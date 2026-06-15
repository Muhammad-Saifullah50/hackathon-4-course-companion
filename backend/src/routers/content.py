from fastapi import APIRouter, HTTPException

from src.core.dependencies import (
    ContentServiceDep,
    DbSessionDep,
    OptionalCurrentUserDep,
)
from src.models.content import ChapterDetail, ChapterSummary, MediaUrlResponse
from src.services.access import (
    can_access_chapter,
    require_chapter_access,
    resolve_access_tier,
)
from src.services.content import (
    ChapterNotFoundError,
    MediaNotFoundError,
    ServiceUnavailableError,
)

router = APIRouter()


async def _chapter_summary(
    slug: str, service: ContentServiceDep
) -> ChapterSummary:
    chapters = await service.get_chapter_summaries()
    chapter = next((item for item in chapters if item.slug == slug), None)
    if chapter is None:
        raise ChapterNotFoundError(f"Unknown chapter slug: {slug}")
    return chapter


@router.get("", response_model=list[ChapterSummary])
async def list_chapters(
    service: ContentServiceDep,
    current_user: OptionalCurrentUserDep,
    db: DbSessionDep,
) -> list[ChapterSummary]:
    try:
        tier = await resolve_access_tier(current_user, db)
        chapters = await service.get_chapter_summaries()
        return [
            chapter.model_copy(
                update={
                    "accessible": can_access_chapter(tier, chapter.order),
                    "required_tier": (
                        None
                        if can_access_chapter(tier, chapter.order)
                        else "premium"
                    ),
                }
            )
            for chapter in chapters
        ]
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/{slug}", response_model=ChapterDetail)
async def get_chapter(
    slug: str,
    service: ContentServiceDep,
    current_user: OptionalCurrentUserDep,
    db: DbSessionDep,
) -> ChapterDetail:
    try:
        chapter = await _chapter_summary(slug, service)
        tier = await resolve_access_tier(current_user, db)
        require_chapter_access(tier, chapter.order, f"chapter:{slug}")
        return await service.get_chapter_detail(slug)
    except ChapterNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/{slug}/next")
async def next_chapter(
    slug: str, service: ContentServiceDep
) -> dict[str, str]:
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
async def prev_chapter(
    slug: str, service: ContentServiceDep
) -> dict[str, str]:
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
async def get_media_url(
    slug: str,
    filename: str,
    service: ContentServiceDep,
    current_user: OptionalCurrentUserDep,
    db: DbSessionDep,
) -> MediaUrlResponse:
    try:
        chapter = await _chapter_summary(slug, service)
        tier = await resolve_access_tier(current_user, db)
        require_chapter_access(tier, chapter.order, f"chapter-media:{slug}")
        return await service.generate_signed_url(slug, filename)
    except ChapterNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except MediaNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
