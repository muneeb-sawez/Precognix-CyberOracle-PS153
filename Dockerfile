# Precognix-PS153 // Autonomous Cyber Defense World Model Container
# Smart India Hackathon 2026 - Problem Statement 26153 (NTRO)

FROM python:3.11-slim AS runtime

# System dependencies for packet telemetry, networking & PDF compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpcap-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install PyTorch (CPU fallback by default in standard docker container, CUDA via nvidia runtime)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install pipeline dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Precognix codebase
COPY . .

# Expose FastAPI REST Engine (8000) and Offline Streamlit (8501)
EXPOSE 8000
EXPOSE 8501

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/status || exit 1

# Default launch command: Start high-performance Uvicorn REST server
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
