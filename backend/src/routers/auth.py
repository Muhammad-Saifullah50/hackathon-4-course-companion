from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Response, status

from src.core.auth import revoke_session
from src.core.dependencies import CurrentUserDep
from src.models.users import AuthSession

router = APIRouter()


@router.get("/session", response_model=AuthSession)
async def get_auth_session(current_user: CurrentUserDep) -> AuthSession:
    """Return the authenticated Stytch session identity."""
    return AuthSession(
        user_id=current_user.user_id,
        email=current_user.email,
        expires_at=current_user.expires_at,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def post_auth_logout(
    session_token: Annotated[
        str | None,
        Header(alias="X-Stytch-Session"),
    ] = None,
) -> Response:
    """Revoke the current opaque Stytch session."""
    if not session_token:
        raise HTTPException(status_code=401, detail="Authentication required")
    revoke_session(session_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
