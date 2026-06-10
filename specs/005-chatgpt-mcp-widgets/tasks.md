# Tasks: ChatGPT App — MCP Server + React Widgets

**Input**: Design documents from `/specs/005-chatgpt-mcp-widgets/`  
**Branch**: `005-chatgpt-mcp-widgets`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: Pytest tests included per tool module to satisfy constitution's 80% coverage requirement.  
**Organization**: Tasks grouped by user story — each story delivers a independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies on in-progress tasks)
- **[Story]**: User story this task belongs to (US1–US5)
- Paths follow plan.md project structure under `chatgpt-app/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create both sub-project skeletons (`server/` and `widgets/`) with dependency manifests.

- [X] T001 Create chatgpt-app/server/src/tools/ and chatgpt-app/server/src/models/ and chatgpt-app/server/tests/ directories
- [X] T002 Create chatgpt-app/server/pyproject.toml with Python 3.12, `fastmcp>=2.0`, `httpx>=0.27`, `pydantic>=2.0`, `pydantic-settings`, pytest dependencies
- [X] T003 [P] Create chatgpt-app/widgets/package.json with react@19, react-dom@19, vite@6, typescript@5, @types/react, @types/react-dom, vitest
- [X] T004 [P] Create chatgpt-app/widgets/tsconfig.json with strict mode, target ES2022, jsx react-jsx
- [X] T005 [P] Create chatgpt-app/widgets/vite.config.ts configured for library mode (outputs ES module bundle)
- [X] T006 [P] Create chatgpt-app/widgets/src/ directory with ChapterList/, ChapterReader/, QuizPanel/, ProgressDashboard/, SearchResults/, AccessStatus/ subdirectories
- [X] T007 [P] Create chatgpt-app/manifest.yaml skeleton with app name "Course Companion", description, placeholder tool list, and OAuth stanza pointing to Stytch Connected Apps

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that every user story's tool and widget depends on. No user story can proceed without these.

**⚠️ CRITICAL**: Complete this phase before starting any user story work.

- [X] T008 Create chatgpt-app/server/src/core/config.py — pydantic-settings `Settings` class with fields: `backend_url: str`, `stytch_project_domain: str`, `stytch_project_id: str`, `upgrade_url: str | None = None`
- [X] T009 Implement chatgpt-app/server/src/client.py — async `httpx.AsyncClient` wrapper that reads `BACKEND_URL` from Settings, exposes `get(path, headers?)` and `post(path, body, headers?)` helpers, propagates `Authorization` header downstream
- [X] T010 Implement chatgpt-app/server/src/auth.py — `BearerAuthProvider` configured with `jwks_uri=f"{settings.stytch_project_domain}/.well-known/jwks.json"`, `issuer=settings.stytch_project_domain`, `algorithm="RS256"`, `audience=settings.stytch_project_id`
- [X] T011 Create chatgpt-app/server/src/main.py — `FastMCP` app instance wired to `auth.py` provider; `get_app()` factory; tool imports will be added as each story completes
- [X] T012 [P] Create chatgpt-app/server/src/models/__init__.py and define `ErrorPanel(BaseModel)` with field `message: str = "Service unavailable, please try again"`
- [X] T013 [P] Create chatgpt-app/widgets/src/types.ts — copy `PanelAction` and `ErrorState` interfaces from contracts/widgets.ts
- [X] T014 [P] Create chatgpt-app/widgets/src/ErrorPanel/index.tsx — reusable error panel component that renders `ErrorState.message` centered in the panel; used by all 6 widget components

**Checkpoint**: Foundation ready — all user story phases can start independently after T011 is complete.

---

## Phase 3: User Story 1 — Browse and Read Course Chapters (Priority: P1) 🎯 MVP

**Goal**: Public chapter browsing and full chapter reading inside ChatGPT visual panels.

**Independent Test**: Connect the app in ChatGPT Developer Mode, type "show me all chapters" → ChapterList panel appears; type "show me chapter 1" → ChapterReader panel appears with full content and next/prev buttons. No sign-in required.

### Implementation

- [X] T015 [P] [US1] Create `ChapterSummary` and `ChapterPanel` Pydantic models in chatgpt-app/server/src/models/chapters.py — field-for-field match with data-model.md definitions
- [X] T016 [P] [US1] Create ChapterList React widget in chatgpt-app/widgets/src/ChapterList/index.tsx — renders `ChapterListProps`: numbered rows with title, completion badge, and click handler that triggers `get_chapter` tool; shows ErrorPanel on error
- [X] T017 [P] [US1] Create ChapterReader React widget in chatgpt-app/widgets/src/ChapterReader/index.tsx — renders `ChapterReaderProps`: full `content_html` via dangerouslySetInnerHTML, prev/next nav buttons (disabled when null slug), "Take Quiz" button (hidden when `has_quiz=false`); shows ErrorPanel on error
- [X] T018 [US1] Implement `list_chapters` tool in chatgpt-app/server/src/tools/chapters.py — public (no auth), calls `client.get("/chapters")`, maps response to `list[ChapterSummary]`, returns as panel payload
- [X] T019 [US1] Implement `get_chapter` tool in chatgpt-app/server/src/tools/chapters.py — public (no auth), arg `slug: str`, calls `client.get(f"/chapters/{slug}")`, returns `ChapterPanel`; raises 404 tool error if backend returns 404
- [X] T020 [US1] Register `list_chapters` and `get_chapter` tools in chatgpt-app/server/src/main.py by importing from tools/chapters.py
- [X] T021 [US1] Write pytest tests in chatgpt-app/server/tests/test_chapters.py — mock `client.get`: test list_chapters returns ChapterSummary list, test get_chapter returns ChapterPanel for valid slug, test get_chapter raises error for unknown slug

**Checkpoint**: US1 complete — chapter browsing and reading fully functional without authentication.

---

## Phase 4: User Story 2 — Take a Quiz with Immediate Feedback (Priority: P2)

**Goal**: Authenticated users take quizzes inside a QuizPanel that handles Q&A state and shows a score screen — without triggering new ChatGPT messages per answer.

**Independent Test**: Sign in to ChatGPT app, type "quiz me on chapter 1" → QuizPanel opens with Q1; select an option → immediate correct/incorrect feedback in panel; complete all questions → score screen shown with "View Progress" button.

### Implementation

- [X] T022 [P] [US2] Create `QuizQuestion`, `QuizPanel`, `QuestionResult`, `QuizResult` Pydantic models in chatgpt-app/server/src/models/quiz.py — field-for-field match with data-model.md
- [X] T023 [P] [US2] Create QuizPanel React widget in chatgpt-app/widgets/src/QuizPanel/index.tsx — renders `QuizPanelProps`: displays one question at a time with option buttons, tracks selected answers in local state, shows per-question feedback immediately on selection, renders `QuizResultProps` score screen when all answered; "View Progress" triggers `get_progress` tool
- [X] T024 [US2] Implement `get_quiz` tool in chatgpt-app/server/src/tools/quiz.py — protected (Bearer required), arg `chapter_slug: str`, forwards token to `client.get(f"/quizzes/{chapter_slug}", headers=auth_headers)`, returns `QuizPanel`
- [X] T025 [US2] Implement `submit_quiz` tool in chatgpt-app/server/src/tools/quiz.py — protected (Bearer required), args `chapter_slug: str, answers: dict[str, str]`, calls `client.post(f"/quizzes/{chapter_slug}/submit", body=answers, headers=auth_headers)`, returns `QuizResult`
- [X] T026 [US2] Register `get_quiz` and `submit_quiz` tools in chatgpt-app/server/src/main.py
- [X] T027 [US2] Write pytest tests in chatgpt-app/server/tests/test_quiz.py — mock client: test get_quiz returns QuizPanel, test submit_quiz returns QuizResult, test both return 401 error without Bearer token

**Checkpoint**: US2 complete — authenticated quiz flow functional end-to-end.

---

## Phase 5: User Story 3 — View Learning Progress and Streaks (Priority: P3)

**Goal**: Authenticated users see their streak count, overall completion %, and per-chapter status in a ProgressDashboard panel.

**Independent Test**: Sign in, complete one chapter, type "what's my progress?" → ProgressDashboard shows streak count, completion percentage, and chapter list. Zero-progress state shows encouraging prompt.

### Implementation

- [X] T028 [P] [US3] Create `ChapterProgressItem` and `ProgressPanel` Pydantic models in chatgpt-app/server/src/models/progress.py — field-for-field match with data-model.md; derive `completion_percentage` as `completed_chapters / total_chapters * 100`
- [X] T029 [P] [US3] Create ProgressDashboard React widget in chatgpt-app/widgets/src/ProgressDashboard/index.tsx — renders `ProgressDashboardProps`: streak prominently displayed, completion % progress bar, chapter list rows (completed chapters checked, quiz score shown); empty state renders encouragement copy; chapter rows trigger `get_chapter` on click
- [X] T030 [US3] Implement `get_progress` tool in chatgpt-app/server/src/tools/progress.py — protected (Bearer required), extracts `user_id` from JWT sub claim, calls `client.get(f"/users/{user_id}/progress", headers=auth_headers)`, returns `ProgressPanel`
- [X] T031 [US3] Register `get_progress` tool in chatgpt-app/server/src/main.py
- [X] T032 [US3] Write pytest tests in chatgpt-app/server/tests/test_progress.py — mock client: test get_progress returns ProgressPanel with correct user_id, test unauthenticated call returns 401 error

**Checkpoint**: US3 complete — progress dashboard shows live data for authenticated users.

---

## Phase 6: User Story 4 — Search Course Content by Keyword (Priority: P4)

**Goal**: Public keyword search returns a SearchResults panel with matching chapters and excerpts; clicking a result opens the chapter.

**Independent Test**: Type "find chapters about tool use" → SearchResults panel shows matching chapter titles with keyword excerpts; click "Read Chapter" on any result → ChapterReader panel opens for that chapter.

### Implementation

- [X] T033 [P] [US4] Create `SearchResult` and `SearchResultsPanel` Pydantic models in chatgpt-app/server/src/models/search.py — `limit` clamped to [1, 20] before forwarding to backend
- [X] T034 [P] [US4] Create SearchResults React widget in chatgpt-app/widgets/src/SearchResults/index.tsx — renders `SearchResultsProps`: query echoed as header, total_matches count, result rows with chapter title + excerpt snippet; "Read Chapter" button on each row triggers `get_chapter` tool; empty state renders "No results found" with browse suggestion
- [X] T035 [US4] Implement `search_content` tool in chatgpt-app/server/src/tools/search.py — public (no auth), args `query: str, limit: int = 10`; validates query non-empty and strips whitespace; clamps limit to [1, 20]; calls `client.get(f"/search?q={query}&limit={limit}")`, returns `SearchResultsPanel`
- [X] T036 [US4] Register `search_content` tool in chatgpt-app/server/src/main.py
- [X] T037 [US4] Write pytest tests in chatgpt-app/server/tests/test_search.py — test search_content returns SearchResultsPanel, test empty query raises validation error, test limit clamped to 20 when exceeded

**Checkpoint**: US4 complete — keyword search fully functional without authentication.

---

## Phase 7: User Story 5 — Check Account Access Tier (Priority: P5)

**Goal**: Authenticated users see their tier (Free or Premium) with an upgrade CTA for free users.

**Independent Test**: Sign in, type "what's my account tier?" → AccessStatus panel shows "Free" with upgrade link, or "Premium" with confirmation.

### Implementation

- [X] T038 [P] [US5] Create `AccessStatusPanel` Pydantic model in chatgpt-app/server/src/models/access.py — `tier: Literal["free","premium"]`, `is_premium: bool`, `upgrade_url: str | None` (populated from Settings.upgrade_url for free-tier users)
- [X] T039 [P] [US5] Create AccessStatus React widget in chatgpt-app/widgets/src/AccessStatus/index.tsx — renders `AccessStatusProps`: tier badge (Free/Premium), upgrade CTA button linking to `upgrade_url` when `is_premium=false`; premium users see confirmation message
- [X] T040 [US5] Implement `check_access` tool in chatgpt-app/server/src/tools/access.py — protected (Bearer required), calls `client.get("/access/check", headers=auth_headers)`, enriches response with `upgrade_url` from Settings when tier is "free", returns `AccessStatusPanel`
- [X] T041 [US5] Register `check_access` tool in chatgpt-app/server/src/main.py
- [X] T042 [US5] Write pytest tests in chatgpt-app/server/tests/test_access.py — test check_access returns free-tier panel with upgrade_url, test returns premium panel without upgrade_url, test unauthenticated call returns 401 error

**Checkpoint**: US5 complete — all 7 tools registered and functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finalize manifest, error resilience, deployment config, and end-to-end verification.

- [X] T043 Update chatgpt-app/manifest.yaml — fill all 7 tool entries with final descriptions (used by ChatGPT to decide when to call each tool), OAuth stanza with `client_id`/JWKS pointing to Stytch, and production MCP server URL
- [X] T044 [P] Create chatgpt-app/widgets/src/index.ts — barrel export for all 6 widget components
- [X] T045 [P] Create chatgpt-app/server/vercel.json — configure Python runtime, routes, and env var references for Vercel serverless deployment
- [X] T046 [P] Create chatgpt-app/widgets/vercel.json — configure static build output (`dist/`) for Vercel static site deployment
- [X] T047 Add global error handler in chatgpt-app/server/src/main.py — catches `httpx.TimeoutException` and `httpx.HTTPStatusError` (5xx), returns `ErrorPanel` with the standard "Service unavailable" message for all tool responses
- [X] T048 Run end-to-end verification per quickstart.md SC-001 through SC-007 in ChatGPT Developer Mode; confirm all 7 tools return panels and all 5 user stories are independently functional

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; all T001–T007 parallelizable except T001→T002 ordering
- **Foundational (Phase 2)**: Requires T001/T002 complete — BLOCKS all user story phases; T008→T009→T010→T011 must run in that order; T012/T013/T014 can run in parallel with T008–T011
- **User Stories (Phase 3–7)**: All depend on Phase 2 completion; stories are independent of each other and can start simultaneously after T011
- **Polish (Phase 8)**: Requires all desired stories complete; T043–T047 can run in parallel; T048 must be last

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|-----------|---------------------|
| US1 (P1) | Phase 2 complete | US2, US3, US4, US5 |
| US2 (P2) | Phase 2 complete | US1, US3, US4, US5 |
| US3 (P3) | Phase 2 complete | US1, US2, US4, US5 |
| US4 (P4) | Phase 2 complete | US1, US2, US3, US5 |
| US5 (P5) | Phase 2 complete | US1, US2, US3, US4 |

### Within Each Story

1. [P] tasks (models + widget component) can launch simultaneously
2. Tool implementation follows after model is defined
3. Tool registration in main.py follows tool implementation
4. Pytest tests can be written in parallel with tool implementation

---

## Parallel Execution Examples

### Phase 2 (Foundational)

```
Sequential chain:  T008 (config) → T009 (client) → T010 (auth) → T011 (main.py)
Parallel with chain: T012 (ErrorPanel model) | T013 (types.ts) | T014 (ErrorPanel widget)
```

### Phase 3 (US1) — after T011 complete

```
Parallel:  T015 (chapter models) | T016 (ChapterList widget) | T017 (ChapterReader widget)
Then:      T018 (list_chapters tool) — needs T015
           T019 (get_chapter tool)   — needs T015
