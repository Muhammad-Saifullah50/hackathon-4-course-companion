# Implementation Plan: Progress, Streaks, Search & Access Control

**Branch**: `004-progress-streaks-search-access` | **Date**: 2026-06-05 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/004-progress-streaks-search-access/spec.md`

## Summary

Adds four deterministic backend capabilities to the FastAPI Course Companion: (1) chapter completion tracking with upsert semantics, (2) daily streak calculation with UTC day boundaries, (3) in-memory keyword search over the pre-warmed chapter cache, and (4) an access tier check endpoint. All logic is rule-based — zero LLM calls, compliant with Phase 1 constraints.

## Technical Context

**Language/Version**: Python 3.12  
**Primary Dependencies**: FastAPI, Pydantic v2, SQLAlchemy 2.0 async, asyncpg, Stytch (JWT auth), boto3 (R2 search cache)  
**Storage**: Neon PostgreSQL (progress + user streak fields); Cloudflare R2 (chapter content — cached in-process for search)  
**Testing**: pytest with pytest-asyncio; httpx AsyncClient for integration tests  
**Target Platform**: Linux server (Vercel / local dev)  
**Project Type**: Web application (backend only for this feature)  
**Performance Goals**: Completion PUT < 500 ms p95; progress GET < 200 ms; search < 300 ms  
**Constraints**: Zero LLM imports; all dates UTC; chapter cache pre-warmed at startup; search returns 503 if cache cold  
**Scale/Scope**: ~50 chapters; single Neon DB; one user table + one new progress table

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Zero LLM imports in Phase 1 | PASS | No `anthropic`, `openai`, `langchain` touched |
| Cloudflare R2 used for content | PASS | Search uses `ContentService._chapter_cache` (R2-backed) |
| Repository/service layer for DB | PASS | All DB access via service classes, not route handlers |
| Pydantic v2 models for all I/O | PASS | New models added in `src/models/` |
| `pydantic-settings` for env config | PASS | Config extends existing `Settings` class |
| No raw SQL | PASS | SQLAlchemy ORM + `insert().on_conflict_do_update()` |
| JWT auth on every endpoint | PASS | `get_current_user` dependency applied to all routers |
| Server-side access control | PASS | `access_tier` read from DB, not trusted from client |

**Gate result: ALL PASS — proceed to Phase 0**

## Project Structure

### Documentation (this feature)

```text
specs/004-progress-streaks-search-access/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── openapi.yaml
└── tasks.md             # Phase 2 output (/sp.tasks — NOT created here)
```

### Source Code

```text
backend/
├── src/
│   ├── db/
│   │   └── models.py              # ADD: ChapterProgress; EXTEND: User with streak fields
│   ├── models/
│   │   ├── progress.py            # NEW: CompletionRequest, CompletionResponse, ProgressResponse
│   │   ├── search.py              # NEW: SearchResult, SearchResponse
│   │   └── access.py              # NEW: AccessStatus
│   ├── services/
│   │   ├── progress.py            # NEW: ProgressService (upsert, streak calc, read)
│   │   └── search.py              # NEW: SearchService (in-memory ranking over chapter cache)
│   └── routers/
│       ├── progress.py            # NEW: PUT/GET /users/{user_id}/progress
│       ├── search.py              # NEW: GET /search
│       └── access.py              # NEW: GET /access/check
├── migrations/versions/
│   └── 002_add_progress_and_streaks.py  # NEW: chapter_progress table + User streak columns
└── tests/
    ├── unit/
    │   └── test_streak_logic.py   # NEW: pure streak calculation unit tests
    └── integration/
        ├── test_progress.py       # NEW
        ├── test_search.py         # NEW
        └── test_access.py         # NEW
```

**Structure Decision**: Web application (backend only). Follows existing `src/routers/`, `src/services/`, `src/models/`, `src/db/models.py` pattern already established in features 001–003.

## Complexity Tracking

> No constitution violations — section not needed.
