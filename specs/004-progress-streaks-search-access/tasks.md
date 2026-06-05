# Tasks: Progress, Streaks, Search & Access Control

**Feature**: `004-progress-streaks-search-access`  
**Input**: Design documents from `/specs/004-progress-streaks-search-access/`  
**Prerequisites**: plan.md ✓, spec.md ✓, data-model.md ✓, contracts/openapi.yaml ✓, research.md ✓, quickstart.md ✓

**Tests**: Included — plan.md project structure explicitly lists test files for this feature.

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the Alembic migration that all user stories depend on — without this, no tests can run against a real DB.

- [X] T001 Create Alembic migration `002_add_progress_and_streaks.py` in `backend/migrations/versions/` — adds `current_streak INTEGER NOT NULL DEFAULT 0` and `last_active_date DATE NULL` columns to `users`; creates `chapter_progress` table with composite unique constraint `(user_id, chapter_slug)` and index on `user_id` per data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ORM models, Pydantic models, and router registration — blocks all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Extend `User` ORM class in `backend/src/db/models.py` with `current_streak: Mapped[int]` (default 0) and `last_active_date: Mapped[date | None]` columns per data-model.md
- [X] T003 Add `ChapterProgress` ORM class to `backend/src/db/models.py` with `id`, `user_id` (FK→users.id CASCADE), `chapter_slug`, `completed_at` (TIMESTAMPTZ), `quiz_score` (SMALLINT nullable), and `UniqueConstraint("user_id", "chapter_slug")` per data-model.md
- [X] T004 [P] Create Pydantic models `CompletionRequest`, `CompletionResponse`, `ProgressEntry`, `ProgressResponse` in `backend/src/models/progress.py` per data-model.md and contracts/openapi.yaml
- [X] T005 [P] Create Pydantic models `SearchResult`, `SearchResponse` in `backend/src/models/search.py` with fields `slug`, `title`, `excerpt`, `rank` per data-model.md
- [X] T006 [P] Create Pydantic model `AccessStatus` in `backend/src/models/access.py` with fields `tier`, `resource: str | None`, `allowed` per data-model.md
- [X] T007 Register `progress`, `search`, and `access` routers in `backend/src/main.py` (import and `app.include_router()` for all three new routers)

**Checkpoint**: ORM models, Pydantic models, and router stubs in place — user story implementation can now begin.

---

## Phase 3: User Story 1 — Mark a Chapter as Complete (Priority: P1) 🎯 MVP

**Goal**: Authenticated student marks a chapter complete; system upserts the row, updates the streak, and returns updated state.

**Independent Test**: `PUT /users/{user_id}/progress?chapter_slug=01-intro-to-agents` with a valid JWT → response includes `chapter_slug`, `completed_at`, and `current_streak ≥ 1`.

### Tests for User Story 1

- [X] T008 [P] [US1] Write integration tests for `PUT /users/{user_id}/progress` in `backend/tests/integration/test_progress.py` covering: valid completion returns 200 with streak, same-chapter re-completion returns 200 idempotent, invalid JWT returns 401, mismatched user_id returns 403, unknown chapter_slug returns 404

### Implementation for User Story 1

- [X] T009 [US1] Implement `ProgressService.record_completion(user_id, chapter_slug, quiz_score, session)` in `backend/src/services/progress.py` — PostgreSQL upsert via `insert().on_conflict_do_update()` on `(user_id, chapter_slug)`, then call streak helper to update `users` row; raise 404 if slug absent from content manifest
- [X] T010 [US1] Implement `_update_streak(user, today_utc)` pure-logic helper in `backend/src/services/progress.py` encapsulating the four-condition streak state machine from data-model.md (None → 1; same day → no-op; consecutive → +1; gap → reset to 1)
- [X] T011 [US1] Create `PUT /users/{user_id}/progress` route in `backend/src/routers/progress.py` — apply `get_current_user` dependency, enforce `user_id == current_user.user_id` (403 if not), delegate to `ProgressService.record_completion()`, return `CompletionResponse`

**Checkpoint**: `PUT /users/{user_id}/progress` is functional and all T008 tests pass.

---

## Phase 4: User Story 2 — View My Progress (Priority: P1)

