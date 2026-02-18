import logging
import shutil
import subprocess
from pathlib import Path

from config import ALLOWED_AUDIO_EXTENSIONS, MAX_UPLOAD_SIZE_BYTES
from utils.exceptions import AudioTooLargeError, UnsupportedFormatError, AppError

logger = logging.getLogger(__name__)

MAX_AUDIO_DURATION_SEC = 300  # 5분 (업로드 허용 한도)
PROCESS_TRIM_SEC = 90  # basic-pitch에 넣을 최대 길이


class AudioTooLongError(AppError):
    def __init__(self):
        super().__init__(400, "최대 5분까지 지원합니다. 더 짧은 구간을 녹음해 주세요.")


class ConversionError(AppError):
    def __init__(self, detail: str = "오디오 변환에 실패했습니다."):
        super().__init__(500, detail)


def check_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def validate_audio_file(file_path: Path, file_size: int) -> None:
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise AudioTooLargeError()

    ext = file_path.suffix.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise UnsupportedFormatError(ext)


def _get_duration_sec(file_path: Path) -> float:
    """ffprobe로 파일 길이(초)를 구한다."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(file_path),
            ],
            capture_output=True, text=True, timeout=30,
        )
        return float(result.stdout.strip())
    except Exception:
        return 0.0


def convert_to_wav(input_path: Path, output_path: Path) -> Path:
    """subprocess ffmpeg로 직접 변환 — pydub 의존 제거."""
    if not check_ffmpeg():
        # ffmpeg 없으면 pydub fallback (WAV만 가능)
        return _convert_to_wav_pydub(input_path, output_path)

    # 길이 체크
    duration = _get_duration_sec(input_path)
    if duration > MAX_AUDIO_DURATION_SEC:
        raise AudioTooLongError()

    # 90초 트림 옵션
    trim_args: list[str] = []
    if duration > PROCESS_TRIM_SEC:
        logger.info("Audio %.1fs → trimmed to %ds", duration, PROCESS_TRIM_SEC)
        trim_args = ["-t", str(PROCESS_TRIM_SEC)]

    # ffmpeg: 모든 포맷 → mono 22050Hz 16-bit WAV
    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-vn",
        "-ac", "1",
        "-ar", "22050",
        "-sample_fmt", "s16",
        *trim_args,
        str(output_path),
    ]

    logger.info("Running: %s", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    if result.returncode != 0:
        stderr_short = result.stderr[-300:] if result.stderr else "(no stderr)"
        logger.error("ffmpeg failed: %s", stderr_short)
        raise ConversionError(f"오디오 변환 실패: {stderr_short[:150]}")

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise ConversionError("ffmpeg 변환 결과 파일이 비어 있습니다.")

    return output_path


def _convert_to_wav_pydub(input_path: Path, output_path: Path) -> Path:
    """ffmpeg 없을 때 pydub fallback (WAV 입력만 가능)."""
    from pydub import AudioSegment

    ext = input_path.suffix.lower()
    if ext != ".wav":
        raise UnsupportedFormatError(ext)

    audio = AudioSegment.from_wav(str(input_path))

    duration_sec = len(audio) / 1000.0
    if duration_sec > MAX_AUDIO_DURATION_SEC:
        raise AudioTooLongError()
    if duration_sec > PROCESS_TRIM_SEC:
        audio = audio[:PROCESS_TRIM_SEC * 1000]

    audio = audio.set_channels(1).set_frame_rate(22050).set_sample_width(2)
    audio.export(str(output_path), format="wav")
    return output_path
