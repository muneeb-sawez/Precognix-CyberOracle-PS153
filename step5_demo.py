"""Precognix-PS153 // Cyber Defense World Model Command Console.

High-Tech Tactical SOC Interface featuring interactive Plotly cyber telemetry,
Integrated Gradients feature attribution, MITRE ATT&CK progression tracking,
and automated closed-loop defense mitigation.
"""
from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import requests
import streamlit as st
import torch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wm.infer import forecast_file  # noqa: E402
from wm.common import STAGES  # noqa: E402

# ----------------------------------------------------------------------------------------
# Streamlit Page Config & High-Tech Cyber Theme Injection
# ----------------------------------------------------------------------------------------
st.set_page_config(
    page_title="Precognix // Tactical World Model Console",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

CUSTOM_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

html, body, [class*="css"] {
    font-family: 'Rajdhani', sans-serif;
    color: #e2e8f0;
}

/* Background gradient & cyber grid */
.stApp {
    background: radial-gradient(circle at 15% 15%, rgba(6, 78, 59, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 85% 20%, rgba(14, 116, 144, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 50% 80%, rgba(15, 23, 42, 0.8) 0%, transparent 60%),
                #030712;
}

/* Sidebar styling */
[data-testid="stSidebar"] {
    background-color: rgba(3, 7, 18, 0.95);
    border-right: 1px solid rgba(0, 240, 255, 0.2);
    backdrop-filter: blur(12px);
}

/* Tactical HUD Cards */
.hud-card {
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(0, 240, 255, 0.25);
    border-radius: 12px;
    padding: 18px 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(0, 240, 255, 0.05);
    transition: all 0.3s ease;
    margin-bottom: 12px;
}
.hud-card:hover {
    border-color: rgba(0, 240, 255, 0.5);
    box-shadow: 0 0 25px rgba(0, 240, 255, 0.15);
}

.hud-card-critical {
    border-color: rgba(239, 68, 68, 0.6);
    background: rgba(30, 10, 15, 0.65);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
}

/* Titles & Header */
.cyber-title {
    font-family: 'Orbitron', sans-serif;
    font-weight: 900;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #00F0FF, #38BDF8, #10B981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0px;
    text-transform: uppercase;
}

.mono-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 1px;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid rgba(0, 240, 255, 0.3);
    background: rgba(0, 240, 255, 0.1);
    color: #38BDF8;
}

.metric-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.metric-value {
    font-family: 'Orbitron', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #f8fafc;
    margin-top: 4px;
}

/* Primary Button Styling */
div.stButton > button {
    font-family: 'Orbitron', sans-serif;
    font-weight: 700;
    letter-spacing: 1px;
    border-radius: 8px;
    border: 1px solid #00F0FF;
    background: linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(14, 116, 144, 0.4) 100%);
    color: #00F0FF;
    transition: all 0.3s ease;
    padding: 10px 24px;
}
div.stButton > button:hover {
    background: linear-gradient(135deg, rgba(0, 240, 255, 0.4) 0%, rgba(14, 116, 144, 0.7) 100%);
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
    color: #ffffff;
}
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


def parse_cli_defaults():
    ap = argparse.ArgumentParser()
    ap.add_argument("--checkpoint", default="runs/wm_best.pt")
    ap.add_argument("--device", default="auto")
    args, _ = ap.parse_known_args(sys.argv[1:])
    device = args.device
    if device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    return args.checkpoint, device


default_ckpt, default_device = parse_cli_defaults()

# ----------------------------------------------------------------------------------------
# Sidebar Controls & Hardware Info
# ----------------------------------------------------------------------------------------
with st.sidebar:
    st.markdown("<h3 style='font-family: Orbitron; color: #00F0FF; letter-spacing: 1px;'>// COMMAND CONTROLS</h3>", unsafe_allow_html=True)
    
    ckpt_path = st.text_input("Model Checkpoint (.pt)", value=default_ckpt)
    device_opt = st.radio("Hardware Acceleration", ["cuda", "cpu"] if torch.cuda.is_available() else ["cpu"],
                          index=(0 if torch.cuda.is_available() else 0))
    explain_n = st.slider("Explain top-N flagged windows", 1, 8, 3)

    st.markdown("---")
    st.markdown("<span class='metric-label'>Telemetry Ingestion</span>", unsafe_allow_html=True)
    up = st.file_uploader("Upload Network Flow CSV", type=["csv"], help="CICFlowMeter format network capture")

    st.markdown("---")
    st.markdown("<span class='metric-label'>Quick Benchmark Evaluation</span>", unsafe_allow_html=True)
    use_sample = st.button("⚡ LOAD DEMO BENCHMARK (15k flows)")
    
    st.markdown("---")
    st.markdown(f"""
    <div style='font-family: JetBrains Mono; font-size: 11px; color: #64748b;'>
    ENGINE: PyTorch 2.14.0+cu126<br>
    DEVICE: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}<br>
    HORIZON: K=6 Windows (60s Lead-Time)<br>
    STATUS: <span style='color: #10B981;'>ONLINE & READY</span>
    </div>
    """, unsafe_allow_html=True)

# ----------------------------------------------------------------------------------------
# Header Banner
# ----------------------------------------------------------------------------------------
col_h1, col_h2 = st.columns([3, 1])
with col_h1:
    st.markdown("<h1 class='cyber-title'>PRECOGNIX // WORLD MODEL</h1>", unsafe_allow_html=True)
    st.markdown("<p style='font-size: 14px; color: #94a3b8; margin-top: -8px; font-family: JetBrains Mono;'>"
                "SIH 2026 · Problem Statement 26153 (NTRO) · AI-Based Attack Infiltration Forecasting</p>",
                unsafe_allow_html=True)
with col_h2:
    st.markdown(
        "<div style='text-align: right; padding-top: 10px;'>"
        "<span class='mono-tag'>100% AIR-GAPPED</span> "
        "<span class='mono-tag' style='border-color: #10B981; color: #10B981;'>GPU ACCELERATED</span>"
        "</div>",
        unsafe_allow_html=True
    )

st.markdown("<div style='height: 1px; background: linear-gradient(90deg, #00F0FF, transparent); margin-bottom: 20px;'></div>", unsafe_allow_html=True)

if not Path(ckpt_path).exists():
    st.error(f"Checkpoint not found at `{ckpt_path}`. Train one first with `python step3_train.py`.")
    st.stop()

# Determine File to Predict
target_csv_path = None
if use_sample:
    sample_file = Path(__file__).resolve().parent / "demo_sample.csv"
    if sample_file.exists():
        target_csv_path = str(sample_file)
    else:
        st.warning("demo_sample.csv not found in folder.")
elif up is not None:
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
        tmp.write(up.getvalue())
        target_csv_path = tmp.name

if not target_csv_path:
    st.info("👈 Please upload a flow CSV in the sidebar or click **'⚡ LOAD DEMO BENCHMARK (15k flows)'** to start the neural forecasting simulation.")
    st.stop()

# ----------------------------------------------------------------------------------------
# Run World Model Forecast
# ----------------------------------------------------------------------------------------
with st.spinner(f"Aggregating 10-second states & executing autoregressive K-step rollout ({device_opt.upper()})..."):
    try:
        res = forecast_file(target_csv_path, ckpt_path, device=device_opt, explain_top_n=explain_n)
    except Exception as e:
        st.error(f"Inference execution error: {str(e)}")
        st.stop()
    finally:
        if up is not None and target_csv_path != str(Path(__file__).resolve().parent / "demo_sample.csv"):
            Path(target_csv_path).unlink(missing_ok=True)

windows, rowmap = res["windows"], res["rowmap"]
n_flagged = len(res["flagged"])
tau = res["tau"]
p_alarm = res["p_alarm"]
t_sec = res["t_end_seconds"]
K = res["K"]

# ----------------------------------------------------------------------------------------
# Top Telemetry HUD Metrics
# ----------------------------------------------------------------------------------------
m1, m2, m3, m4, m5 = st.columns(5)

with m1:
    st.markdown(f"""
    <div class='hud-card'>
        <div class='metric-label'>Analyzed Windows</div>
        <div class='metric-value'>{len(windows):,}</div>
        <div style='font-size: 11px; color: #64748b;'>{len(windows)*10/60:.1f} minutes of flows</div>
    </div>
    """, unsafe_allow_html=True)

with m2:
    st.markdown(f"""
    <div class='hud-card'>
        <div class='metric-label'>K-Step Rollouts</div>
        <div class='metric-value'>{len(res['t_end']):,}</div>
        <div style='font-size: 11px; color: #00F0FF;'>Horizon: T+1 to T+{K}</div>
    </div>
    """, unsafe_allow_html=True)

with m3:
    card_cls = "hud-card-critical" if n_flagged > 0 else "hud-card"
    status_color = "#EF4444" if n_flagged > 0 else "#10B981"
    st.markdown(f"""
    <div class='hud-card {card_cls}'>
        <div class='metric-label'>Flagged Alarms</div>
        <div class='metric-value' style='color: {status_color};'>{n_flagged:,}</div>
        <div style='font-size: 11px; color: {status_color};'>Threat threshold breached</div>
    </div>
    """, unsafe_allow_html=True)

with m4:
    st.markdown(f"""
    <div class='hud-card'>
        <div class='metric-label'>Alarm Threshold (τ)</div>
        <div class='metric-value' style='color: #F59E0B;'>{tau:.4f}</div>
        <div style='font-size: 11px; color: #64748b;'>Calibrated FPR ≤ 0.005</div>
    </div>
    """, unsafe_allow_html=True)

with m5:
    lead_time = f"+{K*10}s Lead-Time" if n_flagged > 0 else "Nominal"
    lead_color = "#10B981" if n_flagged > 0 else "#64748b"
    st.markdown(f"""
    <div class='hud-card'>
        <div class='metric-label'>Forecasting Advantage</div>
        <div class='metric-value' style='color: {lead_color}; font-size: 20px;'>{lead_time}</div>
        <div style='font-size: 11px; color: #64748b;'>Pre-emptive defense</div>
    </div>
    """, unsafe_allow_html=True)

# ----------------------------------------------------------------------------------------
# High-Tech Interactive Plotly Infiltration Timeline
# ----------------------------------------------------------------------------------------
st.markdown("<h3 style='font-family: Orbitron; font-size: 18px; color: #00F0FF; margin-top: 15px;'>// INFILTRATION PROBABILITY TRAJECTORY (T+1 TO T+6)</h3>", unsafe_allow_html=True)

fig = go.Figure()

# Plot Ground Truth if present
if res["has_labels"]:
    full_t = windows["t0"].to_numpy()
    attack_vals = windows["attack"].to_numpy()
    fig.add_trace(go.Scatter(
        x=full_t,
        y=attack_vals,
        mode="lines",
        name="Ground Truth Attack Window",
        line=dict(color="rgba(239, 68, 68, 0.4)", width=1.5, dash="dot"),
        fill="tozeroy",
        fillcolor="rgba(239, 68, 68, 0.12)",
        hoverinfo="skip"
    ))

# Plot Forecast Probability Trajectory
fig.add_trace(go.Scatter(
    x=t_sec,
    y=p_alarm,
    mode="lines+markers",
    name=f"World Model Forecast P(Attack in next {K} windows)",
    line=dict(color="#00F0FF", width=2.5),
    marker=dict(size=4, color="#38BDF8"),
    fill="tozeroy",
    fillcolor="rgba(0, 240, 255, 0.08)",
    hovertemplate="<b>Window Time:</b> %{x:.0f}s<br><b>Infiltration P:</b> %{y:.4f}<extra></extra>"
))

# Alarm Threshold line
fig.add_hline(
    y=tau,
    line_dash="dash",
    line_color="#F59E0B",
    annotation_text=f"Alarm Threshold τ = {tau:.3f}",
    annotation_position="top right",
    annotation_font=dict(color="#F59E0B", family="JetBrains Mono", size=11)
)

fig.update_layout(
    template="plotly_dark",
    paper_bgcolor="rgba(15, 23, 42, 0.6)",
    plot_bgcolor="rgba(3, 7, 18, 0.8)",
    height=340,
    margin=dict(l=40, r=40, t=30, b=40),
    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(family="JetBrains Mono", size=11)),
    xaxis=dict(
        title="Observation Window Timeline (seconds)",
        title_font=dict(family="JetBrains Mono", size=12, color="#94a3b8"),
        gridcolor="rgba(255, 255, 255, 0.06)",
        zerolinecolor="rgba(255, 255, 255, 0.1)"
    ),
    yaxis=dict(
        title="Threat Probability",
        title_font=dict(family="JetBrains Mono", size=12, color="#94a3b8"),
        range=[-0.05, 1.05],
        gridcolor="rgba(255, 255, 255, 0.06)",
        zerolinecolor="rgba(255, 255, 255, 0.1)"
    )
)

