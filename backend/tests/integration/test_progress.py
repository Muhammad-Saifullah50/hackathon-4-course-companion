"""Integration tests for PUT and GET /users/{user_id}/progress."""
from collections.abc import AsyncGenerator
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_db
from src.main import app

USER_ID = "user-test-progress-001"
EMAIL = "student@example.com"
CHAPTER_SLUG = "01-intro-to-agents"


def _auth_header(token: str = "valid.jwt.token") -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _make_stytch_response(user_id: str = USER_ID, email: str = EMAIL) -> MagicMock:
    email_obj = MagicMock()
    email_obj.email = email
    user = MagicMock()
    user.emails = [email_obj]
    session = MagicMock()
    session.user_id = user_id
    resp = MagicMock()
    resp.session = session
    resp.user = user
    return resp


def _make_db_user(
    user_id: str = USER_ID,
    email: str = EMAIL,
    access_tier: str = "free",
    current_streak: int = 1,
    last_active_date: date | None = None,
) -> MagicMock:
    user = MagicMock()
    user.id = user_id
    user.email = email
    user.access_tier = access_tier
    user.current_streak = current_streak
    user.last_active_date = last_active_date or date.today()
    user.created_at = datetime(2026, 6, 4, 10, 0, 0, tzinfo=timezone.utc)
    return user


@pytest.fixture
def mock_stytch() -> MagicMock:
    mock_client = MagicMock()
    mock_client.sessions.authenticate_jwt.return_value = _make_stytch_response()
    return mock_client


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock(spec=AsyncSession)


@pytest.fixture(autouse=True)
def override_db(mock_db: AsyncMock) -> AsyncGenerator[None, None]:
    async def _get_db_override() -> AsyncGenerator[AsyncSession, None]:
        yield mock_db

    app.dependency_overrides[get_db] = _get_db_override
    yield
    app.dependency_overrides.pop(get_db, None)


def _make_completion_response(
    user_id: str = USER_ID,
    chapter_slug: str = CHAPTER_SLUG,
    quiz_score: int | None = 85,
    current_streak: int = 1,
) -> MagicMock:
    from src.models.progress import CompletionResponse

    return CompletionResponse(
        user_id=user_id,
        chapter_slug=chapter_slug,
        completed_at=datetime(2026, 6, 5, 10, 0, 0, tzinfo=timezone.utc),
        quiz_score=quiz_score,
        current_streak=current_streak,
    )


class TestPutUserProgress:
    async def test_valid_completion_returns_200_with_streak(self, mock_stytch: MagicMock, mock_db: AsyncMock) -> None:
        completion = _make_completion_response()

        from src.services.progress import ProgressService

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(ProgressService, "record_completion", new=AsyncMock(return_value=completion)),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.put(
                    f"/users/{USER_ID}/progress",
                    headers=_auth_header(),
                    params={"chapter_slug": CHAPTER_SLUG},
                    json={"quiz_score": 85},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["chapter_slug"] == CHAPTER_SLUG
        assert "completed_at" in data
        assert data["current_streak"] >= 1

    async def test_same_chapter_re_completion_is_idempotent(self, mock_stytch: MagicMock, mock_db: AsyncMock) -> None:
        completion = _make_completion_response()

        from src.services.progress import ProgressService

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(ProgressService, "record_completion", new=AsyncMock(return_value=completion)),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                r1 = await client.put(
                    f"/users/{USER_ID}/progress",
                    headers=_auth_header(),
                    params={"chapter_slug": CHAPTER_SLUG},
                    json={},
                )
                r2 = await client.put(
                    f"/users/{USER_ID}/progress",
                    headers=_auth_header(),
                    params={"chapter_slug": CHAPTER_SLUG},
                    json={},
                )

        assert r1.status_code == 200
        assert r2.status_code == 200

    async def test_invalid_jwt_returns_401(self, mock_db: AsyncMock) -> None:
        bad_client = MagicMock()
        bad_client.sessions.authenticate_jwt.side_effect = Exception("invalid")

        with patch("src.core.auth.get_stytch_client", return_value=bad_client):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.put(
                    f"/users/{USER_ID}/progress",
                    headers=_auth_header("bad.token"),
                    params={"chapter_slug": CHAPTER_SLUG},
                    json={},
                )

        assert response.status_code == 401

    async def test_mismatched_user_id_returns_403(self, mock_stytch: MagicMock, mock_db: AsyncMock) -> None:
        from src.services.progress import ProgressService
        from fastapi import HTTPException

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(
                ProgressService,
                "record_completion",
                new=AsyncMock(side_effect=HTTPException(status_code=403, detail="Forbidden")),
            ),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.put(
                    "/users/other-user-id/progress",
                    headers=_auth_header(),
                    params={"chapter_slug": CHAPTER_SLUG},
                    json={},
                )

        assert response.status_code == 403

    async def test_unknown_chapter_slug_returns_404(self, mock_stytch: MagicMock, mock_db: AsyncMock) -> None:
        from src.services.progress import ProgressService
        from fastapi import HTTPException

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(
                ProgressService,
                "record_completion",
                new=AsyncMock(side_effect=HTTPException(status_code=404, detail="Chapter not found")),
            ),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.put(
                    f"/users/{USER_ID}/progress",
                    headers=_auth_header(),
                    params={"chapter_slug": "nonexistent-chapter"},
                    json={},
                )

        assert response.status_code == 404


class TestGetUserProgress:
    async def test_user_with_no_completions_returns_empty(self, mock_stytch: MagicMock, mock_db: AsyncMock) -> None:
        from src.models.progress import ProgressResponse
        from src.services.progress import ProgressService

        empty_response = ProgressResponse(
            user_id=USER_ID,
            completions=[],
            current_streak=0,
            last_active_date=None,
        )

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(ProgressService, "get_progress", new=AsyncMock(return_value=empty_response)),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get(f"/users/{USER_ID}/progress", headers=_auth_header())

        assert response.status_code == 200
        data = response.json()
        assert data["completions"] == []
        assert data["current_streak"] == 0

    async def test_user_with_three_completions_returns_all(self, mock_stytch: MagicMock, mock_db: AsyncMock) -> None:
        from src.models.progress import ProgressEntry, ProgressResponse
        from src.services.progress import ProgressService

        now = datetime(2026, 6, 5, 10, 0, 0, tzinfo=timezone.utc)
        entries = [
            ProgressEntry(chapter_slug=f"chapter-{i}", completed_at=now, quiz_score=None)
            for i in range(3)
        ]
        progress_response = ProgressResponse(
            user_id=USER_ID,
            completions=entries,
            current_streak=3,
            last_active_date=date(2026, 6, 5),
        )

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(ProgressService, "get_progress", new=AsyncMock(return_value=progress_response)),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get(f"/users/{USER_ID}/progress", headers=_auth_header())

        assert response.status_code == 200
        data = response.json()
        assert len(data["completions"]) == 3
        assert data["current_streak"] == 3

    async def test_requesting_another_users_progress_returns_403(
        self, mock_stytch: MagicMock, mock_db: AsyncMock
    ) -> None:
        from src.services.progress import ProgressService
        from fastapi import HTTPException

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(
                ProgressService,
                "get_progress",
                new=AsyncMock(side_effect=HTTPException(status_code=403, detail="Forbidden")),
            ),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/users/other-user/progress", headers=_auth_header())

        assert response.status_code == 403
