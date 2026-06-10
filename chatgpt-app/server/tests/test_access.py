import pytest
from unittest.mock import AsyncMock, patch, MagicMock


MOCK_FREE_TIER_RESPONSE = {
    "user_id": "user-123",
    "tier": "free",
    "is_premium": False,
    "upgrade_url": None,
}

MOCK_PREMIUM_TIER_RESPONSE = {
    "user_id": "user-456",
    "tier": "premium",
    "is_premium": True,
    "upgrade_url": None,
}

UPGRADE_URL = "https://example.com/upgrade"


@pytest.mark.asyncio
async def test_check_access_free_tier_populates_upgrade_url():
    mock_settings = MagicMock()
    mock_settings.upgrade_url = UPGRADE_URL

    with patch("src.tools.access.backend") as mock_backend, patch(
        "src.tools.access.settings", mock_settings
    ):
        mock_backend.get = AsyncMock(return_value=MOCK_FREE_TIER_RESPONSE)

        from src.tools.access import check_access

        ctx = MagicMock()
        ctx.auth = None

        result = await check_access(ctx)

    assert result["user_id"] == "user-123"
    assert result["tier"] == "free"
    assert result["is_premium"] is False
    assert result["upgrade_url"] == UPGRADE_URL


@pytest.mark.asyncio
async def test_check_access_premium_tier_returns_no_upgrade_url():
    mock_settings = MagicMock()
    mock_settings.upgrade_url = UPGRADE_URL

    with patch("src.tools.access.backend") as mock_backend, patch(
        "src.tools.access.settings", mock_settings
    ):
        mock_backend.get = AsyncMock(return_value=MOCK_PREMIUM_TIER_RESPONSE)

        from src.tools.access import check_access

        ctx = MagicMock()
        ctx.auth = None

        result = await check_access(ctx)

    assert result["user_id"] == "user-456"
    assert result["tier"] == "premium"
    assert result["is_premium"] is True
    assert result["upgrade_url"] is None


@pytest.mark.asyncio
async def test_check_access_backend_error_propagates():
    mock_settings = MagicMock()
    mock_settings.upgrade_url = UPGRADE_URL

    with patch("src.tools.access.backend") as mock_backend, patch(
        "src.tools.access.settings", mock_settings
    ):
        mock_backend.get = AsyncMock(side_effect=RuntimeError("Backend unavailable"))

        from src.tools.access import check_access

        ctx = MagicMock()
        ctx.auth = None

        with pytest.raises(RuntimeError, match="Backend unavailable"):
            await check_access(ctx)
