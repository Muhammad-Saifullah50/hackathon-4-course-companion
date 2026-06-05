from fastapi import APIRouter

from src.core.dependencies import CurrentUserDep, DbSessionDep
from src.models.access import AccessStatus
from src.services.access import AccessService
from src.services.users import UserService

router = APIRouter()
_access_service = AccessService()
_user_service = UserService()


@router.get("/check", response_model=AccessStatus)
async def get_access_check(
    current_user: CurrentUserDep,
    db: DbSessionDep,
    resource: str | None = None,
) -> AccessStatus:
    user = await _user_service.get_or_create(
        user_id=current_user.user_id,
        email=current_user.email,
        db=db,
    )
    return _access_service.check(user=current_user, tier=user.access_tier, resource=resource)
