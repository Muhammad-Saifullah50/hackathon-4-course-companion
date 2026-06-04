from typing import Annotated

from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from stytch import Client

from src.core.config import settings
from src.models.users import AuthenticatedUser

_stytch_client: Client | None = None


def get_stytch_client() -> Client:
    global _stytch_client
    if _stytch_client is None:
        _stytch_client = Client(
            project_id=settings.stytch_project_id,
            secret=settings.stytch_secret,
        )
    return _stytch_client


def _extract_email(resp: object) -> str:
    emails = getattr(getattr(resp, "user", None), "emails", None)
    if emails:
        return emails[0].email
    raise HTTPException(status_code=401, detail="Email claim missing from token")


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
        raise HTTPException(status_code=401, detail="Invalid or expired token")
