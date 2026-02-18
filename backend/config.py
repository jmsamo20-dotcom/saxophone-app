import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
TEMP_DIR = BASE_DIR / "temp"
TEMP_DIR.mkdir(exist_ok=True)

# File limits
MAX_UPLOAD_SIZE_MB = 50
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"}

# Temp file TTL
TEMP_FILE_TTL_SECONDS = 3600  # 1 hour

# basic-pitch settings
PITCH_MIN_NOTE_LENGTH = 0.05  # seconds
PITCH_ONSET_THRESHOLD = 0.5
PITCH_FRAME_THRESHOLD = 0.3

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
