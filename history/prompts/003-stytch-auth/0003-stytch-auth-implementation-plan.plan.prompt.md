---
id: "0003"
title: stytch-auth-implementation-plan
stage: plan
date: 2026-06-04
surface: claude-code
model: claude-sonnet-4-6
feature: 003-stytch-auth
branch: 003-stytch-auth
user: Muhammad
command: /sp.plan
labels: [auth, stytch, oauth, mcp, sqlalchemy, jwt]
links:
  spec: specs/003-stytch-auth/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/003-stytch-auth/plan.md
  - specs/003-stytch-auth/research.md
  - specs/003-stytch-auth/data-model.md
  - specs/003-stytch-auth/quickstart.md
  - specs/003-stytch-auth/contracts/backend-openapi.yaml
  - specs/003-stytch-auth/contracts/mcp-server-endpoints.yaml
tests:
  - backend/tests/unit/test_auth.py (planned)
  - backend/tests/integration/test_users_me.py (planned)
  - mcp-server/tests/test_well_known.py (planned)
  - mcp-server/tests/test_auth_middleware.py (planned)
---

## Prompt

User invoked `/sp.plan` on branch `003-stytch-auth` for the Stytch OAuth 2.1 authentication feature. Spec describes: MCP authorization spec with Stytch as identity provider; FastAPI JWT verification dependency (`get_current_user`); protected resource metadata endpoint on MCP server; Stytch tenant setup; token verification middleware; and `/users/me` endpoint. Phase 1 — zero LLM calls.

## Response snapshot

Executed full `/sp.plan` workflow:

**Phase 0 Research** (3 parallel agents + WebFetch/WebSearch):
- Stytch Python SDK: `stytch.Client` initialized once at startup, JWKS cached automatically, `client.sessions.authenticate_jwt(session_jwt=token)` for local verification. SDK is synchronous — FastAPI runs it in thread pool.
- MCP Auth Spec (June 2025 / RFC 9728): `/.well-known/oauth-protected-resource` document requires `resource` + `authorization_servers` fields. 401 responses need `WWW-Authenticate: Bearer realm="...", resource_metadata=".../.well-known/oauth-protected-resource"`. Stytch AS discovery at `https://api.stytch.com/v1/public/{project_id}/.well-known/oauth-authorization-server`.
- SQLAlchemy 2.0 async: `DeclarativeBase` + `Mapped[Type]` + `mapped_column()`, `async_sessionmaker`, Neon requires `sslmode=require`, upsert via `pg_insert().on_conflict_do_nothing()`.

**Phase 1 Design**:
- User entity: `id` (Stytch user_id as PK), `email`, `created_at`, `access_tier="free"`
- Backend additions: `src/core/auth.py` (StytchVerifier singleton + `get_current_user`), `src/db/` (engine + User ORM), `src/services/users.py` (get_or_create), `src/routers/users.py` (GET /users/me), Alembic migrations
- MCP server: new `mcp-server/` directory, FastMCP process with `/.well-known/oauth-protected-resource` endpoint + OAuth 401 middleware
- Constitution check: all gates pass — zero LLM imports, pydantic-settings for config, repository pattern for DB, no raw SQL

**Artifacts generated**: research.md, data-model.md, contracts/backend-openapi.yaml, contracts/mcp-server-endpoints.yaml, quickstart.md, plan.md filled

## Outcome

- ✅ Impact: Complete implementation plan for Stytch auth covering backend JWT middleware, user DB provisioning, /users/me endpoint, and standalone MCP server with OAuth discovery
- 🧪 Tests: 4 test files planned (unit auth, integration users/me, MCP well-known, MCP middleware)
- 📁 Files: 6 new design artifacts under specs/003-stytch-auth/
- 🔁 Next prompts: `/sp.tasks` to generate task breakdown; then `/sp.implement`
- 🧠 Reflection: Key open question is whether Stytch exposes RFC 8414 AS metadata at the expected URL — should be verified before MCP server implementation task

## Evaluation notes (flywheel)

- Failure modes observed: Subagents couldn't use WebSearch (permissions); mitigated by using WebFetch directly in main context
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Pre-grant WebSearch to research subagents in settings to avoid fallback overhead
