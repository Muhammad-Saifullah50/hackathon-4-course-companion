# Feature Specification: Four-Tier Stripe Monetization

**Feature Branch**: `006-stripe-subscriptions`  
**Created**: 2026-06-15  
**Status**: Implemented  
**Input**: Correct Feature 006 to use Free, Premium, Pro, and Team tiers.

## Tier Catalog

| Tier | Monthly price | Launch state | Included now |
|---|---:|---|---|
| Free | $0 | Active | First 3 chapters, basic quizzes, ChatGPT tutoring |
| Premium | $9.99 one time | Purchasable | All chapters, all quizzes, progress tracking |
| Pro | $19.99 one time | Coming soon | Premium; Adaptive Path and LLM Assessments are future work |
| Team | $49.99 one time | Coming soon | Pro; analytics and multiple-seat workflows are future work; 5 seats planned |

All prices are one-time USD purchases. There are no subscriptions or trials.

## User Stories

### US1 - Browse Plans

Every visitor can view the exact four-tier catalog. Free is active, Premium has
an upgrade action, and Pro and Team are visibly disabled as Coming soon.

### US2 - Purchase Premium

An authenticated Free user can send `{"plan":"premium"}` to
`POST /billing/checkout` and receive a Stripe-hosted Checkout URL. Pro and Team
requests return 409 and never create a Checkout Session.

### US3 - Synchronize Entitlements

Verified successful Stripe Checkout webhooks grant the purchased tier.
Incomplete or unpaid Checkout Sessions do not grant access.

### US4 - Enforce Course Access

Anonymous and Free learners receive the full chapter catalog, with manifest
chapters 1-3 accessible and later chapters marked `required_tier=premium`.
Direct chapter and quiz access is rejected server-side when locked. Premium,
Pro, and Team unlock all current chapters and quizzes.

### US5 - Gate Saved Progress

Progress reads, completion writes, streaks, and persisted quiz scores require
Premium or above. Free learners may take eligible quizzes, but results are not
saved. Existing progress remains stored while inaccessible.

### US6 - Share Rules Across Surfaces

The FastAPI backend owns entitlements. The Next.js and ChatGPT MCP interfaces
show locked chapters, suppress locked search excerpts, and present upgrade
guidance without duplicating access authority.

## Functional Requirements

- **FR-001**: `GET /billing/plans` MUST return the exact public tier catalog.
- **FR-002**: Checkout MUST accept a typed plan and enable only Premium.
- **FR-003**: Premium Checkout MUST use `STRIPE_PREMIUM_PRICE_ID`.
- **FR-004**: Premium Checkout MUST use one-time payment mode.
- **FR-005**: Signed, idempotent webhooks MUST be the sole billing authority.
- **FR-006**: Price IDs MUST map explicitly to tiers; unknown IDs grant Free.
- **FR-007**: Older events MUST NOT overwrite newer payment state.
- **FR-008**: Manifest order MUST determine the three Free chapters.
- **FR-009**: Locked content and quizzes MUST return structured 403 responses.
- **FR-010**: Search MUST not expose excerpts from locked chapters.
- **FR-011**: Progress APIs MUST require Premium, Pro, or Team.
- **FR-012**: Stripe secrets and card data MUST never reach browser storage.
- **FR-013**: Feature 006 MUST make zero LLM calls.

## Success Criteria

- Anonymous and Free access exactly manifest chapters and quizzes 1-3.
- Every paid tier unlocks all existing deterministic course features.
- Premium Checkout selects only the configured $9.99 one-time Price.
- Pro and Team Checkout attempts return unavailable.
- Duplicate, out-of-order, unknown-price, and terminal-state webhook tests pass.
- Web and MCP surfaces render locked states without leaking protected content.

## Future Scope

Adaptive Path, LLM Assessments, team analytics, invitations, membership
management, and seat billing are not implemented by Feature 006.

## Assumptions

- Team will eventually include one owner plus four members.
- Stripe Dashboard configuration controls products, tax, payment methods, and
  Customer Portal behavior.
- An ADR for the four-tier entitlement architecture is proposed but MUST NOT be
  created without explicit user approval.
