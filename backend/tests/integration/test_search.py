"""Integration tests for GET /search."""
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import get_db
from src.main import app
from src.services.users import UserService

USER_ID = "user-test-search-001"
EMAIL = "student@example.com"


def _auth_header(token: str = "valid.jwt.token") -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _make_stytch_response() -> MagicMock:
    email_obj = MagicMock()
    email_obj.email = EMAIL
    user = MagicMock()
    user.emails = [email_obj]
    session = MagicMock()
    session.user_id = USER_ID
    resp = MagicMock()
    resp.session = session
    resp.user = user
    return resp


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


@pytest.fixture(autouse=True)
def free_user() -> AsyncGenerator[None, None]:
    user = MagicMock()
    user.access_tier = "free"
    with patch.object(
        UserService,
        "get_or_create",
        new=AsyncMock(return_value=user),
    ):
        yield


class TestGetSearch:
    async def test_query_matching_title_returns_rank_2(self, mock_stytch: MagicMock, mock_db: AsyncMock) -> None:
        from src.models.search import SearchResponse, SearchResult
        from src.services.search import SearchService

        result = SearchResponse(
            results=[SearchResult(slug="01-intro", title="Claude Agent SDK", excerpt="...agent sdk...", rank=2)],
            total=1,
        )

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(SearchService, "search", new=AsyncMock(return_value=result)),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/search", headers=_auth_header(), params={"q": "agent sdk"})

        assert response.status_code == 200
        data = response.json()
        assert data["results"][0]["rank"] == 2

    async def test_query_matching_body_only_returns_rank_1(self, mock_stytch: MagicMock, mock_db: AsyncMock) -> None:
        from src.models.search import SearchResponse, SearchResult
        from src.services.search import SearchService

        result = SearchResponse(
            results=[SearchResult(slug="02-advanced", title="Other Title", excerpt="...body match...", rank=1)],
            total=1,
        )

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(SearchService, "search", new=AsyncMock(return_value=result)),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/search", headers=_auth_header(), params={"q": "body match"})

        assert response.status_code == 200
        data = response.json()
        assert data["results"][0]["rank"] == 1

    async def test_query_matching_no_chapters_returns_empty_200(
        self, mock_stytch: MagicMock, mock_db: AsyncMock
    ) -> None:
        from src.models.search import SearchResponse
        from src.services.search import SearchService

        result = SearchResponse(results=[], total=0)

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(SearchService, "search", new=AsyncMock(return_value=result)),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/search", headers=_auth_header(), params={"q": "zzznomatch"})

        assert response.status_code == 200
        assert response.json()["total"] == 0

    async def test_blank_query_returns_400(self, mock_stytch: MagicMock, mock_db: AsyncMock) -> None:
        with patch("src.core.auth.get_stytch_client", return_value=mock_stytch):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/search", headers=_auth_header(), params={"q": "   "})

        assert response.status_code == 400

    async def test_missing_jwt_uses_free_search(self, mock_db: AsyncMock) -> None:
        from src.models.search import SearchResponse
        from src.services.search import SearchService

        with patch.object(
            SearchService,
            "search",
            new=AsyncMock(return_value=SearchResponse(results=[], total=0)),
        ) as search:
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.get("/search", params={"q": "anything"})

        assert response.status_code == 200
        assert search.await_args.kwargs["tier"] == "free"

    async def test_cold_cache_returns_503(self, mock_stytch: MagicMock, mock_db: AsyncMock) -> None:
        from src.services.content import ServiceUnavailableError
        from src.services.search import SearchService

        with (
            patch("src.core.auth.get_stytch_client", return_value=mock_stytch),
            patch.object(
                SearchService,
                "search",
                new=AsyncMock(side_effect=ServiceUnavailableError("Cache not warmed")),
            ),
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.get("/search", headers=_auth_header(), params={"q": "anything"})

        assert response.status_code == 503
