"""Step 1 - download the 'Processed Traffic Data for ML Algorithms' part of CSE-CIC-IDS2018.

* 10 CSV files, ~6.9 GB in total (the huge PCAP part of the dataset is NOT needed).
* Public AWS S3 bucket -> no account, no keys. Plain HTTPS, resumable: if the connection drops
  (or you press Ctrl+C) just run the script again and it continues where it stopped.

Examples
    python step1_download.py                     # everything (~6.9 GB)
    python step1_download.py --skip-large        # skip the 3.8 GB 20-02 file (DDoS day)
    python step1_download.py --only 14-02 16-02  # only some days
    python step1_download.py --list              # just show what would be downloaded
"""
from __future__ import annotations

import argparse
import shutil
import sys
import time
from pathlib import Path

import requests

from wm.common import add_common_args, get_cfg, resolve

BASE_URL = ("https://cse-cic-ids2018.s3.ca-central-1.amazonaws.com/"
            "Processed%20Traffic%20Data%20for%20ML%20Algorithms/")

# name, approx. size in MiB (from the bucket listing; the real size is read from the server)
FILES = [
    ("Wednesday-14-02-2018_TrafficForML_CICFlowMeter.csv", 341.6),
    ("Thursday-15-02-2018_TrafficForML_CICFlowMeter.csv", 358.5),
    ("Friday-16-02-2018_TrafficForML_CICFlowMeter.csv", 318.3),
    ("Thuesday-20-02-2018_TrafficForML_CICFlowMeter.csv", 3891.0),  # sic - the typo is in the bucket
    ("Wednesday-21-02-2018_TrafficForML_CICFlowMeter.csv", 313.7),
    ("Thursday-22-02-2018_TrafficForML_CICFlowMeter.csv", 364.9),
    ("Friday-23-02-2018_TrafficForML_CICFlowMeter.csv", 365.1),
    ("Wednesday-28-02-2018_TrafficForML_CICFlowMeter.csv", 199.6),
    ("Thursday-01-03-2018_TrafficForML_CICFlowMeter.csv", 102.8),
    ("Friday-02-03-2018_TrafficForML_CICFlowMeter.csv", 336.0),
]

try:
    from tqdm import tqdm
except ImportError:  # tqdm is optional
    tqdm = None


def remote_size(url: str) -> int:
    r = requests.head(url, allow_redirects=True, timeout=30)
    r.raise_for_status()
    size = int(r.headers.get("Content-Length", 0))
    if size <= 0 or "text/html" in r.headers.get("Content-Type", ""):
        raise RuntimeError(f"unexpected reply for {url} (size={size}, type={r.headers.get('Content-Type')})")
    return size


def download(url: str, dest: Path, retries: int = 12) -> None:
    size = remote_size(url)
    if dest.exists() and dest.stat().st_size == size:
        print(f"  already complete ({size / 2**20:.0f} MiB) - skipping")
        return
    part = dest.with_suffix(dest.suffix + ".part")
    for attempt in range(1, retries + 1):
        have = part.stat().st_size if part.exists() else 0
        if have > size:
            part.unlink()
            have = 0
        if have == size:
            break
        headers = {"Range": f"bytes={have}-"} if have else {}
        try:
            with requests.get(url, headers=headers, stream=True, timeout=(15, 60)) as r:
                if r.status_code == 200 and have:  # server ignored Range -> start over
                    have = 0
                elif r.status_code not in (200, 206):
                    r.raise_for_status()
                mode = "ab" if have else "wb"
                bar = tqdm(total=size, initial=have, unit="B", unit_scale=True, unit_divisor=1024,
                           desc=f"  {dest.name[:28]}", leave=False) if tqdm else None
                with open(part, mode) as f:
                    for block in r.iter_content(chunk_size=1 << 20):
                        f.write(block)
                        if bar:
                            bar.update(len(block))
                if bar:
                    bar.close()
        except (requests.RequestException, OSError) as e:
            wait = min(60, 2 ** attempt)
            print(f"  connection problem ({type(e).__name__}); retry {attempt}/{retries} in {wait}s ...")
            time.sleep(wait)
    final = part.stat().st_size if part.exists() else 0
    if final != size:
        raise RuntimeError(f"{dest.name}: got {final} of {size} bytes - run the script again to resume")
    part.replace(dest)
    print(f"  done ({size / 2**20:.0f} MiB)")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    add_common_args(ap)
    ap.add_argument("--only", nargs="*", help="only files whose name contains one of these (e.g. 14-02 01-03)")
    ap.add_argument("--skip-large", action="store_true", help="skip the 3.8 GB Tuesday 20-02 file")
    ap.add_argument("--list", action="store_true", help="list files and exit")
    ap.add_argument("--base-url", default=BASE_URL, help="override the download URL prefix")
    args = ap.parse_args()
    cfg = get_cfg(args)
    dest_dir = resolve(cfg["paths"]["raw_dir"])
    dest_dir.mkdir(parents=True, exist_ok=True)

    todo = [(n, s) for n, s in FILES if (not args.only or any(o in n for o in args.only))]
    if args.skip_large:
        todo = [(n, s) for n, s in todo if s < 1000]
    total = sum(s for _, s in todo)
    print(f"{len(todo)} files, about {total / 1024:.1f} GiB  ->  {dest_dir}")
    free = shutil.disk_usage(dest_dir).free / 2**30
    print(f"free disk space: {free:.1f} GiB")
    if args.list:
        for n, s in todo:
            print(f"  {s:8.1f} MiB  {n}")
        return
    if free < total / 1024 + 1:
        sys.exit("Not enough free disk space - change paths.raw_dir in config.yaml")

    for i, (name, _) in enumerate(todo, 1):
        print(f"[{i}/{len(todo)}] {name}")
        download(args.base_url + name, dest_dir / name)
    print("\nAll downloads finished. Next: python step2_preprocess.py")


if __name__ == "__main__":
    main()
