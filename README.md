# CyberOracle: Predictive Cyber Defense World Model for Network Attack Forecasting

**Developed by Team Precognix · Smart India Hackathon 2026 · Problem Statement 26153 (NTRO)**  
*CSE-CIC-IDS2018 Flow Telemetry Pipeline · Autoregressive World Model Dynamics · Explainable AI (XAI)*

---

## 1. Executive Summary & Problem Formulation

Contemporary Security Operations Centers (SOCs) rely predominantly on point-in-time Signature and Anomaly Intrusion Detection Systems (IDS). These conventional systems suffer from a foundational latency flaw: they fire alerts reactively, either concurrent with packet arrival or after adversary payloads have successfully executed. 

**CyberOracle** (engineered by **Team Precognix**) formulates cyber defense as an **autoregressive temporal state-space modeling problem**. By transforming raw network flow telemetry into 10-second rolling state vectors $S_t \in \mathbb{R}^{49}$, CyberOracle trains a recurrent neural World Model:

$$\mathcal{M}_\theta: (S_{t-L+1}, \dots, S_t) \mapsto (\hat{S}_{t+1}, \dots, \hat{S}_{t+K})$$

Operating over a 5-minute historical context window ($L=30$) and predicting up to 60 seconds into the future ($K=6$ steps), the model accomplishes three objectives:
1. **Infiltration Forecasting**: Predicts the probability of attack occurrence $\hat{p}_k = P(\text{attack at } t+k \mid S_{\le t})$ across the rollout horizon.
2. **Tactical Stage Anticipation**: Classifies upcoming adversary trajectory into MITRE ATT&CK tactical stages (Initial Access, Lateral Movement, Command & Control, Impact).
3. **Axiomatic Attribution**: Computes path-integral feature attributions via Integrated Gradients ($m=20$ quadrature steps) to provide explainable root-cause telemetry ranking without black-box opacity.

---

## 2. Hardware Portability & System Requirements

The Precognix codebase is engineered to execute universally across commodity edge hardware, workstations, and high-performance compute clusters without vendor lock-in:

| Component | Minimum Specification | Recommended Specification |
|---|---|---|
| **Operating System** | Windows 10/11, Ubuntu 20.04+, macOS 12+ | Linux / Windows 64-bit |
| **Python Runtime** | Python 3.10, 3.11, or 3.12 | Python 3.11 |
| **Compute Engine** | Multi-core x86_64 / ARM64 CPU | NVIDIA CUDA GPU (11.8 / 12.x) or Apple Silicon MPS |
| **Memory (RAM)** | 8 GB | 16 GB |
| **Storage** | 10 GB free space | 20 GB free space (NVMe / SSD) |

The inference footprint is strictly constrained to **<1 MB** checkpoint storage and **<600 MB** runtime RAM, ensuring wire-speed execution (<1 ms per 10-second state snapshot).

---

## 3. Repository Architecture

```
Precognix-PS153/
├── frontend/               # Enterprise Cyber-Oracle SOC React + Vite dashboard
│   ├── src/                # Real-time HUD, MITRE matrix, Dual Explainability, Topology
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Dev server configuration
├── docs/                   # SIH 2026 Master Dossier, Architecture Specs & Presentation
│   ├── CyberOracle-SIH2026-Master_Dossier.pdf
│   ├── CyberOracle_Model_Evaluation_Report.pdf
│   ├── technical_presentation.pptx
│   └── architecture_document.docx
├── tests/                  # Automated unit and API contract verification suite
│   ├── test_model.py       # World Model forward pass & rollout dimension tests
│   └── test_api.py         # REST & WebSocket contract validation
├── wm/                     # Core PyTorch neural library
│   ├── data.py             # Feature normalization, window slicing & scheduled batcher
│   ├── model.py            # 2-layer GRU World Model with multi-task prediction heads
│   ├── infer.py            # Autoregressive K-step rollout inference engine
│   ├── explain.py          # Axiomatic Integrated Gradients & Temporal Attention
│   ├── ensemble.py         # Tri-Tier Unified Defense Ensemble core
│   ├── live_manager.py     # Thread-safe background packet capture & simulator
│   └── dossier_generator.py# Official NTRO / CERT-In PDF & STIX 2.1 dossier generator
├── api_server.py           # High-performance FastAPI server with WebSockets & SOAR
├── live_sniffer.py         # Wire-speed packet capture & streaming inference
├── export_onnx.py          # Edge gateway ONNX model exporter
├── Dockerfile              # Production container build
├── docker-compose.yml      # 1-command startup for unified backend + frontend stack
├── launch_system.bat       # 1-click system launcher (Windows Command Prompt)
├── launch_system.ps1       # 1-click system launcher (PowerShell edition)
├── step0_check_env.py      # Hardware, CUDA/MPS/CPU, and dependency verification
├── step1_download.py       # Resumable HTTPS fetcher for CSE-CIC-IDS2018 (6.6 GB)
├── step2_preprocess.py     # Chunked aggregation of flows into 10s state vectors
├── step3_train.py          # Autoregressive World Model training with scheduled sampling
├── step3b_train_ensemble.py# Tri-Tier Ensemble trainer (IsoForest + LightGBM meta-learner)
├── step4_evaluate.py       # Test day benchmarking vs memoryless baseline & XAI
├── step4b_eval_ensemble.py # Held-out test evaluation for Tri-Tier Ensemble
├── step5_demo.py           # Offline interactive Streamlit dashboard
├── config.yaml             # Central pipeline configuration (window size, horizon, loss weights)
├── demo_sample.csv         # Standalone validation flow trace (15,000 flows)
└── requirements.txt        # Full Python dependencies
```


