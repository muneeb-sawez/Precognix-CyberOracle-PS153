"""Step 3 - train the world model.

    python step3_train.py                       # use every setting in config.yaml
    python step3_train.py --epochs 5             # quick smoke test
    python step3_train.py --device cpu           # force CPU (slow - only for debugging)

Everything needed to re-run preprocessing-compatible evaluation later (scaler, config, feature
and stage names) is saved INSIDE the checkpoint, so step4/step5 never depend on config.yaml
having stayed unchanged since training.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
import torch

from wm.common import STAGES, add_common_args, get_cfg, resolve, set_seed
from wm.data import Batcher, apply_scaler, build_splits, class_stats, feature_matrix, fit_scaler, load_windows
from wm.features import FEATURE_NAMES
from wm.model import WorldModel, compute_loss
from wm.metrics import best_f1_threshold, binary_report


def epoch_tf_prob(epoch: int, decay_epochs: int) -> float:
    return max(0.0, 1.0 - epoch / max(decay_epochs, 1))


def run_batches(model, batcher, starts, L, K, w, pos_weight, stage_w, use_nll,
                bs, device, opt=None, scaler=None, tf_prob: float = 0.0):
    """One pass over `starts`. Trains if opt is given, otherwise just evaluates (no_grad)."""
    train = opt is not None
    model.train(train)
    order = np.random.permutation(len(starts)) if train else np.arange(len(starts))
    tot = {"loss": 0.0, "state": 0.0, "attack": 0.0, "stage": 0.0}
    all_p, all_y = [], []
    n_seen = 0
    ctx_mgr = torch.enable_grad() if train else torch.no_grad()
    with ctx_mgr:
        for i in range(0, len(order), bs):
            idx = starts[order[i:i + bs]]
            x, ya, ys = batcher.get(idx)
            ctx, fut = x[:, :L], x[:, L:]
            if train:
                opt.zero_grad(set_to_none=True)
            use_amp = scaler is not None
            with torch.autocast(device_type=device.type, dtype=torch.float16, enabled=use_amp):
                out = model(ctx, K, fut=fut if train else None, tf_prob=tf_prob if train else 0.0)
                loss, parts = compute_loss(out, x, ya, ys, L, w, pos_weight, stage_w, use_nll)
            if train:
                if use_amp:
                    scaler.scale(loss).backward()
                    scaler.unscale_(opt)
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)
                    scaler.step(opt)
                    scaler.update()
                else:
                    loss.backward()
                    torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)
                    opt.step()
            else:
                # forecast-only attack probabilities (the K rollout steps, NOT the easier
                # teacher-forced context steps) - this is what step4 also reports on
                all_p.append(torch.sigmoid(out["att"]).float().cpu().numpy().ravel())
                all_y.append(ya[:, L:].cpu().numpy().ravel())
            b = len(idx)
            tot["loss"] += float(loss.detach()) * b
            for k in ("state", "attack", "stage"):
                tot[k] += parts[k] * b
            n_seen += b
    for k in tot:
        tot[k] /= max(n_seen, 1)
    if all_p:
        p, y = np.concatenate(all_p), np.concatenate(all_y)
        tau, f1 = best_f1_threshold(y, p)
        tot["auprc"] = binary_report(y, p, tau)["auprc"]
        tot["f1_at_best_tau"] = f1
    return tot


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_common_args(ap)
    ap.add_argument("--epochs", type=int, default=None)
    ap.add_argument("--batch-size", type=int, default=None)
    ap.add_argument("--device", default="auto", choices=["auto", "cuda", "cpu"])
    ap.add_argument("--name", default="wm", help="checkpoint file name (without .pt)")
    args = ap.parse_args()
    cfg = get_cfg(args)
    tcfg, scfg, mcfg = cfg["train"], cfg["sequence"], cfg["model"]
    if args.epochs:
        tcfg["epochs"] = args.epochs
    if args.batch_size:
        tcfg["batch_size"] = args.batch_size
    set_seed(tcfg["seed"])

    device = torch.device("cuda" if (args.device in ("auto", "cuda") and torch.cuda.is_available()) else "cpu")
    if args.device == "cuda" and device.type == "cpu":
        sys.exit("CUDA was requested but is not available - see step0_check_env.py")
    print(f"device: {device}" + (f" ({torch.cuda.get_device_name(0)})" if device.type == "cuda" else " (CPU execution mode)"))

    processed_dir = resolve(cfg["paths"]["processed_dir"])
    df = load_windows(processed_dir)
    L, K = scfg["context"], scfg["horizon"]
    present = set(df["day"].astype(str).unique())
    for role in ("train_days", "test_days"):
        missing = [d for d in cfg["split"][role] if d not in present]
        if missing:
            print(f"[warn] {role} lists days not found in processed data (skipped): {missing}")
    splits = build_splits(df, L, K, cfg["split"])
    print(f"windows: {len(df):,}  |  sequences  train={len(splits.train):,}  "
         f"val={len(splits.val):,}  test={len(splits.test):,}")
    if len(splits.train) == 0:
        sys.exit("No training sequences - check split.train_days in config.yaml against the "
                 "days actually processed (see step2 output), and that context+horizon isn't "
                 "longer than a day's traffic.")
    if len(splits.val) == 0:
        print("[warn] no validation sequences - early stopping will just run the full epoch budget")

    X = feature_matrix(df)
    attack, stage = df["attack"].to_numpy(), df["stage"].to_numpy()
    mean, std = fit_scaler(X, splits.train_mask, df["n_flows"].to_numpy())
    Xz = apply_scaler(X, mean, std)
    pos_weight_v, stage_w_v, counts = class_stats(attack, stage, splits.train_mask)
    print("stage counts in training windows:")
    for s, c in zip(STAGES, counts):
        print(f"  {s:<20} {int(c):>8,}")
    print(f"pos_weight (attack)  = {pos_weight_v:.2f}")

    batcher = Batcher(Xz, attack, stage, L, K, device)
    pos_weight = torch.tensor(pos_weight_v, device=device)
    stage_w = torch.tensor(stage_w_v, device=device)

    model = WorldModel(d_in=len(FEATURE_NAMES), n_stage=len(STAGES), hidden=mcfg["hidden"],
                       layers=mcfg["layers"], dropout=mcfg["dropout"], arch=mcfg["arch"]).to(device)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"model: {mcfg['arch'].upper()} hidden={mcfg['hidden']} layers={mcfg['layers']}  "
         f"({n_params:,} parameters)")
    opt = torch.optim.AdamW(model.parameters(), lr=tcfg["lr"], weight_decay=tcfg["weight_decay"])
    use_amp = bool(tcfg["amp"]) and device.type == "cuda"
    amp_scaler = torch.amp.GradScaler("cuda") if use_amp else None

    runs_dir = resolve(cfg["paths"]["runs_dir"])
    runs_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = runs_dir / f"{args.name}_best.pt"
    log_path = runs_dir / f"{args.name}_train_log.csv"
    log_rows = []
    best_metric, best_epoch, patience = float("-inf"), -1, 0
    t0 = time.time()
    for epoch in range(tcfg["epochs"]):
        te0 = time.time()
        tf_prob = epoch_tf_prob(epoch, tcfg["tf_decay_epochs"])
        use_nll = epoch >= tcfg["warmup_mse_epochs"]
        tr = run_batches(model, batcher, splits.train, L, K, tcfg["loss_weights"], pos_weight, stage_w,
                         use_nll, tcfg["batch_size"], device, opt=opt, scaler=amp_scaler, tf_prob=tf_prob)
        if len(splits.val):
            va = run_batches(model, batcher, splits.val, L, K, tcfg["loss_weights"], pos_weight, stage_w,
                             use_nll, max(tcfg["batch_size"], 512), device)
            metric = va.get("auprc", float("nan"))
            if not np.isfinite(metric):  # e.g. no positive windows landed in val this run
                if epoch == 0:
                    print("[warn] validation set has no positive (attack) windows in its forecast "
                         "horizon - using validation loss for early stopping instead of AUPRC. If "
                         "this persists, try a smaller val_every or larger block_windows.")
                metric = -va["loss"]
            msg_val = f"val loss {va['loss']:.4f} (state {va['state']:.3f} att {va['attack']:.3f} " \
                     f"stage {va['stage']:.3f}) auprc {va.get('auprc', float('nan')):.3f}"
        else:
            va, metric = {}, -tr["loss"]
            msg_val = "(no val set)"
        dt = time.time() - te0
        print(f"epoch {epoch + 1:>3}/{tcfg['epochs']}  tf={tf_prob:.2f}  "
             f"nll={'Y' if use_nll else 'n'}  train loss {tr['loss']:.4f}  |  {msg_val}  [{dt:4.1f}s]")
        log_rows.append({"epoch": epoch + 1, "tf_prob": tf_prob, "use_nll": use_nll,
                         **{f"train_{k}": v for k, v in tr.items()},
                         **{f"val_{k}": v for k, v in va.items()}, "seconds": dt})

        if metric > best_metric:
            best_metric, best_epoch, patience = metric, epoch + 1, 0
            torch.save({
                "model_state": model.state_dict(),
                "model_cfg": mcfg, "cfg": cfg,
                "scaler_mean": mean, "scaler_std": std,
                "pos_weight": pos_weight_v, "stage_w": stage_w_v,
                "feature_names": FEATURE_NAMES, "stage_names": STAGES,
                "L": L, "K": K, "epoch": epoch + 1, "val_metric": best_metric,
            }, ckpt_path)
        else:
            patience += 1
            if patience >= tcfg["patience"]:
                print(f"early stopping (no improvement for {tcfg['patience']} epochs)")
                break

    import csv
    with open(log_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=sorted({k for r in log_rows for k in r}))
        w.writeheader()
        w.writerows(log_rows)

    print(f"\ntotal training time: {time.time() - t0:.0f}s")
    print(f"best epoch: {best_epoch}  (val metric {best_metric:.4f})")
    print(f"checkpoint : {ckpt_path}")
    print(f"train log  : {log_path}")
    print("Next: python step4_evaluate.py --checkpoint", ckpt_path)


if __name__ == "__main__":
    main()
