# Tasks: AI Course Mentor

**Input**: Design documents from `/specs/007-ai-course-mentor/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Tests**: Include backend unit/integration tests and web component/helper tests because the feature has premium access, quota, persistence, and LLM guardrail behavior.

**Organization**: Tasks are grouped by user story to preserve independent implementation and validation. Backend endpoints are implemented before the web ChatKit launcher consumes them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because the task touches different files and has no dependency on an incomplete task
- **[Story]**: Maps the task to the user story from `spec.md`
- Each task names exact paths to modify or create

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add required dependencies, settings, and package scaffolding for mentor backend and web UI work.

- [ ] T001 Add backend dependencies for `openai-agents`, `openai-chatkit`, `litellm`, `pgvector`, and any embedding/runtime support in `backend/pyproject.toml`
- [ ] T002 Add web dependency `@openai/chatkit-react` in `web-app/package.json`
- [ ] T003 [P] Add mentor, OpenRouter, LiteLLM, ChatKit, and vector settings fields with validation in `backend/src/core/config.py`
- [ ] T004 [P] Add mentor environment placeholders to `backend/.env.example` and `web-app/.env.example`
- [ ] T005 [P] Create backend package placeholders `backend/src/agents/__init__.py` and `backend/src/routers/premium/__init__.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, typed API boundaries, dependencies, and shared service shells that block all user stories.

**CRITICAL**: No user story endpoint or UI work should begin until this phase is complete.

- [ ] T006 Add SQLAlchemy models for `MentorThread`, `MentorMessage`, `MentorCitation`, `MentorUsageRecord`, and `CourseContentChunk` in `backend/src/db/models.py`
- [ ] T007 Create Alembic migration `backend/migrations/versions/004_add_ai_course_mentor.py` with mentor tables, ownership indexes, usage uniqueness, pgvector extension, and vector index
- [ ] T008 [P] Add Pydantic request/response models from `contracts/openapi.yaml` in `backend/src/models/mentor.py`
- [ ] T009 [P] Add mentor service dependency factory in `backend/src/core/dependencies.py`
- [ ] T010 [P] Create service shells for `MentorService`, `ContentIndexer`, `VectorRetrievalService`, and `ChatKitServer` in `backend/src/services/mentor.py`, `backend/src/services/content_indexer.py`, `backend/src/services/vector_retrieval.py`, and `backend/src/services/chatkit_server.py`
- [ ] T011 [P] Create agent module shells for mentor agent, tools, and guardrails in `backend/src/agents/openai_mentor_agent.py`, `backend/src/agents/tools.py`, and `backend/src/agents/guardrails.py`
- [ ] T012 Register an empty premium mentor router in `backend/src/routers/premium/mentor.py` and include it from `backend/src/main.py` under `/premium/mentor`
- [ ] T013 [P] Add shared mentor API TypeScript types in `web-app/src/lib/api-types.ts`

**Checkpoint**: Foundation ready; user story tasks can begin.

---

## Phase 3: User Story 1 - Grounded Course Help (Priority: P1) MVP

**Goal**: A Pro learner submits a course question and receives a course-grounded answer with lesson/section citations, or a clear limited-evidence/course-scope response.

**Independent Test**: Submit a supported course question as a Pro learner and verify the response cites course content; submit an unrelated question and verify guardrail handling.

### Tests for User Story 1

- [ ] T014 [P] [US1] Add guardrail tests for supported, unrelated, and weak-evidence questions in `backend/tests/unit/test_guardrails.py`
- [ ] T015 [P] [US1] Add vector retrieval tests for top-k chunk results and citation metadata in `backend/tests/unit/test_vector_retrieval.py`
- [ ] T016 [P] [US1] Add mentor service tests for grounded, guardrail-blocked, and limited-evidence runs in `backend/tests/unit/test_mentor_service.py`
- [ ] T017 [P] [US1] Add route integration tests for `POST /premium/mentor/messages` grounded answers and guardrail responses in `backend/tests/integration/test_mentor_routes.py`

### Implementation for User Story 1

- [ ] T018 [US1] Implement deterministic R2 markdown chunking, metadata extraction, hashing, embedding calls, and pgvector upserts in `backend/src/services/content_indexer.py`
- [ ] T019 [US1] Implement pgvector similarity lookup returning course chunks and relevance scores in `backend/src/services/vector_retrieval.py`
- [ ] T020 [US1] Implement Agents SDK retrieval function tools in `backend/src/agents/tools.py`
- [ ] T021 [US1] Implement input, output, and tool guardrails with deterministic guardrail codes in `backend/src/agents/guardrails.py`
- [ ] T022 [US1] Implement the OpenAI Agents SDK mentor agent with LiteLLM model configuration and latest-20-message context handling in `backend/src/agents/openai_mentor_agent.py`
- [ ] T023 [US1] Implement `MentorService.send_message()` orchestration for text validation, Pro access, thread creation, learner/mentor persistence, citations, and no progress/quiz/access side effects in `backend/src/services/mentor.py`
- [ ] T024 [US1] Implement `POST /premium/mentor/messages` in `backend/src/routers/premium/mentor.py`

