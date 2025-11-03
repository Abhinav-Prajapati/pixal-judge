FROM python:3.11-slim

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
