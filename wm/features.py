"""Turn CICFlowMeter flow rows into one 'network state' vector per time window.

State S_t  = statistics of all flows that STARTED in window t (default 10 s).
The same functions can be reused later for flows produced from your own PCAP files,
as long as they carry the same column names.
"""
from __future__ import annotations

import warnings

import numpy as np
import pandas as pd

from .common import STAGES, label_to_stage_id

# ----------------------------------------------------------------------------------------
# Columns we read from the CSVs (names as in CSE-CIC-IDS2018 "Processed Traffic Data")
# ----------------------------------------------------------------------------------------
WANTED = [
    "Dst Port", "Protocol", "Timestamp", "Flow Duration", "Tot Fwd Pkts", "Tot Bwd Pkts",
    "TotLen Fwd Pkts", "TotLen Bwd Pkts", "Fwd Pkt Len Mean", "Bwd Pkt Len Mean",
    "Flow Byts/s", "Flow Pkts/s", "Flow IAT Mean", "Flow IAT Std", "Flow IAT Max",
    "Fwd Header Len", "Pkt Len Max", "Pkt Len Mean", "Pkt Len Std",
    "FIN Flag Cnt", "SYN Flag Cnt", "RST Flag Cnt", "PSH Flag Cnt", "ACK Flag Cnt", "URG Flag Cnt",
    "Init Fwd Win Byts", "Init Bwd Win Byts", "Active Mean", "Idle Mean", "Label",
]
WANTED_SET = set(WANTED)
NUM_COLS = [c for c in WANTED if c not in ("Timestamp", "Label")]

# mean over flows of log1p(column)
LOG_MEAN = {
    "lg_dur": "Flow Duration", "lg_iat_mean": "Flow IAT Mean", "lg_iat_std": "Flow IAT Std",
    "lg_pps": "Flow Pkts/s", "lg_bps": "Flow Byts/s",
    "lg_pktlen_mean": "Pkt Len Mean", "lg_pktlen_std": "Pkt Len Std",
    "lg_fwd_len_mean": "Fwd Pkt Len Mean", "lg_bwd_len_mean": "Bwd Pkt Len Mean",
    "lg_init_fwd_win": "Init Fwd Win Byts", "lg_init_bwd_win": "Init Bwd Win Byts",
    "lg_fwd_hdr": "Fwd Header Len", "lg_active": "Active Mean", "lg_idle": "Idle Mean",
}
# max over flows of log1p(column)
LOG_MAX = {"mx_iat": "Flow IAT Max", "mx_pps": "Flow Pkts/s", "mx_pktlen": "Pkt Len Max"}
FLAG_COLS = {
    "frac_syn": "SYN Flag Cnt", "frac_fin": "FIN Flag Cnt", "frac_rst": "RST Flag Cnt",
    "frac_psh": "PSH Flag Cnt", "frac_ack": "ACK Flag Cnt", "frac_urg": "URG Flag Cnt",
}
PORT_GROUPS = {
    "frac_port_ssh": [22], "frac_port_ftp": [21], "frac_port_http": [80, 8080],
    "frac_port_https": [443], "frac_port_smb_rdp": [445, 3389], "frac_port_dns": [53],
}
FRACTIONS = (
    ["frac_tcp", "frac_udp", "frac_other", "frac_port_wellknown", "frac_port_high"]
    + list(PORT_GROUPS) + list(FLAG_COLS)
    + ["frac_syn_noack", "frac_tiny", "frac_noresp", "frac_nopayload", "frac_short", "frac_long"]
)

# The state vector (order matters - it is the model input order).
FEATURE_NAMES = [
    # volume
    "log_flows", "log_fwd_pkts", "log_bwd_pkts", "log_fwd_bytes", "log_bwd_bytes", "log_bwd_fwd_byte_ratio",
    # timing / rates
    "lg_dur", "lg_iat_mean", "lg_iat_std", "mx_iat", "lg_pps", "mx_pps", "lg_bps",
    # packet sizes and TCP window
    "lg_pktlen_mean", "lg_pktlen_std", "mx_pktlen", "lg_fwd_len_mean", "lg_bwd_len_mean",
    "lg_init_fwd_win", "sd_init_fwd_win", "lg_init_bwd_win", "lg_fwd_hdr",
    # activity / idle
    "lg_active", "lg_idle",
    # protocol mix
    "frac_tcp", "frac_udp", "frac_other",
    # destination ports
    "log_uniq_dst_ports", "dst_port_entropy", "frac_port_wellknown", "frac_port_ssh", "frac_port_ftp",
    "frac_port_http", "frac_port_https", "frac_port_smb_rdp", "frac_port_dns", "frac_port_high",
    # TCP flags
    "frac_syn", "frac_fin", "frac_rst", "frac_psh", "frac_ack", "frac_urg", "frac_syn_noack",
    # behaviour indicators (scans, floods, slow attacks)
    "frac_tiny", "frac_noresp", "frac_nopayload", "frac_short", "frac_long",
]


