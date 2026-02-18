class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class AudioTooLargeError(AppError):
    def __init__(self, max_mb: int = 50):
        super().__init__(f"파일 크기가 {max_mb}MB를 초과합니다.", 413)


class UnsupportedFormatError(AppError):
    def __init__(self, ext: str):
        super().__init__(f"지원하지 않는 오디오 형식입니다: {ext}", 415)


class PitchDetectionError(AppError):
    def __init__(self, detail: str = ""):
        msg = "음높이 인식에 실패했습니다."
        if detail:
            msg += f" ({detail})"
        super().__init__(msg, 422)


class ConversionError(AppError):
    def __init__(self, detail: str = ""):
        msg = "악보 변환에 실패했습니다."
        if detail:
            msg += f" ({detail})"
        super().__init__(msg, 500)


class YouTubeDownloadError(AppError):
    def __init__(self, detail: str = ""):
        msg = "YouTube 오디오 다운로드에 실패했습니다."
        if detail:
            msg += f" ({detail})"
        super().__init__(msg, 422)


class JobNotFoundError(AppError):
    def __init__(self, job_id: str):
        super().__init__(f"작업을 찾을 수 없습니다: {job_id}", 404)
