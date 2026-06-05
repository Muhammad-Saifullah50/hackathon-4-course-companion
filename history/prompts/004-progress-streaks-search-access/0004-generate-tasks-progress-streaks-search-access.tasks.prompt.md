---
id: "0004"
title: generate-tasks-progress-streaks-search-access
stage: tasks
date: 2026-06-05
surface: claude-code
model: claude-sonnet-4-6
feature: 004-progress-streaks-search-access
branch: 004-progress-streaks-search-access
user: Muhammad
command: /sp.tasks
labels: [tasks, progress, streaks, search, access-control, phase-1]
links:
  spec: specs/004-progress-streaks-search-access/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/004-progress-streaks-search-access/tasks.md
tests:
  - backend/tests/unit/test_streak_logic.py
  - backend/tests/integration/test_progress.py
  - backend/tests/integration/test_search.py
  - backend/tests/integration/test_access.py
---

## Prompt

/sp.tasks — Generate tasks.md for feature 004-progress-streaks-search-access (Progress tracking, streak calculation, keyword search, access tier check). Input: plan.md, spec.md, data-model.md, contracts/openapi.yaml, research.md, quickstart.md.

## Response snapshot

Generated `specs/004-progress-streaks-search-access/tasks.md` with 23 tasks across 8 phases organized by user story:

- Phase 1 (Setup): 1 task — Alembic migration 002_add_progress_and_streaks.py
- Phase 2 (Foundational): 6 tasks — ORM extensions (User + ChapterProgress), 3 parallel Pydantic model files, router registration
- Phase 3 (US1, P1): 4 tasks — ProgressService.record_completion() with upsert + streak helper, PUT /users/{user_id}/progress, integration tests
- Phase 4 (US2, P1): 3 tasks — ProgressService.get_progress(), GET /users/{user_id}/progress, integration tests
- Phase 5 (US3, P2): 1 task — unit tests for _update_streak() covering all 4 streak state-machine conditions
- Phase 6 (US4, P2): 3 tasks — SearchService (in-memory cache scan, ranking), GET /search route, integration tests
- Phase 7 (US5, P3): 3 tasks — AccessService, GET /access/check route, integration tests
- Phase 8 (Polish): 2 tasks — quickstart validation, full test suite with coverage

MVP scope identified: Phase 1 + Phase 2 + US1 + US2 = 14 tasks to a working learning tracker.

## Outcome

- ✅ Impact: Fully actionable tasks.md ready for /sp.implement — each task has exact file path, task ID, parallelism label, and story label
- 🧪 Tests: 4 test files planned (1 unit, 3 integration); test tasks written first within each story phase
- 📁 Files: specs/004-progress-streaks-search-access/tasks.md
- 🔁 Next prompts: /sp.implement to execute tasks; or /sp.clarify if any task is ambiguous
- 🧠 Reflection: US3 (streak correctness) placed as its own phase after US1 since it tests the pure helper extracted in US1 implementation — cleaner dependency than embedding streak unit tests inside US1

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a
