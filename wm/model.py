"""Recurrent world model.

  encoder  : S_t (49-d state vector)  -> latent
  dynamics : GRU/LSTM over the latent history  (this is what learns P(S_t+1 | S_<=t))
  heads    : next-state Gaussian (mean, log-variance), P(attack in next window), ATT&CK stage

`forward` first reads the L context windows (teacher forced), then rolls K steps into the future
feeding its OWN predicted state back in (free running, "imagination"). The K attack
probabilities from that rollout are the infiltration forecast.
"""
from __future__ import annotations

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


class WorldModel(nn.Module):
    def __init__(self, d_in: int, n_stage: int, hidden: int = 128, layers: int = 2,
                 dropout: float = 0.15, arch: str = "gru"):
        super().__init__()
        self.d_in, self.n_stage = d_in, n_stage
        self.enc = nn.Sequential(nn.Linear(d_in, hidden), nn.LayerNorm(hidden), nn.GELU())
        rnn_cls = {"gru": nn.GRU, "lstm": nn.LSTM}[arch]
        self.rnn = rnn_cls(hidden, hidden, num_layers=layers, batch_first=True,
                           dropout=dropout if layers > 1 else 0.0)
        self.drop = nn.Dropout(dropout)
        self.mu = nn.Linear(hidden, d_in)          # residual: S_next = S_now + mu(h)
        self.logvar = nn.Linear(hidden, d_in)
        self.attack = nn.Sequential(nn.Linear(hidden, hidden // 2), nn.GELU(), nn.Linear(hidden // 2, 1))
        self.stage = nn.Sequential(nn.Linear(hidden, hidden // 2), nn.GELU(), nn.Linear(hidden // 2, n_stage))

    def heads(self, h, x_in):
        h = self.drop(h)
        mean = x_in + self.mu(h)
        logvar = self.logvar(h).clamp(-6.0, 2.0)
        return mean, logvar, self.attack(h).squeeze(-1), self.stage(h)

    def forward(self, ctx, K: int, fut=None, tf_prob: float = 0.0):
        """ctx: (B, L, D) standardised states.  fut: (B, K, D) true future states (training only)."""
        B = ctx.shape[0]
        out, state = self.rnn(self.enc(ctx))
        # teacher-forced one-step predictions inside the context (predict windows 1..L-1)
        c_mean, c_logvar, c_att, c_stage = self.heads(out[:, :-1], ctx[:, :-1])
        last, x_cur = out[:, -1], ctx[:, -1]
        means, logvars, atts, stages = [], [], [], []
        for k in range(K):
            m, lv, a, s = self.heads(last, x_cur)  # prediction for window t+1+k
            means.append(m); logvars.append(lv); atts.append(a); stages.append(s)
            if k == K - 1:
                break
            x_next = m.detach()                     # free running: feed our own prediction
            if fut is not None and tf_prob > 0:     # scheduled sampling: sometimes feed the truth
                use_real = torch.rand(B, 1, device=ctx.device) < tf_prob
                x_next = torch.where(use_real, fut[:, k].to(x_next.dtype), x_next)
            o, state = self.rnn(self.enc(x_next).unsqueeze(1), state)
            last, x_cur = o[:, 0], x_next
        return {
            "c_mean": c_mean, "c_logvar": c_logvar, "c_att": c_att, "c_stage": c_stage,
            "mean": torch.stack(means, 1), "logvar": torch.stack(logvars, 1),
            "att": torch.stack(atts, 1), "stage": torch.stack(stages, 1),
        }

    @torch.no_grad()
    def forecast(self, ctx, K: int):
        """Pure free-running K-step forecast (what you use at inference time)."""
        self.eval()
        o = self.forward(ctx, K)
        return {
            "p_attack": torch.sigmoid(o["att"].float()),         # (B, K)
            "p_stage": torch.softmax(o["stage"].float(), -1),    # (B, K, S)
            "mean": o["mean"].float(),                           # (B, K, D) predicted future states
            "logvar": o["logvar"].float(),
        }


def compute_loss(out, x, ya, ys, L: int, w: dict, pos_weight: torch.Tensor,
                 stage_w: torch.Tensor, use_nll: bool):
    """x/ya/ys cover L+K windows. Predictions cover windows 1..L+K-1."""
    mean = torch.cat([out["c_mean"], out["mean"]], 1).float()
    logv = torch.cat([out["c_logvar"], out["logvar"]], 1).float()
    att = torch.cat([out["c_att"], out["att"]], 1).float()
    stg = torch.cat([out["c_stage"], out["stage"]], 1).float()
    tx, ta, ts = x[:, 1:], ya[:, 1:], ys[:, 1:]

    if use_nll:  # Gaussian negative log-likelihood = learns a distribution, not just a point
        e_state = (0.5 * (logv + (tx - mean) ** 2 * torch.exp(-logv))).mean(-1)
    else:        # MSE warm-up (stabilises the means first)
        e_state = ((tx - mean) ** 2).mean(-1)
    e_att = F.binary_cross_entropy_with_logits(att, ta, pos_weight=pos_weight, reduction="none")
    e_stage = F.cross_entropy(stg.reshape(-1, stg.shape[-1]), ts.reshape(-1),
                              weight=stage_w, reduction="none").reshape(ts.shape)

    def blend(e):  # context part counts half, the K rollout steps count fully
        return 0.5 * e[:, : L - 1].mean() + e[:, L - 1:].mean()

    parts = {"state": blend(e_state), "attack": blend(e_att), "stage": blend(e_stage)}
    total = sum(w[k] * v for k, v in parts.items())
    return total, {k: float(v.detach()) for k, v in parts.items()}


@torch.no_grad()
def predict_all(model, batcher, starts: np.ndarray, L: int, K: int, bs: int = 1024) -> dict:
    """Run the K-step forecast for every sequence in `starts`; returns numpy arrays."""
    model.eval()
    keys = ("p", "p_stage", "mean", "y", "y_stage", "y_now", "true_fut")
    acc = {k: [] for k in keys}
    for i in range(0, len(starts), bs):
        x, ya, ys = batcher.get(starts[i:i + bs])
        o = model.forecast(x[:, :L], K)
        acc["p"].append(o["p_attack"].cpu()); acc["p_stage"].append(o["p_stage"].cpu())
        acc["mean"].append(o["mean"].cpu()); acc["true_fut"].append(x[:, L:].cpu())
        acc["y"].append(ya[:, L:].cpu()); acc["y_stage"].append(ys[:, L:].cpu())
        acc["y_now"].append(ya[:, L - 1].cpu())
    if not acc["p"]:
        return {k: np.zeros(0) for k in keys}
    return {k: torch.cat(v).numpy() for k, v in acc.items()}