**Goal**: Authenticated student retrieves all completed chapters plus current streak and last active date.

**Independent Test**: After two `PUT` completions, `GET /users/{user_id}/progress` lists both slugs with `completed_at` timestamps and correct `current_streak`.

### Tests for User Story 2

- [X] T012 [P] [US2] Extend `backend/tests/integration/test_progress.py` with `GET` cases: user with no completions returns empty list and `current_streak: 0`; user with three completions returns all three; requesting another user's progress returns 403

### Implementation for User Story 2

- [X] T013 [US2] Implement `ProgressService.get_progress(user_id, session)` in `backend/src/services/progress.py` — SELECT all `ChapterProgress` rows for `user_id`, join with `users` for streak fields; return `ProgressResponse`
- [X] T014 [US2] Create `GET /users/{user_id}/progress` route in `backend/src/routers/progress.py` — apply `get_current_user`, enforce ownership (403), delegate to `ProgressService.get_progress()`, return `ProgressResponse`

**Checkpoint**: Both `PUT` and `GET` `/users/{user_id}/progress` are functional; T008 and T012 tests pass.

---

## Phase 5: User Story 3 — Streak Calculation Correctness (Priority: P2)

**Goal**: Guarantee streak edge-case correctness via dedicated unit tests against the pure helper extracted in T010.

**Independent Test**: Simulate completions on days D, D+1, D+3 (using mock dates) and assert streak resets to 1 on the gap day.

### Tests for User Story 3

- [X] T015 [US3] Write unit tests for `_update_streak()` in `backend/tests/unit/test_streak_logic.py` covering: brand-new user (streak becomes 1), two consecutive days (streak becomes 2), same-day second completion (streak unchanged), one-day gap resets to 1, multi-day gap resets to 1, multiple completions same day counts once

**Checkpoint**: All streak edge cases covered; T015 unit tests pass without any DB or network access.

---

## Phase 6: User Story 4 — Keyword Search (Priority: P2)

**Goal**: Authenticated student queries chapter titles and bodies; results are ranked with title matches above body matches.

**Independent Test**: Load cache with two chapters where only one contains the query term; call `GET /search?q=<term>` and verify exactly one result with correct rank.

### Tests for User Story 4

- [X] T016 [P] [US4] Write integration tests in `backend/tests/integration/test_search.py` covering: query matching a title returns rank-2 result, query matching body only returns rank-1 result, query matching no chapters returns empty list with 200, blank/whitespace query returns 400, missing JWT returns 401, cold cache (manifest None) returns 503

### Implementation for User Story 4

- [X] T017 [US4] Implement `SearchService.search(query, limit, content_service)` in `backend/src/services/search.py` — validate query non-blank (raise 400), raise 503 if `_manifest_cache` is None, iterate chapter cache with case-insensitive substring match, score title hits as 2 and body-only hits as 1, extract 200-char excerpt window, sort descending by rank, return `SearchResponse`
- [X] T018 [US4] Create `GET /search` route in `backend/src/routers/search.py` — apply `get_current_user`, validate `q` param non-blank, delegate to `SearchService.search()`, return `SearchResponse`; map `ServiceUnavailableError` → 503

**Checkpoint**: `GET /search` is functional; T016 tests pass including cold-cache 503 guard.

---

## Phase 7: User Story 5 — Access Tier Check (Priority: P3)

**Goal**: Authenticated client checks whether the user can access a specific resource given their stored tier.

**Independent Test**: Call `GET /access/check?resource=premium` with a free-tier user JWT → response contains `tier: "free"`, `allowed: false`.

### Tests for User Story 5

- [X] T019 [P] [US5] Write integration tests in `backend/tests/integration/test_access.py` covering: free-tier user without resource param returns `tier: free, allowed: true`; free-tier user with `resource=premium` returns `allowed: false`; premium-tier user with `resource=premium` returns `allowed: true`; missing JWT returns 401

### Implementation for User Story 5

- [X] T020 [US5] Implement `AccessService.check(user, resource)` in `backend/src/services/access.py` — read `user.access_tier`; compute `allowed = (tier == "premium" or resource != "premium")`; return `AccessStatus`
- [X] T021 [US5] Create `GET /access/check` route in `backend/src/routers/access.py` — apply `get_current_user`, accept optional `resource: str | None` query param, delegate to `AccessService.check()`, return `AccessStatus`

