# Tasks: Rule-Based Quiz Grading

**Input**: Design documents from `/specs/002-quiz-grading/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/openapi.yaml ✅

**Tech stack**: Python 3.12, FastAPI, Pydantic v2, boto3, pytest + httpx AsyncClient  
**New files**: `backend/src/models/quiz.py`, `backend/src/services/quiz.py`, `backend/src/routers/quizzes.py`, `backend/tests/test_quizzes.py`, `content/quizzes/*.json`  
**Modified files**: `backend/src/core/dependencies.py`, `backend/src/main.py`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm environment and create the `content/quizzes/` directory.

- [X] T001 Verify `uv sync` succeeds and `uv run pytest` exits 0 in `backend/` (no regressions from feature 1)
- [X] T002 Create `content/quizzes/` directory (for local quiz JSON files used in tests)

**Checkpoint**: Backend runs, existing tests pass, quiz content directory exists.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared models, service skeleton, DI wiring, and router registration. Nothing in Phase 3+ can start until this phase is complete.

**⚠️ CRITICAL**: All US phases depend on this.

- [X] T003 Create `backend/src/models/quiz.py` with all Pydantic v2 models: `AnswerOption`, `Question` (internal, includes `correct_answer` and `explanation`), `QuizFile` (internal, with `@model_validator` validating `correct_answer` is in option labels and all question IDs are unique), `QuestionPublic` (no `correct_answer`/`explanation`), `QuizPublic`, `AnswerSubmission`, `GradedResult`
- [X] T004 Create `backend/src/services/quiz.py` with `QuizNotFoundError`, `QuizValidationError` exception classes and `QuizService` class skeleton: lazy boto3 S3 client property `_r2` (same pattern as `ContentService`), private `_fetch_quiz_from_r2(chapter_slug: str) -> QuizFile` (fetches `quizzes/{chapter_slug}.json` from R2, raises `QuizNotFoundError` on 404/NoSuchKey, `ServiceUnavailableError` on other errors), private `async _fetch_with_retry(chapter_slug: str) -> QuizFile` (two attempts, then raises `ServiceUnavailableError`)
- [X] T005 Add `QuizServiceDep` to `backend/src/core/dependencies.py` — singleton factory with `lru_cache(maxsize=1)`, typed as `Annotated[QuizService, Depends(get_quiz_service)]`
- [X] T006 Register quizzes router in `backend/src/main.py`: `app.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])` — import the router from `src.routers.quizzes` (file created in T008)
- [X] T007 [P] Create minimal `content/quizzes/mcp-introduction.json` fixture file with at least 2 questions conforming to the schema in `data-model.md` (used by tests in T009/T014)

**Checkpoint**: `uv run python -c "from src.models.quiz import QuizFile, GradedResult; print('ok')"` succeeds from `backend/`. All existing tests still pass.

---

## Phase 3: User Story 1 — Retrieve Quiz Questions (P1) 🎯 MVP

**Goal**: `GET /quizzes/{chapter_slug}` returns questions with answer options — no correct answer or explanation in the response.

**Independent Test**: `curl http://localhost:8000/quizzes/mcp-introduction` returns questions array; response JSON contains no `correct_answer` or `explanation` fields at any nesting level.

### Tests for User Story 1

> **Write these tests first and confirm they FAIL (404 or AttributeError) before implementing T011**

- [X] T008 [P] [US1] Create `backend/tests/test_quizzes.py` with `AsyncClient` fixture (using `httpx.AsyncClient(app=app, base_url="http://test")`) and test for GET happy path: mock `QuizService.get_quiz_public` to return a `QuizPublic` fixture; assert status 200, response has `chapter_slug` and `questions`, and no `correct_answer`/`explanation` in any question
- [X] T009 [P] [US1] Add test in `backend/tests/test_quizzes.py` for GET 404: mock service raises `QuizNotFoundError`; assert status 404 and `detail` key in response body
- [X] T010 [P] [US1] Add test in `backend/tests/test_quizzes.py` for GET 503: mock service raises `ServiceUnavailableError`; assert status 503

### Implementation for User Story 1

- [X] T011 [US1] Add `get_quiz_public(self, chapter_slug: str) -> QuizPublic` to `QuizService` in `backend/src/services/quiz.py`: calls `_fetch_with_retry`, builds `QuizPublic` by mapping each `Question` to `QuestionPublic` (strips `correct_answer` and `explanation`)
- [X] T012 [US1] Create `backend/src/routers/quizzes.py` with `GET /{chapter_slug}` endpoint: calls `service.get_quiz_public(chapter_slug)`, maps `QuizNotFoundError` → 404, `ServiceUnavailableError` → 503; `response_model=QuizPublic`

**Checkpoint**: `GET /quizzes/mcp-introduction` returns HTTP 200 with questions array (using mocked service). All T008–T010 tests pass. Response contains NO `correct_answer` or `explanation`.

---

## Phase 4: User Story 2 — Submit Answer and Get Immediate Feedback (P1)

**Goal**: `POST /quizzes/{chapter_slug}/submit` returns verdict, correct answer, and explanation for the submitted question.

**Independent Test**: `POST /quizzes/mcp-introduction/submit` with `{"question_id": "q1", "selected_answer": "A"}` returns `{"question_id": "q1", "is_correct": true/false, "correct_answer": "A", "explanation": "..."}` within 2 seconds.

### Tests for User Story 2

> **Write these tests first and confirm they FAIL before implementing T016**

- [X] T013 [P] [US2] Add test in `backend/tests/test_quizzes.py` for POST happy path (correct answer): mock `QuizService.grade_submission` returning a `GradedResult` with `is_correct=True`; assert status 200, all four response fields present
- [X] T014 [P] [US2] Add test in `backend/tests/test_quizzes.py` for POST happy path (incorrect answer): mock returns `GradedResult` with `is_correct=False`; assert `correct_answer` and `explanation` still present
- [X] T015 [P] [US2] Add test in `backend/tests/test_quizzes.py` for POST 400 unknown question_id: mock service raises `QuizValidationError`; assert status 400 with informative `detail`
- [X] T016 [P] [US2] Add test in `backend/tests/test_quizzes.py` for POST 404 missing quiz: mock raises `QuizNotFoundError`; assert status 404

### Implementation for User Story 2

- [X] T017 [US2] Add `grade_submission(self, chapter_slug: str, submission: AnswerSubmission) -> GradedResult` to `QuizService` in `backend/src/services/quiz.py`: calls `_fetch_with_retry`, finds question by `submission.question_id` (raises `QuizValidationError` if not found), returns `GradedResult(question_id=..., is_correct=submission.selected_answer == q.correct_answer, correct_answer=q.correct_answer, explanation=q.explanation)`
- [X] T018 [US2] Add `POST /{chapter_slug}/submit` endpoint to `backend/src/routers/quizzes.py`: accepts `AnswerSubmission` body, calls `service.grade_submission`, maps `QuizNotFoundError` → 404, `QuizValidationError` → 400, `ServiceUnavailableError` → 503; `response_model=GradedResult`

**Checkpoint**: All T013–T016 tests pass. Full quiz flow end-to-end: GET questions → POST answer → receive feedback. Grading accuracy 100% against static answer key.

---

## Phase 5: User Story 3 — Quiz Data Authored and Stored in Content Bank (P2)

**Goal**: Quiz JSON files for all 5 course chapters are authored, schema-validated, and ready to upload to R2.

**Independent Test**: `uv run python -c "import json; from src.models.quiz import QuizFile; [QuizFile.model_validate(json.load(open(f))) for f in ['../content/quizzes/mcp-introduction.json', ...]]"` runs without errors from `backend/`.

- [X] T019 [P] [US3] Create `content/quizzes/mcp-introduction.json` with 5 MCQ questions on MCP fundamentals, each with 4 options, `correct_answer` matching a label, and a non-trivial `explanation` — conforming to the `QuizFile` schema in `data-model.md`
- [X] T020 [P] [US3] Create `content/quizzes/claude-agent-sdk-foundations.json` with 5 MCQ questions on Claude Agent SDK foundations
- [X] T021 [P] [US3] Create `content/quizzes/claude-agent-sdk-advanced.json` with 5 MCQ questions on advanced Claude Agent SDK usage
- [X] T022 [P] [US3] Create `content/quizzes/mcp-building-servers.json` with 5 MCQ questions on building MCP servers
- [X] T023 [P] [US3] Create `content/quizzes/agent-skills.json` with 5 MCQ questions on agent skills
- [X] T024 [US3] Add schema validation test in `backend/tests/test_quizzes.py`: load each of the 5 quiz JSON files from `content/quizzes/` via `QuizFile.model_validate()` and assert no validation errors — catches authoring mistakes before upload

**Checkpoint**: `uv run pytest tests/test_quizzes.py::test_quiz_schema_validation -v` passes for all 5 chapter quiz files.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T025 [P] Run Phase 1 compliance check: `grep -r "anthropic\|openai\|langchain\|litellm" backend/src/routers/quizzes.py backend/src/services/quiz.py backend/src/models/quiz.py` — must return no output
- [X] T026 Run full test suite `uv run pytest --cov=src tests/` from `backend/` and confirm ≥ 80% coverage on `src/models/quiz.py` and `src/services/quiz.py`
- [X] T027 [P] Verify `GET /quizzes/{slug}` response schema matches `contracts/openapi.yaml` by inspecting FastAPI's generated `/openapi.json` — confirm `QuizPublic` shape, no `correct_answer`/`explanation` fields, correct 404/503 error bodies

**Checkpoint**: Zero LLM imports confirmed. Coverage ≥ 80%. OpenAPI spec matches contracts.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **US1 (Phase 3)**: Depends on Phase 2 only
- **US2 (Phase 4)**: Depends on Phase 2; integrates with Phase 3 router file (T012) but independently testable
- **US3 (Phase 5)**: Depends on Phase 2 models (T003) only — quiz JSON files can be authored in parallel with Phases 3–4
- **Polish (Phase 6)**: Depends on Phases 3, 4, 5

### Within Each Phase

```
Phase 2: T003 (models) → T004 (service) → T005 (DI) → T006 (router reg) [T007 parallel with T003+]
Phase 3: T008–T010 (tests, write first) → T011 (service method) → T012 (endpoint)
Phase 4: T013–T016 (tests, write first) → T017 (service method) → T018 (endpoint)
Phase 5: T019–T023 [all parallel] → T024 (schema validation test)
```

### User Story Dependencies

- **US1**: No dependency on US2 or US3
- **US2**: Uses same `QuizService` and router file as US1 (T011, T012) — implement after US1 is functional
- **US3**: Depends only on models (T003) — can be authored in parallel with US1/US2 development

### Parallel Opportunities

Within Phase 2: T003 and T007 can run in parallel  
Within Phase 3: T008, T009, T010 can all run in parallel  
Within Phase 4: T013, T014, T015, T016 can all run in parallel  
Within Phase 5: T019, T020, T021, T022, T023 can all run in parallel  
Within Phase 6: T025 and T027 can run in parallel  

---

## Parallel Example: Phase 3 (US1)

```
# Write all three GET tests in parallel:
Task T008: "Happy path test for GET /quizzes/{chapter_slug} in backend/tests/test_quizzes.py"
Task T009: "404 test for GET /quizzes/{chapter_slug} in backend/tests/test_quizzes.py"
Task T010: "503 test for GET /quizzes/{chapter_slug} in backend/tests/test_quizzes.py"

# Then implement:
Task T011: "get_quiz_public method in backend/src/services/quiz.py"
Task T012: "GET endpoint in backend/src/routers/quizzes.py"
```

---

## Implementation Strategy

### MVP First (US1 only — question delivery)

1. Phase 1: Setup (T001–T002)
2. Phase 2: Foundational (T003–T007)
3. Phase 3: US1 tests (T008–T010), then implementation (T011–T012)
4. **STOP and VALIDATE**: `GET /quizzes/{slug}` returns questions with no answer key
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → question serving works → demo (MVP)
3. Add US2 → grading works → full quiz flow demo
4. Add US3 → all chapter quizzes authored → production ready
5. Polish → compliance + coverage verified

### Suggested MVP Scope

**Phase 1 + Phase 2 + Phase 3** = complete question-serving capability.  
US2 (grading) is equally P1 but depends on US1's router file (T012) being in place first.

---

## Notes

- `[P]` tasks touch different files — safe to run in parallel with no merge conflicts
- Tests must be written and failing before their corresponding implementation tasks
- `QuizFile` (internal) is never returned by any route — `response_model=QuizPublic` is the safety net
- `ServiceUnavailableError` is shared with `ContentService` — import from `src.services.content`
- No DB writes anywhere in this feature — grading is a pure function over in-memory `QuizFile`
- Commit after each checkpoint: `feat(quiz): ...` format
