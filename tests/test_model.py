"""Precognix-PS153 // Model & Inference Unit Tests.
Verifies World Model tensor shapes, forward rollouts, and explainability.
"""
import sys
from pathlib import Path
import numpy as np
import pytest
import torch

# Ensure parent directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from wm.infer import load_checkpoint_for_inference
from wm.explain import integrated_gradients, temporal_attention, top_features
from wm.features import FEATURE_NAMES


@pytest.fixture(scope="module")
def checkpoint_info():
    ckpt_path = Path(__file__).resolve().parent.parent / "runs" / "wm_best.pt"
    if not ckpt_path.exists():
        pytest.skip(f"Checkpoint not found at {ckpt_path}")
    model, ckpt = load_checkpoint_for_inference(ckpt_path, device="cpu")
    return model, ckpt


def test_checkpoint_structure(checkpoint_info):
    model, ckpt = checkpoint_info
    assert "scaler_mean" in ckpt
    assert "scaler_std" in ckpt
    assert "L" in ckpt
    assert "K" in ckpt
    assert ckpt["L"] == 30
    assert ckpt["K"] == 6
    assert len(ckpt["feature_names"]) == len(FEATURE_NAMES)


def test_forward_rollout_dimensions(checkpoint_info):
    model, ckpt = checkpoint_info
    L, K = ckpt["L"], ckpt["K"]
    D = len(ckpt["feature_names"])
    B = 2

    dummy_ctx = torch.randn(B, L, D)
    with torch.no_grad():
        out = model.forecast(dummy_ctx, K=K)

    # Validate output tensor shapes
    assert out["p_attack"].shape == (B, K)
    assert out["p_stage"].shape == (B, K, len(ckpt["stage_names"]))
    assert out["mean"].shape == (B, K, D)
    assert out["logvar"].shape == (B, K, D)

    # Probability bounds [0, 1]
    assert (out["p_attack"] >= 0.0).all() and (out["p_attack"] <= 1.0).all()
    assert (out["p_stage"] >= 0.0).all() and (out["p_stage"] <= 1.0).all()


def test_explainability_and_temporal_attention(checkpoint_info):
    model, ckpt = checkpoint_info
    L, K = ckpt["L"], ckpt["K"]
    D = len(ckpt["feature_names"])

    dummy_ctx = torch.randn(1, L, D)
    attributions = integrated_gradients(model, dummy_ctx, K=K, steps=8, target="attack")
    assert attributions.shape == (1, L, D)

    # Top features extraction
    top_f = top_features(attributions[0], k=5)
    assert len(top_f) == 5
    for name, val in top_f:
        assert isinstance(name, str)
        assert isinstance(val, float)

    # Temporal attention derivation
    temp_att = temporal_attention(attributions[0], num_windows=10)
    assert len(temp_att) == 10
    total_w = sum(item["weight"] for item in temp_att)
    assert abs(total_w - 1.0) < 0.05


if __name__ == "__main__":
    print("[*] Running Precognix Model & Inference Unit Tests...")
    ckpt_path = Path(__file__).resolve().parent.parent / "runs" / "wm_best.pt"
    if not ckpt_path.exists():
        print(f"[-] Checkpoint not found at {ckpt_path}. Skipping.")
        sys.exit(0)

    model, ckpt = load_checkpoint_for_inference(ckpt_path, device="cpu")
    info = (model, ckpt)

    print("  -> Testing checkpoint structure...")
    test_checkpoint_structure(info)
    print("     [PASS] Checkpoint integrity and feature dimensions verified.")

    print("  -> Testing forward rollout dimensions (K=6)...")
    test_forward_rollout_dimensions(info)
    print("     [PASS] Tensor rollout shapes and probability bounds verified.")

    print("  -> Testing Integrated Gradients & Temporal Attention...")
    test_explainability_and_temporal_attention(info)
    print("     [PASS] Axiomatic Integrated Gradients and Temporal Attention verified.")

    print("\n[SUCCESS] All Precognix Model unit tests passed successfully!")

