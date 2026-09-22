"""Step 2 - flows (CSV) -> one 'network state' vector per 10-second window.

Reads every CSV in chunks (so the 3.8 GB file never has to fit in RAM), repairs the known
problems of the dataset (header rows repeated inside the file, 'Infinity'/NaN values, negative
values), and writes  data/processed/windows_<day>.parquet  +  windows_all.parquet.

    python step2_preprocess.py              # process everything in data/raw
    python step2_preprocess.py --peek       # only show the columns of the first CSV
    python step2_preprocess.py --force      # redo days that were already processed
"""
from __future__ import annotations

import argparse
import json
import sys
import time

import pandas as pd

from wm.common import STAGES, add_common_args, day_from_filename, get_cfg, resolve
from wm.features import (FEATURE_NAMES, WANTED, WANTED_SET, clean_chunk, finalize_windows,
                         merge_partials, missing_columns, partial_aggregate)

CHUNK_ROWS = 250_000


def process_file(csv_path, out_path, fcfg) -> dict:
    day = day_from_filename(csv_path.name)
    parts, ports, stages = [], [], []
    rows, t0 = 0, time.time()
    reader = pd.read_csv(csv_path, usecols=lambda c: str(c).strip() in WANTED_SET,
                         chunksize=CHUNK_ROWS, low_memory=False)
    for i, raw in enumerate(reader):
        if i == 0:
            miss = missing_columns(raw.columns)
            if "Label" in miss or "Timestamp" in miss:
                sys.exit(f"{csv_path.name}: no Label/Timestamp column - is this the right CSV?")
            if miss:
                print(f"\n  [warn] columns not found (treated as 0): {miss}")
        f = clean_chunk(raw)
        if f.empty:
            continue
        p, pc, sc = partial_aggregate(f, fcfg["window_seconds"])
        parts.append(p); ports.append(pc); stages.append(sc)
        rows += len(f)
        print(f"\r  {csv_path.name}: {rows:>10,} flows  ({time.time() - t0:5.0f}s)", end="", flush=True)
    print()
    if not parts:
        print("  [warn] no usable rows - skipped")
        return {}
    part, pc, sc = merge_partials(parts, ports, stages)
    df = finalize_windows(part, pc, sc, fcfg["window_seconds"], fcfg["attack_min_flows"], fcfg["max_gap_windows"])
    df.insert(0, "day", day)
    df.to_parquet(out_path, index=False)
    return {"day": day, "flows": rows, "windows": len(df), "attack_windows": int(df["attack"].sum())}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_common_args(ap)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--peek", action="store_true", help="print the header of the first CSV and exit")
    args = ap.parse_args()
    cfg = get_cfg(args)
    raw_dir, out_dir = resolve(cfg["paths"]["raw_dir"]), resolve(cfg["paths"]["processed_dir"])
    files = sorted(raw_dir.glob("*_TrafficForML_CICFlowMeter.csv"))
    if not files:
        sys.exit(f"No *_TrafficForML_CICFlowMeter.csv files in {raw_dir} - run step1_download.py first")

    if args.peek:
        head = pd.read_csv(files[0], nrows=3)
        cols = [str(c).strip() for c in head.columns]
        print(f"{files[0].name}: {len(cols)} columns")
        print(cols)
        print("missing required columns:", missing_columns(cols) or "none")
        return

    out_dir.mkdir(parents=True, exist_ok=True)
    stats = []
    for i, csv_path in enumerate(files, 1):
        day = day_from_filename(csv_path.name)
        out_path = out_dir / f"windows_{day}.parquet"
        print(f"[{i}/{len(files)}] {csv_path.name}")
        if out_path.exists() and not args.force:
            d = pd.read_parquet(out_path, columns=["attack"])
            print(f"  already processed ({len(d):,} windows) - use --force to redo")
            stats.append({"day": day, "windows": len(d), "attack_windows": int(d["attack"].sum())})
            continue
        s = process_file(csv_path, out_path, cfg["features"])
        if s:
            stats.append(s)

    frames = [pd.read_parquet(p) for p in sorted(out_dir.glob("windows_2*.parquet"))]
    allw = pd.concat(frames, ignore_index=True)
    allw.to_parquet(out_dir / "windows_all.parquet", index=False)
    meta = {"window_seconds": cfg["features"]["window_seconds"], "features": FEATURE_NAMES,
            "stages": STAGES, "days": stats}
    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    print("\nday          windows  attack windows")
    for s in sorted(stats, key=lambda z: z["day"]):
        pct = 100 * s["attack_windows"] / max(s["windows"], 1)
        print(f"{s['day']}  {s['windows']:>8,}  {s['attack_windows']:>8,} ({pct:4.1f}%)")
    print(f"\nSaved {len(allw):,} windows x {len(FEATURE_NAMES)} features -> {out_dir / 'windows_all.parquet'}")
    print("Next: python step3_train.py")


if __name__ == "__main__":
    main()