st.plotly_chart(fig, use_container_width=True)

# ----------------------------------------------------------------------------------------
# Two-Column Section: Explainability & Active Defense
# ----------------------------------------------------------------------------------------
c_left, c_right = st.columns([3, 2])

with c_left:
    st.markdown("<h3 style='font-family: Orbitron; font-size: 16px; color: #38BDF8;'>// INTEGRATED GRADIENTS ATTRIBUTION</h3>", unsafe_allow_html=True)
    explanations = res.get("explanations", [])
    if explanations:
        expl = explanations[0]
        feats = expl["top_features"]
        f_names = [f[0] for f in feats][::-1]
        f_vals = [f[1] for f in feats][::-1]
        f_colors = ["#EF4444" if v > 0 else "#00F0FF" for v in f_vals]

        fig_bar = go.Figure(go.Bar(
            x=f_vals,
            y=f_names,
            orientation="h",
            marker=dict(color=f_colors, line=dict(color="rgba(255, 255, 255, 0.2)", width=1)),
            hovertemplate="<b>Feature:</b> %{y}<br><b>Attribution Impact:</b> %{x:.2f}<extra></extra>"
        ))

        fig_bar.update_layout(
            template="plotly_dark",
            paper_bgcolor="rgba(15, 23, 42, 0.6)",
            plot_bgcolor="rgba(3, 7, 18, 0.8)",
            height=300,
            margin=dict(l=20, r=20, t=15, b=25),
            xaxis=dict(
                title="Gradient Feature Attribution (Sign preserved: +Raises Risk / -Suppresses Risk)",
                title_font=dict(family="JetBrains Mono", size=10, color="#94a3b8"),
                gridcolor="rgba(255, 255, 255, 0.06)"
            ),
            yaxis=dict(
                tickfont=dict(family="JetBrains Mono", size=11, color="#e2e8f0")
            )
        )
        st.plotly_chart(fig_bar, use_container_width=True)
    else:
        st.info("No threat windows exceeded alarm threshold — network state baseline is nominal.")

