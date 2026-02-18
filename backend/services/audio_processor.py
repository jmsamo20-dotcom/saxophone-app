import logging
from pathlib import Path

from pydub import AudioSegment

from config import ALLOWED_AUDIO_EXTENSIONS, MAX_UPLOAD_SIZE_BYTES
from utils.exceptions import AudioTooLargeError, UnsupportedFormatError, AppError

logger = logging.getLogger(__name__)

MAX_AUDIO_DURATION_SEC = 300  # 5분 (업로드 허용 한도)
PROCESS_TRIM_SEC = 90  # basic-pitch에 넣을 최대 길이 (서버 부하 제한)


class AudioTooLongError(AppError):
    def __init__(self):
        super().__init__(400, "최대 5분까지 지원합니다. 더 짧은 구간을 녹음해 주세요.")


def validate_audio_file(file_path: Path, file_size: int) -> None:
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise AudioTooLargeError()

    ext = file_path.suffix.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise UnsupportedFormatError(ext)


def convert_to_wav(input_path: Path, output_path: Path) -> Path:
    ext = input_path.suffix.lower()
    if ext == ".wav":
        audio = AudioSegment.from_wav(str(input_path))
    elif ext == ".mp3":
        audio = AudioSegment.from_mp3(str(input_path))
    elif ext == ".ogg":
        audio = AudioSegment.from_ogg(str(input_path))
    elif ext == ".flac":
        audio = AudioSegment.from_file(str(input_path), format="flac")
    elif ext in (".m4a", ".webm"):
        audio = AudioSegment.from_file(str(input_path), format=ext.lstrip("."))
    else:
        raise UnsupportedFormatError(ext)

    # 5분 초과 거절
    duration_sec = len(audio) / 1000.0
    if duration_sec > MAX_AUDIO_DURATION_SEC:
        raise AudioTooLongError()

    # 90초 초과 시 앞부분만 사용 (서버 처리 속도 확보)
    if duration_sec > PROCESS_TRIM_SEC:
        logger.info("Audio %.1fs → trimmed to %ds", duration_sec, PROCESS_TRIM_SEC)
        audio = audio[:PROCESS_TRIM_SEC * 1000]

    # mono + 22050Hz + 16-bit → basic-pitch 최적 + 파일 크기 절감
    audio = audio.set_channels(1).set_frame_rate(22050).set_sample_width(2)
    audio.export(str(output_path), format="wav")
    return output_path