---

## 4. Quick Start & Setup Instructions

### Step 4.1: Environment Initialization

Create and activate an isolated virtual environment:

```bash
# Windows (PowerShell)
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### Step 4.2: Dependency Installation

Install PyTorch according to your available compute hardware:

```bash
# Option A: Systems with NVIDIA GPU acceleration (CUDA 12.6)
pip install torch --index-url https://download.pytorch.org/whl/cu126

# Option B: Systems using standard CPU or Apple Silicon MPS
pip install torch
```

Install core numerical, analytical, and server libraries:

```bash
pip install -r requirements.txt
```

### Step 4.3: Environment & Hardware Verification

Validate the runtime configuration:

```bash
python step0_check_env.py
```

This verifies Python runtime version, checks package imports, verifies acceleration device status (CUDA, Apple MPS, or CPU fallback), checks storage volume margins, and validates a synthetic GRU forward tensor pass.

---

## 5. Pipeline Execution Workflow

### Step 1: Dataset Acquisition

The CSE-CIC-IDS2018 benchmark (Communications Security Establishment & Canadian Institute for Cybersecurity) is ingested via resilient HTTPS streaming:

```bash
python step1_download.py
```

- Fetches the 10 daily flow capture files (~6.6 GB total) directly from public repository endpoints.
- Supports HTTP Range headers for automatic byte-level resume upon network interruption.
- Run `python step1_download.py --skip-large` to download all files except the 3.8 GB DDoS capture (~2.7 GB total).

### Step 2: Telemetry Preprocessing & State Space Aggregation

Transform individual packet flows into synchronized 10-second temporal state snapshots:

```bash
python step2_preprocess.py
```

- Processes raw CSVs in 250,000-row streams to prevent memory exhaustion on 8 GB systems.
- Sanitizes missing, infinite, and malformed flow duration anomalies.
- Computes 49 statistical flow descriptors (rates, packet distributions, TCP flag densities, and payload volume metrics).
- Partitions the timeline into strictly chronologically separated training, validation, and test blocks, eliminating temporal lookahead leakage.
- Outputs serialized state tensors into `data/processed/` (<600 MB).

### Step 3: World Model Training

Train the autoregressive recurrent dynamics network:

```bash
python step3_train.py
```

- Implements a 2-layer Gated Recurrent Unit (GRU, hidden dimension $H=128$) with dropout regularisation ($\delta=0.2$).
- Utilizes scheduled sampling (teacher forcing probability $\tau_{\text{tf}}$ decaying linearly from 1.0 to 0.0) so the model transitions from ground-truth inputs to self-generated autoregressive trajectory rollouts.
- Jointly optimizes a composite multi-task objective:
  $$\mathcal{L} = \lambda_{\text{state}} \mathcal{L}_{\text{MSE}}(\hat{S}, S) + \lambda_{\text{att}} \mathcal{L}_{\text{BCE}}(\hat{p}, y_{\text{att}}) + \lambda_{\text{stage}} \mathcal{L}_{\text{CE}}(\hat{c}, y_{\text{stage}})$$
- Automatic early stopping based on Validation Area Under Precision-Recall Curve (AUPRC). Checkpoint, scaler, and metadata are saved to `runs/wm_best.pt`.

### Step 4: Empirical Evaluation & Benchmarking

Evaluate performance on held-out test days (unseen temporal distributions):

```bash
python step4_evaluate.py
```

This script evaluates:
1. **World Model Trajectory Metrics**: Precision, Recall, F1-Score, False Positive Rate (FPR), AUROC, and AUPRC aggregated across the full 60-second horizon and broken down by individual 10-second intervals.
2. **Memoryless Baseline Benchmark**: Isolates the value of temporal context by comparing against an identical-feature Logistic Regression classifier that only observes the current instantaneous time window ($t=0$).
3. **Early Warning Lead Time**: Quantifies the time delta between early warning alert trigger and adversary infiltration onset.
4. **Attribution Analysis**: Generates feature importance plots via Integrated Gradients.
5. Saves artifacts to `runs/eval_report.json`, `eval_pr_curve.png`, and `eval_feature_importance.png`.

---

## 6. Empirical Verification & Benchmark Isolation

Evaluation performed on held-out CSE-CIC-IDS2018 test days demonstrates the critical advantage of modeling multi-step temporal state dynamics over memoryless classification:

| Evaluation Metric | Memoryless Baseline (No History) | Precognix World Model ($L=30, K=6$) | Delta / Improvement |
|---|:---:|:---:|:---:|
| **Area Under PR Curve (AUPRC)** | 0.412 | **0.6932** | **+68.2%** |
| **Macro F1-Score** | 0.307 | **0.4510** | **+46.9%** |
| **Precision ($\tau = 0.999$)** | 82.1% | **96.40%** | **+14.3%** |
| **False Positive Rate (FPR)** | 1.84% | **0.45%** | **-75.5% (Alert Fatigue Mitigated)** |
| **Mean Early Warning Lead Time** | 0.0s (Reactive) | **+52.4 seconds** | **True Predictive Horizon** |
| **Inference Latency** | 0.12 ms | **0.42 ms** | **Sub-millisecond Wire Speed** |

---

## 7. Interactive Interfaces & Deployment Modes

### Mode A: Local Interactive Demonstration (Streamlit)

```bash
streamlit run step5_demo.py
```
Provides an offline GUI to upload CSV flow captures, visualize rolling infiltration probabilities, inspect threshold crossings, and examine Integrated Gradients attribution bar charts.

### Mode B: Real-Time Wire Sniffer & Streaming Forecaster

```bash
# Replay evaluation stream from bundled sample trace:
python live_sniffer.py --replay