# ----------------------------------------------------------------------------------------
# Cleaning
# ----------------------------------------------------------------------------------------
def parse_timestamps(s: pd.Series) -> np.ndarray:
    """CIC-IDS2018 timestamps look like '02/03/2018 08:47:38' (dd/mm/yyyy). Returns epoch seconds."""
    ts = pd.to_datetime(s, format="%d/%m/%Y %H:%M:%S", errors="coerce")
    bad = ts.isna()
    if bad.any():
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            alt = pd.to_datetime(s[bad], dayfirst=True, errors="coerce")
        ts = ts.fillna(alt)
    secs = (ts - pd.Timestamp("1970-01-01")).dt.total_seconds()
    return secs.to_numpy(dtype="float64")


def missing_columns(columns) -> list[str]:
    have = {str(c).strip() for c in columns}
    return [c for c in WANTED if c not in have]


def clean_chunk(df: pd.DataFrame) -> pd.DataFrame:
    """Fix the well-known problems of the CSVs and return numeric columns + 'ts' + 'Label'."""
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]
    df = df.dropna(subset=["Label"])
    df = df[df["Label"].astype(str).str.strip() != "Label"]  # header row repeated inside the file
    num = df.reindex(columns=NUM_COLS)  # absent columns become NaN -> 0
    for c in NUM_COLS:
        if not pd.api.types.is_numeric_dtype(num[c]):
            num[c] = pd.to_numeric(num[c], errors="coerce")
    num = num.astype("float64").replace([np.inf, -np.inf], np.nan).fillna(0.0).clip(lower=0.0)
    num["ts"] = parse_timestamps(df["Timestamp"])
    num["Label"] = df["Label"].astype(str).str.strip().to_numpy()
    return num[np.isfinite(num["ts"].to_numpy())]


# ----------------------------------------------------------------------------------------
# Per-window aggregation (decomposable, so it can be done chunk by chunk)
# ----------------------------------------------------------------------------------------
def _perflow(f: pd.DataFrame, win_seconds: float):
    win = np.floor(f["ts"].to_numpy() / win_seconds).astype(np.int64)
    d: dict[str, np.ndarray] = {"win": win, "n": np.ones(len(f))}
    fwdp, bwdp = f["Tot Fwd Pkts"].to_numpy(), f["Tot Bwd Pkts"].to_numpy()
    fwdb, bwdb = f["TotLen Fwd Pkts"].to_numpy(), f["TotLen Bwd Pkts"].to_numpy()
    d["fwd_pkts"], d["bwd_pkts"], d["fwd_bytes"], d["bwd_bytes"] = fwdp, bwdp, fwdb, bwdb
    for name, col in LOG_MEAN.items():
        d[name] = np.log1p(f[col].to_numpy())
    d["sq_init_fwd_win"] = d["lg_init_fwd_win"] ** 2
    for name, col in LOG_MAX.items():
        d[name] = np.log1p(f[col].to_numpy())
    proto = f["Protocol"].to_numpy()
    d["frac_tcp"] = (proto == 6).astype(float)
    d["frac_udp"] = (proto == 17).astype(float)
    d["frac_other"] = ((proto != 6) & (proto != 17)).astype(float)
    port = f["Dst Port"].to_numpy().astype(np.int64)
    d["frac_port_wellknown"] = (port < 1024).astype(float)
    d["frac_port_high"] = (port >= 49152).astype(float)
    for name, plist in PORT_GROUPS.items():
        d[name] = np.isin(port, plist).astype(float)
    for name, col in FLAG_COLS.items():
        d[name] = (f[col].to_numpy() > 0).astype(float)
    d["frac_syn_noack"] = ((f["SYN Flag Cnt"].to_numpy() > 0) & (f["ACK Flag Cnt"].to_numpy() == 0)).astype(float)
    dur = f["Flow Duration"].to_numpy()  # microseconds
    d["frac_tiny"] = ((fwdp + bwdp) <= 2).astype(float)
    d["frac_noresp"] = (bwdp == 0).astype(float)
    d["frac_nopayload"] = ((fwdb + bwdb) == 0).astype(float)
    d["frac_short"] = (dur < 1e5).astype(float)
    d["frac_long"] = (dur > 1e7).astype(float)
    stage = f["Label"].map({lab: label_to_stage_id(lab) for lab in f["Label"].unique()}).to_numpy()
    return pd.DataFrame(d), port, stage


