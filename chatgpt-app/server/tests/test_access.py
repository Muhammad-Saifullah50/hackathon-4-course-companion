import httpx
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from src.auth import AuthorizedRequest


MOCK_FREE_TIER_RESPONSE = {
    "tier": "free",
    "resource": None,
    "allowed": True,
}

MOCK_PREMIUM_TIER_RESPONSE = {
    "tier": "premium",
    "resource": None,
    "allowed": True,
}

UPGRADE_URL = "https://example.com/upgrade"


@pytest.mark.asyncio
async def test_check_access_free_tier_populates_upgrade_url():
    mock_settings = MagicMock()
    mock_settings.upgrade_url = UPGRADE_URL

    with (
        patch(
            "src.tools.access.authorize_request",
            new=AsyncMock(
                return_value=AuthorizedRequest(
                    token="test-token",
                    user_id="user-123",
                )
            ),
        ),
        patch("src.tools.access.backend") as mock_backend,
        patch("src.tools.access.settings", mock_settings),
    ):
        mock_backend.get = AsyncMock(return_value=MOCK_FREE_TIER_RESPONSE)

        from src.tools.access import check_access

        ctx = MagicMock()
        ctx.auth = None

        result = await check_access(ctx)

    assert result.structured_content is not None
    assert result.structured_content["tier"] == "free"
    assert result.structured_content["allowed"] is True
    assert result.structured_content["upgrade_url"] == UPGRADE_URL


@pytest.mark.asyncio
async def test_check_access_premium_tier_returns_no_upgrade_url():
    mock_settings = MagicMock()
    mock_settings.upgrade_url = UPGRADE_URL

    with (
        patch(
            "src.tools.access.authorize_request",
            new=AsyncMock(
                return_value=AuthorizedRequest(
                    token="test-token",
                    user_id="user-456",
                )
            ),
        ),
        patch("src.tools.access.backend") as mock_backend,
        patch("src.tools.access.settings", mock_settings),
    ):
        mock_backend.get = AsyncMock(return_value=MOCK_PREMIUM_TIER_RESPONSE)

        from src.tools.access import check_access

        ctx = MagicMock()
        ctx.auth = None

        result = await check_access(ctx)

    assert result.structured_content is not None
    assert result.structured_content["tier"] == "premium"
    assert result.structured_content["allowed"] is True
    assert result.structured_content["upgrade_url"] is None


@pytest.mark.asyncio
async def test_check_access_backend_error_propagates():
    mock_settings = MagicMock()
    mock_settings.upgrade_url = UPGRADE_URL

    with (
        patch(
            "src.tools.access.authorize_request",
            new=AsyncMock(
                return_value=AuthorizedRequest(
                    token="test-token",
                    user_id="user-123",
                )
            ),
        ),
        patch("src.tools.access.backend") as mock_backend,
        patch("src.tools.access.settings", mock_settings),
    ):
        mock_backend.get = AsyncMock(side_effect=RuntimeError("Backend unavailable"))

        from src.tools.access import check_access

        ctx = MagicMock()
        ctx.auth = None

        with pytest.raises(RuntimeError, match="Backend unavailable"):
            await check_access(ctx)


@pytest.mark.asyncio
async def test_check_access_backend_401_does_not_trigger_reconnect():
    request = httpx.Request("GET", "http://backend/access/check")
    response = httpx.Response(401, request=request)
    error = httpx.HTTPStatusError(
        "Unauthorized",
        request=request,
        response=response,
    )

    with (
        patch(
            "src.tools.access.authorize_request",
            new=AsyncMock(
                return_value=AuthorizedRequest(
                    token="valid-mcp-token",
                    user_id="user-123",
                )
            ),
        ),
        patch("src.tools.access.backend") as mock_backend,
    ):
        mock_backend.get = AsyncMock(side_effect=error)

        from src.tools.access import check_access

        result = await check_access(MagicMock())

    assert result.is_error is True
    assert "mcp/www_authenticate" not in result.meta
    assert result.structured_content["error"]["message"] == (
        "Backend authentication configuration error."
    )
