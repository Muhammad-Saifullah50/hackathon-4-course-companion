from fastapi import APIRouter, HTTPException

from src.core.dependencies import (
    ContentServiceDep,
    DbSessionDep,
    OptionalCurrentUserDep,
)
from src.models.search import SearchResponse
from src.services.access import resolve_access_tier
from src.services.search import SearchService

router = APIRouter()
_search_service = SearchService()


@router.get("/search", response_model=SearchResponse)
async def get_search(
    q: str,
    content_service: ContentServiceDep,
    current_user: OptionalCurrentUserDep,
    db: DbSessionDep,
    limit: int = 20,
) -> SearchResponse:
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query must not be blank")
    tier = await resolve_access_tier(current_user, db)
    return await _search_service.search(
        query=q,
        limit=limit,
        content_service=content_service,
        tier=tier,
    )
