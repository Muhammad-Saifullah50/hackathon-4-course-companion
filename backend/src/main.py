from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.core.auth import get_stytch_client
from src.core.config import settings
from src.core.dependencies import get_content_service
from src.routers import access, auth, billing, content, progress, quizzes, search, users
from src.services.content import ServiceUnavailableError


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    service = get_content_service()
    await service.warm_cache()
    get_stytch_client()  # warm JWKS cache at startup
    yield


app = FastAPI(
    title="Claude Teacher API",
    description="Content delivery API for the AI Agent Development course",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(content.router, prefix="/chapters", tags=["content"])
app.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(progress.router, prefix="/users", tags=["progress"])
app.include_router(search.router, tags=["search"])
app.include_router(access.router, prefix="/access", tags=["access"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])


@app.exception_handler(ServiceUnavailableError)
async def service_unavailable_handler(request: Request, exc: ServiceUnavailableError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(exc)})
