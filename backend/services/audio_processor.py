from pathlib import Path

from pydub import AudioSegment

from config import ALLOWED_AUDIO_EXTENSIONS, MAX_UPLOAD_SIZE_BYTES
from utils.exceptions import AudioTooLargeError, UnsupportedFormatError


def validate_audio_file(file_path: Path, file_size: int) -> None:
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise AudioTooLargeError()

    ext = file_path.suffix.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise UnsupportedFormatError(ext)


def convert_to_wav(input_path: Path, output_path: Path) -> Path:
    ext = input_path.suffix.lower()
    if ext == ".wav":
        # Already WAV, but ensure mono 16-bit for basic-pitch
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

    # Convert to mono, 44100Hz, 16-bit
    audio = audio.set_channels(1).set_frame_rate(44100).set_sample_width(2)
    audio.export(str(output_path), format="wav")
    return output_path
