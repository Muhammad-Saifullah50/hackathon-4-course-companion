"""Unit tests for get_current_user dependency.

These tests must FAIL before auth.py is implemented.
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from src.core.auth import get_current_user
from src.core.config import settings
from src.models.users import AuthenticatedUser

PROJECT_DOMAIN = "https://project.customers.stytch.dev"
PROJECT_ID = "project-test-connected-app"


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


def _connected_app_token(
    private_key: rsa.RSAPrivateKey,
    *,
    issuer: str = PROJECT_DOMAIN,
    audience: str = PROJECT_ID,
    expires_delta: timedelta = timedelta(minutes=5),
    email: str | None = "learner@example.com",
) -> str:
    now = datetime.now(timezone.utc)
    claims: dict[str, object] = {
        "sub": "user-connected-app",
        "aud": audience,
        "iss": issuer,
        "exp": now + expires_delta,
    }
    if email is not None:
        claims["email"] = email
    return jwt.encode(claims, private_key, algorithm="RS256")


def _connected_app_client() -> MagicMock:
    client = MagicMock()
    client.sessions.authenticate_jwt.side_effect = ValueError("not a session JWT")
    client.users.get.return_value.user = type(
        "User",
        (),
        {"emails": [type("Email", (), {"email": "learner@example.com"})()]},
    )()
    return client


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

    def test_connected_app_token_returns_authenticated_user(self) -> None:
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        signing_key = MagicMock(key=private_key.public_key())
        jwks_client = MagicMock()
        jwks_client.get_signing_key_from_jwt.return_value = signing_key
        client = _connected_app_client()

        with (
            patch.object(settings, "stytch_project_domain", PROJECT_DOMAIN),
            patch.object(settings, "stytch_project_id", PROJECT_ID),
            patch("src.core.auth.get_stytch_client", return_value=client),
            patch(
                "src.core.auth.get_connected_apps_jwks_client",
                return_value=jwks_client,
            ),
        ):
            result = get_current_user(
                _make_creds(_connected_app_token(private_key))
            )

        assert result == AuthenticatedUser(
            user_id="user-connected-app",
            email="learner@example.com",
        )
        client.users.get.assert_not_called()

    def test_connected_app_profile_lookup_failure_uses_stable_email(self) -> None:
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        signing_key = MagicMock(key=private_key.public_key())
        jwks_client = MagicMock()
        jwks_client.get_signing_key_from_jwt.return_value = signing_key
        client = _connected_app_client()
        client.users.get.side_effect = RuntimeError("profile unavailable")

        with (
            patch.object(settings, "stytch_project_domain", PROJECT_DOMAIN),
            patch.object(settings, "stytch_project_id", PROJECT_ID),
            patch("src.core.auth.get_stytch_client", return_value=client),
            patch(
                "src.core.auth.get_connected_apps_jwks_client",
                return_value=jwks_client,
            ),
        ):
            result = get_current_user(
                _make_creds(
                    _connected_app_token(private_key, email=None)
                )
            )

        assert result == AuthenticatedUser(
            user_id="user-connected-app",
            email="user-connected-app@connected-app.local",
        )

    @pytest.mark.parametrize(
        ("issuer", "audience", "expires_delta"),
        [
            ("https://wrong-issuer.example", PROJECT_ID, timedelta(minutes=5)),
            (PROJECT_DOMAIN, "wrong-audience", timedelta(minutes=5)),
            (PROJECT_DOMAIN, PROJECT_ID, timedelta(minutes=-5)),
        ],
    )
    def test_invalid_connected_app_claims_raise_401(
        self,
        issuer: str,
        audience: str,
        expires_delta: timedelta,
    ) -> None:
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        signing_key = MagicMock(key=private_key.public_key())
        jwks_client = MagicMock()
        jwks_client.get_signing_key_from_jwt.return_value = signing_key

        with (
            patch.object(settings, "stytch_project_domain", PROJECT_DOMAIN),
            patch.object(settings, "stytch_project_id", PROJECT_ID),
            patch(
                "src.core.auth.get_stytch_client",
                return_value=_connected_app_client(),
            ),
            patch(
                "src.core.auth.get_connected_apps_jwks_client",
                return_value=jwks_client,
            ),
            pytest.raises(HTTPException) as exc_info,
        ):
            get_current_user(
                _make_creds(
                    _connected_app_token(
                        private_key,
                        issuer=issuer,
                        audience=audience,
                        expires_delta=expires_delta,
                    )
                )
            )

        assert exc_info.value.status_code == 401
