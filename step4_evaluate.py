"""Step 4 - evaluate the trained world model on the held-out TEST DAYS.

* Forecast quality per rollout step and aggregated ("attack somewhere in the next K windows").
* The required benchmark: a logistic regression baseline trained on the SAME (standardised,
  single-window) features, so the comparison isolates exactly the thing the problem statement
  asks about - does modelling temporal dynamics over L windows beat a memoryless classifier that
  only sees the current window?
* Early-warning lead time: for attacks preceded by K clean windows, how many windows before the
  attack starts did we raise the alarm?
* Integrated-Gradients feature attribution for a handful of correctly forecast attacks.
* Three PNGs and one JSON report under runs/.

    python step4_evaluate.py                                   # uses runs/wm_best.pt
    python step4_evaluate.py --checkpoint runs/wm_best.pt
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_recall_curve

from wm.common import add_common_args, resolve, set_seed
from wm.data import Batcher, apply_scaler, build_splits, feature_matrix, load_windows
from wm.explain import integrated_gradients, top_features
from wm.metrics import best_f1_threshold, binary_report, clean_onset_lead_times
from wm.model import WorldModel, predict_all


def _clean_nans(obj):
    """Recursively turn NaN into null so the report is STRICT JSON (Python's json module writes
    bare NaN by default, which most non-Python JSON parsers reject)."""
    if isinstance(obj, float):
        return None if obj != obj else obj
    if isinstance(obj, dict):
        return {k: _clean_nans(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_clean_nans(v) for v in obj]
    return obj


def load_checkpoint(path: Path, device: torch.device) -> dict:
    if not path.exists():
        sys.exit(f"checkpoint not found: {path}  (run step3_train.py first)")
    # weights_only=False: this checkpoint is our own file (holds a plain cfg dict, not just
    # tensors) and was never downloaded from anywhere untrusted.
    return torch.load(path, map_location=device, weights_only=False)


def now_features(Xz: np.ndarray, starts: np.ndarray, L: int) -> np.ndarray:
    return Xz[starts + L - 1]


def horizon_label(attack: np.ndarray, starts: np.ndarray, L: int, K: int) -> np.ndarray:
    idx = starts[:, None] + L + np.arange(K)
    return attack[idx].max(axis=1).astype(int)


def fit_lr_baseline(Xz, attack, splits, L, K):
    Xtr, ytr = now_features(Xz, splits.train, L), horizon_label(attack, splits.train, L, K)
    if len(np.unique(ytr)) < 2:
        print("[warn] LR baseline: only one class in training horizon labels - skipping baseline")
        return None
    clf = LogisticRegression(max_iter=3000, class_weight="balanced")
    clf.fit(Xtr, ytr)
    return clf


def per_step_table(p: np.ndarray, y: np.ndarray, p_val: np.ndarray, y_val: np.ndarray, win_s: float) -> list[dict]:
    rows = []
    for k in range(p.shape[1]):
        tau, _ = best_f1_threshold(y_val[:, k], p_val[:, k])
        r = binary_report(y[:, k], p[:, k], tau)
        r["horizon_s"] = (k + 1) * win_s
        rows.append(r)
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_common_args(ap)
    ap.add_argument("--checkpoint", default=None, help="default: <runs_dir>/wm_best.pt")
    ap.add_argument("--device", default="auto", choices=["auto", "cuda", "cpu"])
    ap.add_argument("--eval-batch-size", type=int, default=1024)
    ap.add_argument("--n-explain", type=int, default=6, help="how many true positives to explain individually")
    args = ap.parse_args()

    device = torch.device("cuda" if (args.device in ("auto", "cuda") and torch.cuda.is_available()) else "cpu")
    ckpt_guess = resolve(args.runs_dir or "runs") / "wm_best.pt"
    ckpt_path = Path(args.checkpoint) if args.checkpoint else ckpt_guess
    ckpt = load_checkpoint(ckpt_path, device)
    cfg = ckpt["cfg"]
    for key in ("raw_dir", "processed_dir", "runs_dir"):
        v = getattr(args, key, None)
        if v:
            cfg["paths"][key] = v
    L, K = ckpt["L"], ckpt["K"]
    win_s = cfg["features"]["window_seconds"]
    stages = ckpt["stage_names"]
    set_seed(cfg["train"]["seed"])
    print(f"device: {device}  |  checkpoint epoch {ckpt['epoch']}  (val metric {ckpt['val_metric']:.4f})")

    df = load_windows(resolve(cfg["paths"]["processed_dir"]))
    splits = build_splits(df, L, K, cfg["split"])
    print(f"sequences  train={len(splits.train):,} val={len(splits.val):,} test={len(splits.test):,}")
    if len(splits.test) == 0:
        sys.exit("No test sequences - check split.test_days in the checkpoint's config against "
                 "the days you have processed.")

    X = feature_matrix(df)
    Xz = apply_scaler(X, np.array(ckpt["scaler_mean"]), np.array(ckpt["scaler_std"]))
    attack, stage = df["attack"].to_numpy(), df["stage"].to_numpy()
    seg_id = df["seg_id"].to_numpy()

    model = WorldModel(d_in=X.shape[1], n_stage=len(stages), **ckpt["model_cfg"]).to(device)
    model.load_state_dict(ckpt["model_state"])
    batcher = Batcher(Xz, attack, stage, L, K, device)

    print("running world-model forecasts on val/test ...")
    pv = predict_all(model, batcher, splits.val, L, K, args.eval_batch_size) if len(splits.val) else None
    pt = predict_all(model, batcher, splits.test, L, K, args.eval_batch_size)

    # ---- aggregated "attack somewhere in the next K windows" ------------------------------
    y_any_test = pt["y"].max(axis=1)
    p_any_test = pt["p"].max(axis=1)
    if pv is not None and len(np.unique(pv["y"].max(axis=1))) > 1:
        tau_wm, _ = best_f1_threshold(pv["y"].max(axis=1), pv["p"].max(axis=1))
    else:
        tau_wm = 0.5
        print("[warn] validation set has no usable label mix for threshold tuning - using tau=0.5")
    wm_any = binary_report(y_any_test, p_any_test, tau_wm)
    print(f"\nWORLD MODEL - attack anywhere in the next {K} windows ({K * win_s:.0f}s):")
    print(f"  precision {wm_any['precision']:.3f}  recall {wm_any['recall']:.3f}  f1 {wm_any['f1']:.3f}  "
         f"FPR {wm_any['fpr']:.3f}  AUROC {wm_any['auroc']:.3f}  AUPRC {wm_any['auprc']:.3f}  "
         f"(tau={tau_wm:.3f}, n={wm_any['n']:,}, positives={wm_any['positives']:,})")

    per_step = per_step_table(pt["p"], pt["y"], pv["p"], pv["y"], win_s) if pv is not None else []
    if per_step:
        print(f"\n  {'horizon':>9} {'precision':>10} {'recall':>8} {'f1':>6} {'fpr':>7} {'auprc':>7}")
        for r in per_step:
            print(f"  {r['horizon_s']:>7.0f}s {r['precision']:>10.3f} {r['recall']:>8.3f} "
                 f"{r['f1']:>6.3f} {r['fpr']:>7.3f} {r['auprc']:>7.3f}")

    # ---- logistic-regression baseline (same standardised features, no temporal context) ---
    print("\ntraining logistic-regression baseline on the SAME features ...")
    clf = fit_lr_baseline(Xz, attack, splits, L, K)
    lr_any = None
    if clf is not None:
        Xva, yva = now_features(Xz, splits.val, L), horizon_label(attack, splits.val, L, K)
        Xte, yte = now_features(Xz, splits.test, L), horizon_label(attack, splits.test, L, K)
        p_lr_val = clf.predict_proba(Xva)[:, 1]
        p_lr_test = clf.predict_proba(Xte)[:, 1]
        tau_lr, _ = best_f1_threshold(yva, p_lr_val) if len(np.unique(yva)) > 1 else (0.5, float("nan"))
        lr_any = binary_report(yte, p_lr_test, tau_lr)
        print(f"LOGISTIC REGRESSION baseline (current window only) - same target:")
        print(f"  precision {lr_any['precision']:.3f}  recall {lr_any['recall']:.3f}  f1 {lr_any['f1']:.3f}  "
             f"FPR {lr_any['fpr']:.3f}  AUROC {lr_any['auroc']:.3f}  AUPRC {lr_any['auprc']:.3f}  "
             f"(tau={tau_lr:.3f})")
        d = wm_any["f1"] - lr_any["f1"]
        pct = f" ({'+' if d > 0 else ''}{100 * d / lr_any['f1']:.0f}%)" if lr_any["f1"] > 1e-6 else ""
        print(f"\n  => world model {'beats' if d > 0 else 'trails'} the logistic-regression baseline "
             f"by {abs(d):.3f} F1{pct} (world model {wm_any['f1']:.3f} vs baseline {lr_any['f1']:.3f}).")

    # ---- stage classification (conditional on the window actually being an attack) ---------
    m = pt["y_stage"][:, 0] != 0
    stage_acc = float((pt["p_stage"][:, 0].argmax(-1) == pt["y_stage"][:, 0])[m].mean()) if m.any() else float("nan")
    print(f"\nMITRE-style stage accuracy on true attack windows (k=1 step ahead): {stage_acc:.3f}  (n={int(m.sum())})")

    # ---- early-warning lead time -------------------------------------------------------
    t_end = splits.test + L - 1
    alarm = (p_any_test >= tau_wm).astype(int)
    lead = clean_onset_lead_times(seg_id, attack, t_end, alarm, K)
    print(f"\nEARLY WARNING (attacks preceded by {K} clean windows, i.e. a genuine onset):")
    print(f"  {lead['onsets']} clean onsets in the test days ({lead['skipped']} had no model coverage)")
    print(f"  detected {lead['detected']}/{lead['onsets']} before completion "
         f"({100 * lead['detection_rate']:.0f}%), median lead time "
         f"{lead['median_lead_windows']:.1f} windows ({lead['median_lead_windows'] * win_s:.0f}s)")

    # ---- explainability: Integrated Gradients on a few true positives ----------------------
    print("\ncomputing Integrated Gradients on a few correctly forecast attacks ...")
    tp_idx = np.flatnonzero((y_any_test == 1) & (alarm == 1))
    rng = np.random.default_rng(0)
    sample = tp_idx if len(tp_idx) <= args.n_explain else rng.choice(tp_idx, args.n_explain, replace=False)
    explanations = []
    if len(sample):
        starts = splits.test[sample]
        ctx, _, _ = batcher.get(starts)
        ctx = ctx[:, :L]
        attributions = integrated_gradients(model, ctx, K, steps=32, target="attack")
        for j in range(len(sample)):
            explanations.append({"test_window_t_end": int(starts[j] + L - 1),
                                 "top_features": top_features(attributions[j], k=8)})
        agg = np.abs(attributions).sum(axis=1).mean(axis=0)  # mean |attr| per feature, summed over L
        order = np.argsort(-agg)[:15]
        names = [ckpt["feature_names"][i] for i in order]
        fig, ax = plt.subplots(figsize=(7, 5))
        ax.barh(range(len(order))[::-1], agg[order])
        ax.set_yticks(range(len(order))[::-1], names)
        ax.set_xlabel("mean |Integrated Gradients attribution|")
        ax.set_title(f"Top features driving infiltration forecasts (n={len(sample)} test attacks)")
        fig.tight_layout()
        fig.savefig(resolve(cfg["paths"]["runs_dir"]) / "eval_feature_importance.png", dpi=130)
        plt.close(fig)
        print("  saved eval_feature_importance.png")
        print(f"  example (window ending at t={explanations[0]['test_window_t_end']}):")
        for name, val in explanations[0]["top_features"][:5]:
            print(f"    {name:<28} {val:+.3f}")
    else:
        print("  no correctly forecast attacks in the test set to explain")

    # ---- plots --------------------------------------------------------------------------
    runs_dir = resolve(cfg["paths"]["runs_dir"])
    pr_w, rc_w, _ = precision_recall_curve(y_any_test, p_any_test)
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(rc_w, pr_w, label=f"world model (AUPRC={wm_any['auprc']:.3f})")
    if lr_any is not None:
        pr_l, rc_l, _ = precision_recall_curve(yte, p_lr_test)
        ax.plot(rc_l, pr_l, label=f"logistic regression (AUPRC={lr_any['auprc']:.3f})", linestyle="--")
    ax.set_xlabel("recall"); ax.set_ylabel("precision")
    ax.set_title(f"Attack in next {K} windows ({K * win_s:.0f}s) - test days")
    ax.legend(); ax.grid(alpha=0.3)
    fig.tight_layout(); fig.savefig(runs_dir / "eval_pr_curve.png", dpi=130); plt.close(fig)
    print("saved eval_pr_curve.png")

    seg_counts = {s: int((attack[(seg_id == s)] == 1).sum()) for s in np.unique(seg_id[splits.test[:, None] + np.arange(L + K)])}
    best_seg = max(seg_counts, key=seg_counts.get)
    rows_in_seg = np.flatnonzero(seg_id == best_seg)
    seq_in_seg = [i for i, s in enumerate(splits.test) if seg_id[s] == best_seg]
    if seq_in_seg:
        t = t_end[seq_in_seg]
        fig, ax = plt.subplots(figsize=(10, 4))
        ax2 = ax.twinx()
        ax2.fill_between(rows_in_seg * win_s, 0, attack[rows_in_seg], step="mid", color="red", alpha=0.15,
                        label="ground truth attack window")
        ax2.set_ylim(0, 1.05); ax2.set_yticks([])
        ax.plot(t * win_s, p_any_test[seq_in_seg], color="C0", label="forecast: P(attack in next K windows)")
        ax.axhline(tau_wm, color="gray", linestyle=":", label=f"alarm threshold ({tau_wm:.2f})")
        ax.set_xlabel("time in test segment (s)"); ax.set_ylabel("forecast probability"); ax.set_ylim(0, 1.05)
        lines1, labels1 = ax.get_legend_handles_labels(); lines2, labels2 = ax2.get_legend_handles_labels()
        ax.legend(lines1 + lines2, labels1 + labels2, loc="upper left", fontsize=8)
        ax.set_title("Example: forecast probability vs. ground truth over one test segment")
        fig.tight_layout(); fig.savefig(runs_dir / "eval_example_timeline.png", dpi=130); plt.close(fig)
        print("saved eval_example_timeline.png")

    report = {
        "checkpoint": str(ckpt_path), "epoch": ckpt["epoch"], "L": L, "K": K, "window_seconds": win_s,
        "world_model": {"aggregated_next_K_windows": wm_any, "tau": tau_wm, "per_step": per_step,
                        "stage_accuracy_on_attacks": stage_acc},
        "logistic_regression_baseline": lr_any,
        "early_warning": lead,
        "explained_examples": explanations,
    }
    (runs_dir / "eval_report.json").write_text(json.dumps(_clean_nans(report), indent=2), encoding="utf-8")
    ckpt["tau_attack"] = tau_wm
    torch.save(ckpt, ckpt_path)
    print(f"\nsaved eval_report.json and refreshed tau_attack={tau_wm:.3f} into {ckpt_path}")
    print(f"Next: streamlit run step5_demo.py -- --checkpoint {ckpt_path}")


if __name__ == "__main__":
    main()