**Checkpoint**: US1 is functional and testable independently.

---

## Phase 4: User Story 2 - Continue a Thread (Priority: P2)

**Goal**: A Pro learner can return to prior mentor threads, see full message history, continue with context, and manually rename the thread.

**Independent Test**: Create a thread, send messages, reload, verify ordered history, send a follow-up using context, rename the thread, and verify the title persists.

### Tests for User Story 2

- [ ] T025 [P] [US2] Add mentor service tests for list/get thread ownership, full history ordering, latest-20 context selection, and rename validation in `backend/tests/unit/test_mentor_service.py`
- [ ] T026 [P] [US2] Add route integration tests for `GET /premium/mentor/threads`, `POST /premium/mentor/threads`, `GET /premium/mentor/threads/{thread_id}`, and `PATCH /premium/mentor/threads/{thread_id}` in `backend/tests/integration/test_mentor_routes.py`

### Implementation for User Story 2

- [ ] T027 [US2] Implement thread creation, listing with message counts, owned thread detail, rename, and ownership isolation methods in `backend/src/services/mentor.py`
- [ ] T028 [US2] Implement thread routes for list, create, detail, and rename in `backend/src/routers/premium/mentor.py`
- [ ] T029 [US2] Ensure `MentorService.send_message()` appends follow-up turns to existing owned threads and supplies only the latest 20 messages to `backend/src/agents/openai_mentor_agent.py`

**Checkpoint**: US2 can be validated without web UI.

---

## Phase 5: User Story 3 - Stay Within Usage Limits (Priority: P3)

**Goal**: A Pro learner can send up to five valid text mentor messages per UTC day; the sixth valid text message is blocked until 00:00 UTC.

**Independent Test**: Send five valid Pro learner text messages, then verify the sixth returns `429` with reset time at the next UTC midnight and that the limit applies across threads.

### Tests for User Story 3

- [ ] T030 [P] [US3] Add unit tests for usage counting, UTC reset calculation, cross-thread limits, guardrail-blocked counting, and non-text/non-Pro exclusions in `backend/tests/unit/test_mentor_service.py`
- [ ] T031 [P] [US3] Add integration tests for `GET /premium/mentor/usage` and `429` quota responses in `backend/tests/integration/test_mentor_routes.py`

### Implementation for User Story 3

- [ ] T032 [US3] Implement atomic UTC-date quota read/increment and reset time calculation in `backend/src/services/mentor.py`
- [ ] T033 [US3] Wire quota enforcement into `MentorService.send_message()` after Pro and text validation but before agent execution in `backend/src/services/mentor.py`
- [ ] T034 [US3] Implement `GET /premium/mentor/usage` and `429` quota response contract in `backend/src/routers/premium/mentor.py`

**Checkpoint**: US3 quota behavior is testable by API only.

---

## Phase 6: User Story 4 - Access Control and Input Rules (Priority: P4)

**Goal**: Only Pro learners can use mentor endpoints, and mentor message submission accepts text only.

**Independent Test**: Attempt mentor access as non-Pro and unauthenticated users, then attempt non-text input as a Pro learner and verify requests are blocked before agent work.

### Tests for User Story 4

- [ ] T035 [P] [US4] Add service tests proving non-Pro and non-text attempts do not create threads, messages, usage records, or agent runs in `backend/tests/unit/test_mentor_service.py`
- [ ] T036 [P] [US4] Add route integration tests for `401`, `403`, and `415` mentor responses in `backend/tests/integration/test_mentor_routes.py`

### Implementation for User Story 4

- [ ] T037 [US4] Implement reusable server-side Pro access enforcement for mentor operations in `backend/src/services/mentor.py`
- [ ] T038 [US4] Apply authentication and Pro checks to every route in `backend/src/routers/premium/mentor.py`
- [ ] T039 [US4] Implement text-only payload checks and non-text rejection behavior in `backend/src/routers/premium/mentor.py` and `backend/src/services/mentor.py`

**Checkpoint**: US4 access and input behavior is testable by API only.

---

## Phase 7: Web ChatKit Experience

**Purpose**: Expose the completed backend mentor feature as a floating ChatKit bubble and pop-up in the authenticated web app shell.

**Depends on**: Backend user stories required by the ChatKit server path.

### Tests

- [ ] T040 [P] Add ChatKit client helper tests for direct FastAPI endpoint calls and auth header handling in `web-app/src/lib/chatkit.test.ts`
- [ ] T041 [P] Add mentor chat component tests for Pro-visible launcher, non-Pro hidden/blocked state, open/close behavior, and rename affordance in `web-app/src/components/mentor-chat.test.tsx`

### Implementation

