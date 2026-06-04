# Tasks: Stytch Authentication (003-stytch-auth)

**Input**: Design documents from `/specs/003-stytch-auth/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/backend-openapi.yaml ✓, quickstart.md ✓

**Scope**: Backend only — MCP server auth deferred to the ChatGPT MCP feature
**Tests**: Included — plan.md explicitly defines test files (tests/unit/test_auth.py, tests/integration/test_users_me.py)

**Organization**: Tasks are grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to ([US1], [US2])
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies and initialize Alembic migration scaffolding

- [X] T001 Add `stytch`, `sqlalchemy[asyncio]`, `asyncpg`, and `alembic` to dependencies in `backend/pyproject.toml`
- [X] T002 Initialize Alembic by running `alembic init migrations` from `backend/`, creating `backend/alembic.ini` and `backend/migrations/`
- [X] T003 [P] Create empty package marker `backend/src/db/__init__.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core DB and config infrastructure that ALL user story tasks depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add `STYTCH_PROJECT_ID`, `STYTCH_SECRET`, and `DATABASE_URL` fields to `Settings` in `backend/src/core/config.py` using `pydantic-settings`
- [X] T005 [P] Create `Base` (DeclarativeBase) and `User` ORM model (id, email, created_at, access_tier) in `backend/src/db/models.py`
- [X] T006 Create async SQLAlchemy engine (`create_async_engine` with `pool_pre_ping=True`, `pool_recycle=3600`), `AsyncSessionLocal` factory, and `get_db` async generator in `backend/src/db/engine.py`
- [X] T007 Configure Alembic async `env.py` using `create_async_engine` + `asyncio.run(run_migrations_online())` in `backend/migrations/env.py`
- [X] T008 [P] Create Alembic `script.py.mako` migration template in `backend/migrations/script.py.mako`
- [X] T009 Create users table migration (`CREATE TABLE users`, `CREATE INDEX ix_users_email`) in `backend/migrations/versions/001_create_users_table.py`

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Backend Identifies User from Token (Priority: P1) 🎯 MVP

**Goal**: Every protected endpoint can resolve a caller's identity from a Stytch JWT via a reusable `get_current_user` dependency. `GET /users/me` returns the authenticated user's profile and provisions a first-time user automatically.

**Independent Test**: `curl http://localhost:8000/users/me` → `401`. `curl -H "Authorization: Bearer <valid_stytch_jwt>" http://localhost:8000/users/me` → `200 UserProfile`.

### Tests for User Story 1

> **Write these tests FIRST — ensure they FAIL before implementation begins**

- [X] T010 [P] [US1] Write unit tests for `get_current_user`: valid token → `AuthenticatedUser`, missing/malformed token → 401, expired token → 401, wrong-issuer token → 401 in `backend/tests/unit/test_auth.py`
- [X] T011 [P] [US1] Write integration tests for `GET /users/me`: 200 with valid token returns `UserProfile`, 401 without token, first-login call creates `User` record in DB in `backend/tests/integration/test_users_me.py`

### Implementation for User Story 1

- [X] T012 [P] [US1] Create `AuthenticatedUser` (user_id, email) and `UserProfile` (id, email, access_tier, created_at) Pydantic v2 models in `backend/src/models/users.py`
- [X] T013 [US1] Implement `get_stytch_client()` singleton, `_extract_email()` helper, and `get_current_user` FastAPI dependency (raises `HTTPException(401)` on any auth failure) in `backend/src/core/auth.py`
- [X] T014 [US1] Implement `UserService.get_or_create(user_id, email, db)` using `pg_insert(User).on_conflict_do_nothing()` in `backend/src/services/users.py`
- [X] T015 [US1] Add `CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]` and `DbSessionDep = Annotated[AsyncSession, Depends(get_db)]` to `backend/src/core/dependencies.py`
- [X] T016 [US1] Implement `GET /users/me` router using `CurrentUserDep` and `DbSessionDep`, calling `UserService.get_or_create()` and returning `UserProfile` in `backend/src/routers/users.py`
- [X] T017 [US1] Register `users` router and add Stytch client warm-up call (`get_stytch_client()`) in FastAPI `lifespan` context manager in `backend/src/main.py`

