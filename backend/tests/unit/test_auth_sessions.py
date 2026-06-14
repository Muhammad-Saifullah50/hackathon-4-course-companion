from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from src.core.auth import get_current_user, revoke_session
from src.models.users import AuthenticatedUser
from src.routers.auth import get_auth_session, post_auth_logout


def _session_response() -> MagicMock:
    response = MagicMock()
    response.session.user_id = "user-session-123"
    response.session.expires_at = datetime(
        2026,
        6,
        13,
        12,
        0,
        tzinfo=timezone.utc,
    )
    response.user.emails = [
        type("Email", (), {"email": "session@example.com"})()
    ]
    return response


def test_opaque_session_token_returns_authenticated_user() -> None:
    client = MagicMock()
    client.sessions.authenticate.return_value = _session_response()

    with patch("src.core.auth.get_stytch_client", return_value=client):
        user = get_current_user(session_token="opaque-session-token")

    assert user == AuthenticatedUser(
        user_id="user-session-123",
        email="session@example.com",
        expires_at=datetime(2026, 6, 13, 12, 0, tzinfo=timezone.utc),
    )
    client.sessions.authenticate.assert_called_once_with(
        session_token="opaque-session-token"
    )
    client.sessions.authenticate_jwt.assert_not_called()


def test_invalid_opaque_session_token_raises_401() -> None:
    client = MagicMock()
    client.sessions.authenticate.side_effect = RuntimeError("expired")

    with (
        patch("src.core.auth.get_stytch_client", return_value=client),
        pytest.raises(HTTPException) as exc_info,
    ):
        get_current_user(session_token="expired-session-token")

    assert exc_info.value.status_code == 401


def test_missing_credentials_raise_401() -> None:
    with (
        patch("src.core.auth.get_stytch_client", return_value=MagicMock()),
        pytest.raises(HTTPException) as exc_info,
    ):
        get_current_user()

    assert exc_info.value.status_code == 401


def test_revoke_session_uses_opaque_token() -> None:
    client = MagicMock()

    with patch("src.core.auth.get_stytch_client", return_value=client):
        revoke_session("opaque-session-token")

    client.sessions.revoke.assert_called_once_with(
        session_token="opaque-session-token"
    )


@pytest.mark.asyncio
async def test_auth_session_endpoint_returns_minimal_identity() -> None:
    user = AuthenticatedUser(
        user_id="user-session-123",
        email="session@example.com",
        expires_at=datetime(2026, 6, 13, 12, 0, tzinfo=timezone.utc),
    )

    response = await get_auth_session(user)

    assert response.user_id == user.user_id
    assert response.email == user.email
    assert response.expires_at == user.expires_at


@pytest.mark.asyncio
async def test_logout_endpoint_revokes_opaque_session() -> None:
    with patch("src.routers.auth.revoke_session") as revoke:
        response = await post_auth_logout("opaque-session-token")

    assert response.status_code == 204
    revoke.assert_called_once_with("opaque-session-token")
