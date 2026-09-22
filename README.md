# AI-based Network Attack Forecasting from Network Traffic Data
SIH 2026 · PS 26153 (NTRO) · a world-model prototype on CSE-CIC-IDS2018

This project learns the state of a network from flow telemetry and forecasts *whether an
infiltration is coming in the next few minutes* - not just whether the current packet is
malicious. It trains an RNN-based world model that rolls forward K steps, reports a MITRE
ATT&CK-style stage, and explains each alarm with Integrated Gradients.

Everything below is tuned for **your machine**: i7-12th-gen H-series, 16 GB RAM, RTX 4050
(6 GB VRAM), 512 GB storage. That's a perfectly capable rig for this - the trained model has
~150k-400k parameters and the whole (pre-processed) dataset fits in a few hundred MB, so the
GPU is never the bottleneck; your SSD space during the download is the only thing to watch.

## What's here

```
step0_check_env.py    verify Python / PyTorch / CUDA / disk before you start
step1_download.py     resumable downloader for the real dataset (~6.6 GB)
step2_preprocess.py   flows -> cleaned, labelled 10-second "network state" vectors
step3_train.py        trains the world model (GRU + K-step rollout)
step4_evaluate.py     test-set metrics, logistic-regression baseline, explainability, plots
step5_demo.py         offline Streamlit app - upload a CSV, see the forecast timeline
config.yaml           every knob (paths, window size, split, model size, training)
wm/                   shared library code imported by all the steps above
```

## 1. Install Python packages

Use a virtual environment so this doesn't clash with anything else on your machine.

```powershell
python -m venv venv
venv\Scripts\activate
```

### 1a. PyTorch **with CUDA** - install this first, and separately

Do not `pip install torch` directly - the default PyPI wheel is CPU-only and will silently
train on your CPU instead of the RTX 4050 (10-50x slower, and you won't get an error, just a
very slow run). The exact command depends on your NVIDIA driver, so:

1. Open PowerShell and run `nvidia-smi`. Near the top-right it prints something like
  `CUDA Version: 12.6` - that is the *maximum* CUDA version your driver supports.
