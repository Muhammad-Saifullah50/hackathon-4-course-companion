---
id: 0002
title: Correct Stripe to four-tier monetization
stage: green
date: 2026-06-15
surface: codex
model: GPT-5
feature: 006-stripe-subscriptions
branch: 006-stripe-subscriptions
user: saifullah
command: implement-approved-plan
labels: [stripe, billing, entitlements, pricing, correction]
links:
  spec: specs/006-stripe-subscriptions/spec.md
  adr: proposed
files:
  - specs/006-stripe-subscriptions/
  - backend/
  - web-app/
  - chatgpt-app/
tests:
  - backend pytest
  - MCP pytest
  - web Vitest and TypeScript
  - widget Vitest and TypeScript
---

## Prompt

Replace the incorrect single-Premium implementation with Free, Premium, Pro,
and Team tiers, enabling only $9.99/month Premium checkout and enforcing shared
course and progress entitlements.

## Outcome

- Added the exact public plan catalog and explicit Stripe Price-to-tier mapping.
- Enforced first-three-chapter Free access and paid progress in FastAPI.
- Added locked and upgrade states to the web app and ChatGPT MCP widgets.
- Kept Pro and Team visible as Coming soon and documented future capabilities.
- Proposed an entitlement ADR without creating it, pending explicit approval.
