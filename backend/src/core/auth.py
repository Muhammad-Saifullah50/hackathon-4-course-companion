import logging
from datetime import datetime
from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Header, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from stytch import Client

from src.core.config import settings
from src.models.users import AuthenticatedUser

logger = logging.getLogger(__name__)
_stytch_client: Client | None = None
_bearer = HTTPBearer(auto_error=False)


def get_stytch_client() -> Client:
    global _stytch_client
    if _stytch_client is None:
        _stytch_client = Client(
            project_id=settings.stytch_project_id,
            secret=settings.stytch_secret,
        )
    return _stytch_client


@lru_cache(maxsize=1)
def get_connected_apps_jwks_client() -> jwt.PyJWKClient:
    """Return the cached JWKS client for Stytch Connected Apps tokens."""
    jwks_uri = f"{settings.stytch_project_domain.rstrip('/')}/.well-known/jwks.json"
    return jwt.PyJWKClient(jwks_uri)


def _extract_email(user: object) -> str:
    emails = getattr(user, "emails", None)
    if emails:
        return emails[0].email
    raise HTTPException(status_code=401, detail="Email claim missing from token")


def _session_email(client: Client, resp: object, user_id: str) -> str:
    user = getattr(resp, "user", None)
    if user is not None and getattr(user, "emails", None):
        return _extract_email(user)

    try:
        return _extract_email(client.users.get(user_id=user_id))
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Stytch user profile lookup failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=401,
            detail="Email claim missing from token",
        ) from exc


def _session_expiry(resp: object) -> datetime | None:
    session = getattr(resp, "session", None)
    expires_at = getattr(session, "expires_at", None)
    return expires_at if isinstance(expires_at, datetime) else None


def _authenticated_session(client: Client, resp: object) -> AuthenticatedUser:
    session = getattr(resp, "session", None)
    user_id = getattr(session, "user_id", None)
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return AuthenticatedUser(
        user_id=user_id,
        email=_session_email(client, resp, user_id),
        expires_at=_session_expiry(resp),
    )


def _connected_app_email(claims: dict[str, object], user_id: str) -> str:
    email = claims.get("email")
    if isinstance(email, str) and email:
        return email

    try:
        response = get_stytch_client().users.get(user_id=user_id)
        return _extract_email(response)
    except Exception as exc:
        logger.warning(
            "Connected Apps user profile lookup failed: %s",
            type(exc).__name__,
        )
        return f"{user_id}@connected-app.local"


def _authenticate_connected_app_token(token: str) -> AuthenticatedUser:
    if not settings.stytch_project_domain or not settings.stytch_project_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    signing_key = get_connected_apps_jwks_client().get_signing_key_from_jwt(token)
    claims = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=settings.stytch_project_id,
        issuer=settings.stytch_project_domain.rstrip("/"),
        options={
            "require": ["sub", "aud", "iss", "exp"],
        },
    )
    user_id = claims.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return AuthenticatedUser(
        user_id=user_id,
        email=_connected_app_email(claims, user_id),
    )


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Security(_bearer),
    ] = None,
    session_token: Annotated[
        str | None,
        Header(alias="X-Stytch-Session"),
    ] = None,
) -> AuthenticatedUser:
    client = get_stytch_client()
    if session_token:
        try:
            return _authenticated_session(
                client,
                client.sessions.authenticate(session_token=session_token),
            )
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning(
                "Stytch opaque session authentication failed: %s",
                type(exc).__name__,
            )
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired token",
            ) from exc

    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        resp = client.sessions.authenticate_jwt(
            session_jwt=credentials.credentials
        )
        return _authenticated_session(client, resp)
    except HTTPException:
        raise
    except Exception:
        try:
            return _authenticate_connected_app_token(credentials.credentials)
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning(
                "Connected Apps token authentication failed: %s",
                type(exc).__name__,
            )
            raise HTTPException(status_code=401, detail="Invalid or expired token")


def revoke_session(session_token: str) -> None:
    """Revoke an opaque Stytch session token."""
    try:
        get_stytch_client().sessions.revoke(session_token=session_token)
    except Exception as exc:
        logger.warning("Stytch session revocation failed: %s", type(exc).__name__)
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        ) from exc
