from fastapi import APIRouter, HTTPException

from src.core.dependencies import ContentServiceDep, CurrentUserDep
from src.models.search import SearchResponse
from src.services.search import SearchService

router = APIRouter()
_search_service = SearchService()


@router.get("/search", response_model=SearchResponse)
async def get_search(
    q: str,
    current_user: CurrentUserDep,
    content_service: ContentServiceDep,
    limit: int = 20,
) -> SearchResponse:
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query must not be blank")
    return await _search_service.search(query=q, limit=limit, content_service=content_service)
