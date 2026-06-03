from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from src.services.content import ContentService


@lru_cache(maxsize=1)
def _get_content_service() -> ContentService:
    return ContentService()


def get_content_service() -> ContentService:
    return _get_content_service()


ContentServiceDep = Annotated[ContentService, Depends(get_content_service)]
