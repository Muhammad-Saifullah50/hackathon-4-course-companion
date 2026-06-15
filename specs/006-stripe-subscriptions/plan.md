# Implementation Plan: Four-Tier Stripe Monetization

**Branch**: `006-stripe-subscriptions` | **Date**: 2026-06-15

## Architecture

Keep Stripe-hosted Checkout and Customer Portal. Persist one billing record per
user plus processed webhook IDs. Add an explicit plan tier and map verified
Price IDs to entitlements. Keep the shared FastAPI backend authoritative for
course, quiz, search, and progress access.

## Delivery

1. Define typed Free, Premium, Pro, and Team catalog entries.
2. Accept a checkout plan; permit Premium and reject Pro/Team as Coming soon.
3. Persist `plan_tier` and synchronize `users.access_tier` from webhooks.
4. Derive chapter access from manifest order and gate content server-side.
5. Gate saved progress at Premium or above.
6. Add locked and upgrade states to Next.js and MCP widgets.
7. Verify billing mapping, access rules, UI contracts, and builds.

## Constitution Check

| Gate | Result |
|---|---|
| Zero backend LLM | Pass |
| Shared backend authority | Pass |
| Typed API boundaries | Pass |
| SQLAlchemy only | Pass |
| Settings-managed secrets | Pass |
| Server-side access checks | Pass |
| ADR approval required | Proposal only; no ADR created |

## Scope Boundary

Feature 006 exposes Pro and Team commercially but does not implement their
exclusive Adaptive Path, LLM Assessment, analytics, invitation, membership, or
seat-management capabilities.
