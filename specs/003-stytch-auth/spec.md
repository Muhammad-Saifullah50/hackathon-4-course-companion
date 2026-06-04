# Feature Specification: Stytch Authentication

**Feature Branch**: `003-stytch-auth`  
**Created**: 2026-06-03  
**Status**: Draft  
**Scope**: Backend API only — MCP server auth deferred to the ChatGPT MCP feature  
**Input**: User description: "003-auth: Stytch OAuth 2.1 authentication for the FastAPI backend. FastAPI JWT verification dependency (get_current_user) used by all authenticated routes. Covers: Stytch tenant setup, token verification middleware, and /users/me endpoint. Phase 1 - zero LLM calls."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Backend Identifies User from Token (Priority: P1)

On every request to a protected backend endpoint (from either ChatGPT or the web frontend), the backend extracts the user's identity from the token without the caller needing to pass a user ID explicitly. Any route that needs to know "who is this user?" uses this mechanism.

**Why this priority**: All user-scoped features (progress, streaks, access tiers) depend on knowing who the caller is. This is the shared building block.

**Independent Test**: Call `GET /users/me` with a valid Stytch token in the `Authorization` header. Confirm it returns the authenticated user's profile. Call without a token — confirm `401` is returned.

**Acceptance Scenarios**:

1. **Given** a valid token in the `Authorization: Bearer` header, **When** any protected endpoint is called, **Then** the user's identity is resolved and the request proceeds.
2. **Given** a missing or malformed token, **When** a protected endpoint is called, **Then** a `401 Unauthorized` response is returned immediately.
3. **Given** a structurally valid but expired token, **When** a protected endpoint is called, **Then** a `401 Unauthorized` response is returned.
4. **Given** a token from a different application or issuer, **When** a protected endpoint is called, **Then** a `401 Unauthorized` response is returned.

---

### User Story 2 - Web Frontend User Authenticates (Priority: P2)

A student visiting the web app (Phase 3) signs in via Stytch's hosted login UI. After login, their session token is stored client-side and sent with every API request to the backend. The backend verifies the same token using the same mechanism as the ChatGPT path.

**Why this priority**: Phase 3 is the web frontend. The backend auth mechanism must support both consumers without duplication.

**Independent Test**: Using a browser, complete Stytch login on the web app. Call `GET /users/me` from the frontend with the resulting token — confirm it returns the user's profile.

**Acceptance Scenarios**:

1. **Given** a student visits the web app unauthenticated, **When** they click Sign In, **Then** they are redirected to Stytch's login UI.
2. **Given** a student completes Stytch login, **When** the web app receives the session token, **Then** subsequent API calls to the backend succeed with that token.
3. **Given** a student's web session expires, **When** they make an API call, **Then** the backend returns `401` and the web app redirects to login.

---

### Edge Cases

- ~~What happens when Stytch's token verification service is temporarily unavailable?~~ → Resolved: backend continues verifying using stale JWKS cache for up to 1 hour; requests are not rejected during brief Stytch outages.
- How does the system handle a user who exists in Stytch but has no record in the application database yet (first login)?
- What happens when ChatGPT sends a token with insufficient scopes for the requested tool?
- How does the system behave if the same user authenticates via both ChatGPT and the web app simultaneously?

---

## Clarifications

### Session 2026-06-03

- Q: How should the backend verify Stytch tokens on each request? → A: Local JWT verification — fetch Stytch JWKS at startup, cache public keys, verify signature/claims locally on every request.
- Q: Should the backend use the Stytch Python SDK or raw HTTP for JWKS/JWT? → A: Stytch Python SDK (`stytch` package).
- Q: Is the MCP server the same FastAPI application as the backend, or a separate process? → A: Separate process — MCP server is a standalone service that calls the FastAPI backend internally.
- Q: When Stytch's JWKS endpoint is unreachable, should the backend use stale cached keys or reject all requests? → A: Stale cache — continue using last successfully fetched keys for up to 1 hour after a refresh failure.
- Q: Who is responsible for token refresh when a token expires? → A: Client-side only — backend returns `401` on expiry; ChatGPT and web frontend handle refresh via their respective Stytch flows. Backend has no refresh endpoint.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend MUST verify every inbound token locally using Stytch's published JWKS (JSON Web Key Set), fetched at startup and cached in-process. Verification checks signature, issuer, audience, and expiry on every request without a remote Stytch API call per request.
- **FR-002**: The backend MUST expose a `GET /users/me` endpoint that returns the authenticated user's profile (id, email) when a valid token is presented.
- **FR-003**: The backend MUST create a user record on first successful authentication if no record exists for that identity (first-login provisioning).
- **FR-004**: All protected backend endpoints MUST reject requests without a valid token with `401 Unauthorized` before any business logic executes.
- **FR-005**: Token verification MUST be a shared, reusable dependency consumed by all protected routes — not duplicated per route.
- **FR-006**: The backend MUST support tokens issued by the same Stytch tenant from any client (ChatGPT, web frontend) — no client-specific code paths.
- **FR-007**: No secrets, credentials, or signing keys MUST be hard-coded — all loaded from environment configuration.

### Key Entities

- **User**: Represents an authenticated student. Identified by a stable ID from Stytch (the `user_id` from the verified JWT). Attributes: id, email, created_at, access_tier.
- **Token**: A short-lived JWT credential issued by Stytch after login. Carries the user's identity. Verified locally on every request via the Stytch Python SDK; never stored by the backend.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of protected endpoints reject requests without a valid token — no endpoint silently allows unauthenticated access.
- **SC-002**: Token verification adds no perceptible latency to API responses (under 200ms overhead).
- **SC-003**: Both ChatGPT-issued and web-frontend-issued Stytch tokens are accepted by the same `GET /users/me` endpoint without separate code paths.
- **SC-004**: A first-time user is provisioned in the database automatically — no manual account creation required.

---

## Non-Functional Requirements

- **NFR-001**: Token verification MUST complete in under 200ms overhead per request (SC-004). Local JWKS cache achieves this without a remote Stytch call per request.
- **NFR-002**: If the Stytch JWKS endpoint is unreachable, the backend MUST continue serving requests using the last successfully fetched public keys for up to 1 hour before failing closed.
- **NFR-003**: JWKS keys MUST be refreshed in the background on a schedule (e.g., every 15 minutes) so stale-key windows are minimized under normal operation.

---

## Out of Scope (deferred)

- MCP server auth: `/.well-known/oauth-protected-resource`, `WWW-Authenticate` challenge, per-tool scope declarations — deferred to the ChatGPT MCP feature
- Web frontend login UI — deferred to Phase 3

## Assumptions

- Stytch tenant is already created; project ID and secret are available.
- Any client (ChatGPT MCP server, web frontend, test scripts) is responsible for obtaining a valid Stytch JWT and passing it as `Authorization: Bearer <token>`. The backend only verifies tokens — it does not initiate auth flows.
- Access tier defaults to "free" on first-login provisioning; tier management is a separate feature.
- UTC is used for all time comparisons (token expiry checks).
- A Neon (PostgreSQL) database is available; a migration will be created as part of this feature's tasks.
