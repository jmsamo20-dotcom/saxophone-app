from pydantic import BaseModel


class ConvertRequest(BaseModel):
    youtube_url: str | None = None
    transposition: str = "concert"  # "concert", "alto_eb", "tenor_bb"
    simplify: bool = False
    tempo_bpm: int | None = None  # 40~240, None이면 기본값(120)


class ConvertResponse(BaseModel):
    job_id: str
    download_urls: dict[str, str]
    metadata: dict


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
