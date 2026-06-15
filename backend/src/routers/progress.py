from fastapi import APIRouter

from src.core.dependencies import ContentServiceDep, CurrentUserDep, DbSessionDep
from src.models.progress import CompletionRequest, CompletionResponse, ProgressResponse
from src.services.access import require_paid_access
from src.services.progress import ProgressService
from src.services.users import UserService

router = APIRouter()
_progress_service = ProgressService()
_user_service = UserService()


async def _require_progress_access(
    current_user: CurrentUserDep, db: DbSessionDep
) -> None:
    user = await _user_service.get_or_create(
        current_user.user_id, current_user.email, db
    )
    require_paid_access(user.access_tier, "progress")


@router.put("/{user_id}/progress", response_model=CompletionResponse)
async def put_user_progress(
    user_id: str,
    chapter_slug: str,
    body: CompletionRequest,
    current_user: CurrentUserDep,
    db: DbSessionDep,
    content_service: ContentServiceDep,
) -> CompletionResponse:
    await _require_progress_access(current_user, db)
    return await _progress_service.record_completion(
        user_id=user_id,
        chapter_slug=chapter_slug,
        quiz_score=body.quiz_score,
        current_user_id=current_user.user_id,
        session=db,
        content_service=content_service,
    )


@router.get("/{user_id}/progress", response_model=ProgressResponse)
async def get_user_progress(
    user_id: str,
    current_user: CurrentUserDep,
    db: DbSessionDep,
) -> ProgressResponse:
    await _require_progress_access(current_user, db)
    return await _progress_service.get_progress(
        user_id=user_id,
        current_user_id=current_user.user_id,
        session=db,
    )
