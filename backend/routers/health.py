import shutil
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health")
async def health_check():
    ffmpeg_available = shutil.which("ffmpeg") is not None

    model_ready = False
    try:
        from basic_pitch import ICASSP_2022_MODEL_PATH
        model_ready = Path(ICASSP_2022_MODEL_PATH).exists()
    except Exception:
        model_ready = False

    return {
        "status": "ok",
        "ffmpeg": ffmpeg_available,
        "model_ready": model_ready,
    }
