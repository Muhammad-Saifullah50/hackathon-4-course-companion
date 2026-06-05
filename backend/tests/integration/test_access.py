"""Integration tests for GET /access/check."""
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_db
from src.main import app

USER_ID = "user-test-access-001"
EMAIL = "student@example.com"


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


@pytest.fixture
def mock_stytch_free() -> MagicMock:
    mock_client = MagicMock()
    mock_client.sessions.authenticate_jwt.return_value = _make_stytch_response()
    return mock_client


@pytest.fixture
def mock_stytch_premium() -> MagicMock:
    mock_client = MagicMock()
    mock_client.sessions.authenticate_jwt.return_value = _make_stytch_response(user_id="user-premium-001")
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


def _make_db_user(access_tier: str = "free", user_id: str = USER_ID) -> MagicMock:
    from datetime import datetime, timezone

    user = MagicMock()
    user.id = user_id
    user.email = EMAIL
    user.access_tier = access_tier
    user.current_streak = 0
    user.last_active_date = None
    user.created_at = datetime(2026, 6, 4, 10, 0, 0, tzinfo=timezone.utc)
    return user


class TestGetAccessCheck:
    async def test_free_user_no_resource_returns_allowed_true(
        self, mock_stytch_free: MagicMock, mock_db: AsyncMock
    ) -> None:
        from src.models.access import AccessStatus
        from src.services.access import AccessService
        from src.services.users import UserService

        db_user = _make_db_user(access_tier="free")
        status = AccessStatus(tier="free", resource=None, allowed=True)

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch_free),
            patch.object(UserService, "get_or_create", new=AsyncMock(return_value=db_user)),
            patch.object(AccessService, "check", return_value=status),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/access/check", headers=_auth_header())

        assert response.status_code == 200
        data = response.json()
        assert data["tier"] == "free"
        assert data["resource"] is None
        assert data["allowed"] is True

    async def test_free_user_with_premium_resource_returns_allowed_false(
        self, mock_stytch_free: MagicMock, mock_db: AsyncMock
    ) -> None:
        from src.models.access import AccessStatus
        from src.services.access import AccessService
        from src.services.users import UserService

        db_user = _make_db_user(access_tier="free")
        status = AccessStatus(tier="free", resource="premium", allowed=False)

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch_free),
            patch.object(UserService, "get_or_create", new=AsyncMock(return_value=db_user)),
            patch.object(AccessService, "check", return_value=status),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/access/check", headers=_auth_header(), params={"resource": "premium"})

        assert response.status_code == 200
        data = response.json()
        assert data["tier"] == "free"
        assert data["resource"] == "premium"
        assert data["allowed"] is False

    async def test_premium_user_with_premium_resource_returns_allowed_true(
        self, mock_stytch_premium: MagicMock, mock_db: AsyncMock
    ) -> None:
        from src.models.access import AccessStatus
        from src.services.access import AccessService
        from src.services.users import UserService

        db_user = _make_db_user(access_tier="premium", user_id="user-premium-001")
        status = AccessStatus(tier="premium", resource="premium", allowed=True)

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch_premium),
            patch.object(UserService, "get_or_create", new=AsyncMock(return_value=db_user)),
            patch.object(AccessService, "check", return_value=status),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/access/check", headers=_auth_header(), params={"resource": "premium"})

        assert response.status_code == 200
        data = response.json()
        assert data["tier"] == "premium"
        assert data["allowed"] is True

    async def test_missing_jwt_returns_401(self, mock_db: AsyncMock) -> None:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/access/check")

        assert response.status_code in (401, 403)
