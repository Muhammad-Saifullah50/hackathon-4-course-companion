from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
import stripe

from src.db.models import BillingCustomer, StripeWebhookEvent, User
from src.services.billing import (
    BillingEvent,
    BillingConflictError,
    BillingService,
    PLAN_CATALOG,
    _from_timestamp,
    _parse_event,
    tier_for_subscription,
)
from src.services.access import can_access_chapter, has_paid_access


def test_plan_catalog_matches_four_tier_offer() -> None:
    assert [
        (
            plan.tier,
            plan.price_cents,
            plan.interval,
            plan.available,
            plan.seats_included,
        )
        for plan in PLAN_CATALOG
    ] == [
        ("free", 0, None, True, None),
        ("premium", 999, None, True, None),
        ("pro", 1999, None, False, None),
        ("team", 4999, None, False, 5),
    ]


@pytest.mark.parametrize("tier", ["premium", "pro", "team"])
def test_all_paid_tiers_unlock_full_catalog(tier: str) -> None:
    assert has_paid_access(tier) is True
    assert can_access_chapter(tier, 99) is True


def test_free_access_is_limited_by_manifest_order() -> None:
    assert [can_access_chapter("free", order) for order in range(1, 6)] == [
        True,
        True,
        True,
        False,
        False,
    ]


@pytest.mark.parametrize("plan", ["pro", "team"])
async def test_unavailable_checkout_is_rejected_before_stripe_configuration(
    plan: str,
) -> None:
    with pytest.raises(BillingConflictError, match="coming soon"):
        await BillingService().create_checkout(
            User(id="user_123", email="student@example.com"),
            plan,
            AsyncMock(),
        )


async def test_premium_checkout_uses_configured_price(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "src.services.billing.settings.stripe_secret_key", "sk_test_example"
    )
    monkeypatch.setattr(
        "src.services.billing.settings.stripe_premium_price_id",
        "price_premium_999",
    )
    create = MagicMock(
        return_value=SimpleNamespace(url="https://checkout.stripe.test/session")
    )
    monkeypatch.setattr(
        "src.services.billing.stripe.checkout.Session.create", create
    )
    db = AsyncMock()
    db.get.return_value = BillingCustomer(user_id="user_123")

    await BillingService().create_checkout(
        User(id="user_123", email="student@example.com"),
        "premium",
        db,
    )

    assert create.call_args.kwargs["line_items"] == [
        {"price": "price_premium_999", "quantity": 1}
    ]
    assert create.call_args.kwargs["mode"] == "payment"
    assert create.call_args.kwargs["customer_creation"] == "always"
    assert "subscription_data" not in create.call_args.kwargs


@pytest.mark.parametrize("status", ["active", "trialing", "past_due"])
def test_paid_or_recovering_status_uses_price_mapping(
    status: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        "src.services.billing.settings.stripe_premium_price_id",
        "price_premium",
    )
    assert tier_for_subscription(status, "price_premium") == "premium"


@pytest.mark.parametrize(
    "status",
    [None, "incomplete", "incomplete_expired", "canceled", "unpaid", "paused"],
)
def test_inactive_status_grants_free(status: str | None) -> None:
    assert tier_for_subscription(status, "price_premium") == "free"


def test_unknown_price_never_grants_paid_access() -> None:
    assert tier_for_subscription("active", "price_unknown") == "free"


@pytest.mark.parametrize(
    ("price_setting", "price_id", "expected"),
    [
        ("stripe_premium_price_id", "price_premium", "premium"),
        ("stripe_pro_price_id", "price_pro", "pro"),
        ("stripe_team_price_id", "price_team", "team"),
    ],
)
def test_known_prices_map_to_tiers(
    price_setting: str,
    price_id: str,
    expected: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        f"src.services.billing.settings.{price_setting}", price_id
    )
    assert tier_for_subscription("active", price_id) == expected


def test_parse_subscription_event_extracts_entitlement_fields() -> None:
    event = _parse_event(
        {
            "id": "evt_123",
            "type": "customer.subscription.updated",
            "created": 1_750_000_000,
            "data": {
                "object": {
                    "id": "sub_123",
                    "customer": "cus_123",
                    "status": "active",
                    "current_period_end": 1_760_000_000,
                    "cancel_at_period_end": True,
                    "metadata": {"user_id": "user_123"},
                    "items": {"data": [{"price": {"id": "price_123"}}]},
                }
            },
        }
    )

    assert event.event_id == "evt_123"
    assert event.user_id == "user_123"
    assert event.customer_id == "cus_123"
    assert event.subscription_id == "sub_123"
    assert event.price_id == "price_123"
    assert event.status == "active"
    assert event.cancel_at_period_end is True


def test_parse_checkout_event_extracts_one_time_payment_fields() -> None:
    event = _parse_event(
        {
            "id": "evt_checkout",
            "type": "checkout.session.completed",
            "created": 1_750_000_000,
            "data": {
                "object": {
                    "client_reference_id": "user_123",
                    "customer": "cus_123",
                    "payment_status": "paid",
                    "metadata": {"plan": "premium"},
                }
            },
        }
    )

    assert event.user_id == "user_123"
    assert event.customer_id == "cus_123"
    assert event.payment_status == "paid"
    assert event.plan == "premium"


