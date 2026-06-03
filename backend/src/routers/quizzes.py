from fastapi import APIRouter, HTTPException

from src.core.dependencies import QuizServiceDep
from src.models.quiz import AnswerSubmission, GradedResult, QuizPublic
from src.services.quiz import QuizNotFoundError, QuizValidationError
from src.services.content import ServiceUnavailableError

router = APIRouter()


_ERROR_RESPONSES = {
    404: {"description": "Quiz not found for this chapter slug"},
    503: {"description": "R2 content store unavailable"},
}


@router.get(
    "/{chapter_slug}",
    response_model=QuizPublic,
    responses=_ERROR_RESPONSES,
)
async def get_quiz(chapter_slug: str, service: QuizServiceDep) -> QuizPublic:
    try:
        return await service.get_quiz_public(chapter_slug)
    except QuizNotFoundError as exc:
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
    chapter_slug: str, submission: AnswerSubmission, service: QuizServiceDep
) -> GradedResult:
    try:
        return await service.grade_submission(chapter_slug, submission)
    except QuizNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except QuizValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
