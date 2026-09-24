"""Step 0 - Environment and dependency verification for Precognix World Model.
Checks Python runtime, PyTorch installation, compute acceleration (CUDA/MPS/CPU), RAM, and disk space.
"""
import platform
import shutil
import sys
from pathlib import Path


def main() -> None:
    ok = True
    print(f"Python      : {sys.version.split()[0]} on {platform.system()} {platform.release()} ({platform.machine()})")
    if sys.version_info < (3, 10):
        print("  [FAIL] Python 3.10 or newer is required.")
        ok = False

    for mod in ("numpy", "pandas", "pyarrow", "sklearn", "matplotlib", "yaml", "requests", "tqdm"):
        try:
            m = __import__(mod)
            print(f"{mod:<12}: {getattr(m, '__version__', 'ok')}")
        except ImportError:
            print(f"{mod:<12}: MISSING  -> pip install -r requirements.txt")
            ok = False

    # Server, Dossier & Visualization ecosystem check
    server_mods = ("fastapi", "uvicorn", "pydantic", "reportlab", "plotly")
    for mod in server_mods:
        try:
            m = __import__(mod)
            print(f"{mod:<12}: {getattr(m, '__version__', 'ok')} [SOC/Dossier Ready]")
        except ImportError:
            print(f"{mod:<12}: Optional missing -> pip install {mod}")


    try:
        import torch
    except ImportError:
        print("torch       : MISSING  -> pip install torch (see README step 1)")
        sys.exit(1)

    cuda_avail = torch.cuda.is_available()
    mps_avail = hasattr(torch.backends, "mps") and torch.backends.mps.is_available()

    if cuda_avail:
        dev_name = "cuda"
        p = torch.cuda.get_device_properties(0)
        print(f"torch       : {torch.__version__} (CUDA {torch.version.cuda})")
        print(f"Compute Dev : {p.name}, {p.total_memory / 2**30:.1f} GB VRAM  [CUDA ACCELERATED]")
    elif mps_avail:
        dev_name = "mps"
        print(f"torch       : {torch.__version__} (Apple Silicon MPS)")
        print(f"Compute Dev : Apple Metal Performance Shaders  [MPS ACCELERATED]")
    else:
        dev_name = "cpu"
        print(f"torch       : {torch.__version__} (CPU)")
        print(f"Compute Dev : Standard CPU Engine (Universal Fallback)  [OK]")

    # Smoke test: GRU forward pass on the detected compute device
    try:
        x = torch.randn(64, 30, 32, device=dev_name)
        rnn = torch.nn.GRU(32, 64, num_layers=2, batch_first=True).to(dev_name)
        if dev_name == "cuda":
            with torch.autocast("cuda", dtype=torch.float16):
                y, _ = rnn(x)
            torch.cuda.synchronize()
            print("Engine test : GRU + mixed precision inference validated  [OK]")
        else:
            y, _ = rnn(x)
            print("Engine test : GRU tensor forward pass validated  [OK]")
    except Exception as e:
        print(f"Engine test : Failed on {dev_name}: {e}")
        ok = False

    try:
        import psutil
        vm = psutil.virtual_memory()
        print(f"RAM         : {vm.total / 2**30:.1f} GB total, {vm.available / 2**30:.1f} GB free")
    except ImportError:
        print("RAM         : (psutil optional for detailed memory telemetry)")

    root = Path(__file__).resolve().parent
    free = shutil.disk_usage(root).free / 2**30
    print(f"Disk free   : {free:.1f} GB available on workspace volume")
    if free < 5:
        print("  [WARN] less than 5 GB disk space remaining; consider cleaning temp files")

    print("\nRESULT:", "Environment ready" if ok else "Please resolve missing dependencies above.")


if __name__ == "__main__":
    main()

