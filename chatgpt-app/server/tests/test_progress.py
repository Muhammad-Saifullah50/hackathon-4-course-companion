import pytest
from unittest.mock import AsyncMock, MagicMock, patch


MOCK_PROGRESS_DATA = {
    "user_id": "user-123",
    "current_streak": 5,
    "completion_percentage": 60.0,
    "total_chapters": 10,
    "completed_chapters": 6,
    "chapter_list": [
        {"slug": "intro", "title": "Introduction", "completed": True, "quiz_score": 90},
        {"slug": "agents-101", "title": "Agents 101", "completed": True, "quiz_score": None},
        {"slug": "mcp-basics", "title": "MCP Basics", "completed": False, "quiz_score": None},
    ],
}


def _make_ctx(sub: str | None = "user-123", token: str | None = "test-token") -> MagicMock:
    """Build a mock FastMCP Context with optional auth claims."""
    ctx = MagicMock()
    if sub is not None or token is not None:
        auth = MagicMock()
        auth.token = token
        auth.access_token = token
        auth.claims = {"sub": sub} if sub else {}
        ctx.auth = auth
    else:
        ctx.auth = None
    return ctx


@pytest.mark.asyncio
async def test_get_progress_returns_progress_panel():
    """get_progress returns a ProgressPanel-shaped dict for an authenticated user."""
    ctx = _make_ctx(sub="user-123", token="test-token")

    with patch("src.tools.progress.backend") as mock_backend:
        mock_backend.get = AsyncMock(return_value=MOCK_PROGRESS_DATA)

        from src.tools.progress import get_progress

        result = await get_progress(ctx)

    assert result["user_id"] == "user-123"
    assert result["current_streak"] == 5
    assert result["completion_percentage"] == 60.0
    assert result["total_chapters"] == 10
    assert result["completed_chapters"] == 6
    assert len(result["chapter_list"]) == 3
    first = result["chapter_list"][0]
    assert first["slug"] == "intro"
    assert first["completed"] is True
    assert first["quiz_score"] == 90
    # Backend called with correct path and auth header
    mock_backend.get.assert_called_once_with(
        "/users/user-123/progress",
        headers={"Authorization": "Bearer test-token"},
    )


@pytest.mark.asyncio
async def test_get_progress_unauthenticated_still_calls_backend():
    """When no auth context is present, backend is still called (backend validates the token)."""
    ctx = MagicMock()
    ctx.auth = None

    with patch("src.tools.progress.backend") as mock_backend:
        mock_backend.get = AsyncMock(return_value={**MOCK_PROGRESS_DATA, "user_id": "me"})

        from src.tools.progress import get_progress

        result = await get_progress(ctx)

    # Without a token, no Authorization header is sent
    mock_backend.get.assert_called_once_with("/users/me/progress", headers={})
    assert result["user_id"] == "me"
