from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.core.dependencies import get_content_service
from src.routers import content
from src.services.content import ServiceUnavailableError


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    service = get_content_service()
    await service.warm_cache()
    yield


app = FastAPI(
    title="Course Companion API",
    description="Content delivery API for the AI Agent Development course",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(content.router, prefix="/chapters", tags=["content"])


@app.exception_handler(ServiceUnavailableError)
async def service_unavailable_handler(request: Request, exc: ServiceUnavailableError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(exc)})
