from unittest.mock import AsyncMock, patch

import pytest
from fastmcp.tools import ToolResult


def test_protected_resource_metadata():
    from src.auth import SCOPES
    from src.core.config import settings
    from src.main import oauth_protected_resource

    assert settings.stytch_project_domain
    assert SCOPES == ["openid"]
    assert callable(oauth_protected_resource)


def test_protected_resource_url_is_on_origin_root():
    from src.auth import protected_resource_url

    with patch(
        "src.auth.settings.mcp_server_base_url",
        "https://claudeteacher.example/mcp",
    ):
        assert protected_resource_url() == (
            "https://claudeteacher.example/"
            ".well-known/oauth-protected-resource"
        )


@pytest.mark.asyncio
async def test_missing_token_returns_oauth_challenge():
    from src.auth import authorize_request

    with patch("src.auth.get_http_headers", return_value={}):
        result = await authorize_request("ui://widget/quiz-panel.html")

    assert isinstance(result, ToolResult)
    assert result.is_error is True
    assert "mcp/www_authenticate" in result.meta


@pytest.mark.asyncio
async def test_missing_token_without_widget_omits_template_metadata():
    from src.auth import authorize_request

    with patch("src.auth.get_http_headers", return_value={}):
        result = await authorize_request()

    assert isinstance(result, ToolResult)
    assert "mcp/www_authenticate" in result.meta
    assert "ui" not in result.meta
    assert "openai/outputTemplate" not in result.meta


@pytest.mark.asyncio
async def test_valid_token_resolves_stytch_subject():
    from src.auth import AuthorizedRequest, authorize_request

    verified = type("AccessToken", (), {"claims": {"sub": "user-test"}})()
    with (
        patch(
            "src.auth.get_http_headers",
            return_value={"authorization": "Bearer access-token"},
        ),
        patch(
            "src.auth.auth_provider.verify_token",
            new=AsyncMock(return_value=verified),
        ),
    ):
        result = await authorize_request("ui://widget/quiz-panel.html")

    assert result == AuthorizedRequest(
        token="access-token", user_id="user-test"
    )
