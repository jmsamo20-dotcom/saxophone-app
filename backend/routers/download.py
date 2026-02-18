from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from utils.file_manager import get_job_dir

router = APIRouter()

FORMAT_MAP = {
    "pdf": {"filename": "score.pdf", "media_type": "application/pdf"},
    "musicxml": {"filename": "score.musicxml", "media_type": "application/vnd.recordare.musicxml+xml"},
    "midi": {"filename": "output.mid", "media_type": "audio/midi"},
}


@router.get("/api/download/{job_id}/{fmt}")
async def download_file(job_id: str, fmt: str):
    if fmt not in FORMAT_MAP:
        raise HTTPException(400, f"지원하지 않는 형식입니다: {fmt}")

    job_dir = get_job_dir(job_id)
    if not job_dir:
        raise HTTPException(404, "작업을 찾을 수 없습니다. 파일이 만료되었을 수 있습니다.")

    file_info = FORMAT_MAP[fmt]
    file_path = job_dir / file_info["filename"]

    # For simplified version, check that too
    if not file_path.exists() and fmt == "musicxml":
        file_path = job_dir / "score_simplified.musicxml"

    if not file_path.exists():
        raise HTTPException(404, f"{fmt} 파일을 찾을 수 없습니다.")

    return FileResponse(
        path=str(file_path),
        media_type=file_info["media_type"],
        filename=f"saxophone_score.{fmt}" if fmt != "midi" else "saxophone_score.mid",
    )
