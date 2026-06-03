from fastapi import APIRouter, HTTPException

from src.core.dependencies import ContentServiceDep
from src.models.content import ChapterDetail, ChapterSummary, MediaUrlResponse
from src.services.content import ChapterNotFoundError, MediaNotFoundError, ServiceUnavailableError

router = APIRouter()


@router.get("", response_model=list[ChapterSummary])
async def list_chapters(service: ContentServiceDep) -> list[ChapterSummary]:
    try:
        return await service.get_chapter_summaries()
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/{slug}", response_model=ChapterDetail)
async def get_chapter(slug: str, service: ContentServiceDep) -> ChapterDetail:
    try:
        return await service.get_chapter_detail(slug)
    except ChapterNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/{slug}/next")
async def next_chapter(slug: str, service: ContentServiceDep) -> dict[str, str]:
    try:
        detail = await service.get_chapter_detail(slug)
    except ChapterNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if detail.next_slug is None:
        raise HTTPException(status_code=404, detail="No next chapter")
    return {"slug": detail.next_slug}


@router.get("/{slug}/prev")
async def prev_chapter(slug: str, service: ContentServiceDep) -> dict[str, str]:
    try:
        detail = await service.get_chapter_detail(slug)
    except ChapterNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if detail.prev_slug is None:
        raise HTTPException(status_code=404, detail="No previous chapter")
    return {"slug": detail.prev_slug}


@router.get("/{slug}/media/{filename}", response_model=MediaUrlResponse)
async def get_media_url(slug: str, filename: str, service: ContentServiceDep) -> MediaUrlResponse:
    try:
        return await service.generate_signed_url(slug, filename)
    except ChapterNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except MediaNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
