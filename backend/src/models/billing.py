from datetime import datetime
from typing import Literal

from pydantic import BaseModel, HttpUrl

from src.models.access import AccessTier


class CheckoutSessionRequest(BaseModel):
    plan: Literal["premium", "pro", "team"]


class PlanCatalogItem(BaseModel):
    tier: AccessTier
    name: str
    price_cents: int
    currency: Literal["usd"] = "usd"
    interval: Literal["month"] | None
    features: list[str]
    available: bool
    seats_included: int | None = None


class CheckoutSessionResponse(BaseModel):
    url: HttpUrl


class PortalSessionResponse(BaseModel):
    url: HttpUrl


class BillingStatus(BaseModel):
    tier: AccessTier
    subscription_status: str | None
    current_period_end: datetime | None
    cancel_at_period_end: bool


class WebhookResponse(BaseModel):
    received: bool = True
    duplicate: bool = False
