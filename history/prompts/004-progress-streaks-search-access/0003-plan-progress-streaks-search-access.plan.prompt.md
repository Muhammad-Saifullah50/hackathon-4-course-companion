---
id: "0003"
title: plan-progress-streaks-search-access
stage: plan
date: 2026-06-05
surface: claude-code
model: claude-sonnet-4-6
feature: 004-progress-streaks-search-access
branch: 004-progress-streaks-search-access
user: Muhammad
command: /sp.plan
labels: [plan, progress, streaks, search, access, phase1]
links:
  spec: specs/004-progress-streaks-search-access/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/004-progress-streaks-search-access/plan.md
  - specs/004-progress-streaks-search-access/research.md
  - specs/004-progress-streaks-search-access/data-model.md
  - specs/004-progress-streaks-search-access/quickstart.md
  - specs/004-progress-streaks-search-access/contracts/openapi.yaml
tests:
  - tests/unit/test_streak_logic.py (planned)
  - tests/integration/test_progress.py (planned)
  - tests/integration/test_search.py (planned)
  - tests/integration/test_access.py (planned)
---

## Prompt

/sp.plan — Generate implementation plan for feature 004-progress-streaks-search-access (progress tracking, streak calculation, keyword search, access tier check).

## Response snapshot

Ran `setup-plan.sh --json` to locate the spec and plan template. Read the feature spec (chapter completion with upsert semantics, streak state machine, in-memory keyword search, access tier check). Analysed the existing backend (FastAPI, SQLAlchemy 2.0 async, Stytch auth, ContentService with chapter cache). All Phase 1 constitution gates pass (zero LLM calls). Generated:

- **plan.md** — technical context, constitution check (all PASS), concrete source tree.
- **research.md** — six decisions: SQLAlchemy PostgreSQL upsert pattern, pure-Python streak state machine, in-memory substring search with title/body ranking, access tier read from DB, Stytch auth reuse, single Alembic migration strategy.
- **data-model.md** — `User` extension (current_streak + last_active_date), new `ChapterProgress` table, Pydantic models (CompletionRequest/Response, ProgressResponse, SearchResult/Response, AccessStatus), streak state machine diagram, Alembic migration skeleton.
- **contracts/openapi.yaml** — full OpenAPI 3.1 spec for PUT/GET `/users/{user_id}/progress`, GET `/search`, GET `/access/check` with all response codes.
- **quickstart.md** — step-by-step dev guide: migration, server startup, curl examples for all four endpoints, test run instructions.
- Ran `update-agent-context.sh claude` — CLAUDE.md updated with new framework/DB additions for this feature.

## Outcome

- ✅ Impact: Full implementation blueprint produced; zero constitution violations; all six research decisions documented with alternatives.
- 🧪 Tests: Planned in four files (streak unit tests + three integration suites); not yet written — will be created in /sp.tasks.
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/openapi.yaml, CLAUDE.md updated.
- 🔁 Next prompts: /sp.tasks to generate tasks.md; then /sp.implement.
- 🧠 Reflection: In-memory search avoids Postgres FTS complexity for ~50 chapters; streak denormalization on the user row is the right tradeoff at this scale; SQLAlchemy async upsert via `on_conflict_do_update` is clean and atomic.

## Evaluation notes (flywheel)

- Failure modes observed: None — all gates passed, no NEEDS CLARIFICATION remaining.
- Graders run and results (PASS/FAIL): Constitution check manual — PASS.
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Consider adding a `limit` param to the progress GET endpoint if user chapter counts grow beyond 50.
