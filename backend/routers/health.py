import shutil

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health")
async def health_check():
    ffmpeg_available = shutil.which("ffmpeg") is not None
    return {
        "status": "ok",
        "ffmpeg": ffmpeg_available,
    }