**Checkpoint**: `GET /access/check` is functional; T019 tests pass; all five user stories independently verified.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation against real environment and final quality pass.

- [X] T022 [P] Run quickstart.md validation — apply migration (`uv run alembic upgrade head`), start server, exercise all seven curl steps from quickstart.md against a running dev instance; confirm no 5xx errors
- [X] T023 Run full test suite `uv run pytest tests/ -v --cov=src` from `backend/`; confirm ≥ 80% coverage on `src/services/` and all new test files pass

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)       → no dependencies — start immediately
Phase 2 (Foundational)→ depends on Phase 1 — BLOCKS all user stories
Phase 3 (US1, P1)     → depends on Phase 2
Phase 4 (US2, P1)     → depends on Phase 2 + Phase 3 (shares ProgressService)
Phase 5 (US3, P2)     → depends on Phase 3 (tests the helper from T010)
Phase 6 (US4, P2)     → depends on Phase 2 — independent of US1/US2
Phase 7 (US5, P3)     → depends on Phase 2 — independent of all other stories
Phase 8 (Polish)      → depends on all user story phases
```

### User Story Dependencies

- **US1 (P1)**: Blocked by Phase 2 only — no inter-story dependency
- **US2 (P1)**: Blocked by Phase 2 + US1 (shares `ProgressService`; GET depends on record_completion already implemented)
- **US3 (P2)**: Blocked by US1 (tests the `_update_streak` helper from T010)
- **US4 (P2)**: Blocked by Phase 2 only — fully independent
- **US5 (P3)**: Blocked by Phase 2 only — fully independent

### Within Each User Story

- Tests written first (before implementation tasks in same story)
- Pydantic models → service logic → route handler
- Core logic before edge-case tests

### Parallel Opportunities

Within Phase 2 (after T002 + T003 complete): T004, T005, T006 are parallel — different model files.  
After Phase 2: US4 and US5 can be implemented in parallel (fully independent).  
Within any story: test tasks marked [P] can start while models from same story are being written.

---

## Parallel Example: Phase 2 Foundational

```
T002 (extend User ORM)
T003 (add ChapterProgress ORM)   ← wait for T001 migration first
  ↓ (both complete)
T004 [P] progress.py models     ← run in parallel
T005 [P] search.py models       ← run in parallel
T006 [P] access.py models       ← run in parallel
  ↓ (all complete)
T007 register routers in main.py
```

## Parallel Example: US4 + US5 (after Phase 2)

```
T016 [P] search integration tests  ← run in parallel with T019
T017     SearchService              ← sequential within US4
T018     GET /search route

T019 [P] access integration tests  ← run in parallel with T016
T020     AccessService              ← sequential within US5
T021     GET /access/check route
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 only)

1. Complete Phase 1: Migration
2. Complete Phase 2: Foundational (ORM models, Pydantic models, router registration)
3. Complete Phase 3: US1 — Mark Chapter Complete
4. Complete Phase 4: US2 — View My Progress
5. **STOP and VALIDATE**: Run T008 + T012 tests; exercise quickstart steps 4–5
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 + US2 (P1) → core learning flow — **demo-ready MVP**
3. US3 (P2) → streak correctness guarantee
4. US4 (P2) → search — independently testable
5. US5 (P3) → access tier check — independently testable
6. Polish → full suite green, quickstart validated

### Parallel Team Strategy

With two developers:

1. Both complete Phase 1 + Phase 2 together
2. Once foundational phase is done:
   - Dev A: US1 → US2 → US3 (progress/streak track)
   - Dev B: US4 → US5 (search/access track)
3. Both converge on Phase 8 polish

---

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 23 |
| Phase 1 (Setup) | 1 |
| Phase 2 (Foundational) | 6 |
| US1 tasks | 4 |
| US2 tasks | 3 |
| US3 tasks | 1 |
| US4 tasks | 3 |
| US5 tasks | 3 |
| Polish tasks | 2 |
| Parallelizable [P] tasks | 10 |

**MVP scope**: Phase 1 + Phase 2 + US1 (Phase 3) + US2 (Phase 4) = 14 tasks to a working learning tracker.