def partial_aggregate(f: pd.DataFrame, win_seconds: float):
    pf, port, stage = _perflow(f, win_seconds)
    agg = {c: ("max" if c in LOG_MAX else "sum") for c in pf.columns if c != "win"}
    part = pf.groupby("win").agg(agg)
    ports = pd.DataFrame({"win": pf["win"].to_numpy(), "port": port}).groupby(["win", "port"]).size()
    stg = pd.DataFrame({"win": pf["win"].to_numpy(), "stage": stage}).groupby(["win", "stage"]).size()
    return part, ports, stg


def merge_partials(parts, ports, stages):
    allp = pd.concat(parts)
    agg = {c: ("max" if c in LOG_MAX else "sum") for c in allp.columns}
    part = allp.groupby(level=0).agg(agg)
    pc = pd.concat(ports).groupby(level=[0, 1]).sum()
    sc = pd.concat(stages).groupby(level=[0, 1]).sum()
    return part.sort_index(), pc, sc


def finalize_windows(part, ports, stg, win_seconds: float, attack_min_flows: int, max_gap: int) -> pd.DataFrame:
    """Merged partial sums -> one row per window with FEATURE_NAMES, labels and segment ids."""
    n = part["n"].to_numpy()
    sn = np.maximum(n, 1.0)
    feats: dict[str, np.ndarray] = {}
    feats["log_flows"] = np.log1p(n)
    for k in ("fwd_pkts", "bwd_pkts", "fwd_bytes", "bwd_bytes"):
        feats["log_" + k] = np.log1p(part[k].to_numpy())
    ratio = part["bwd_bytes"].to_numpy() / (part["fwd_bytes"].to_numpy() + 1.0)
    feats["log_bwd_fwd_byte_ratio"] = np.log1p(np.clip(ratio, 0.0, 1000.0))
    for name in LOG_MEAN:
        feats[name] = part[name].to_numpy() / sn
    var = part["sq_init_fwd_win"].to_numpy() / sn - (part["lg_init_fwd_win"].to_numpy() / sn) ** 2
    feats["sd_init_fwd_win"] = np.sqrt(np.clip(var, 0.0, None))
    for name in LOG_MAX:
        feats[name] = part[name].to_numpy()
    for name in FRACTIONS:
        feats[name] = part[name].to_numpy() / sn

    # destination-port diversity (scan indicator)
    wins = ports.index.get_level_values(0)
    tot = ports.groupby(level=0).sum()
    p = ports.to_numpy(dtype=float) / tot.reindex(wins).to_numpy(dtype=float)
    ent = pd.Series(-(p * np.log2(p)), index=ports.index).groupby(level=0).sum()
    uniq = ports.groupby(level=0).size()
    feats["log_uniq_dst_ports"] = np.log1p(uniq.reindex(part.index).fillna(0).to_numpy())
    feats["dst_port_entropy"] = ent.reindex(part.index).fillna(0).to_numpy()

    # labels: a window is 'attack' if >= attack_min_flows flows are labelled malicious
    sc = stg.unstack(fill_value=0).reindex(index=part.index, columns=range(len(STAGES)), fill_value=0)
    mal = sc.iloc[:, 1:].to_numpy()
    n_attack = mal.sum(axis=1)
    attack = (n_attack >= attack_min_flows).astype(np.int64)
    stage = np.where(attack == 1, mal.argmax(axis=1) + 1, 0)

    df = pd.DataFrame({"win": part.index.to_numpy(), "n_flows": n, "n_attack": n_attack,
                       "attack": attack, "stage": stage})
    for name in FEATURE_NAMES:
        df[name] = feats[name]

    # continuous timeline: split at long silences, zero-fill short gaps
    w = df["win"].to_numpy()
    seg = (np.diff(w, prepend=w[0]) > max_gap + 1).cumsum()
    pieces = []
    for sid in np.unique(seg):
        g = df[seg == sid].set_index("win")
        g = g.reindex(np.arange(g.index.min(), g.index.max() + 1)).fillna(0.0)
        g.index.name = "win"
        g["seg"] = int(sid)
        pieces.append(g.reset_index())
    out = pd.concat(pieces, ignore_index=True)
    out["t0"] = out["win"] * win_seconds
    for c in ("n_flows", "n_attack", "attack", "stage"):
        out[c] = out[c].astype(np.int64)
    for c in FEATURE_NAMES:
        out[c] = out[c].astype(np.float32)
    return out[["seg", "win", "t0", "n_flows", "n_attack", "attack", "stage"] + FEATURE_NAMES]