def test_construct_event_parses_real_stripe_event(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "src.services.billing.settings.stripe_webhook_secret", "whsec_test"
    )
    stripe_event = stripe.Event.construct_from(
        {
            "id": "evt_123",
            "type": "customer.subscription.updated",
            "created": 1_750_000_000,
            "data": {
                "object": {
                    "id": "sub_123",
                    "customer": "cus_123",
                    "status": "active",
                    "metadata": {"user_id": "user_123"},
                    "items": {"data": [{"price": {"id": "price_123"}}]},
                }
            },
        },
        None,
    )
    construct_event = MagicMock(return_value=stripe_event)
    monkeypatch.setattr(
        "src.services.billing.stripe.Webhook.construct_event", construct_event
    )

    event = BillingService().construct_event(b"payload", "signature")

    construct_event.assert_called_once_with(
        b"payload", "signature", "whsec_test"
    )
    assert event.event_id == "evt_123"
    assert event.user_id == "user_123"
    assert event.subscription_id == "sub_123"
    assert event.price_id == "price_123"


async def test_paid_checkout_grants_lifetime_premium(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "src.services.billing.settings.stripe_premium_price_id",
        "price_premium",
    )
    billing = BillingCustomer(user_id="user_123")
    user = User(id="user_123", email="student@example.com", access_tier="free")
    db = AsyncMock()
    db.get.side_effect = [billing, user]
    event = BillingEvent(
        event_id="evt_checkout",
        event_type="checkout.session.completed",
        created=10,
        user_id="user_123",
        customer_id="cus_123",
        subscription_id=None,
        price_id=None,
        status="complete",
        current_period_end=None,
        cancel_at_period_end=False,
        payment_status="paid",
        plan="premium",
    )

    await BillingService()._apply_event(event, db)

    assert user.access_tier == "premium"
    assert billing.plan_tier == "premium"
    assert billing.subscription_status == "paid"
    assert billing.current_period_end is None


async def test_unpaid_checkout_does_not_grant_premium() -> None:
    billing = BillingCustomer(user_id="user_123")
    db = AsyncMock()
    db.get.return_value = billing
    event = BillingEvent(
        event_id="evt_checkout",
        event_type="checkout.session.completed",
        created=10,
        user_id="user_123",
        customer_id="cus_123",
        subscription_id=None,
        price_id=None,
        status="complete",
        current_period_end=None,
        cancel_at_period_end=False,
        payment_status="unpaid",
        plan="premium",
    )

    await BillingService()._apply_event(event, db)

    assert billing.plan_tier == "free"
    assert billing.subscription_status is None


def test_timestamp_conversion_is_utc() -> None:
    value = _from_timestamp(0)
    assert value == datetime(1970, 1, 1, tzinfo=timezone.utc)


async def test_duplicate_webhook_event_has_no_side_effects() -> None:
    db = AsyncMock()
    db.get.return_value = StripeWebhookEvent(
        event_id="evt_duplicate",
        event_type="customer.subscription.updated",
        event_created=1,
    )
    event = BillingEvent(
        event_id="evt_duplicate",
        event_type="customer.subscription.updated",
        created=1,
        user_id="user_123",
        customer_id="cus_123",
        subscription_id="sub_123",
        price_id="price_123",
        status="active",
        current_period_end=None,
        cancel_at_period_end=False,
    )

    response = await BillingService().process_event(event, db)

    assert response.duplicate is True
    db.commit.assert_not_awaited()


async def test_older_subscription_event_does_not_overwrite_newer_state() -> None:
    billing = BillingCustomer(
        user_id="user_123",
        subscription_status="active",
        last_event_created=20,
    )
    db = AsyncMock()
    db.get.return_value = billing
    event = BillingEvent(
        event_id="evt_old",
        event_type="customer.subscription.updated",
        created=10,
        user_id="user_123",
        customer_id="cus_old",
        subscription_id="sub_old",
        price_id="price_old",
        status="canceled",
        current_period_end=None,
        cancel_at_period_end=False,
    )

    await BillingService()._apply_event(event, db)

    assert billing.subscription_status == "active"
    assert billing.last_event_created == 20


async def test_active_subscription_event_updates_entitlement(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "src.services.billing.settings.stripe_premium_price_id",
        "price_123",
    )
    billing = BillingCustomer(user_id="user_123", last_event_created=0)
    user = User(id="user_123", email="student@example.com", access_tier="free")
    db = AsyncMock()
    db.get.side_effect = [billing, user]
    event = BillingEvent(
        event_id="evt_active",
        event_type="customer.subscription.updated",
        created=10,
        user_id="user_123",
        customer_id="cus_123",
        subscription_id="sub_123",
        price_id="price_123",
        status="active",
        current_period_end=1_760_000_000,
        cancel_at_period_end=False,
    )

    await BillingService()._apply_event(event, db)

    assert user.access_tier == "premium"
    assert billing.subscription_status == "active"
    assert billing.stripe_customer_id == "cus_123"