2. Go to **https://pytorch.org/get-started/locally/**, select **Windows / Pip / Python /** the
  CUDA version at or below what `nvidia-smi` reported, and copy the command it shows you.
  This page always reflects the current release, which is why we're not hardcoding a version
  here - as of writing, it looks like this:
  ```powershell
  pip install torch --index-url https://download.pytorch.org/whl/cu126
  ```
  (Your RTX 4050 is an Ada-Lovelace GPU, the same family used since the RTX 40-series launched -
  it's been supported by every stable PyTorch release for years, so any current cu12x/cu13x
  build will work. There's no special case to worry about here.)

### 1b. Everything else

```powershell
pip install -r requirements.txt
```

### 1c. Confirm it all works

```powershell
python step0_check_env.py
```

This should end with `GPU : NVIDIA GeForce RTX 4050 Laptop GPU, 6.0 GB VRAM  [OK]` and
`GPU test : GRU + mixed precision ran fine  [OK]`. If it instead says CUDA is not available,
you installed the CPU-only wheel by mistake - `pip uninstall torch` and redo step 1a.

## 2. Download CSE-CIC-IDS2018 (~6.6 GB)

You don't need an AWS account or the AWS CLI - the bucket is public, and `step1_download.py`
talks to it over plain HTTPS with resume support (safe to Ctrl+C and re-run any time).

```powershell
python step1_download.py
```

This fetches 10 CSV files (the "Processed Traffic Data for ML Algorithms", i.e. the
CICFlowMeter flow features - *not* the ~450 GB of raw PCAPs, which you don't need). One file
alone (Tuesday 20-02, a DDoS day - yes, it's really misspelled "Thuesday" in the bucket) is
3.8 GB; the rest are 100-370 MB each.

**On a slow or metered connection**, skip the big file first and add it later:
```powershell
python step1_download.py --skip-large      # ~2.7 GB, everything except the 3.8 GB file
python step1_download.py                   # re-run any time to fetch the rest (resumes, skips done files)
```
Rough download time: **≈15 min on 50 Mbps, ≈8 min on 100 Mbps, ≈40 min on 20 Mbps** for the
full 6.6 GB. `--list` shows sizes without downloading anything.

## 3. Preprocess: flows -> network-state windows

```powershell
python step2_preprocess.py
```

This reads each CSV in 250k-row chunks (so the 3.8 GB file never has to fit in RAM at once),
fixes the dataset's known quirks (a header row repeated mid-file, `Infinity`/NaN values in
`Flow Byts/s`, a couple of negative durations), and aggregates flows into one 49-feature
"network state" vector per 10-second window, labelled Benign/attack **and** a MITRE-ish stage
(Initial Access, Lateral Movement, Command & Control, Impact/DDoS - see the note below on
Reconnaissance/Exfiltration). Expect this to take **somewhere from a few minutes to ~30-40
minutes** depending on your disk speed, dominated almost entirely by the one 3.8 GB file - CPU
and RAM are not the constraint here (16 GB is comfortably enough since it never loads a whole
file at once). Output goes to `data/processed/` (well under 1 GB).

Two things worth knowing:
* **CIC-IDS2018 has no labelled Reconnaissance or Exfiltration flows** (unlike CIC-IDS2017,
  which has a `PortScan` label, this dataset doesn't). The model's stage head still has slots
  for them, and the architecture supports predicting them, but you won't get training signal
  or evaluation numbers for those two stages from this dataset alone. Worth a sentence in your
  architecture doc so it doesn't look like an oversight.
* `--peek` shows you the column list of the first file without processing anything, useful if
  you want to sanity-check before committing to the full run.

## 4. Train the world model

```powershell
python step3_train.py
```

With the default `config.yaml` (GRU, hidden=128, 2 layers, context=30 windows / 5 min,
horizon=6 windows / 1 min) this is a small model - a few hundred thousand parameters - so on
your RTX 4050 each epoch should take **on the order of a minute or two**, not hours; the
default 30-epoch budget with early stopping (patience 6) should comfortably finish in **well
under an hour**, and quite possibly in 15-20 minutes. Mixed precision is on by default.

Watch the printed line each epoch:
```
epoch  12/30  tf=0.53  nll=Y  train loss 1.21  |  val loss 1.34 (state 0.41 att 0.55 stage 0.11) auprc 0.62  [63.2s]
```
`tf` is the teacher-forcing probability (decays to 0 - the model has to stand on its own
forecasts by then), `auprc` is the validation metric used for checkpointing. The best checkpoint
(by validation AUPRC) is saved to `runs/wm_best.pt` - **this one file contains the model
weights, the feature scaler, and the exact config used**, so step4/step5 never depend on you
remembering what settings you trained with.

If you want a fast sanity-check before committing to the full run: `python step3_train.py
--epochs 3`.

**If you hit a CUDA out-of-memory error** (unlikely at these sizes, but just in case): lower
`train.batch_size` in `config.yaml`, e.g. to 128.

## 5. Evaluate

```powershell
python step4_evaluate.py
```

Reports, on the held-out **test days** (days the model never trained on):
* precision / recall / F1 / FPR / AUROC / AUPRC, both aggregated ("attack somewhere in the
  next 60s") and broken down per 10-second step of the forecast horizon
* the **required benchmark**: a logistic-regression baseline trained on the exact same
  standardised features but *without* the temporal context - it only sees the current window.
  Comparing the two isolates exactly what the problem statement asks about: does modelling
  dynamics over a 5-minute history beat a memoryless classifier?
* **early-warning lead time** - for attacks preceded by a clean run-up, how many seconds
  before the attack actually starts did the model raise the alarm
* **Integrated Gradients** feature attribution on a handful of correctly forecast attacks (used
  instead of SHAP - it needs only autograd, so there's nothing extra to install, and it's well
  defined for a free-running recurrent rollout in a way KernelSHAP isn't)
* three PNGs (`runs/eval_pr_curve.png`, `eval_feature_importance.png`,
  `eval_example_timeline.png`) and `runs/eval_report.json` with everything in one file

## 6. Try the offline demo

```powershell
streamlit run step5_demo.py
```

Upload any CICFlowMeter-style CSV (a slice of a test day works well) and it shows the rolling
infiltration-probability timeline, flags windows that cross the alarm threshold, predicts the
next MITRE-style stage, and explains the top flagged windows - all running locally, no network
calls once the page is open.

## Tuning knobs (`config.yaml`)

| Setting | Meaning |
|---|---|
| `features.window_seconds` | size of one "network state" snapshot (default 10s) |
| `sequence.context` / `horizon` | how much history (L) the model sees / how far ahead (K) it forecasts |
| `split.train_days` / `test_days` | which days are used for what - test days are never trained on |
| `split.block_windows` / `val_every` | how training days are cut into train/validation blocks |
| `model.hidden` / `layers` / `arch` | model size; `arch: lstm` is a drop-in alternative to the default GRU |
| `train.loss_weights` | relative weight of the state/attack/stage loss terms |

## Troubleshooting

- **`pip install` fails on `torch` with an SSL or "no matching distribution" error** - you're
  likely still on the default PyPI index; make sure you used the `--index-url
  https://download.pytorch.org/whl/...` form from step 1a, not a plain `pip install torch`.
- **PowerShell won't run `venv\Scripts\activate`** ("running scripts is disabled") - run
  `Set-ExecutionPolicy -Scope CurrentProcess RemoteSigned` once, then retry.
- **Antivirus flags or quarantines the downloaded CSVs / the venv** - these are large plain-text
  CSVs and Python bytecode, both common false-positive triggers; add an exclusion for the
  project folder if this happens.
- **Download keeps dropping partway** - just re-run `step1_download.py`; it resumes from the
  last byte via HTTP range requests rather than restarting.
- **Running low on disk** - point `paths.raw_dir` / `processed_dir` in `config.yaml` at another
  drive; `step1_download.py --skip-large` also cuts the download to ~2.7 GB if you decide the
  3.8 GB DDoS-day file isn't worth it for your split.

## Where this leaves you for the SIH deliverables

Done here: source code, README, a working end-to-end pipeline (download → preprocess → train →
evaluate → demo), the required logistic-regression benchmark, and explainability output. Still
to do for submission: the 2-page architecture document, the 5-slide technical presentation, and
the 2-minute demo video - happy to help draft any of those once you've got real numbers back
from a training run on your machine.
