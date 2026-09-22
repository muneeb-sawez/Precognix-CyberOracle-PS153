"""Metrics used by training (early stopping) and evaluation."""
from __future__ import annotations

import numpy as np
from sklearn.metrics import average_precision_score, precision_recall_curve, roc_auc_score


def best_f1_threshold(y: np.ndarray, p: np.ndarray):
    """Threshold that maximises F1 (use validation data only!). Returns (tau, f1)."""
    y = np.asarray(y).astype(int)
    if y.sum() == 0 or y.sum() == len(y):
        return 0.5, float("nan")
    pr, rc, th = precision_recall_curve(y, p)
    f1 = 2 * pr * rc / np.maximum(pr + rc, 1e-12)
    i = int(np.nanargmax(f1[:-1]))
    return float(th[i]), float(f1[i])


def binary_report(y: np.ndarray, p: np.ndarray, tau: float) -> dict:
    y = np.asarray(y).astype(int)
    yp = (np.asarray(p) >= tau).astype(int)
    tp = int(((yp == 1) & (y == 1)).sum()); fp = int(((yp == 1) & (y == 0)).sum())
    fn = int(((yp == 0) & (y == 1)).sum()); tn = int(((yp == 0) & (y == 0)).sum())
    prec = tp / max(tp + fp, 1); rec = tp / max(tp + fn, 1)
    both = 0 < y.sum() < len(y)
    return {
        "precision": prec, "recall": rec, "f1": 2 * prec * rec / max(prec + rec, 1e-12),
        "fpr": fp / max(fp + tn, 1),
        "auroc": float(roc_auc_score(y, p)) if both else float("nan"),
        "auprc": float(average_precision_score(y, p)) if y.sum() > 0 else float("nan"),
        "n": int(len(y)), "positives": int(y.sum()), "tau": float(tau),
    }


def clean_onset_lead_times(seg_id, attack, t_end, alarm, K: int):
    """Early-warning statistics.

    A *clean onset* is an attack window g preceded by K completely benign windows in the same
    segment. It counts as detected if an alarm was raised at any window in [g-K, g-1]
    (i.e. before the attack had started). Lead time = g - (first alarm window), in windows.
    """
    N = len(attack)
    alarm_at = np.full(N, -1, dtype=np.int8)
    alarm_at[t_end] = alarm.astype(np.int8)
    leads, n_on, skipped = [], 0, 0
    for g in np.flatnonzero(attack == 1):
        if g - K < 0 or seg_id[g - K] != seg_id[g] or attack[g - K:g].any():
            continue
        sl = alarm_at[g - K:g]
        if (sl >= 0).sum() == 0:
            skipped += 1
            continue
        n_on += 1
        hit = np.flatnonzero(sl == 1)
        if len(hit):
            leads.append(K - int(hit[0]))
    return {"onsets": n_on, "skipped": skipped, "detected": len(leads),
            "detection_rate": len(leads) / n_on if n_on else float("nan"),
            "median_lead_windows": float(np.median(leads)) if leads else float("nan")}
