from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Mapping, cast

import stripe
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.db.models import BillingCustomer, StripeWebhookEvent, User
from src.models.billing import (
    BillingStatus,
    CheckoutSessionResponse,
    PlanCatalogItem,
    PortalSessionResponse,
    WebhookResponse,
)
from src.models.access import AccessTier
from src.services.access import normalize_tier

PREMIUM_STATUSES = frozenset({"active", "trialing", "past_due"})
PLAN_CATALOG = [
    PlanCatalogItem(
        tier="free",
        name="Free",
        price_cents=0,
        interval=None,
        features=["First 3 chapters", "Basic quizzes", "ChatGPT tutoring"],
        available=True,
    ),
    PlanCatalogItem(
        tier="premium",
        name="Premium",
        price_cents=999,
        interval=None,
        features=["All chapters", "All quizzes", "Progress tracking"],
        available=True,
    ),
    PlanCatalogItem(
        tier="pro",
        name="Pro",
        price_cents=1999,
        interval=None,
        features=["Premium features", "Adaptive Path", "LLM Assessments"],
        available=False,
    ),
    PlanCatalogItem(
        tier="team",
        name="Team",
        price_cents=4999,
        interval=None,
        features=["Pro features", "Analytics", "Multiple seats"],
        available=False,
        seats_included=5,
    ),
]


class BillingConfigurationError(RuntimeError):
    pass


class BillingConflictError(RuntimeError):
    pass


@dataclass(frozen=True)
class BillingEvent:
    event_id: str
    event_type: str
    created: int
    user_id: str | None
    customer_id: str | None
    subscription_id: str | None
    price_id: str | None
    status: str | None
    current_period_end: int | None
    cancel_at_period_end: bool
    payment_status: str | None = None
    plan: str | None = None


def tier_for_subscription(
    status: str | None, price_id: str | None
) -> AccessTier:
    if status not in PREMIUM_STATUSES:
        return "free"
    return _tier_for_price_id(price_id)


def _tier_for_price_id(price_id: str | None) -> AccessTier:
    mapping = {
        settings.stripe_premium_price_id: "premium",
        settings.stripe_pro_price_id: "pro",
        settings.stripe_team_price_id: "team",
    }
    if not price_id or not mapping.get(price_id):
        return "free"
    return normalize_tier(mapping[price_id])


