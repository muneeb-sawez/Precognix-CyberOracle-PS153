"""Step 5 - offline demo interface (Streamlit).

    streamlit run step5_demo.py
    streamlit run step5_demo.py -- --checkpoint runs/wm_best.pt --device cuda

Upload any CICFlowMeter-style flow CSV (a slice of a CIC-IDS2018 day, or your own capture run
through CICFlowMeter). Everything - preprocessing, the world-model forecast, and the Integrated
Gradients explanation - runs locally in this process; nothing is sent anywhere.
"""
from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import streamlit as st
import torch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wm.infer import forecast_file  # noqa: E402


def parse_cli_defaults():
    ap = argparse.ArgumentParser()
    ap.add_argument("--checkpoint", default="runs/wm_best.pt")
    ap.add_argument("--device", default="auto")
    args, _ = ap.parse_known_args(sys.argv[1:])
    device = args.device
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    return args.checkpoint, device


st.set_page_config(page_title="Network Attack Forecasting - World Model", layout="wide")
st.title("AI-based Network Attack Forecasting")
st.caption("SIH 2026 - PS 26153  |  runs fully offline, no cloud API calls")

default_ckpt, default_device = parse_cli_defaults()
with st.sidebar:
    st.header("Model")
    ckpt_path = st.text_input("Checkpoint (.pt)", value=default_ckpt)
    device = st.radio("Device", ["cpu", "cuda"] if torch.cuda.is_available() else ["cpu"],
                      index=(0 if default_device == "cpu" else (1 if torch.cuda.is_available() else 0)))
    explain_n = st.slider("Explain top-N flagged windows", 0, 8, 3)
    st.header("Input")
    up = st.file_uploader("Flow CSV (CICFlowMeter format)", type=["csv"])
    st.caption("A `Label` column is optional - without one, ground truth simply won't be shown.")

if not Path(ckpt_path).exists():
    st.warning(f"Checkpoint not found at `{ckpt_path}`. Train one first with `python step3_train.py`, "
              f"or point this field at your `.pt` file.")
    st.stop()

if up is None:
    st.info("Upload a flow CSV in the sidebar to run a forecast. "
           "You can use a slice of any `*_TrafficForML_CICFlowMeter.csv` file to try it out.")
    st.stop()

with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
    tmp.write(up.getvalue())
    tmp_path = tmp.name

with st.spinner("Preprocessing traffic and running the world model ..."):
    try:
        res = forecast_file(tmp_path, ckpt_path, device=device, explain_top_n=explain_n)
    except Exception as e:  # noqa: BLE001 - surface any preprocessing/model error to the user
        st.error(str(e))
        st.stop()
    finally:
        Path(tmp_path).unlink(missing_ok=True)

windows, rowmap = res["windows"], res["rowmap"]
n_flagged = len(res["flagged"])
c1, c2, c3, c4 = st.columns(4)
c1.metric("Time windows analysed", f"{len(windows):,}")
c2.metric("Rolling forecasts made", f"{len(res['t_end']):,}")
c3.metric("Windows flagged", f"{n_flagged:,}")
c4.metric("Alarm threshold", f"{res['tau']:.2f}")
if not res["has_labels"]:
    st.caption("No `Label` column in the upload - ground truth is not shown, only the model's own forecast.")

st.subheader("Infiltration probability timeline")
fig, ax = plt.subplots(figsize=(11, 3.5))
t = res["t_end_seconds"]
if res["has_labels"]:
    ax2 = ax.twinx()
    full_t = windows["t0"].to_numpy()
    ax2.fill_between(full_t, 0, windows["attack"].to_numpy(), step="mid", color="red", alpha=0.15,
                    label="ground truth attack window")
    ax2.set_ylim(0, 1.05); ax2.set_yticks([])
ax.plot(t, res["p_alarm"], color="C0", label=f"P(attack in next {res['K']} windows)")
ax.axhline(res["tau"], color="gray", linestyle=":", label="alarm threshold")
ax.set_xlabel("time (s)"); ax.set_ylabel("forecast probability"); ax.set_ylim(0, 1.05)
h1, l1 = ax.get_legend_handles_labels()
if res["has_labels"]:
    h2, l2 = ax2.get_legend_handles_labels()
    h1, l1 = h1 + h2, l1 + l2
ax.legend(h1, l1, loc="upper left", fontsize=8)
fig.tight_layout()
st.pyplot(fig)

st.subheader("Flagged windows")
if n_flagged == 0:
    st.success("No windows crossed the alarm threshold - traffic looks benign to the model.")
else:
    idx = np.isin(res["t_end"], res["flagged"])
    stage_names = res["stage_names"]
    table = pd.DataFrame({
        "time (s)": res["t_end_seconds"][idx],
        "P(attack in horizon)": res["p_alarm"][idx],
        "predicted next stage": [stage_names[s] for s in res["stage_next"][idx]],
    }).sort_values("P(attack in horizon)", ascending=False).reset_index(drop=True)
    st.dataframe(table, width="stretch")

    win_id_at = windows["win"].to_numpy()
    with st.expander("Show the underlying flagged flow records"):
        chosen_t_end = st.selectbox("Window (time, s)", table["time (s)"].tolist())
        te_idx = res["t_end"][np.isclose(res["t_end_seconds"], chosen_t_end)][0]
        flows = rowmap[rowmap["win"] == win_id_at[te_idx]]
        st.write(f"{len(flows)} flow(s) started in this 10-second window:")
        st.dataframe(flows[["ts", "Label"]], width="stretch")

if res["explanations"]:
    st.subheader("Why the model raised these alarms (Integrated Gradients)")
    st.caption("Positive = pushed the infiltration score up. Negative = pushed it down. "
              "Summed over the model's context window, per input feature.")
    for exp in res["explanations"]:
        with st.container(border=True):
            st.markdown(f"**Window at t={exp['t_end_seconds']:.0f}s** - forecast probability "
                       f"{exp['p_alarm']:.2f}")
            names = [n for n, _ in exp["top_features"]]
            vals = [v for _, v in exp["top_features"]]
            fig, ax = plt.subplots(figsize=(6, 2.6))
            colors = ["#d62728" if v > 0 else "#1f77b4" for v in vals]
            ax.barh(range(len(names))[::-1], vals, color=colors)
            ax.set_yticks(range(len(names))[::-1], names, fontsize=8)
            ax.set_xlabel("attribution", fontsize=8)
            fig.tight_layout()
            st.pyplot(fig)
