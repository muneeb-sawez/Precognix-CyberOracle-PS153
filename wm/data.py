"""Loading the per-window table, train/val/test splitting, scaling and batch gathering."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import torch

from .common import STAGES
from .features import FEATURE_NAMES


def load_windows(processed_dir) -> pd.DataFrame:
    p = Path(processed_dir) / "windows_all.parquet"
    if not p.exists():
        raise FileNotFoundError(f"{p} not found - run step2_preprocess.py first")
    df = pd.read_parquet(p)
    df = df.sort_values(["day", "seg", "win"]).reset_index(drop=True)
    df["seg_id"] = (df["day"].astype(str) + "#" + df["seg"].astype(str)).factorize()[0]
    return df


def feature_matrix(df: pd.DataFrame) -> np.ndarray:
    return df[FEATURE_NAMES].to_numpy(dtype=np.float32)


@dataclass
class Splits:
    train: np.ndarray       # global index of the FIRST window of every training sequence
    val: np.ndarray
    test: np.ndarray
    train_mask: np.ndarray  # bool per window: window lies inside a training block


def build_splits(df: pd.DataFrame, L: int, K: int, cfg: dict) -> Splits:
    """A sequence = L context windows + K future windows.

    * test days   -> every sequence of the day (whole days the model never trained on)
    * train days  -> cut into blocks of `block_windows`; every `val_every`-th block is validation.
                     A sequence never crosses a block border, so train and val never share a window.
    """
    B, V = int(cfg["block_windows"]), int(cfg["val_every"])
    train_days, test_days = set(cfg["train_days"]), set(cfg["test_days"])
    days = df["day"].astype(str).to_numpy()
    seg = df["seg_id"].to_numpy()
    N, T = len(df), L + K
    bounds = np.r_[0, np.flatnonzero(np.diff(seg)) + 1, N]
    tr, va, te = [], [], []
    mask = np.zeros(N, dtype=bool)
    for a, b in zip(bounds[:-1], bounds[1:]):
        n = b - a
        day = days[a]
        if day in train_days:
            q = np.arange(n)
            mask[a:b] = (q // B) % V != V - 1
            if n >= T:
                p = np.arange(n - T + 1)
                same_block = (p // B) == ((p + T - 1) // B)
                is_val = (p // B) % V == V - 1
                tr.append(a + p[same_block & ~is_val])
                va.append(a + p[same_block & is_val])
        elif day in test_days and n >= T:
            te.append(a + np.arange(n - T + 1))

    def cat(xs):
        return np.concatenate(xs).astype(np.int64) if xs else np.zeros(0, dtype=np.int64)

    return Splits(cat(tr), cat(va), cat(te), mask)


def fit_scaler(X: np.ndarray, mask: np.ndarray, n_flows: np.ndarray):
    m = mask & (n_flows > 0)
    mean = X[m].mean(axis=0)
    std = np.maximum(X[m].std(axis=0), 1e-3)
    return mean.astype(np.float32), std.astype(np.float32)


def apply_scaler(X: np.ndarray, mean: np.ndarray, std: np.ndarray, clip: float = 6.0) -> np.ndarray:
    return np.clip((X - mean) / std, -clip, clip).astype(np.float32)


def class_stats(attack: np.ndarray, stage: np.ndarray, mask: np.ndarray):
    """pos_weight for the attack head and (soft) class weights for the stage head."""
    a = attack[mask]
    pos = float(a.mean()) if len(a) else 0.0
    pos_weight = float(np.clip((1 - pos) / max(pos, 1e-6), 1.0, 10.0))
    counts = np.bincount(stage[mask], minlength=len(STAGES)).astype(float)
    present = counts > 0
    w = np.ones(len(STAGES))
    if present.sum() > 0:
        w[present] = np.sqrt(counts[present].sum() / (counts[present] * present.sum()))
        w[present] = w[present] / w[present].mean()
    return pos_weight, w.astype(np.float32), counts


class Batcher:
    """Keeps all window vectors on the device and gathers sequences by start index."""

    def __init__(self, Xz: np.ndarray, attack: np.ndarray, stage: np.ndarray, L: int, K: int, device):
        self.device = device
        self.X = torch.from_numpy(Xz).to(device)
        self.A = torch.from_numpy(attack.astype(np.float32)).to(device)
        self.S = torch.from_numpy(stage.astype(np.int64)).to(device)
        self.offs = torch.arange(L + K, device=device)

    def get(self, starts: np.ndarray):
        idx = torch.as_tensor(np.asarray(starts), device=self.device).unsqueeze(1) + self.offs
        return self.X[idx], self.A[idx], self.S[idx]