# Capture live network interface packets (requires Npcap on Windows or libpcap on Linux):
python live_sniffer.py --live --count 500
```
Aggregates live socket packets into 10-second rolling vectors and computes real-time predictions directly on the local compute engine.

### Mode C: Production REST API Server & Enterprise SOC Dashboard

```bash
# Terminal 1: Launch FastAPI backend server (Port 8000)
python api_server.py

# Terminal 2: Launch Vite React Cyber-Oracle SOC interface (Port 5173)
cd frontend
npm run dev
```


The React frontend includes:
- Live 10-second rolling telemetry HUD.
- Multi-scenario threat injector (Critical Infrastructure SCADA, APT-41, Ransomware, BGP Hijacking).
- Dual theme support (Professional SOC Tactical Dark & Clean Light).
- Automated SOAR containment trigger endpoints.

### Mode D: One-Click Instant Evaluator Launcher

For rapid demonstration during SIH jury evaluations:

```bash
# Windows (Double-click or run from terminal):
launch_system.bat

# PowerShell:
.\launch_system.ps1
```
Automatically executes tensor smoke tests, spawns the FastAPI REST server, starts the Vite React frontend, and opens `http://localhost:5173` in your default browser within seconds.

### Mode E: Automated Forensic Incident Dossier Export (PDF & STIX 2.1)

SOC analysts can generate cryptographically signed incident briefing dossiers with one click from the UI or via REST API:

```bash
# Download official NTRO / CERT-In PDF Forensic Dossier:
curl -X GET http://localhost:8000/api/incident/dossier/pdf -o Precognix_Dossier.pdf

# Download STIX 2.1 JSON incident intelligence package:
curl -X GET http://localhost:8000/api/incident/dossier/stix -o Precognix_STIX2.1.json
```

---

## 8. SIH 2026 Deliverables Compliance Matrix

| NTRO Requirement | Project Implementation | Validation Mechanism |
|---|---|---|
| **Attack Forecasting** | Autoregressive 2-layer GRU rolling forward $K=6$ steps (60s ahead) | `wm/model.py`, `step4_evaluate.py` |
| **State Representation** | 49-dimensional statistical flow aggregation per 10s window | `step2_preprocess.py`, `wm/data.py` |
| **Baseline Benchmarking** | Rigorous comparison against memoryless Logistic Regression | `step4_evaluate.py`, `runs/eval_report.json` |
| **Explainable Predictions** | Axiomatic Integrated Gradients attribution satisfying completeness | `wm/explain.py`, `runs/eval_feature_importance.png` |
| **Operational Feasibility** | Standalone offline execution, <1 ms latency, portable CPU/GPU deployment | `step0_check_env.py`, `step5_demo.py`, `api_server.py` |
| **Threat Categorization** | Multi-class MITRE ATT&CK tactical stage classification head | `wm/model.py`, `api_server.py` |
| **Forensic Incident Export** | Official NTRO/CERT-In PDF Dossier & STIX 2.1 JSON with SHA-256 HMAC | `wm/dossier_generator.py`, `api_server.py`, `cyber-oracle/` |
| **Turnkey Evaluation** | 1-Click Unified System Launcher for rapid jury demonstration | `launch_system.bat`, `launch_system.ps1` |

---

## 9. Academic & Technical References

1. **Sundararajan, M., Taly, A., & Yan, Q.** (2017). *Axiomatic Attribution for Deep Networks*. Proceedings of the 34th International Conference on Machine Learning (ICML 2017), PMLR 70:3319-3328.
2. **Sharafaldin, I., Lashkari, A. H., & Ghorbani, A. A.** (2018). *Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization*. Proceedings of the 4th International Conference on Information Systems Security and Privacy (ICISSP 2018).
3. **Ha, D., & Schmidhuber, J.** (2018). *Recurrent World Models Facilitate Policy Evolution*. Advances in Neural Information Processing Systems (NeurIPS 2018).
4. **MITRE ATT&CK Enterprise Matrix** (2024). *Tactics and Techniques for Enterprise Defense Infrastructure*.
