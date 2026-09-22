"""Core inference logic behind step5_demo.py, kept separate from Streamlit so it can be tested
and reused from a plain script or notebook too.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
import torch

from .data import apply_scaler
from .explain import integrated_gradients, top_features
from .features import FEATURE_NAMES, clean_chunk, finalize_windows, missing_columns, partial_aggregate
from .model import WorldModel

MAX_DEMO_BYTES = 600 * 1024 * 1024  # ~600 MB: bigger files should go through step2's chunked path


def load_checkpoint_for_inference(path: str | Path, device: str = "cpu"):
    ckpt = torch.load(path, map_location=device, weights_only=False)
    model = WorldModel(d_in=len(ckpt["feature_names"]), n_stage=len(ckpt["stage_names"]), **ckpt["model_cfg"])
    model.load_state_dict(ckpt["model_state"])
    model.to(device).eval()
    return model, ckpt


def preprocess_single_csv(csv_path: str | Path, win_seconds: float, max_gap: int, attack_min_flows: int):
    size = Path(csv_path).stat().st_size
    if size > MAX_DEMO_BYTES:
        raise ValueError(f"{Path(csv_path).name} is {size / 2**20:.0f} MB - use step2_preprocess.py "
                         f"for files this large (it reads in chunks), then feed the resulting "
                         f"parquet instead of a raw CSV here.")
    raw = pd.read_csv(csv_path, low_memory=False)
    raw.columns = [str(c).strip() for c in raw.columns]
    miss = missing_columns(raw.columns)
    if "Timestamp" in miss:
        raise ValueError("no 'Timestamp' column found - this doesn't look like a CICFlowMeter CSV")
    has_labels = "Label" not in miss
    if not has_labels:
        raw["Label"] = "Benign"  # placeholder only - see `has_labels` in the caller
    f = clean_chunk(raw)
    if f.empty:
        raise ValueError("no usable rows after cleaning (check the Timestamp format)")
    part, ports, stg = partial_aggregate(f, win_seconds)
    windows = finalize_windows(part, ports, stg, win_seconds, attack_min_flows, max_gap)
    row_win = np.floor(f["ts"].to_numpy() / win_seconds).astype(np.int64)
    rowmap = pd.DataFrame({"orig_index": f.index.to_numpy(), "win": row_win, "ts": f["ts"].to_numpy(),
                           "Label": f["Label"].to_numpy()})
    return windows, rowmap, has_labels


def forecast_file(csv_path: str | Path, checkpoint_path: str | Path, device: str = "cpu",
                  explain_top_n: int = 3) -> dict:
    """Full pipeline for the demo: CSV -> windows -> rolling K-step forecast -> explanations."""
    model, ckpt = load_checkpoint_for_inference(checkpoint_path, device)
    cfg = ckpt["cfg"]
    L, K = ckpt["L"], ckpt["K"]
    fcfg = cfg["features"]
    windows, rowmap, has_labels = preprocess_single_csv(
        csv_path, fcfg["window_seconds"], fcfg["max_gap_windows"], fcfg["attack_min_flows"])
    if len(windows) < L:
        raise ValueError(f"only {len(windows)} time windows in this file (need >= {L}, i.e. "
                         f"{L * fcfg['window_seconds']:.0f}s of contiguous traffic) - upload a longer capture")

    X = windows[FEATURE_NAMES].to_numpy(dtype=np.float32)
    Xz = apply_scaler(X, np.array(ckpt["scaler_mean"]), np.array(ckpt["scaler_std"]))
    Xt = torch.from_numpy(Xz).to(device)

    seg = windows["seg"].to_numpy()
    N = len(windows)
    starts = np.arange(0, N - L + 1)
    starts = starts[seg[starts] == seg[starts + L - 1]]  # keep only contexts inside one segment
    if len(starts) == 0:
        raise ValueError("every segment in this file is shorter than the model's context window")
    ctx_idx = torch.as_tensor(starts)[:, None] + torch.arange(L)

    with torch.no_grad():
        ctx = Xt[ctx_idx]
        out = model.forecast(ctx, K)
    p_attack_k = out["p_attack"].cpu().numpy()     # (n, K)
    p_stage_k = out["p_stage"].cpu().numpy()       # (n, K, S)
    t_end = starts + L - 1
    tau = ckpt.get("tau_attack", 0.5)

    result = {
        "windows": windows, "rowmap": rowmap, "has_labels": has_labels,
        "t_end": t_end, "t_end_seconds": windows["t0"].to_numpy()[t_end],
        "p_next": p_attack_k[:, 0], "p_alarm": p_attack_k.max(axis=1), "p_attack_k": p_attack_k,
        "stage_next": p_stage_k[:, 0, :].argmax(axis=1), "stage_names": ckpt["stage_names"],
        "tau": tau, "L": L, "K": K, "window_seconds": fcfg["window_seconds"],
        "flagged": t_end[p_attack_k.max(axis=1) >= tau],
    }

    flagged_seq = np.flatnonzero(p_attack_k.max(axis=1) >= tau)
    if explain_top_n and len(flagged_seq):
        pick = flagged_seq[np.argsort(-p_attack_k.max(axis=1)[flagged_seq])[:explain_top_n]]
        attributions = integrated_gradients(model, ctx[pick], K, steps=32, target="attack")
        result["explanations"] = [
            {"t_end": int(t_end[i]), "t_end_seconds": float(windows["t0"].to_numpy()[t_end[i]]),
             "p_alarm": float(p_attack_k[i].max()),
             "top_features": top_features(attributions[j], k=8)}
            for j, i in enumerate(pick)
        ]
    else:
        result["explanations"] = []
    return result
