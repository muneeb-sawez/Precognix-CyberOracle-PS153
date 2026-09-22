"""Explainability - Integrated Gradients (Sundararajan et al. 2017).

The problem statement asks for "attention mechanisms, feature attribution or equivalent
techniques". We use Integrated Gradients instead of SHAP because:
  * it needs only autograd (no extra dependency, nothing that can fail to install on Windows),
  * it is well defined for a recurrent free-running rollout, where SHAP's KernelExplainer would
    need to treat the model as a black box and re-run it thousands of times per sample,
  * with a zero baseline it satisfies the same completeness axiom SHAP is built on, so the
    attributions of one prediction sum (almost exactly) to that prediction's logit.

`_rollout_for_grad` is a copy of WorldModel.forward's free-running loop that does NOT detach the
fed-back prediction, so gradients can flow through the full K-step rollout back to the context
input. WorldModel.forward detaches on purpose during training (stops the model being blamed for
compounding its own forecast error into future steps) - we do not want that here.
"""
from __future__ import annotations

import numpy as np
import torch

from .features import FEATURE_NAMES


def _rollout_for_grad(model, ctx: torch.Tensor, K: int):
    out, state = model.rnn(model.enc(ctx))
    last, x_cur = out[:, -1], ctx[:, -1]
    atts, stages = [], []
    for k in range(K):
        m, lv, a, s = model.heads(last, x_cur)
        atts.append(a)
        stages.append(s)
        if k == K - 1:
            break
        o, state = model.rnn(model.enc(m).unsqueeze(1), state)   # m NOT detached
        last, x_cur = o[:, 0], m
    return torch.stack(atts, 1), torch.stack(stages, 1)          # (B,K), (B,K,S)


def integrated_gradients(model, ctx: torch.Tensor, K: int, steps: int = 32,
                         target: str = "attack") -> np.ndarray:
    """Attribution of every (window, feature) in `ctx` towards the worst-case infiltration score.

    ctx: (B, L, D) standardised context, on the model's device. Returns (B, L, D) numpy array;
    attributions[b].sum() approximately equals the target score for sample b (completeness).
    """
    model.eval()
    was_training = model.training
    baseline = torch.zeros_like(ctx)
    total_grad = torch.zeros_like(ctx)
    alphas = torch.linspace(0.0, 1.0, steps, device=ctx.device)
    for a in alphas:
        x = (baseline + a * (ctx - baseline)).clone().requires_grad_(True)
        att, stage = _rollout_for_grad(model, x, K)
        score = att.amax(dim=1).sum() if target == "attack" else stage.amax(dim=(1, 2)).sum()
        grad, = torch.autograd.grad(score, x)
        total_grad = total_grad + grad
    model.train(was_training)
    avg_grad = total_grad / steps
    return ((ctx - baseline) * avg_grad).detach().cpu().numpy()


def top_features(attribution: np.ndarray, k: int = 8) -> list[tuple[str, float]]:
    """attribution: (L, D) for ONE sample -> the k features with the largest |attribution|,
    summed over the L context windows, sign preserved (raises vs lowers the risk score)."""
    per_feat = attribution.sum(axis=0)
    order = np.argsort(-np.abs(per_feat))[:k]
    return [(FEATURE_NAMES[i], float(per_feat[i])) for i in order]
