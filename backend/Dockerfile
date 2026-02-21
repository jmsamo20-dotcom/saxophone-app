FROM python:3.11-slim

# FFmpeg, libcairo2(PDF), libsndfile1(librosa/basic-pitch)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      libcairo2 \
      libsndfile1 \
    && rm -rf /var/lib/apt/lists/* \
    && ffmpeg -version | head -1

# ffmpeg 경로를 명시적으로 보장
ENV PATH="/usr/bin:${PATH}"
ENV OMP_NUM_THREADS=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p temp

EXPOSE 8000

# --workers 2 권장이나 Render 무료 플랜(512MB)에서는 메모리 부족으로 1 유지
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
