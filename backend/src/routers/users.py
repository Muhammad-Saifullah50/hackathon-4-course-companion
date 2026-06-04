from fastapi import APIRouter

from src.core.dependencies import CurrentUserDep, DbSessionDep
from src.models.users import UserProfile
from src.services.users import UserService

router = APIRouter()
_user_service = UserService()


@router.get("/me", response_model=UserProfile)
async def get_users_me(current_user: CurrentUserDep, db: DbSessionDep) -> UserProfile:
    user = await _user_service.get_or_create(
        user_id=current_user.user_id,
        email=current_user.email,
        db=db,
    )
    return UserProfile.model_validate(user)
