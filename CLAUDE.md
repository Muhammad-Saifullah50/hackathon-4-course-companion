# Claude Code Rules

## Project Context

See @AGENTS.md for universal project guidelines (tech stack, directory structure, key commands, coding conventions).

See @.specify/memory/constitution.md for the project constitution — the immutable architecture, quality, and security principles governing this project.

**Course**: AI Agent Development | **Hackathon**: Panaversity Agent Factory IV
**Critical**: Phase 1 backend must have ZERO LLM calls — disqualifier if violated.

## Project Structure

- `.specify/memory/constitution.md` — Project principles
- `specs/<feature>/spec.md` — Feature requirements
- `specs/<feature>/plan.md` — Architecture decisions
- `specs/<feature>/tasks.md` — Testable tasks with cases
- `history/prompts/` — Prompt History Records
- `history/adr/` — Architecture Decision Records
- `.specify/` — SpecKit Plus templates and scripts

## Code Standards

See `.specify/memory/constitution.md` for code quality, testing, performance, security, and architecture principles.

## Active Technologies
- Python 3.12 + FastAPI, Pydantic v2, boto3 (S3-compatible R2 client), pytest (002-quiz-grading)
- Cloudflare R2 for quiz JSON files — no DB writes for this feature (002-quiz-grading)
- Python 3.12 (backend + MCP server) (003-stytch-auth)
- Neon PostgreSQL via SQLAlchemy 2.0 async ORM (one new `users` table) (003-stytch-auth)
- Python 3.12 + FastAPI, Pydantic v2, SQLAlchemy 2.0 async, asyncpg, Stytch (JWT auth), boto3 (R2 search cache) (004-progress-streaks-search-access)
- Neon PostgreSQL (progress + user streak fields); Cloudflare R2 (chapter content — cached in-process for search) (004-progress-streaks-search-access)

## Recent Changes
- 002-quiz-grading: Added Python 3.12 + FastAPI, Pydantic v2, boto3 (S3-compatible R2 client), pytest
