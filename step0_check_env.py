"""Step 0 - check that your PC is ready (Python, PyTorch + CUDA, GPU, RAM, disk)."""
import platform
import shutil
import sys
from pathlib import Path


def main() -> None:
    ok = True
    print(f"Python      : {sys.version.split()[0]} on {platform.system()} {platform.release()}")
    if sys.version_info < (3, 10):
        print("  [FAIL] use Python 3.10 or newer")
        ok = False

    for mod in ("numpy", "pandas", "pyarrow", "sklearn", "matplotlib", "yaml", "requests", "tqdm"):
        try:
            m = __import__(mod)
            print(f"{mod:<12}: {getattr(m, '__version__', 'ok')}")
        except ImportError:
            print(f"{mod:<12}: MISSING  -> pip install -r requirements.txt")
            ok = False

    try:
        import torch
    except ImportError:
        print("torch       : MISSING  -> install PyTorch first (README step 2)")
        sys.exit(1)
    print(f"torch       : {torch.__version__}  (built for CUDA {torch.version.cuda})")
    if torch.cuda.is_available():
        p = torch.cuda.get_device_properties(0)
        print(f"GPU         : {p.name}, {p.total_memory / 2**30:.1f} GB VRAM  [OK]")
        # tiny smoke test: the exact ops the world model uses (GRU + fp16 autocast)
        x = torch.randn(64, 30, 32, device="cuda")
        rnn = torch.nn.GRU(32, 64, num_layers=2, batch_first=True).cuda()
        with torch.autocast("cuda", dtype=torch.float16):
            y, _ = rnn(x)
        torch.cuda.synchronize()
        print("GPU test    : GRU + mixed precision ran fine  [OK]")
    else:
        print("GPU         : CUDA NOT available - training would run on the CPU (slow)")
        print("  -> you most likely installed the CPU-only PyTorch wheel. Re-install with the CUDA index URL")
        print("     (README step 2), then run this script again.")
        ok = False

    try:
        import psutil

        vm = psutil.virtual_memory()
        print(f"RAM         : {vm.total / 2**30:.1f} GB total, {vm.available / 2**30:.1f} GB free")
    except ImportError:
        print("RAM         : (pip install psutil to display)")

    root = Path(__file__).resolve().parent
    free = shutil.disk_usage(root).free / 2**30
    print(f"Disk free   : {free:.1f} GB on the drive holding this folder (need ~15 GB)")
    if free < 15:
        print("  [WARN] free some space or point paths.raw_dir / processed_dir in config.yaml to another drive")

    print("\nRESULT:", "ready to go" if ok else "fix the items marked above, then re-run")


if __name__ == "__main__":
    main()
