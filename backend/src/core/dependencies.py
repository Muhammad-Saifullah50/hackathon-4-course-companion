from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.auth import get_current_user
from src.db.engine import get_db
from src.models.users import AuthenticatedUser
from src.services.content import ContentService
from src.services.quiz import QuizService


@lru_cache(maxsize=1)
def _get_content_service() -> ContentService:
    return ContentService()


def get_content_service() -> ContentService:
    return _get_content_service()


ContentServiceDep = Annotated[ContentService, Depends(get_content_service)]


@lru_cache(maxsize=1)
def _get_quiz_service() -> QuizService:
    return QuizService()


def get_quiz_service() -> QuizService:
    return _get_quiz_service()


QuizServiceDep = Annotated[QuizService, Depends(get_quiz_service)]

CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]
DbSessionDep = Annotated[AsyncSession, Depends(get_db)]
