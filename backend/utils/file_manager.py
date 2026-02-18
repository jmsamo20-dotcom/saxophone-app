import uuid
import time
import shutil
from pathlib import Path

from config import TEMP_DIR, TEMP_FILE_TTL_SECONDS


def create_job_dir() -> tuple[str, Path]:
    job_id = uuid.uuid4().hex[:12]
    job_dir = TEMP_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    # Write a timestamp file for TTL tracking
    (job_dir / ".created").write_text(str(time.time()))
    return job_id, job_dir


def get_job_dir(job_id: str) -> Path | None:
    job_dir = TEMP_DIR / job_id
    if job_dir.is_dir():
        return job_dir
    return None


def cleanup_expired_jobs():
    now = time.time()
    for job_dir in TEMP_DIR.iterdir():
        if not job_dir.is_dir():
            continue
        ts_file = job_dir / ".created"
        if ts_file.exists():
            try:
                created = float(ts_file.read_text().strip())
                if now - created > TEMP_FILE_TTL_SECONDS:
                    shutil.rmtree(job_dir, ignore_errors=True)
            except (ValueError, OSError):
                pass
