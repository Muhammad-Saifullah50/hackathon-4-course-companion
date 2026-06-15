from typing import cast

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.engine import open_db_session
from src.models.access import AccessStatus, AccessTier
from src.models.users import AuthenticatedUser
from src.services.users import UserService

FREE_CHAPTER_LIMIT = 3
PAID_TIERS = frozenset({"premium", "pro", "team"})
TIER_ORDER: dict[str, int] = {"free": 0, "premium": 1, "pro": 2, "team": 3}
_user_service = UserService()


def normalize_tier(tier: str) -> AccessTier:
    return cast(AccessTier, tier) if tier in TIER_ORDER else "free"


def has_paid_access(tier: str) -> bool:
    return normalize_tier(tier) in PAID_TIERS


def can_access_chapter(tier: str, chapter_order: int) -> bool:
    return has_paid_access(tier) or chapter_order <= FREE_CHAPTER_LIMIT


async def resolve_access_tier(
    current_user: AuthenticatedUser | None,
    db: AsyncSession | None = None,
) -> AccessTier:
    if current_user is None:
        return "free"
    if db is not None:
        user = await _user_service.get_or_create(
            current_user.user_id, current_user.email, db
        )
        return normalize_tier(user.access_tier)
    async with open_db_session() as session:
        user = await _user_service.get_or_create(
            current_user.user_id, current_user.email, session
        )
    return normalize_tier(user.access_tier)


def require_paid_access(tier: str, resource: str) -> None:
    if has_paid_access(tier):
        return
    raise HTTPException(
        status_code=403,
        detail={
            "code": "upgrade_required",
            "resource": resource,
            "required_tier": "premium",
        },
    )


def require_chapter_access(tier: str, chapter_order: int, resource: str) -> None:
    if can_access_chapter(tier, chapter_order):
        return
    raise HTTPException(
        status_code=403,
        detail={
            "code": "upgrade_required",
            "resource": resource,
            "required_tier": "premium",
        },
    )


class AccessService:
    def check(
        self,
        user: AuthenticatedUser,
        tier: str,
        resource: str | None,
    ) -> AccessStatus:
        normalized = normalize_tier(tier)
        allowed = not resource or resource != "premium" or has_paid_access(normalized)
        return AccessStatus(tier=normalized, resource=resource, allowed=allowed)
