from functools import lru_cache
import logging
from typing import Annotated

import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from stytch import Client

from src.core.config import settings
from src.models.users import AuthenticatedUser

logger = logging.getLogger(__name__)
_stytch_client: Client | None = None


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


def _extract_email(resp: object) -> str:
    emails = getattr(getattr(resp, "user", None), "emails", None)
    if emails:
        return emails[0].email
    raise HTTPException(status_code=401, detail="Email claim missing from token")


def _connected_app_email(claims: dict[str, object], user_id: str) -> str:
    email = claims.get("email")
    if isinstance(email, str) and email:
        return email

    try:
        user = get_stytch_client().users.get(user_id=user_id).user
        return _extract_email(type("UserResponse", (), {"user": user})())
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
    credentials: Annotated[HTTPAuthorizationCredentials, Security(HTTPBearer())],
) -> AuthenticatedUser:
    try:
        resp = get_stytch_client().sessions.authenticate_jwt(
            session_jwt=credentials.credentials
        )
        return AuthenticatedUser(
            user_id=resp.session.user_id,
            email=_extract_email(resp),
        )
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
