"""Unit tests for get_current_user dependency.

These tests must FAIL before auth.py is implemented.
"""
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from src.core.auth import get_current_user
from src.models.users import AuthenticatedUser


def _make_creds(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _make_stytch_response(user_id: str = "user-test-abc123", email: str = "student@example.com") -> MagicMock:
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


class TestGetCurrentUser:
    def test_valid_token_returns_authenticated_user(self) -> None:
        resp = _make_stytch_response()
        mock_client = MagicMock()
        mock_client.sessions.authenticate_jwt.return_value = resp

        with patch("src.core.auth.get_stytch_client", return_value=mock_client):
            result = get_current_user(_make_creds("valid.jwt.token"))

        assert isinstance(result, AuthenticatedUser)
        assert result.user_id == "user-test-abc123"
        assert result.email == "student@example.com"

    def test_missing_token_raises_401(self) -> None:
        mock_client = MagicMock()
        mock_client.sessions.authenticate_jwt.side_effect = Exception("invalid token")

        with patch("src.core.auth.get_stytch_client", return_value=mock_client):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(_make_creds(""))

        assert exc_info.value.status_code == 401

    def test_malformed_token_raises_401(self) -> None:
        mock_client = MagicMock()
        mock_client.sessions.authenticate_jwt.side_effect = Exception("malformed")

        with patch("src.core.auth.get_stytch_client", return_value=mock_client):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(_make_creds("not.a.valid.jwt"))

        assert exc_info.value.status_code == 401

    def test_expired_token_raises_401(self) -> None:
        mock_client = MagicMock()
        mock_client.sessions.authenticate_jwt.side_effect = Exception("expired")

        with patch("src.core.auth.get_stytch_client", return_value=mock_client):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(_make_creds("expired.jwt.token"))

        assert exc_info.value.status_code == 401

    def test_wrong_issuer_token_raises_401(self) -> None:
        mock_client = MagicMock()
        mock_client.sessions.authenticate_jwt.side_effect = Exception("invalid issuer")

        with patch("src.core.auth.get_stytch_client", return_value=mock_client):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(_make_creds("wrong.issuer.token"))

        assert exc_info.value.status_code == 401

    def test_missing_email_claim_raises_401(self) -> None:
        resp = MagicMock()
        resp.session.user_id = "user-test-abc123"
        resp.user.emails = []  # no emails

        mock_client = MagicMock()
        mock_client.sessions.authenticate_jwt.return_value = resp

        with patch("src.core.auth.get_stytch_client", return_value=mock_client):
            with pytest.raises(HTTPException) as exc_info:
                get_current_user(_make_creds("valid.jwt.token"))

        assert exc_info.value.status_code == 401
