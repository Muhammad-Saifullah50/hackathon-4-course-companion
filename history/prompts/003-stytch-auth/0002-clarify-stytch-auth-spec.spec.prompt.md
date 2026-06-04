---
id: "0002"
title: clarify-stytch-auth-spec
stage: spec
date: 2026-06-03
surface: claude-code
model: claude-sonnet-4-6
feature: 003-stytch-auth
branch: 003-stytch-auth
user: Muhammad
command: /sp.clarify
labels: [clarification, auth, stytch, mcp, jwt]
links:
  spec: specs/003-stytch-auth/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/003-stytch-auth/spec.md
tests: []
---

## Prompt

Run `/sp.clarify` on the active feature spec for `003-stytch-auth` (Stytch OAuth 2.1 authentication for ChatGPT MCP server and web frontend).

## Response snapshot

Ran structured ambiguity scan across 10 taxonomy categories. Asked and answered 5 clarifying questions, integrating each answer incrementally into the spec:

1. **Token verification method** → Local JWT verification via cached Stytch JWKS (no per-request Stytch API call).
2. **Stytch Python SDK vs raw HTTP** → Stytch Python SDK (`stytch` package).
3. **MCP server architecture** → Separate process from FastAPI backend; MCP server calls backend internally.
4. **Stytch unavailability handling** → Stale JWKS cache for up to 1 hour after refresh failure before failing closed.
5. **Token refresh responsibility** → Client-side only (ChatGPT / web frontend); backend has no refresh endpoint.

Added `## Clarifications` section with all 5 Q→A records, updated FR-004, Key Entities, User Story acceptance scenarios, and added a new `## Non-Functional Requirements` section with NFR-001–003.

## Outcome

- ✅ Impact: Resolved 5 high-impact architectural ambiguities; spec is now ready for `/sp.plan`
- 🧪 Tests: No tests written (spec phase)
- 📁 Files: specs/003-stytch-auth/spec.md
- 🔁 Next prompts: /sp.plan
- 🧠 Reflection: MCP server being a separate process (not same FastAPI app) was the most surprising answer — it meaningfully changes the deployment and auth propagation design.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a
