from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastmcp.tools import ToolResult

from src.auth import AuthorizedRequest
from src.tools.progress import _normalize_progress


MOCK_PROGRESS_DATA = {
    "user_id": "user-123",
    "current_streak": 5,
    "last_active_date": "2026-06-11",
    "completions": [
        {
            "chapter_slug": "intro",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "quiz_score": 90,
        },
        {
            "chapter_slug": "stale-chapter",
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "quiz_score": 100,
        },
    ],
}

MOCK_CHAPTERS = [
    {"slug": "mcp-basics", "title": "MCP Basics", "order": 3},
    {"slug": "intro", "title": "Introduction", "order": 1},
    {"slug": "agents-101", "title": "Agents 101", "order": 2},
]


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

    with (
        patch(
            "src.tools.progress.authorize_request",
            new=AsyncMock(
                return_value=AuthorizedRequest(
                    token="test-token",
                    user_id="user-123",
                )
            ),
        ),
        patch("src.tools.progress.backend") as mock_backend,
    ):
        mock_backend.get = AsyncMock(
            side_effect=[MOCK_PROGRESS_DATA, MOCK_CHAPTERS]
        )

        from src.tools.progress import get_progress

        result = await get_progress(ctx)

    assert isinstance(result, ToolResult)
    assert result.structured_content is not None
    assert result.structured_content["user_id"] == "user-123"
    assert result.structured_content["current_streak"] == 5
    assert result.structured_content["completion_percentage"] == pytest.approx(
        100 / 3
    )
    assert result.structured_content["total_chapters"] == 3
    assert result.structured_content["completed_chapters"] == 1
    assert len(result.structured_content["chapter_list"]) == 3
    first = result.structured_content["chapter_list"][0]
    assert first["slug"] == "intro"
    assert first["completed"] is True
    assert first["quiz_score"] == 90
    assert result.structured_content["chapter_list"][1]["slug"] == "agents-101"
    assert result.structured_content["chapter_list"][2]["slug"] == "mcp-basics"
    assert mock_backend.get.await_args_list[0].args == (
        "/users/user-123/progress",
    )
    assert mock_backend.get.await_args_list[0].kwargs == {
        "headers": {"Authorization": "Bearer test-token"}
    }
    assert mock_backend.get.await_args_list[1].args == ("/chapters",)


@pytest.mark.parametrize(
    ("progress", "chapters", "completed", "percentage"),
    [
        (
            {
                "user_id": "new-user",
                "completions": [],
                "current_streak": 0,
                "last_active_date": None,
            },
            MOCK_CHAPTERS,
            0,
            0.0,
        ),
        (
            {
                "user_id": "complete-user",
                "completions": [
                    {"chapter_slug": chapter["slug"], "quiz_score": None}
                    for chapter in MOCK_CHAPTERS
                ],
                "current_streak": 3,
                "last_active_date": "2026-06-11",
            },
            MOCK_CHAPTERS,
            3,
            100.0,
        ),
        (
            {
                "user_id": "empty-course-user",
                "completions": [],
                "current_streak": 0,
                "last_active_date": None,
            },
            [],
            0,
            0.0,
        ),
    ],
)
def test_normalize_progress_edge_cases(
    progress: dict,
    chapters: list[dict],
    completed: int,
    percentage: float,
) -> None:
    panel = _normalize_progress(progress, chapters)

    assert panel.completed_chapters == completed
    assert panel.total_chapters == len(chapters)
    assert panel.completion_percentage == percentage
    assert len(panel.chapter_list) == len(chapters)


@pytest.mark.asyncio
async def test_get_progress_backend_401_does_not_trigger_reconnect():
    """A backend auth mismatch does not restart OAuth for a validated token."""
    ctx = MagicMock()
    request = httpx.Request("GET", "http://backend/users/user-123/progress")
    response = httpx.Response(401, request=request)
    error = httpx.HTTPStatusError(
        "Unauthorized",
        request=request,
        response=response,
    )

    with (
        patch(
            "src.tools.progress.authorize_request",
            new=AsyncMock(
                return_value=AuthorizedRequest(
                    token="expired-token",
                    user_id="user-123",
                )
            ),
        ),
        patch("src.tools.progress.backend") as mock_backend,
    ):
        mock_backend.get = AsyncMock(side_effect=error)
        from src.tools.progress import get_progress

        result = await get_progress(ctx)

    assert isinstance(result, ToolResult)
    assert result.is_error is True
    assert "mcp/www_authenticate" not in result.meta
    assert result.structured_content == {
        "error": {
            "message": "Backend authentication configuration error."
        }
    }
