"""Integration tests for GET /users/me.

These tests must FAIL before the endpoint is implemented.
"""
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_db
from src.main import app


def _make_auth_header(token: str = "valid.jwt.token") -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _make_stytch_response(
    user_id: str = "user-test-abc123",
    email: str = "student@example.com",
) -> MagicMock:
    user = MagicMock()
    email_obj = MagicMock()
    email_obj.email = email
    user.emails = [email_obj]

    session = MagicMock()
    session.user_id = user_id

    resp = MagicMock()
    resp.session = session
    resp.user = user
    return resp


def _make_db_user(
    user_id: str = "user-test-abc123",
    email: str = "student@example.com",
    access_tier: str = "free",
) -> MagicMock:
    from datetime import datetime, timezone

    user = MagicMock()
    user.id = user_id
    user.email = email
    user.access_tier = access_tier
    user.created_at = datetime(2026, 6, 4, 10, 0, 0, tzinfo=timezone.utc)
    return user


@pytest.fixture
def mock_stytch() -> MagicMock:
    resp = _make_stytch_response()
    mock_client = MagicMock()
    mock_client.sessions.authenticate_jwt.return_value = resp
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


class TestGetUsersMe:
    async def test_returns_200_with_valid_token(
        self, mock_stytch: MagicMock, mock_db: AsyncMock
    ) -> None:
        db_user = _make_db_user()

        from src.services.users import UserService

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(UserService, "get_or_create", new=AsyncMock(return_value=db_user)),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/users/me", headers=_make_auth_header())

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "user-test-abc123"
        assert data["email"] == "student@example.com"
        assert data["access_tier"] == "free"
        assert "created_at" in data

    async def test_returns_401_without_token(self) -> None:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/users/me")

        assert response.status_code in (401, 403)  # HTTPBearer returns 401 or 403 depending on FastAPI version

    async def test_returns_401_with_invalid_token(self) -> None:
        mock_client = MagicMock()
        mock_client.sessions.authenticate_jwt.side_effect = Exception("invalid")

        with patch("src.core.auth.get_stytch_client", return_value=mock_client):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/users/me", headers=_make_auth_header("bad.token"))

        assert response.status_code == 401

    async def test_first_login_creates_user_record(
        self, mock_stytch: MagicMock, mock_db: AsyncMock
    ) -> None:
        db_user = _make_db_user()

        from src.services.users import UserService

        mock_get_or_create = AsyncMock(return_value=db_user)
        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(UserService, "get_or_create", new=mock_get_or_create),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/users/me", headers=_make_auth_header())

        assert response.status_code == 200
        mock_get_or_create.assert_called_once_with(
            user_id="user-test-abc123",
            email="student@example.com",
            db=mock_db,
        )

    async def test_same_token_twice_does_not_duplicate_user(
        self, mock_stytch: MagicMock, mock_db: AsyncMock
    ) -> None:
        db_user = _make_db_user()

        from src.services.users import UserService

        mock_get_or_create = AsyncMock(return_value=db_user)
        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(UserService, "get_or_create", new=mock_get_or_create),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                r1 = await client.get("/users/me", headers=_make_auth_header())
                r2 = await client.get("/users/me", headers=_make_auth_header())

        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json()["id"] == r2.json()["id"]


class TestMultiClientCompatibility:
    """US2: same backend JWT mechanism works for all frontend consumers."""

    async def test_two_clients_same_user_returns_identical_profile_no_duplicate(
        self, mock_db: AsyncMock
    ) -> None:
        user_id = "user-test-shared-abc"
        email = "shared@example.com"
        db_user = _make_db_user(user_id=user_id, email=email)

        mock_client_a = MagicMock()
        mock_client_a.sessions.authenticate_jwt.return_value = _make_stytch_response(user_id, email)

        mock_client_b = MagicMock()
        mock_client_b.sessions.authenticate_jwt.return_value = _make_stytch_response(user_id, email)

        from src.services.users import UserService

        call_count = 0

        async def mock_get_or_create(self_: object, user_id: str, email: str, db: object) -> MagicMock:
            nonlocal call_count
            call_count += 1
            return db_user

        with patch.object(UserService, "get_or_create", new=mock_get_or_create):
            with patch("src.core.auth.get_stytch_client", return_value=mock_client_a):
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    r1 = await client.get("/users/me", headers=_make_auth_header("chatgpt.token"))

            with patch("src.core.auth.get_stytch_client", return_value=mock_client_b):
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                    r2 = await client.get("/users/me", headers=_make_auth_header("webapp.token"))

        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json()["id"] == r2.json()["id"] == user_id
        assert r1.json()["email"] == r2.json()["email"] == email
        assert call_count == 2  # called twice but same user_id — DB handles idempotency
