from typing import Literal

from pydantic import BaseModel

AccessTier = Literal["free", "premium", "pro", "team"]


class AccessStatus(BaseModel):
    tier: AccessTier
    resource: str | None
    allowed: bool