Then:      T020 (register in main.py) — needs T018, T019
           T021 (tests)              — needs T018, T019 (can run parallel with T020)
```

### All Stories in Parallel (after Phase 2)

```
Developer A: T015–T021 (US1 chapters)
Developer B: T022–T027 (US2 quiz)
Developer C: T028–T032 (US3 progress)
Developer D: T033–T037 (US4 search)
Developer E: T038–T042 (US5 access)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T007)
2. Complete Phase 2: Foundational (T008–T014) — CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T015–T021)
4. **STOP and VALIDATE**: Confirm chapter list and chapter reader work in ChatGPT Developer Mode
5. Deploy MCP server to Vercel preview — share URL for review

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (T015–T021) → Chapters browsable ✅ MVP
3. US2 (T022–T027) → Quiz functional ✅
4. US3 (T028–T032) → Progress dashboard ✅
5. US4 (T033–T037) → Search works ✅
6. US5 (T038–T042) → Access tier visible ✅
7. Polish (T043–T048) → Production ready ✅

---

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 48 |
| Phase 1 (Setup) | 7 tasks |
| Phase 2 (Foundational) | 7 tasks |
| Phase 3 (US1 — Chapters) | 7 tasks |
| Phase 4 (US2 — Quiz) | 6 tasks |
| Phase 5 (US3 — Progress) | 5 tasks |
| Phase 6 (US4 — Search) | 5 tasks |
| Phase 7 (US5 — Access) | 5 tasks |
| Phase 8 (Polish) | 6 tasks |
| Tasks with [P] | 22 parallelizable |
| MVP scope | Phase 1 + 2 + 3 (21 tasks) |

---

## Notes

- [P] tasks = different files, no dependencies on in-progress work
- [US#] label maps task to user story for traceability
- Each story delivers a visual panel independently testable in ChatGPT Developer Mode
- All tests use `httpx.MockTransport` or `pytest-httpx` to mock backend calls
- `Authorization` header forwarding is handled in client.py — tools don't manipulate tokens directly
- No backend changes required — all 7 tools map to already-implemented FastAPI endpoints
- Phase 1 constraint verified: zero LLM imports anywhere in `chatgpt-app/`
