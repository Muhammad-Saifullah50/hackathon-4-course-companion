# Research: Four-Tier Stripe Monetization

## Decisions

### Hosted payment surfaces

Use Stripe Checkout in subscription mode for Premium and Customer Portal for
cancellation, invoices, payment methods, and future plan changes. The
application never handles card data.

### Webhook-owned entitlement

Only signed subscription webhooks update access. Persist event IDs for retry
idempotency and Stripe event creation time to prevent older events from
overwriting newer state.

### Explicit Price mapping

Map separate configured Premium, Pro, and Team Price IDs to typed tiers.
Unknown prices grant no paid access. Premium alone is purchasable at launch;
Pro and Team Price settings support future activation without changing the
entitlement model.

### Subscription states

`active`, `trialing`, and `past_due` retain the mapped paid tier. `incomplete`,
`incomplete_expired`, `canceled`, `unpaid`, and `paused` are Free. Scheduling
an active subscription to cancel at period end retains access until Stripe
reports a terminal status.

### Shared content authority

The backend derives Free access from the first three entries in the R2
manifest. It returns lock metadata and rejects locked content directly so web
and MCP clients cannot bypass the same rule.

## Sources

- Stripe Build on Stripe with AI: https://docs.stripe.com/building-with-ai.md
- Stripe Checkout Sessions: https://docs.stripe.com/api/checkout/sessions/create
- Stripe Customer Portal: https://docs.stripe.com/customer-management/integrate-customer-portal.md
- Stripe Webhooks: https://docs.stripe.com/webhooks.md
- Stripe Subscription lifecycle: https://docs.stripe.com/billing/subscriptions/overview
