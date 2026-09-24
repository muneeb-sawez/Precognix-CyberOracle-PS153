"""Precognix-PS153 // ONNX Model Exporter for Edge Gateways.
Exports the PyTorch World Model (runs/wm_best.pt) to ONNX format (runs/wm_best.onnx)
for sub-millisecond, standalone wire-speed inference on edge routers, SmartNICs,
and embedded SOC appliances without Python/PyTorch runtime dependencies.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import torch
import torch.nn as nn
import numpy as np

from wm.infer import load_checkpoint_for_inference
from wm.features import FEATURE_NAMES
from wm.common import resolve


class OnnxRolloutWrapper(nn.Module):
    """Wraps the recurrent world model for static graph export with K=6 rollout."""
    def __init__(self, model, K: int = 6):
        super().__init__()
        self.model = model
        self.K = K

    def forward(self, ctx: torch.Tensor):
        # ctx: (B, L, D)
        out = self.model.forecast(ctx, self.K)
        return out["p_attack"], out["p_stage"], out["mean"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkpoint", default="runs/wm_best.pt", help="Path to PyTorch checkpoint")
    parser.add_argument("--output", default="runs/wm_best.onnx", help="Output path for ONNX model")
    parser.add_argument("--horizon", type=int, default=6, help="Rollout steps K")
    args = parser.parse_args()

    ckpt_path = resolve(args.checkpoint)
    out_path = resolve(args.output)

    if not ckpt_path.exists():
        raise FileNotFoundError(f"Checkpoint not found at {ckpt_path}. Please train first.")

    print(f"[*] Loading PyTorch World Model from {ckpt_path.name}...")
    model, ckpt = load_checkpoint_for_inference(ckpt_path, device="cpu")
    model.eval()

    L = ckpt.get("L", 30)
    K = args.horizon
    D = len(ckpt.get("feature_names", FEATURE_NAMES))

    wrapper = OnnxRolloutWrapper(model, K=K).eval()

    # Create dummy context input: Batch=1, L=30 windows, D=49 features
    dummy_ctx = torch.randn(1, L, D, dtype=torch.float32)

    print(f"[*] Exporting graph: Context ({1}, {L}, {D}) -> Rollout Horizon K={K}...")
    try:
        torch.onnx.export(
            wrapper,
            dummy_ctx,
            str(out_path),
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=["context_telemetry"],
            output_names=["p_attack_rollout", "p_stage_rollout", "predicted_states"],
            dynamic_axes={
                "context_telemetry": {0: "batch_size"},
                "p_attack_rollout": {0: "batch_size"},
                "p_stage_rollout": {0: "batch_size"},
                "predicted_states": {0: "batch_size"}
            }
        )
        print(f"[+] Successfully exported ONNX model to: {out_path} ({out_path.stat().st_size / 1024:.1f} KB)")
        print("[+] Model is ready for ultra-low latency deployment with onnxruntime / TensorRT / OpenVINO.")
    except (ImportError, ModuleNotFoundError) as e:
        print(f"[-] ONNX export requires onnx and onnxscript: {e}")
        print("    Run: pip install onnx onnxscript onnxruntime")
    except Exception as e:
        print(f"[-] ONNX export error: {e}")



if __name__ == "__main__":
    main()