class BillingService:
    def _configure_stripe(self) -> None:
        if not settings.stripe_secret_key:
            raise BillingConfigurationError("Stripe billing is not configured")
        stripe.api_key = settings.stripe_secret_key

    async def create_checkout(
        self, user: User, plan: str, db: AsyncSession
    ) -> CheckoutSessionResponse:
        if plan != "premium":
            raise BillingConflictError(f"{plan.title()} is coming soon")
        self._configure_stripe()
        price_id = settings.stripe_premium_price_id
        if not price_id:
            raise BillingConfigurationError("Stripe Premium price is not configured")
        billing = await self._get_or_create_billing(user.id, db)
        params: dict[str, object] = {
            "mode": "payment",
            "line_items": [{"price": price_id, "quantity": 1}],
            "success_url": settings.stripe_success_url,
            "cancel_url": settings.stripe_cancel_url,
            "client_reference_id": user.id,
            "payment_intent_data": {
                "metadata": {"user_id": user.id, "plan": plan}
            },
            "metadata": {"user_id": user.id, "plan": plan},
        }
        if billing.stripe_customer_id:
            params["customer"] = billing.stripe_customer_id
        else:
            params["customer_email"] = user.email
            params["customer_creation"] = "always"
        session = stripe.checkout.Session.create(**params)
        url = cast(str | None, session.url)
        if not url:
            raise BillingConfigurationError("Stripe did not return a Checkout URL")
        return CheckoutSessionResponse(url=url)

    async def create_portal(
        self, user_id: str, db: AsyncSession
    ) -> PortalSessionResponse:
        self._configure_stripe()
        billing = await db.get(BillingCustomer, user_id)
        if billing is None or billing.stripe_customer_id is None:
            raise BillingConflictError("Subscribe before opening billing management")
        session = stripe.billing_portal.Session.create(
            customer=billing.stripe_customer_id,
            return_url=settings.stripe_portal_return_url,
        )
        url = cast(str | None, session.url)
        if not url:
            raise BillingConfigurationError("Stripe did not return a portal URL")
        return PortalSessionResponse(url=url)

    def construct_event(self, payload: bytes, signature: str) -> BillingEvent:
        if not settings.stripe_webhook_secret:
            raise BillingConfigurationError("Stripe webhook is not configured")
        event = stripe.Webhook.construct_event(
            payload, signature, settings.stripe_webhook_secret
        )
        return _parse_event(event.to_dict())

    async def process_event(
        self, event: BillingEvent, db: AsyncSession
    ) -> WebhookResponse:
        if await db.get(StripeWebhookEvent, event.event_id):
            return WebhookResponse(duplicate=True)
        try:
            await self._apply_event(event, db)
            db.add(
                StripeWebhookEvent(
                    event_id=event.event_id,
                    event_type=event.event_type,
                    event_created=event.created,
                )
            )
            await db.commit()
        except IntegrityError:
            await db.rollback()
            return WebhookResponse(duplicate=True)
        return WebhookResponse()

    async def get_status(self, user: User, db: AsyncSession) -> BillingStatus:
        billing = await db.get(BillingCustomer, user.id)
        return BillingStatus(
            tier=normalize_tier(user.access_tier),
            subscription_status=billing.subscription_status if billing else None,
            current_period_end=billing.current_period_end if billing else None,
            cancel_at_period_end=billing.cancel_at_period_end if billing else False,
        )

    async def _apply_event(self, event: BillingEvent, db: AsyncSession) -> None:
        if event.event_type in {
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded",
        }:
            await self._apply_checkout_payment(event, db)
            return
        if not event.event_type.startswith("customer.subscription."):
            return
        billing = await self._find_billing(event, db)
        if billing is None or event.created < billing.last_event_created:
            return
        billing.stripe_customer_id = event.customer_id or billing.stripe_customer_id
        billing.stripe_subscription_id = event.subscription_id
        billing.stripe_price_id = event.price_id
        billing.plan_tier = tier_for_subscription(event.status, event.price_id)
        billing.subscription_status = event.status
        billing.current_period_end = _from_timestamp(event.current_period_end)
        billing.cancel_at_period_end = event.cancel_at_period_end
        billing.last_event_created = event.created
        user = await db.get(User, billing.user_id)
        if user:
            user.access_tier = billing.plan_tier

    async def _apply_checkout_payment(
        self, event: BillingEvent, db: AsyncSession
    ) -> None:
        if event.user_id is None:
            return
        billing = await self._get_or_create_billing(event.user_id, db)
        if event.created < billing.last_event_created:
            return
        billing.stripe_customer_id = event.customer_id or billing.stripe_customer_id
        billing.last_event_created = event.created
        if event.payment_status != "paid" or event.plan != "premium":
            return
        billing.stripe_price_id = settings.stripe_premium_price_id
        billing.plan_tier = "premium"
        billing.subscription_status = "paid"
        billing.current_period_end = None
        billing.cancel_at_period_end = False
        user = await db.get(User, event.user_id)
        if user:
            user.access_tier = "premium"

    async def _find_billing(
        self, event: BillingEvent, db: AsyncSession
    ) -> BillingCustomer | None:
        if event.user_id:
            return await self._get_or_create_billing(event.user_id, db)
        if not event.customer_id:
            return None
        result = await db.execute(
            select(BillingCustomer).where(
                BillingCustomer.stripe_customer_id == event.customer_id
            )
        )
        return result.scalar_one_or_none()

    async def _get_or_create_billing(
        self, user_id: str, db: AsyncSession
    ) -> BillingCustomer:
        billing = await db.get(BillingCustomer, user_id)
        if billing:
            return billing
        billing = BillingCustomer(user_id=user_id)
        db.add(billing)
        await db.flush()
        return billing


def _parse_event(event: Mapping[str, object]) -> BillingEvent:
    data = _mapping(event.get("data"))
    obj = _mapping(data.get("object"))
    metadata = _mapping(obj.get("metadata"))
    event_type = _string(event.get("type")) or ""
    subscription_id = _string(obj.get("subscription"))
    if event_type.startswith("customer.subscription."):
        subscription_id = _string(obj.get("id"))
    return BillingEvent(
        event_id=_string(event.get("id")) or "",
        event_type=event_type,
        created=_integer(event.get("created")) or 0,
        user_id=_string(obj.get("client_reference_id"))
        or _string(metadata.get("user_id")),
        customer_id=_string(obj.get("customer")),
        subscription_id=subscription_id,
        price_id=_subscription_price_id(obj),
        status=_string(obj.get("status")),
        current_period_end=_integer(obj.get("current_period_end")),
        cancel_at_period_end=obj.get("cancel_at_period_end") is True,
        payment_status=_string(obj.get("payment_status")),
        plan=_string(metadata.get("plan")),
    )


def _subscription_price_id(obj: Mapping[str, object]) -> str | None:
    items = _mapping(obj.get("items"))
    rows = items.get("data")
    if not isinstance(rows, list) or not rows:
        return None
    first = _mapping(rows[0])
    return _string(_mapping(first.get("price")).get("id"))


def _mapping(value: object) -> Mapping[str, object]:
    return cast(Mapping[str, object], value) if isinstance(value, Mapping) else {}


def _string(value: object) -> str | None:
    return value if isinstance(value, str) else None


def _integer(value: object) -> int | None:
    return value if isinstance(value, int) else None


def _from_timestamp(value: int | None) -> datetime | None:
    return datetime.fromtimestamp(value, timezone.utc) if value is not None else None