**Checkpoint**: User Story 1 fully functional — `GET /users/me` returns profile and provisions new users independently

---

## Phase 4: User Story 2 — Web Frontend Auth Compatibility (Priority: P2)

**Goal**: The same backend JWT verification mechanism accepts tokens from any Stytch client (ChatGPT MCP server, web frontend) without client-specific code paths, satisfying FR-006.

**Independent Test**: Call `GET /users/me` with a Stytch session JWT obtained from the web app's Stytch login flow — confirm `200 UserProfile` returned. (Web app login UI is deferred to Phase 3; token can be obtained via SDK or Stytch dashboard sandbox.)

### Implementation for User Story 2

- [X] T018 [P] [US2] Create `backend/.env.example` with placeholder values for `DATABASE_URL`, `STYTCH_PROJECT_ID`, and `STYTCH_SECRET`
- [X] T019 [US2] Add integration test scenario asserting two sequential `GET /users/me` calls with tokens for the same user (simulating ChatGPT + web frontend) return identical `UserProfile` and do not duplicate the DB record in `backend/tests/integration/test_users_me.py`

**Checkpoint**: Backend confirmed client-agnostic — same token mechanism works for all frontend consumers

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Dependency installation, migration execution, and end-to-end quickstart validation

- [X] T020 [P] Run `uv sync` from `backend/` to install all newly added dependencies
- [X] T021 Run `uv run alembic upgrade head` from `backend/` to apply the users table migration to the Neon PostgreSQL database
- [X] T022 [P] Run full test suite: `uv run pytest tests/unit/test_auth.py tests/integration/test_users_me.py -v` from `backend/`
- [X] T023 [P] Validate quickstart.md steps manually: confirm `curl http://localhost:8000/users/me` → `401` and `curl -H "Authorization: Bearer <sandbox_jwt>" http://localhost:8000/users/me` → `200`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user story phases**
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion (T019 extends test file from T011)
- **Polish (Phase 5)**: Depends on Phases 3 and 4 completion

### Within Each User Story

- Tests (T010, T011) → written first and must **fail** before implementation starts
- Models (T012) → before services and auth
- Auth dependency (T013) + Service (T014) → before dependencies module and router
- Dependencies module (T015) → before router
- Router (T016) → before main.py registration (T017)

### Parallel Opportunities

- T003, T005 can run in parallel with each other after T001/T002
- T004, T005 in Phase 2 can start in parallel
- T006 depends on T004 + T005; T007 depends on T005 + T006
- T008 is independent of T007 and can run in parallel
- T009 depends on T007
- T010, T011, T012 within US1 can all start in parallel after Phase 2 completes
- T013 and T014 can run in parallel (different files)
- T018 is independent of US1 tasks
- T020, T022, T023 in Polish can run in parallel (T021 must run before T022/T023)

---

## Parallel Example: User Story 1

```bash
# Start these in parallel immediately after Phase 2:
Task T010: Write unit tests in backend/tests/unit/test_auth.py
Task T011: Write integration tests in backend/tests/integration/test_users_me.py
Task T012: Create Pydantic models in backend/src/models/users.py

# Then in parallel:
Task T013: Implement auth dependency in backend/src/core/auth.py
Task T014: Implement UserService in backend/src/services/users.py

# Then sequentially:
Task T015 → T016 → T017
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T009) — **CRITICAL, blocks all stories**
3. Write tests (T010–T011) — must **fail** first
4. Implement US1 (T012–T017)
5. **STOP and VALIDATE**: Run `pytest` — all tests green, `GET /users/me` works end-to-end
6. Deploy/demo as MVP

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Token verification + `/users/me` + first-login provisioning → **MVP**
3. Phase 4 (US2) → Multi-client compatibility confirmed → **Production-ready**
4. Phase 5 → Fully validated and documented

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Phase 1: Setup | T001–T003 | 3 |
| Phase 2: Foundational | T004–T009 | 6 |
| Phase 3: US1 (P1) MVP | T010–T017 | 8 |
| Phase 4: US2 (P2) | T018–T019 | 2 |
| Phase 5: Polish | T020–T023 | 4 |
| **Total** | | **23** |

**Parallel opportunities**: 12 tasks marked [P]
**MVP scope**: Phases 1–3 (17 tasks) — fully functional auth with `/users/me`
