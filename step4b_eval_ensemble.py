"""Step 4b - Rigorous Held-out Test Evaluation of the Tri-Tier Unified Defense Ensemble.

Evaluates on the true test split (held-out days unseen during training):
  - Logistic Regression Baseline
  - World Model (Tier 1 alone)
  - Tri-Tier Unified Defense Ensemble (Tier 1 + Tier 2 + Tier 3)

Generates:
  - runs/ensemble_eval_report.json
  - runs/ensemble_pr_curve.png
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_recall_curve

from wm.common import add_common_args, get_cfg, resolve
from wm.data import Batcher, apply_scaler, build_splits, feature_matrix, load_windows
from wm.ensemble import TriTierEnsemble
from wm.features import FEATURE_NAMES
from wm.metrics import binary_report
from wm.model import WorldModel
from step3b_train_ensemble import extract_split_features


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    add_common_args(ap)
    ap.add_argument("--checkpoint", default="runs/wm_best.pt")
    ap.add_argument("--ensemble", default="runs/ensemble_bundle.joblib")
    ap.add_argument("--device", default=None)
    args = ap.parse_args()
    cfg = get_cfg(args)
    
    dev_str = args.device or ("cuda" if torch.cuda.is_available() else "cpu")
    device = torch.device(dev_str)
    
    ckpt_path = resolve(args.checkpoint)
    ens_path = resolve(args.ensemble)
    runs_dir = resolve("runs")
    
    if not ckpt_path.exists() or not ens_path.exists():
        raise FileNotFoundError("Make sure both runs/wm_best.pt and runs/ensemble_bundle.joblib exist.")
        
    print(f"Device: {device}")
    print(f"Loading World Model: {ckpt_path.name}")
    ckpt = torch.load(ckpt_path, map_location=device, weights_only=False)
    L, K = ckpt["L"], ckpt["K"]
    mean = np.array(ckpt["scaler_mean"], dtype=np.float32)
    std = np.array(ckpt["scaler_std"], dtype=np.float32)
    
    wm_model = WorldModel(d_in=len(ckpt["feature_names"]), n_stage=len(ckpt["stage_names"]), **ckpt["model_cfg"])
    wm_model.load_state_dict(ckpt["model_state"])
    wm_model.to(device).eval()
    
    print(f"Loading Tri-Tier Ensemble: {ens_path.name}")
    ensemble = TriTierEnsemble.load(ens_path, wm_model=wm_model)
    
    processed_dir = resolve(cfg["paths"]["processed_dir"])
    df = load_windows(processed_dir)
    raw_feats = feature_matrix(df)
    std_feats = apply_scaler(raw_feats, mean, std)
    
    splits = build_splits(df, L, K, cfg["split"])
    batcher = Batcher(std_feats, df["attack"].to_numpy(), df["stage"].to_numpy(), L, K, device)
    
    print(f"Evaluating on held-out test split: {len(splits.test):,} sequences...")
    t0 = time.time()
    h_te, p_te, raw_te, y_te = extract_split_features(wm_model, batcher, splits.test, L, K, raw_feats, device)
    
    # 1. World Model alone prediction
    wm_probs = np.max(p_te, axis=1)
    
    # 2. Tri-Tier Ensemble prediction
    iso_score_te = (-ensemble.iso_forest.decision_function(raw_te)).reshape(-1, 1)
    Z_te = ensemble.build_fused_vector(raw_te, h_te, p_te, iso_score_te)
    ens_probs = ensemble.meta.predict_proba(Z_te)[:, 1]
    
    # 3. Logistic Regression Baseline
    print("Training Logistic Regression baseline on current window...")
    h_tr, p_tr, raw_tr, y_tr = extract_split_features(wm_model, batcher, splits.train, L, K, raw_feats, device)
    x_curr_tr = apply_scaler(raw_tr, mean, std)
    x_curr_te = apply_scaler(raw_te, mean, std)
    
    lr = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
    lr.fit(x_curr_tr, y_tr)
    lr_probs = lr.predict_proba(x_curr_te)[:, 1]
    
    eval_time = time.time() - t0
    print(f"Inference completed in {eval_time:.1f}s ({eval_time / len(splits.test) * 1000:.2f} ms/sequence)")
    
    # Compute Metrics using calibrated thresholds
    tau_lr = ckpt.get("tau_lr", 0.902)
    tau_wm = ckpt.get("tau_attack", 0.999)
    tau_ens = ensemble.tau
    
    rep_lr = binary_report(y_te, lr_probs, tau_lr)
    rep_wm = binary_report(y_te, wm_probs, tau_wm)
    rep_ens = binary_report(y_te, ens_probs, tau_ens)
    
    print("\n" + "=" * 96)
    print(f"{'TRI-TIER UNIFIED DEFENSE ENSEMBLE // HELD-OUT TEST BENCHMARK':^96}")
    print("=" * 96)
    print(f"{'Metric':<22} | {'Baseline (LogReg)':<18} | {'World Model (Alone)':<20} | {'Tri-Tier Ensemble':<20} | {'Ensemble Gain':<10}")
    print("-" * 96)
    
    metrics = [
        ("Precision", rep_lr["precision"], rep_wm["precision"], rep_ens["precision"]),
        ("Recall", rep_lr["recall"], rep_wm["recall"], rep_ens["recall"]),
        ("F1 Score", rep_lr["f1"], rep_wm["f1"], rep_ens["f1"]),
        ("False Alarm Rate (FPR)", rep_lr["fpr"], rep_wm["fpr"], rep_ens["fpr"]),
        ("AUROC", rep_lr["auroc"], rep_wm["auroc"], rep_ens["auroc"]),
        ("AUPRC", rep_lr["auprc"], rep_wm["auprc"], rep_ens["auprc"])
    ]
    
    for name, v_lr, v_wm, v_ens in metrics:
        if "FPR" in name:
            reduction = (v_ens - v_wm) / max(v_wm, 1e-4) * 100
            diff = f"{reduction:+.1f}%"
        else:
            gain = (v_ens - v_wm) / max(v_wm, 1e-4) * 100
            diff = f"{gain:+.1f}%"
        print(f"{name:<22} | {v_lr:<18.3f} | {v_wm:<20.3f} | {v_ens:<20.3f} | {diff:<10}")
        
    print("=" * 96)
    print(f"Optimal Thresholds: Baseline tau={tau_lr:.3f}, World Model tau={tau_wm:.3f}, Ensemble tau={tau_ens:.3f}")
    print(f"Test Population: n={len(y_te):,}, Infiltration Events={int(y_te.sum()):,} ({y_te.sum()/len(y_te)*100:.1f}%)")
    print("=" * 96)
    
    # 4. Save Precision-Recall Comparison Plot
    fig, ax = plt.subplots(figsize=(8, 6), dpi=150)
    for probs, label, col in [
        (lr_probs, f"Logistic Regression (AUPRC = {rep_lr['auprc']:.3f})", "#94a3b8"),
        (wm_probs, f"Tier 1: World Model Alone (AUPRC = {rep_wm['auprc']:.3f})", "#0ea5e9"),
        (ens_probs, f"Tri-Tier Ensemble [TDE] (AUPRC = {rep_ens['auprc']:.3f})", "#10b981")
    ]:
        prec, rec, _ = precision_recall_curve(y_te, probs)
        ax.plot(rec, prec, label=label, color=col, linewidth=2.5)
        
    ax.set_title("Precision-Recall Curve Comparison on Held-Out Test Set (CSE-CIC-IDS2018)", fontsize=11, fontweight="bold")
    ax.set_xlabel("Recall (True Infiltration Coverage)", fontsize=10)
    ax.set_ylabel("Precision (True Positive Alert Accuracy)", fontsize=10)
    ax.grid(True, linestyle="--", alpha=0.5)
    ax.legend(loc="lower left", framealpha=0.9)
    plt.tight_layout()
    
    pr_plot_path = runs_dir / "ensemble_pr_curve.png"
    fig.savefig(pr_plot_path)
    plt.close(fig)
    print(f"\nSaved Precision-Recall comparison plot: {pr_plot_path.name}")
    
    # 5. Save JSON Report
    report = {
        "held_out_test_sequences": len(y_te),
        "true_positives_in_test": int(y_te.sum()),
        "models": {
            "baseline_logistic_regression": rep_lr,
            "tier1_world_model_alone": rep_wm,
            "tri_tier_unified_ensemble": rep_ens
        },
        "gain_over_world_model": {
            "f1_delta": float(rep_ens["f1"] - rep_wm["f1"]),
            "f1_percent_gain": float((rep_ens["f1"] - rep_wm["f1"]) / max(rep_wm["f1"], 1e-4) * 100),
            "auprc_delta": float(rep_ens["auprc"] - rep_wm["auprc"]),
            "fpr_reduction": float((rep_wm["fpr"] - rep_ens["fpr"]) / max(rep_wm["fpr"], 1e-4) * 100)
        }
    }
    
    report_json_path = runs_dir / "ensemble_eval_report.json"
    report_json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Saved evaluation report: {report_json_path.name}")
    print("\nTri-Tier Unified Defense Ensemble is fully evaluated and ready.")


if __name__ == "__main__":
    main()
