from fastapi import APIRouter, HTTPException

from src.core.dependencies import (
    ContentServiceDep,
    DbSessionDep,
    OptionalCurrentUserDep,
    QuizServiceDep,
)
from src.models.quiz import AnswerSubmission, GradedResult, QuizPublic
from src.services.access import require_chapter_access, resolve_access_tier
from src.services.content import ChapterNotFoundError, ServiceUnavailableError
from src.services.quiz import QuizNotFoundError, QuizValidationError

router = APIRouter()

_ERROR_RESPONSES = {
    403: {"description": "Premium subscription required"},
    404: {"description": "Quiz not found for this chapter slug"},
    503: {"description": "R2 content store unavailable"},
}


async def _require_quiz_access(
    chapter_slug: str,
    content_service: ContentServiceDep,
    current_user: OptionalCurrentUserDep,
    db: DbSessionDep,
) -> None:
    chapters = await content_service.get_chapter_summaries()
    chapter = next(
        (item for item in chapters if item.slug == chapter_slug), None
    )
    if chapter is None:
        raise ChapterNotFoundError(f"Unknown chapter slug: {chapter_slug}")
    tier = await resolve_access_tier(current_user, db)
    require_chapter_access(tier, chapter.order, f"quiz:{chapter_slug}")


@router.get(
    "/{chapter_slug}",
    response_model=QuizPublic,
    responses=_ERROR_RESPONSES,
)
async def get_quiz(
    chapter_slug: str,
    service: QuizServiceDep,
    content_service: ContentServiceDep,
    current_user: OptionalCurrentUserDep,
    db: DbSessionDep,
) -> QuizPublic:
    try:
        await _require_quiz_access(
            chapter_slug, content_service, current_user, db
        )
        return await service.get_quiz_public(chapter_slug)
    except (QuizNotFoundError, ChapterNotFoundError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post(
    "/{chapter_slug}/submit",
    response_model=GradedResult,
    responses={
        400: {"description": "question_id not found in this quiz"},
        **_ERROR_RESPONSES,
    },
)
async def submit_answer(
    chapter_slug: str,
    submission: AnswerSubmission,
    service: QuizServiceDep,
    content_service: ContentServiceDep,
    current_user: OptionalCurrentUserDep,
    db: DbSessionDep,
) -> GradedResult:
    try:
        await _require_quiz_access(
            chapter_slug, content_service, current_user, db
        )
        return await service.grade_submission(chapter_slug, submission)
    except (QuizNotFoundError, ChapterNotFoundError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except QuizValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
