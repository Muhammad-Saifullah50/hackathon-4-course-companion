---
id: "0004"
title: quiz-grading-tasks-generated
stage: tasks
date: 2026-06-03
surface: claude-code
model: claude-sonnet-4-6
feature: 002-quiz-grading
branch: 002-quiz-grading
user: Muhammad
command: /sp.tasks
labels: [tasks, quiz-grading, fastapi, r2, stateless]
links:
  spec: specs/002-quiz-grading/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/002-quiz-grading/tasks.md
tests:
  - backend/tests/test_quizzes.py (planned in tasks)
---

## Prompt

/sp.tasks — invoked on branch 002-quiz-grading to generate the implementation task list for the Rule-Based Quiz Grading feature, based on plan.md, spec.md, data-model.md, contracts/openapi.yaml, and research.md.

## Response snapshot

Generated `specs/002-quiz-grading/tasks.md` with 27 tasks across 6 phases:

**Phase 1 — Setup (T001–T002, 2 tasks)**: Verify existing tests pass; create `content/quizzes/` directory.

**Phase 2 — Foundational (T003–T007, 5 tasks)**: Create `backend/src/models/quiz.py` (all Pydantic models including `@model_validator`); create `backend/src/services/quiz.py` (QuizService skeleton with R2 client, retry logic, error types); add `QuizServiceDep` to `dependencies.py`; register quizzes router in `main.py`; create `mcp-introduction.json` fixture.

**Phase 3 — US1: GET questions (T008–T012, 5 tasks)**: Three parallel tests (happy path, 404, 503); `get_quiz_public` service method; GET endpoint in `quizzes.py` router.

**Phase 4 — US2: POST submit (T013–T018, 6 tasks)**: Four parallel tests; `grade_submission` service method; POST endpoint in `quizzes.py` router.

**Phase 5 — US3: Quiz content bank (T019–T024, 6 tasks)**: Five parallel quiz JSON files for all course chapters; schema validation test.

**Phase 6 — Polish (T025–T027, 3 tasks)**: LLM import compliance check; coverage ≥ 80% verification; OpenAPI spec match validation.

**Total**: 27 tasks | **Parallel opportunities**: 17 tasks marked [P] | **MVP scope**: Phases 1–3

## Outcome

- ✅ Impact: Fully executable task list ready for /sp.implement
- 🧪 Tests: T008–T010 (US1), T013–T016 (US2), T024 (US3 schema) — write-first TDD approach
- 📁 Files: specs/002-quiz-grading/tasks.md created
- 🔁 Next prompts: /sp.implement to execute tasks
- 🧠 Reflection: US1 and US2 share the same router file and service — US2 must follow US1 (T012). US3 content authoring can run in parallel with US1/US2 since it only depends on T003 (models).

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