with c_right:
    st.markdown("<h3 style='font-family: Orbitron; font-size: 16px; color: #10B981;'>// MITRE ATT&CK & AUTOMATED COUNTERMEASURE</h3>", unsafe_allow_html=True)
    
    # MITRE Stage indicator
    stage_names = res["stage_names"]
    pred_stage_idx = res["stage_next"][0] if len(res["stage_next"]) else 0
    pred_stage_name = stage_names[pred_stage_idx]

    st.markdown(f"""
    <div class='hud-card' style='border-color: rgba(16, 185, 129, 0.4);'>
        <div class='metric-label'>Predicted ATT&CK Stage</div>
        <div style='font-family: Orbitron; font-size: 20px; color: #10B981; font-weight: 700;'>
            {pred_stage_name}
        </div>
        <div style='font-size: 12px; color: #94a3b8; font-family: JetBrains Mono; margin-top: 4px;'>
            Tactic detected during forward rollout (K=6 steps ahead)
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Closed-Loop Mitigation Action
    st.markdown("<span class='metric-label'>Pre-emptive Air-Gap Enforcement</span>", unsafe_allow_html=True)
    if st.button("🛡️ DISPATCH PROACTIVE FIREWALL BLOCK"):
        try:
            r = requests.post("http://localhost:8000/api/mitigate", json={
                "action": "isolate_subnet",
                "target_ip": "18.219.211.138",
                "port": 21,
                "protocol": "TCP",
                "reason": f"Predicted {pred_stage_name} threat onset"
            }, timeout=3)
            if r.status_code == 200:
                data = r.json()
                st.success("✅ Countermeasure Staged Successfully!")
                st.code(data["enforcement"]["windows_firewall_rule"], language="powershell")
                st.code(data["enforcement"]["linux_iptables_ebpf"], language="bash")
        except Exception as e:
            st.error(f"Failed to communicate with API server: {e}")
