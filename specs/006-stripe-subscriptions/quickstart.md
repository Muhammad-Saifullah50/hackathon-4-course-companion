# Quickstart: Four-Tier Stripe Monetization

Create monthly USD Stripe Prices for Premium ($9.99), Pro ($19.99), and Team
($49.99). Only Premium Checkout is enabled.

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
STRIPE_SUCCESS_URL=http://localhost:3000/account?billing=success
STRIPE_CANCEL_URL=http://localhost:3000/account?billing=canceled
STRIPE_PORTAL_RETURN_URL=http://localhost:3000/account
```

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn src.main:app --reload
```

```bash
stripe listen \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted \
  --forward-to localhost:8000/billing/webhooks/stripe
```

Verify Premium Checkout with `{"plan":"premium"}`. Pro and Team requests should
return 409 until their exclusive capabilities launch.
