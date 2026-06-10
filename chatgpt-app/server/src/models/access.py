from pydantic import BaseModel


class AccessStatusPanel(BaseModel):
    tier: str
    resource: str | None = None
    allowed: bool
    upgrade_url: str | None = None
