import shutil
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from models.schemas import ConvertResponse
from services.audio_processor import validate_audio_file
from services.pitch_detector import detect_pitch
from services.music_converter import midi_to_musicxml
from services.simplifier import simplify_score
from utils.file_manager import create_job_dir
from utils.exceptions import AppError

router = APIRouter()

_ffmpeg_available: bool | None = None


def _check_ffmpeg() -> bool:
    global _ffmpeg_available
    if _ffmpeg_available is None:
        _ffmpeg_available = shutil.which("ffmpeg") is not None
    return _ffmpeg_available


@router.post("/api/convert", response_model=ConvertResponse)
async def convert_audio(
    audio_file: UploadFile | None = File(None),
    youtube_url: str | None = Form(None),
    transposition: str = Form("concert"),
    simplify: bool = Form(False),
    tempo_bpm: int | None = Form(None),
):
    # MVP: YouTube 비활성화
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

    # tempo_bpm 유효성 검사
    if tempo_bpm is not None and not (40 <= tempo_bpm <= 240):
        raise HTTPException(400, f"템포는 40~240 BPM 범위여야 합니다. (입력값: {tempo_bpm})")

    # 파일 확장자 확인
    ext = Path(audio_file.filename).suffix.lower() if audio_file.filename else ".wav"

    # FFmpeg 없으면 WAV만 허용
    if ext != ".wav" and not _check_ffmpeg():
        raise HTTPException(
            415,
            "현재 환경은 WAV만 지원합니다(FFmpeg 설치 필요).",
        )

    job_id, job_dir = create_job_dir()

    try:
        # Step 1: Save uploaded file
        upload_path = job_dir / f"upload{ext}"
        content = await audio_file.read()
        validate_audio_file(upload_path, len(content))
        upload_path.write_bytes(content)

        # Convert to WAV if needed (only when FFmpeg available)
        if ext == ".wav":
            wav_path = upload_path
        else:
            from services.audio_processor import convert_to_wav
            wav_path = job_dir / "audio.wav"
            convert_to_wav(upload_path, wav_path)

        # Step 2: Pitch detection (audio → MIDI)
        midi_path = job_dir / "output.mid"
        detect_pitch(wav_path, midi_path, tempo_bpm=tempo_bpm)

        # Step 3: MIDI → MusicXML (with transposition)
        musicxml_path = job_dir / "score.musicxml"
        musicxml_path, metadata = midi_to_musicxml(
            midi_path, musicxml_path, transposition, tempo_bpm=tempo_bpm
        )

        # Step 4: Simplify if requested
        if simplify:
            simplified_path = job_dir / "score_simplified.musicxml"
            simplify_score(musicxml_path, simplified_path, minimum_note_length=0.25)
            # Overwrite score.musicxml so download always finds it
            shutil.copy2(str(simplified_path), str(job_dir / "score.musicxml"))
            metadata["simplified"] = True

        # Build download URLs (MVP: no server-side PDF)
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
        raise HTTPException(e.status_code, e.message)
    except Exception as e:
        raise HTTPException(500, f"처리 중 오류가 발생했습니다: {str(e)}")
