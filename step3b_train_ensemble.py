"""Step 3b - Train the Tri-Tier Unified Defense Ensemble (TDE).

Combines:
  Tier 1: Pre-trained PyTorch World Model (runs/wm_best.pt)
  Tier 2: Isolation Forest Anomaly Core (trained strictly on clean benign baseline)
  Tier 3: LightGBM Meta-Decision Head (trained on fused multimodal representations)

Usage:
    python step3b_train_ensemble.py
"""
from __future__ import annotations

import argparse
import time
from pathlib import Path

import numpy as np
import torch

from wm.common import add_common_args, get_cfg, resolve, set_seed
from wm.data import Batcher, apply_scaler, build_splits, feature_matrix, load_windows
from wm.ensemble import TriTierEnsemble
from wm.features import FEATURE_NAMES
from wm.metrics import best_f1_threshold, binary_report
from wm.model import WorldModel


def extract_split_features(wm_model, batcher, starts, L, K, raw_features, device, batch_size=256):
    """Extracts Tier 1 latent states and K-step trajectories for a given split."""
    wm_model.eval()
    all_h, all_probs, all_raw, all_y = [], [], [], []
    
    with torch.no_grad():
        for i in range(0, len(starts), batch_size):
            idx = starts[i:i + batch_size]
            x, ya, ys = batcher.get(idx)  # x: (B, L+K, D) standardized on device
            ctx = x[:, :L]
            
            # Ground truth: attack anywhere in next K windows
            y_any = (ya[:, L:].amax(dim=1) > 0).long().cpu().numpy()
            
            # Forward pass through encoder + GRU
            enc = wm_model.enc(ctx)
            out, state = wm_model.rnn(enc)
            h_t = out[:, -1].float().cpu().numpy()
            
            # Autoregressive K-step rollout
            last, x_cur = out[:, -1], ctx[:, -1]
            atts = []
            for k in range(K):
                m, lv, a, s = wm_model.heads(last, x_cur)
                atts.append(a)
                if k == K - 1:
                    break
                x_next = m.detach()
                o, state = wm_model.rnn(wm_model.enc(x_next).unsqueeze(1), state)
                last, x_cur = o[:, 0], x_next
                
            att_tensor = torch.stack(atts, 1)
            probs_k = torch.sigmoid(att_tensor.float()).cpu().numpy()
            
            # Raw unstandardized features of the current observation window
            raw_curr = raw_features[idx + L - 1]
            
            all_h.append(h_t)
            all_probs.append(probs_k)
            all_raw.append(raw_curr)
            all_y.append(y_any)
            
    return (np.vstack(all_h),
            np.vstack(all_probs),
            np.vstack(all_raw),
            np.concatenate(all_y))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    add_common_args(ap)
    ap.add_argument("--checkpoint", default="runs/wm_best.pt", help="path to trained World Model checkpoint")
    ap.add_argument("--device", default=None, help="cpu or cuda")
    args = ap.parse_args()
    cfg = get_cfg(args)
    set_seed(cfg["train"]["seed"])
    
    dev_str = args.device or ("cuda" if torch.cuda.is_available() else "cpu")
    device = torch.device(dev_str)
    print(f"Device: {device}")
    
    ckpt_path = resolve(args.checkpoint)
    if not ckpt_path.exists():
        raise FileNotFoundError(f"{ckpt_path} not found - run step3_train.py first")
        
    print(f"Loading Tier-1 World Model: {ckpt_path.name}")
    ckpt = torch.load(ckpt_path, map_location=device, weights_only=False)
    L, K = ckpt["L"], ckpt["K"]
    mean = np.array(ckpt["scaler_mean"], dtype=np.float32)
    std = np.array(ckpt["scaler_std"], dtype=np.float32)
    
    wm_model = WorldModel(d_in=len(ckpt["feature_names"]), n_stage=len(ckpt["stage_names"]), **ckpt["model_cfg"])
    wm_model.load_state_dict(ckpt["model_state"])
    wm_model.to(device).eval()
    
    processed_dir = resolve(cfg["paths"]["processed_dir"])
    df = load_windows(processed_dir)
    raw_feats = feature_matrix(df)
    std_feats = apply_scaler(raw_feats, mean, std)
    
    splits = build_splits(df, L, K, cfg["split"])
    batcher = Batcher(std_feats, df["attack"].to_numpy(), df["stage"].to_numpy(), L, K, device)
    
    print(f"Sequences -> Train: {len(splits.train):,}, Val: {len(splits.val):,}, Test: {len(splits.test):,}")
    
    # 1. Feature Extraction from Tier 1 (Temporal World Model)
    t0 = time.time()
    print("\n[Tier 1] Extracting recurrent latent states & rollout trajectories on GPU...")
    h_tr, p_tr, raw_tr, y_tr = extract_split_features(wm_model, batcher, splits.train, L, K, raw_feats, device)
    h_va, p_va, raw_va, y_va = extract_split_features(wm_model, batcher, splits.val, L, K, raw_feats, device)
    print(f"  Extracted {len(h_tr) + len(h_va):,} sequences in {time.time() - t0:.1f}s")
    
    # 2. Fit Tier 2: Unsupervised Zero-Day Anomaly Core (Isolation Forest)
    print("\n[Tier 2] Fitting Isolation Forest on clean benign baseline traffic...")
    benign_mask = (y_tr == 0)
    benign_raw = raw_tr[benign_mask]
    
    # Sample up to 10,000 clean windows for fast, robust density modeling
    if len(benign_raw) > 10000:
        sample_idx = np.random.choice(len(benign_raw), 10000, replace=False)
        benign_raw = benign_raw[sample_idx]
        
    iso_forest = TriTierEnsemble().iso_forest
    t_iso = time.time()
    iso_forest.fit(benign_raw)
    print(f"  Isolation Forest trained on {len(benign_raw):,} benign windows in {time.time() - t_iso:.1f}s")
    
    # Tier 2 Anomaly Scores: higher = more anomalous
    iso_score_tr = (-iso_forest.decision_function(raw_tr)).reshape(-1, 1)
    iso_score_va = (-iso_forest.decision_function(raw_va)).reshape(-1, 1)
    
    # 3. Build Multimodal Fused Matrix Z_t
    print("\n[Tier 3] Fusing Multimodal Representations & Training LightGBM Meta-Classifier...")
    ensemble = TriTierEnsemble(
        wm_model=wm_model,
        scaler_mean=mean,
        scaler_std=std,
        L=L,
        K=K,
        iso_forest=iso_forest
    )
    
    Z_tr = ensemble.build_fused_vector(raw_tr, h_tr, p_tr, iso_score_tr)
    Z_va = ensemble.build_fused_vector(raw_va, h_va, p_va, iso_score_va)
    print(f"  Fused Representation Shape: {Z_tr.shape} (49 raw + 128 latent + 6 trajectory + 3 stats + 1 anomaly = {Z_tr.shape[1]} features)")
    
    t_meta = time.time()
    ensemble.fit_tier3_meta(Z_tr, y_tr)
    print(f"  LightGBM Meta-Classifier fitted in {time.time() - t_meta:.1f}s")
    
    # 4. Validation & Calibration
    val_probs = ensemble.meta.predict_proba(Z_va)[:, 1]
    best_tau, best_f1 = best_f1_threshold(y_va, val_probs)
    ensemble.tau = float(best_tau)
    
    wm_val_max = np.max(p_va, axis=1)
    wm_tau, wm_f1 = best_f1_threshold(y_va, wm_val_max)
    
    rep_wm = binary_report(y_va, wm_val_max, wm_tau)
    rep_ens = binary_report(y_va, val_probs, best_tau)
    
    print("\n" + "=" * 70)
    print("VALIDATION SET BENCHMARK: WORLD MODEL vs TRI-TIER ENSEMBLE")
    print("=" * 70)
    print(f"Tier 1 (World Model Alone)  : Precision={rep_wm['precision']:.3f}, Recall={rep_wm['recall']:.3f}, F1={rep_wm['f1']:.3f}, AUPRC={rep_wm['auprc']:.3f}")
    print(f"Tri-Tier Unified Ensemble   : Precision={rep_ens['precision']:.3f}, Recall={rep_ens['recall']:.3f}, F1={rep_ens['f1']:.3f}, AUPRC={rep_ens['auprc']:.3f}")
    gain = (rep_ens['f1'] - rep_wm['f1']) / max(rep_wm['f1'], 1e-4) * 100
    print(f"Ensemble Improvement       : {gain:+.1f}% F1 ({rep_wm['f1']:.3f} -> {rep_ens['f1']:.3f}), Optimal Tau={best_tau:.3f}")
    print("=" * 70)
    
    # 5. Save Artifact
    runs_dir = resolve("runs")
    bundle_path = runs_dir / "ensemble_bundle.joblib"
    ensemble.save(bundle_path)
    print(f"\nSaved Tri-Tier Defense Ensemble bundle to: {bundle_path}")
    print("Next: python step4b_eval_ensemble.py")


if __name__ == "__main__":
    main()
