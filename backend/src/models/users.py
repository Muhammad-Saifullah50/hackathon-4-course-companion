from datetime import datetime

from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    user_id: str
    email: str
    expires_at: datetime | None = None


class AuthSession(BaseModel):
    user_id: str
    email: str
    expires_at: datetime | None


class UserProfile(BaseModel):
    id: str
    email: str
    access_tier: str
    created_at: datetime

    model_config = {"from_attributes": True}
