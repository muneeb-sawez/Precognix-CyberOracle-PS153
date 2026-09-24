"""Tri-Tier Unified Defense Ensemble (TDE) for SIH 2026 PS 26153 (NTRO).

Synthesizes three complementary defense layers:
  Tier 1: Recurrent World Model (2-layer GRU with K-step Autoregressive Rollout P(S_{t+1:t+K} | S_{<=t}))
          Extracts latent temporal dynamics vector h_t (128-d) and multi-step lookahead forecast trajectory.
  Tier 2: Unsupervised Zero-Day Anomaly Core (Isolation Forest trained strictly on benign baseline traffic).
          Detects novel, unseen exploit signatures and traffic distribution drifts.
  Tier 3: Gradient Boosted Meta-Calibrator (LightGBM / HistGradientBoosting).
          Learns non-linear tabular decision boundaries over the fused multimodal feature vector:
          Z_t = [Raw 49 features, Latent State h_t (128-d), K-step Trajectory, Max/Mean Risk, Outlier Score]
"""
from __future__ import annotations

import os
from pathlib import Path
import joblib
import numpy as np
import torch
import torch.nn as nn

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

from sklearn.ensemble import HistGradientBoostingClassifier, IsolationForest
from .features import FEATURE_NAMES


class TriTierEnsemble:
    def __init__(self, wm_model=None, scaler_mean=None, scaler_std=None, L: int = 30, K: int = 6,
                 iso_forest=None, meta_classifier=None, tau: float = 0.5):
        self.wm = wm_model
        self.scaler_mean = scaler_mean
        self.scaler_std = scaler_std
        self.L = L
        self.K = K
        self.tau = tau
        
        # Tier 2: Isolation Forest
        self.iso_forest = iso_forest or IsolationForest(
            n_estimators=100,
            contamination=0.015,
            random_state=42,
            n_jobs=-1
        )
        
        # Tier 3: Gradient Boosted Meta-Classifier
        if meta_classifier is not None:
            self.meta = meta_classifier
        elif HAS_LIGHTGBM:
            self.meta = lgb.LGBMClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.05,
                num_leaves=31,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1,
                verbose=-1
            )
        else:
            self.meta = HistGradientBoostingClassifier(
                max_iter=100,
                max_depth=5,
                learning_rate=0.05,
                random_state=42
            )

    @torch.no_grad()
    def extract_latent_and_forecast(self, ctx_tensor: torch.Tensor, device: torch.device):
        """Tier 1 forward pass: extracts 128-d latent state h_t and K-step lookahead trajectory."""
        self.wm.eval()
        ctx_tensor = ctx_tensor.to(device)
        enc = self.wm.enc(ctx_tensor)
        out, state = self.wm.rnn(enc)
        
        # Latent state of the latest context window: (B, hidden)
        h_t = out[:, -1].float().cpu().numpy()
        
        # Free-running K-step rollout
        last, x_cur = out[:, -1], ctx_tensor[:, -1]
        atts = []
        for k in range(self.K):
            m, lv, a, s = self.wm.heads(last, x_cur)
            atts.append(a)
            if k == self.K - 1:
                break
            x_next = m.detach()
            o, state = self.wm.rnn(self.wm.enc(x_next).unsqueeze(1), state)
            last, x_cur = o[:, 0], x_next
            
        att_tensor = torch.stack(atts, 1)  # (B, K)
        probs_k = torch.sigmoid(att_tensor.float()).cpu().numpy()  # (B, K)
        return h_t, probs_k

    def build_fused_vector(self, raw_last_window: np.ndarray, h_t: np.ndarray,
                           probs_k: np.ndarray, iso_scores: np.ndarray) -> np.ndarray:
        """Constructs multimodal input Z_t for the Tier 3 Meta-Classifier."""
        p_max = np.max(probs_k, axis=1, keepdims=True)
        p_mean = np.mean(probs_k, axis=1, keepdims=True)
        p_slope = (probs_k[:, -1:] - probs_k[:, :1]) / max(self.K - 1, 1)
        
        # Fused vector: [Raw 49, Latent 128, K Probs (6), Max, Mean, Slope, Iso_Score]
        return np.hstack([raw_last_window, h_t, probs_k, p_max, p_mean, p_slope, iso_scores])

    def fit_tier2_anomaly(self, benign_raw_windows: np.ndarray):
        """Fits Tier 2 Isolation Forest strictly on benign normal traffic baseline."""
        self.iso_forest.fit(benign_raw_windows)

    def fit_tier3_meta(self, Z_train: np.ndarray, y_train: np.ndarray):
        """Fits Tier 3 Gradient Boosting meta-classifier on the fused representation."""
        self.meta.fit(Z_train, y_train)

    def predict_proba(self, ctx_tensor: torch.Tensor, raw_last_window: np.ndarray,
                      device: torch.device) -> dict:
        """Unified inference producing individual tier telemetry and calibrated ensemble score."""
        h_t, probs_k = self.extract_latent_and_forecast(ctx_tensor, device)
        iso_scores = (-self.iso_forest.decision_function(raw_last_window)).reshape(-1, 1)
        Z = self.build_fused_vector(raw_last_window, h_t, probs_k, iso_scores)
        
        if hasattr(self.meta, "predict_proba"):
            ensemble_probs = self.meta.predict_proba(Z)[:, 1]
        else:
            ensemble_probs = self.meta.decision_function(Z)
            
        wm_p_max = np.max(probs_k, axis=1)
        
        return {
            "ensemble_prob": ensemble_probs,
            "wm_probs_k": probs_k,
            "wm_p_max": wm_p_max,
            "iso_scores": iso_scores.flatten(),
            "latent_h": h_t,
            "is_attack": (ensemble_probs >= self.tau)
        }

    def save(self, filepath: str | Path):
        """Saves ensemble bundle (scaler, iso_forest, meta-classifier, thresholds)."""
        data = {
            "scaler_mean": self.scaler_mean,
            "scaler_std": self.scaler_std,
            "L": self.L,
            "K": self.K,
            "tau": self.tau,
            "iso_forest": self.iso_forest,
            "meta": self.meta,
            "has_lightgbm": HAS_LIGHTGBM
        }
        joblib.dump(data, filepath, compress=3)

    @classmethod
    def load(cls, ensemble_path: str | Path, wm_model=None):
        """Loads ensemble bundle and binds it with the PyTorch World Model."""
        d = joblib.load(ensemble_path)
        inst = cls(
            wm_model=wm_model,
            scaler_mean=d.get("scaler_mean"),
            scaler_std=d.get("scaler_std"),
            L=d["L"],
            K=d["K"],
            iso_forest=d["iso_forest"],
            meta_classifier=d["meta"],
            tau=d.get("tau", 0.5)
        )
        return inst
