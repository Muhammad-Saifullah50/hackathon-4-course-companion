from pydantic import BaseModel


class AccessStatus(BaseModel):
    tier: str
    resource: str | None
    allowed: bool
