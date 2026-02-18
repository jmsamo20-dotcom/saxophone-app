FROM python:3.11-slim

# FFmpeg (pydub/audio), libcairo2 (cairosvg/PDF), libsndfile1 (librosa/basic-pitch)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      libcairo2 \
      libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# onnxruntime thread 제한 → 메모리 절약
ENV OMP_NUM_THREADS=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p temp

EXPOSE 8000

# Render는 $PORT 환경변수를 자동 주입
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
