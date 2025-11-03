# Multi-stage Dockerfile with optional GPU stage.
# Default build uses the 'cpu' stage. To build a GPU-capable image use:
#   docker build --target gpu -t pixsort-backend:gpu ./server
# and run with the NVIDIA runtime: `docker run --gpus all ...`

####################
# CPU stage (default)
####################
FROM python:3.11-slim AS cpu

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Storage directory will be mounted as volume
# The startup script will create subdirectories based on STORAGE_ROOT env var

EXPOSE 8000

CMD ["python", "startup.py"]

####################
# GPU stage (optional)
####################
FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04 AS gpu

WORKDIR /app

# Install Python and build deps in CUDA base image
RUN apt-get update && apt-get install -y \
    python3 \
    python3-distutils \
    python3-venv \
    python3-pip \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && ln -sf /usr/bin/pip3 /usr/bin/pip

COPY requirements.txt .

# Install CUDA-compatible PyTorch for GPU acceleration
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cu121 \
    torch torchvision torchaudio

# Install remaining requirements
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "startup.py"]
