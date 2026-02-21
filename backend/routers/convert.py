import asyncio
import logging
import shutil
import time
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from models.schemas import ConvertResponse
from services.audio_processor import validate_audio_file, check_ffmpeg
from services.pitch_detector import detect_pitch
from services.music_converter import midi_to_musicxml
from services.simplifier import simplify_score
from utils.file_manager import create_job_dir
from utils.exceptions import AppError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/api/convert", response_model=ConvertResponse)
async def convert_audio(
    audio_file: UploadFile | None = File(None),
    youtube_url: str | None = Form(None),
    transposition: str = Form("concert"),
    simplify: bool = Form(False),
    tempo_bpm: int | None = Form(None),
):
    if youtube_url:
        raise HTTPException(
            400,
            "MVP에서는 YouTube 변환을 지원하지 않습니다. "
            "파일 업로드 또는 녹음을 사용해 주세요.",
        )

    if not audio_file:
        raise HTTPException(400, "오디오 파일을 업로드해 주세요.")

    if transposition not in ("concert", "alto_eb", "tenor_bb"):
        raise HTTPException(400, f"지원하지 않는 이조 옵션입니다: {transposition}")

    if tempo_bpm is not None and not (40 <= tempo_bpm <= 240):
        raise HTTPException(400, f"템포는 40~240 BPM 범위여야 합니다. (입력값: {tempo_bpm})")

    ext = Path(audio_file.filename).suffix.lower() if audio_file.filename else ".wav"

    # FFmpeg 없으면 WAV만 허용
    if ext != ".wav" and not check_ffmpeg():
        raise HTTPException(
            415,
            "현재 서버에서 FFmpeg가 비활성화되어 WAV만 변환 가능합니다. "
            "(관리자 설정 필요)",
        )

    job_id, job_dir = create_job_dir()
    t0 = time.time()

    try:
        # Step 1: Save uploaded file
        upload_path = job_dir / f"upload{ext}"
        content = await audio_file.read()
        validate_audio_file(upload_path, len(content))
        upload_path.write_bytes(content)
        logger.info("[%s] Step 1: 파일 저장 완료 (%.1fs)", job_id, time.time() - t0)

        # Step 2: Convert to WAV (mono 22050Hz)
        from services.audio_processor import convert_to_wav
        wav_path = job_dir / "audio.wav"
        await asyncio.to_thread(convert_to_wav, upload_path, wav_path)
        logger.info("[%s] Step 2: ffmpeg 변환 완료 (%.1fs)", job_id, time.time() - t0)

        # Step 3: Pitch detection (audio → MIDI)
        midi_path = job_dir / "output.mid"
        await asyncio.to_thread(detect_pitch, wav_path, midi_path, tempo_bpm)
        logger.info("[%s] Step 3: detect_pitch 완료 (%.1fs)", job_id, time.time() - t0)

        # Step 4: MIDI → MusicXML (with transposition)
        musicxml_path = job_dir / "score.musicxml"
        musicxml_path, metadata = await asyncio.to_thread(
            midi_to_musicxml, midi_path, musicxml_path, transposition, tempo_bpm
        )
        logger.info("[%s] Step 4: musicxml 변환 완료 (%.1fs)", job_id, time.time() - t0)

        # Step 5: Simplify if requested
        if simplify:
            simplified_path = job_dir / "score_simplified.musicxml"
            await asyncio.to_thread(
                simplify_score, musicxml_path, simplified_path, 0.25
            )
            shutil.copy2(str(simplified_path), str(job_dir / "score.musicxml"))
            metadata["simplified"] = True

        logger.info("[%s] 전체 완료 (%.1fs)", job_id, time.time() - t0)

        base_url = f"/api/download/{job_id}"
        download_urls = {
            "musicxml": f"{base_url}/musicxml",
            "midi": f"{base_url}/midi",
        }

        return ConvertResponse(
            job_id=job_id,
            download_urls=download_urls,
            metadata=metadata,
        )

    except AppError as e:
        logger.error("[%s] AppError (%.1fs): %s", job_id, time.time() - t0, e.message)
        raise HTTPException(e.status_code, e.message)
    except Exception as e:
        logger.error("[%s] 예외 (%.1fs): %s", job_id, time.time() - t0, str(e))
        raise HTTPException(500, f"처리 중 오류가 발생했습니다: {str(e)}")
