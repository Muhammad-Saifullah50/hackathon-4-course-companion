import functools
from collections.abc import Callable, Coroutine
from typing import Any

import httpx

from .models.error import ErrorPanel


def handle_backend_errors(func: Callable[..., Coroutine[Any, Any, Any]]) -> Callable[..., Coroutine[Any, Any, Any]]:
    """Catches httpx.TimeoutException and 5xx HTTPStatusError, returns ErrorPanel."""
    @functools.wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return await func(*args, **kwargs)
        except httpx.TimeoutException:
            return ErrorPanel().model_dump()
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code >= 500:
                return ErrorPanel().model_dump()
            raise
    return wrapper
