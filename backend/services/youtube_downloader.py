import re
from pathlib import Path

from utils.exceptions import YouTubeDownloadError


YOUTUBE_URL_PATTERN = re.compile(
    r"^(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)[\w\-]+"
)


def validate_youtube_url(url: str) -> bool:
    return bool(YOUTUBE_URL_PATTERN.match(url))


def download_youtube_audio(url: str, output_dir: Path) -> Path:
    if not validate_youtube_url(url):
        raise YouTubeDownloadError("유효하지 않은 YouTube URL입니다.")

    try:
        import yt_dlp
    except ImportError:
        raise YouTubeDownloadError("yt-dlp가 설치되어 있지 않습니다.")

    output_path = output_dir / "youtube_audio.wav"

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": str(output_dir / "youtube_audio.%(ext)s"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "wav",
            "preferredquality": "192",
        }],
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "noplaylist": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        raise YouTubeDownloadError(str(e))

    if not output_path.exists():
        # yt-dlp might use a different extension before conversion
        wav_files = list(output_dir.glob("youtube_audio*.wav"))
        if wav_files:
            output_path = wav_files[0]
        else:
            raise YouTubeDownloadError("오디오 파일 다운로드 후 변환에 실패했습니다. FFmpeg가 설치되어 있는지 확인해 주세요.")

    return output_path
