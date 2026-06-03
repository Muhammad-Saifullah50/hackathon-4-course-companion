# Tasks: Content Delivery

**Input**: Design documents from `/specs/1-content-delivery/`
**Prerequisites**: plan.md ✓, spec.md ✓
**Available docs**: plan.md, spec.md (no data-model.md, contracts/, research.md, or quickstart.md yet)

**Tests**: Included — backend logic has clear test surface and tests/test_content.py is defined in plan.md.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1–US4)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, directory structure, and content authoring

- [X] T001 Initialize `backend/pyproject.toml` with FastAPI, pydantic v2, boto3, pydantic-settings, pytest, pytest-asyncio, httpx dependencies
- [X] T002 Create backend source tree: `backend/src/core/`, `backend/src/models/`, `backend/src/routers/`, `backend/src/services/`, `backend/tests/`
- [X] T003 [P] Create `backend/.env.example` with all required env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `CACHE_TTL_SECONDS`, `SIGNED_URL_EXPIRY_SECONDS`
- [X] T004 [P] Author 5 chapter Markdown files in `content/chapters/` — one per topic: `claude-agent-sdk-foundations.md`, `claude-agent-sdk-advanced.md`, `mcp-introduction.md`, `mcp-building-servers.md`, `agent-skills.md` — each with sections: Introduction, Core Concepts, Code Examples, Key Takeaways
- [X] T005 [P] Create `content/manifest.json` with ordered entries for all 5 chapters (fields: `slug`, `title`, `order`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create `backend/src/core/config.py` with `Settings` class via `pydantic-settings` covering R2 credentials, bucket name, cache TTL, and signed URL expiry
- [X] T007 [P] Create Pydantic v2 models in `backend/src/models/content.py`: `ManifestEntry`, `Manifest`, `ChapterSummary` (slug, title, order), `ChapterDetail` (slug, title, order, content, next_slug, prev_slug), `MediaUrlResponse` (url, expires_at)
- [X] T008 Implement `ContentService` in `backend/src/services/content.py`: R2 client (boto3 in thread pool via `asyncio.to_thread`), TTL in-memory cache for manifest and chapter bodies, `load_manifest()` with Pydantic validation and 503-on-failure semantics, `get_chapter_body(slug)` returning raw Markdown or raising 404, `generate_signed_url(key)` for media assets
- [X] T009 Create `backend/src/main.py` FastAPI app with content router registered under `/chapters`, lifespan hook that warms the manifest cache on startup, and global exception handler for R2/manifest errors
- [X] T010 [P] Create `backend/src/core/dependencies.py` with `get_content_service()` FastAPI dependency (singleton pattern)

**Checkpoint**: Foundation ready — all user story phases can now proceed

---

## Phase 3: User Story 1 — Browse Course Chapters (Priority: P1) 🎯 MVP

**Goal**: `GET /chapters` returns all 5 chapters in manifest order with slug, title, and order number.

**Independent Test**: Call `GET /chapters` and verify 5 items returned in correct order with expected fields.

### Implementation

- [X] T011 [US1] Implement `GET /chapters` endpoint in `backend/src/routers/content.py` returning `List[ChapterSummary]` sourced from the manifest via `ContentService`
- [X] T012 [US1] Add 503 response when manifest is unavailable or invalid in `backend/src/routers/content.py` (propagates `ServiceUnavailableError` from service layer)

### Tests

- [X] T013 [P] [US1] Write tests for `GET /chapters` (happy path: 5 chapters in order; error path: manifest unavailable → 503) in `backend/tests/test_content.py`

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 — Read a Specific Chapter (Priority: P1)

**Goal**: `GET /chapters/{slug}` returns full Markdown content plus next/prev slugs (null at boundaries).

**Independent Test**: Fetch each of the 5 chapters by slug; verify content, next_slug, and prev_slug are correct; verify unknown slug returns 404.

### Implementation

- [X] T014 [US2] Implement `GET /chapters/{slug}` endpoint in `backend/src/routers/content.py` returning `ChapterDetail` (content body + nav slugs)
- [X] T015 [US2] Implement 404 handling in `backend/src/services/content.py` for: slug not in manifest, slug in manifest but `.md` file missing in R2

### Tests

- [X] T016 [P] [US2] Write tests for `GET /chapters/{slug}` (valid slug; boundary chapters prev/next null; unknown slug → 404; manifest slug with missing R2 file → 404) in `backend/tests/test_content.py`

**Checkpoint**: User Stories 1 and 2 both independently functional

---

## Phase 5: User Story 3 — Navigate Between Chapters (Priority: P2)

**Goal**: Dedicated next/prev endpoints return only the adjacent slug; boundary returns 404.

**Independent Test**: Call next/prev on each slug; verify correct adjacent slug; verify 404 at first/last chapter boundaries.

### Implementation

- [X] T017 [US3] Implement `GET /chapters/{slug}/next` and `GET /chapters/{slug}/prev` endpoints in `backend/src/routers/content.py` returning `{"slug": "..."}` or 404 at boundaries

### Tests

- [X] T018 [P] [US3] Write tests for next/prev navigation (middle chapter; last chapter next → 404; first chapter prev → 404) in `backend/tests/test_content.py`

**Checkpoint**: User Stories 1, 2, and 3 all independently functional

---

## Phase 6: User Story 4 — Access Chapter Media (Priority: P3)

**Goal**: `GET /chapters/{slug}/media/{filename}` returns a short-lived signed R2 URL; missing file returns 404.

**Independent Test**: Request a signed URL for a known media filename; verify response contains a time-limited URL; request unknown filename and verify 404.

### Implementation

- [X] T019 [US4] Implement `GET /chapters/{slug}/media/{filename}` endpoint in `backend/src/routers/content.py` delegating to `ContentService.generate_signed_url()` and returning `MediaUrlResponse`
- [X] T020 [US4] Add 404 handling for missing media objects in `backend/src/services/content.py` (catch S3/R2 NoSuchKey error)

### Tests

- [X] T021 [P] [US4] Write tests for media signed URL endpoint (valid filename → response with url and expires_at; unknown filename → 404) in `backend/tests/test_content.py`

**Checkpoint**: All 4 user stories independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, edge-case hardening, and test coverage gate

- [X] T022 [P] Create `backend/tests/conftest.py` with shared fixtures: mock R2 client, test AsyncClient, sample manifest fixture
- [X] T023 Add duplicate-slug deduplication and warning log in `backend/src/services/content.py` (`load_manifest()`) — first occurrence wins
- [X] T024 Validate all 5 chapter files in `content/chapters/` contain the four required sections (Introduction, Core Concepts, Code Examples, Key Takeaways)
- [X] T025 Run full test suite (`pytest --cov=src backend/tests/`) and confirm ≥80% coverage on `backend/src/services/content.py`; fix any failing tests

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3–6 (User Stories)**: All depend on Phase 2; can proceed in priority order (P1 → P2 → P3) or in parallel if staffed
- **Phase 7 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories
- **US2 (P1)**: Independently testable; shares service layer with US1
- **US3 (P2)**: Independently testable; adds endpoints to same router
- **US4 (P3)**: Independently testable; adds one new service method

### Within Each User Story

- Endpoints depend on models and service methods being present
- Tests can be written alongside or after implementation (no TDD mandate, but tests must pass before checkpoint)

### Parallel Opportunities

- T003, T004, T005 can run in parallel within Phase 1 after T002 completes
- T007, T010 can run in parallel within Phase 2 after T006 completes
- T008 depends on T007 (models) — run after T007
- T009 depends on T008 (service) — run after T008
- Test tasks within each phase (T013, T016, T018, T021) are [P] — can overlap with implementation
- T022 (conftest) can run in parallel during Phase 7

---

## Parallel Example: Phase 2 Foundational

```bash
# After T006 (Settings) completes, launch in parallel:
Task T007: "Create Pydantic models in backend/src/models/content.py"
Task T010: "Create backend/src/core/dependencies.py"

# Then sequentially:
Task T008: "Implement ContentService in backend/src/services/content.py"  # needs T007
Task T009: "Create backend/src/main.py FastAPI app"                        # needs T008
```

---

## Implementation Strategy

### MVP First (User Stories 1 and 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (list chapters)
4. Complete Phase 4: User Story 2 (read chapter by slug)
5. **STOP and VALIDATE**: Both P1 stories working independently
6. Demo-ready: ChatGPT can orient learner and fetch chapter content

### Incremental Delivery

1. Phase 1 + Phase 2 → foundation ready
2. Phase 3 (US1) → list endpoint live; demo-able
3. Phase 4 (US2) → chapter reading live; core value delivered (MVP)
4. Phase 5 (US3) → navigation shortcuts available
5. Phase 6 (US4) → media assets accessible
6. Phase 7 → polish and coverage gate

---

## Task Summary

| Phase | Tasks | User Story | Priority |
|-------|-------|------------|----------|
| 1: Setup | T001–T005 | — | Prerequisite |
| 2: Foundational | T006–T010 | — | Blocks all stories |
| 3: Browse Chapters | T011–T013 | US1 | P1 (MVP) |
| 4: Read Chapter | T014–T016 | US2 | P1 (MVP) |
| 5: Navigation | T017–T018 | US3 | P2 |
| 6: Media URLs | T019–T021 | US4 | P3 |
| 7: Polish | T022–T025 | — | Cross-cutting |

**Total**: 25 tasks | **MVP scope**: T001–T016 (16 tasks, US1 + US2)
