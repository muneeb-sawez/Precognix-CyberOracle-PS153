"""Shared helpers: config loading, ATT&CK-style stage names, label -> stage mapping."""
from __future__ import annotations

import random
import re
from pathlib import Path

import numpy as np
import yaml

ROOT = Path(__file__).resolve().parents[1]

# Stage 0 = "no attack". The others are the ATT&CK-style stages named in the problem
# statement, plus "Impact" because CIC-IDS2018 contains a lot of DoS / DDoS traffic.
STAGES = [
    "Benign",
    "Reconnaissance",
    "Initial Access",
    "Lateral Movement",
    "Command & Control",
    "Exfiltration",
    "Impact (DoS/DDoS)",
]
STAGE_ID = {s: i for i, s in enumerate(STAGES)}

# First matching keyword wins (labels are lower-cased). Edit if you disagree with a mapping.
# NOTE: CIC-IDS2018 has NO labelled Reconnaissance or Exfiltration flows - see README.
LABEL_RULES = [
    ("benign", "Benign"),
    ("ftp-brute", "Initial Access"),      # T1110 brute force
    ("ssh-brute", "Initial Access"),
    ("brute force", "Initial Access"),    # web brute force / XSS
    ("sql injection", "Initial Access"),  # T1190 exploit public-facing application
    ("infil", "Lateral Movement"),        # the dataset spells it 'Infilteration'
    ("bot", "Command & Control"),         # T1071 (Ares botnet)
    ("ddos", "Impact (DoS/DDoS)"),        # T1498 / T1499
    ("dos", "Impact (DoS/DDoS)"),
]
_warned: set[str] = set()


def label_to_stage_id(label: str) -> int:
    lab = str(label).strip().lower()
    for key, stage in LABEL_RULES:
        if key in lab:
            return STAGE_ID[stage]
    if lab not in _warned:
        print(f"[warn] unknown label '{label}' -> treated as 'Initial Access'")
        _warned.add(lab)
    return STAGE_ID["Initial Access"]


_DAY_RE = re.compile(r"(\d{2})-(\d{2})-(\d{4})")


def day_from_filename(name: str) -> str:
    """'Wednesday-14-02-2018_TrafficForML_CICFlowMeter.csv' -> '2018-02-14'."""
    m = _DAY_RE.search(name)
    if not m:
        raise ValueError(f"cannot find a dd-mm-yyyy date in file name: {name}")
    d, mth, y = m.groups()
    return f"{y}-{mth}-{d}"


def load_config(path: str | Path = "config.yaml") -> dict:
    p = Path(path)
    if not p.is_absolute() and not p.exists():
        p = ROOT / p
    with open(p, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    cfg["_config_path"] = str(p)
    return cfg


def resolve(path_str: str | Path) -> Path:
    """Relative paths in the config are relative to the project root."""
    p = Path(path_str)
    return p if p.is_absolute() else ROOT / p


def add_common_args(ap) -> None:
    ap.add_argument("--config", default="config.yaml", help="path to config.yaml")
    ap.add_argument("--raw-dir", default=None, help="override paths.raw_dir")
    ap.add_argument("--processed-dir", default=None, help="override paths.processed_dir")
    ap.add_argument("--runs-dir", default=None, help="override paths.runs_dir")


def get_cfg(args) -> dict:
    cfg = load_config(args.config)
    for key in ("raw_dir", "processed_dir", "runs_dir"):
        v = getattr(args, key, None)
        if v:
            cfg["paths"][key] = v
    return cfg


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    try:
        import torch

        torch.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
    except ImportError:
        pass
