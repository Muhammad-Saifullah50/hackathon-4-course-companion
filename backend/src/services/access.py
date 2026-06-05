from src.models.access import AccessStatus
from src.models.users import AuthenticatedUser


class AccessService:
    def check(self, user: AuthenticatedUser, tier: str, resource: str | None) -> AccessStatus:
        allowed = tier == "premium" or resource != "premium"
        return AccessStatus(tier=tier, resource=resource, allowed=allowed)