- [ ] T042 Implement ChatKit Python server processing glue backed by `MentorService` in `backend/src/services/chatkit_server.py`
- [ ] T043 Implement `POST /premium/mentor/chatkit` in `backend/src/routers/premium/mentor.py`
- [ ] T044 Add direct FastAPI ChatKit client helper in `web-app/src/lib/chatkit.ts`
- [ ] T045 Implement floating chat bubble and pop-up ChatKit window in `web-app/src/components/mentor-chat.tsx`
- [ ] T046 Mount `MentorChat` in the authenticated app shell in `web-app/src/app/layout.tsx` without adding `web-app/src/app/mentor` or `web-app/src/app/api/mentor`

**Checkpoint**: Pro learners can use the mentor from existing web app pages.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validate contracts, quickstart, performance expectations, and documentation after all selected stories are complete.

- [ ] T047 [P] Add focused configuration tests for mentor settings validation in `backend/tests/unit/test_config.py`
- [ ] T048 [P] Update `specs/007-ai-course-mentor/quickstart.md` if implementation commands or environment names changed
- [ ] T049 Run backend checks: `cd backend && uv run pytest tests/unit/test_config.py tests/unit/test_mentor_service.py tests/unit/test_guardrails.py tests/unit/test_vector_retrieval.py tests/integration/test_mentor_routes.py`
- [ ] T050 Run web checks: `cd web-app && npm run typecheck && npm run test`
- [ ] T051 Manually verify quickstart scenarios for Pro access, non-Pro block, supported answer citations, weak evidence, unrelated guardrail, five-message quota, non-text rejection, rename persistence, full history display, and latest-20 response context
- [ ] T052 Review generated OpenAPI docs against `specs/007-ai-course-mentor/contracts/openapi.yaml` for endpoint and schema drift

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: No dependencies
- **Phase 2 Foundational**: Depends on Phase 1 and blocks all user stories
- **Phase 3 US1**: Depends on Phase 2; MVP
- **Phase 4 US2**: Depends on Phase 2; follow-up context task T029 depends on US1 agent context behavior
- **Phase 5 US3**: Depends on Phase 2; quota wiring into message send depends on T023
- **Phase 6 US4**: Depends on Phase 2; route application overlaps with all mentor endpoints
- **Phase 7 Web ChatKit Experience**: Depends on backend mentor routes and service behavior from Phases 3-6
- **Phase 8 Polish**: Depends on all implemented phases

### User Story Dependencies

- **US1 (P1)**: First deliverable; establishes grounded answer flow
- **US2 (P2)**: Can begin after foundation, but context continuation relies on US1 message orchestration
- **US3 (P3)**: Can begin after foundation and should be integrated before web ChatKit is exposed
- **US4 (P4)**: Can begin after foundation and must be applied to every endpoint before demo

### Within Each User Story

- Write tests before implementation and confirm they fail for the missing behavior
- Models and schemas before services
- Services before routers
- Agent/tool/guardrail code before grounded message route completion
- Route behavior before web ChatKit integration

---

## Parallel Opportunities

- T003, T004, and T005 can run in parallel after T001/T002 decisions are clear
- T008, T009, T010, T011, and T013 can run in parallel after models/migration shape is understood
- Test tasks within each user story are parallelizable because they target different behavior slices
- US2, US3, and US4 service tests can be drafted in parallel after Phase 2
- Web helper and component tests T040/T041 can run in parallel after backend contracts stabilize

---

## Parallel Example: Backend MVP

```bash
# After Phase 2 is complete, split US1 test work:
Task: "Add guardrail tests in backend/tests/unit/test_guardrails.py"
Task: "Add vector retrieval tests in backend/tests/unit/test_vector_retrieval.py"
Task: "Add mentor service tests in backend/tests/unit/test_mentor_service.py"
Task: "Add route integration tests in backend/tests/integration/test_mentor_routes.py"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) for grounded Pro mentor answers.
3. Validate with backend tests and one supported course question.
4. Add US2 thread continuity, then US3 quota, then US4 access/input hardening.
5. Add the web ChatKit bubble only after backend behavior is stable.

### Incremental Delivery

1. Foundation: schema, models, config, service/agent shells
2. Grounded answer flow: retrieval, guardrails, mentor agent, send endpoint
3. Thread continuity: list/detail/rename/history/context
4. Usage and access hardening: UTC quota, Pro-only, text-only
5. Web experience: ChatKit server endpoint, React launcher, shell mount
6. Polish: quickstart, contract drift, full checks

---

## Notes

- `[P]` tasks are safe to run in parallel because they touch different files or independent test files.
- Do not add backend LLM calls outside premium mentor code paths.
- Do not add a standalone `web-app/src/app/mentor` page.
- Do not add Next.js API proxy routes for mentor; the web app calls FastAPI directly.
- Do not count non-Pro or non-text attempts against the daily quota.
- Count valid Pro learner text submissions even when guardrails block the answer or evidence is limited.
