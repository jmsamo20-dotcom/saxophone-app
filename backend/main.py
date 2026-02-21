from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import convert, download, health
from utils.file_manager import cleanup_expired_jobs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: clean expired temp files
    cleanup_expired_jobs()
    yield
    # Shutdown: clean again
    cleanup_expired_jobs()


app = FastAPI(
    title="색소폰 악보 자동 생성기",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://saxophone-app.vercel.app",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(convert.router)
app.include_router(download.router)
