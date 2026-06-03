from functools import lru_cache
from typing import Annotated

from fastapi import Depends

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
