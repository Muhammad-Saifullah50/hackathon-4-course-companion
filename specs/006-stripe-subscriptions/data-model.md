# Data Model: Four-Tier Stripe Monetization

## Plan Catalog

Typed application configuration containing tier, display name, monthly USD
price in cents, features, availability, and optional included seats.

## BillingCustomer

| Field | Purpose |
|---|---|
| `user_id` | One-to-one key to `users` |
| `stripe_customer_id` | Customer Portal and Checkout reuse |
| `stripe_subscription_id` | Current subscription |
| `stripe_price_id` | Verified subscription Price |
| `plan_tier` | `free`, `premium`, `pro`, or `team` |
| `subscription_status` | Latest Stripe status |
| `current_period_end` | Billing period boundary |
| `cancel_at_period_end` | Retain access while subscription remains active |
| `last_event_created` | Reject out-of-order state changes |

## StripeWebhookEvent

Stores unique event ID, type, Stripe creation time, and processing time for
idempotency and audit.

## Entitlement Rules

- Known Price plus `active`, `trialing`, or `past_due`: mapped paid tier.
- Unknown Price or any other status: Free.
- `cancel_at_period_end=true` does not revoke an otherwise active subscription.
- Chapter access uses manifest order, not hardcoded slugs.
