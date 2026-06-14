# Course Companion FTE — Agent Context

Universal project guidelines for all AI coding agents (Claude Code, Gemini CLI, Cursor, OpenCode, etc.).

---

## Project Overview

**Course Companion FTE** is a Digital Full-Time Equivalent educational tutor built for Panaversity Hackathon IV. It delivers AI Agent Development course content via two frontends:

1. **ChatGPT App** (Phase 1 & 2) — Conversational tutoring inside ChatGPT via OpenAI Apps SDK (MCP). Backend is deterministic in Phase 1 (zero LLM calls). Phase 2 adds premium hybrid features.
2. **Web App** (Phase 3) — Standalone Next.js LMS dashboard with full features.

Both frontends share **one FastAPI backend**. The course topic is **AI Agent Development** (Claude Agent SDK, MCP, Agent Skills).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, Pydantic v2 |
| Database | Neon (PostgreSQL via SQLAlchemy) |
| Content Storage | Cloudflare R2 (chapters, quizzes, media) |
| ChatGPT Frontend | OpenAI Apps SDK (MCP server) |
| Web Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| LLM (Phase 2 only) | Nvidia Nemotron via Openrouter |
| Testing | pytest (backend), Jest/Playwright (frontend) |
| Deployment | Vercel (backend), Vercel (web frontend) |

---

## Directory Structure

```
hackathon-4-course-companion/
├── backend/                  # FastAPI backend (all phases)
│   ├── src/
│   │   ├── main.py           # FastAPI app entrypoint
│   │   ├── routers/          # Route handlers by feature
│   │   │   ├── content.py    # Chapter delivery & navigation
│   │   │   ├── quizzes.py    # Rule-based quiz grading
│   │   │   ├── progress.py   # Progress tracking & streaks
│   │   │   ├── search.py     # Keyword/semantic search
│   │   │   ├── access.py     # Freemium gate
│   │   │   └── premium/      # Phase 2 hybrid routes (gated)
│   │   ├── models/           # Pydantic request/response models
│   │   ├── services/         # Business logic layer
│   │   ├── db/               # SQLAlchemy models & session
│   │   └── core/             # Config, dependencies, middleware
│   ├── tests/                # pytest test suite
│   └── pyproject.toml
├── chatgpt-app/              # Phase 1 & 2: OpenAI Apps SDK (MCP)
│   ├── skills/               # SKILL.md tutor behavior files
│   │   ├── concept-explainer.md
│   │   ├── quiz-master.md
│   │   ├── socratic-tutor.md
│   │   └── progress-motivator.md
│   └── manifest.yaml         # ChatGPT app definition
├── web-app/                  # Phase 3: Next.js frontend
│   ├── src/app/                  # Next.js App Router
│   ├── components/
│   └── package.json
├── content/                  # Course content (synced to R2)
│   ├── chapters/             # Markdown chapter files
│   └── quizzes/              # Quiz banks (JSON)
├── specs/                    # SDD feature specs
├── history/                  # PHRs and ADRs
│   ├── prompts/
│   └── adr/
└── .specify/                 # SDD templates and scripts
```

---

## Key Commands

```bash
# Backend development
cd backend
uv sync
uv run uvicorn app.main:app --reload          # Start dev server
pytest                                  # Run all tests
pytest --cov=app tests/                # With coverage

# Web frontend (Phase 3)
cd web-app
npm install
npm run dev

# Sync content to R2 (when wrangler is configured)
npx wrangler r2 object put course-content/chapters/ --file=content/chapters/

# Database migrations
cd backend
alembic upgrade head
alembic revision --autogenerate -m "description"
```

---

## Coding Conventions

### Python (Backend)
- Python 3.12+, strict type hints on all functions — no `Any`
- UV Package manager
- Pydantic v2 models for all request/response shapes
- SQLAlchemy 2.0 ORM — no raw SQL in application code
- Functions under 50 lines — extract helpers
- Google-style docstrings on public functions
- `pydantic-settings` for all environment config — never `os.getenv` inline
- Imports: stdlib → third-party → local, separated by blank lines

### TypeScript/React (Web Frontend)
- TypeScript strict mode
- React Server Components by default, Client Components only when interactivity needed
- Tailwind CSS + shadcn/ui for UI
- No inline styles

### ChatGPT App
- Apps SDK UI for UI components

### API Design
- RESTful routes following the patterns in `backend/app/routers/`
- All endpoints return typed Pydantic response models
- HTTP errors via FastAPI `HTTPException` with meaningful messages
- OpenAPI docs auto-generated — never document manually

---

## Important Notes

### Phase 1 CRITICAL CONSTRAINT
**Backend must have ZERO LLM API calls.** This is a hackathon disqualifier.
- Do not import `anthropic`, `openai`, `langchain`, or any LLM library in Phase 1 modules
- Do not add summarization, RAG, or prompt orchestration logic
- ChatGPT does all reasoning; backend is a content/rules API only

### Phase 2 Premium Gating
- All hybrid routes live under `backend/app/routers/premium/`
- Protected by `require_premium` FastAPI dependency
- Maximum 2 hybrid features implemented

### Content Storage
- Cloudflare R2 is required (not optional) for course content
- Local file fallback is acceptable during development only
- R2 bucket name and credentials via environment variables

### Environment Variables Required
```
# Backend
DATABASE_URL=postgresql+asyncpg://...
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=course-companion-content

# Phase 2 only
ANTHROPIC_API_KEY=

# Auth
JWT_SECRET_KEY=
```

---

## Project Constitution

See `.specify/memory/constitution.md` for the full set of immutable architecture, quality, and security principles that govern this project.

---

## Specification Workflow

- `.specify/memory/constitution.md` — Project principles
- `specs/<feature>/spec.md` — Feature requirements
- `specs/<feature>/plan.md` — Architecture decisions
- `specs/<feature>/tasks.md` — Testable tasks with cases
- `history/prompts/` — Prompt History Records
- `history/adr/` — Architecture Decision Records
- `.specify/` — SpecKit Plus templates and scripts

The project constitution defines the code quality, testing, performance, security, and architecture standards for all features.

---

## Active Feature Technologies

- **002-quiz-grading**: Python 3.12, FastAPI, Pydantic v2, boto3 (S3-compatible R2 client), and pytest
- **002-quiz-grading storage**: Cloudflare R2 quiz JSON files; no database writes
- **003-stytch-auth**: Python 3.12 for the backend and MCP server
- **003-stytch-auth storage**: Neon PostgreSQL via SQLAlchemy 2.0 async ORM with a `users` table
- **004-progress-streaks-search-access**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 async, asyncpg, Stytch JWT auth, and boto3 for the R2 search cache
- **004-progress-streaks-search-access storage**: Neon PostgreSQL for progress and streak fields; Cloudflare R2 chapter content cached in-process for search
- **005-chatgpt-mcp-widgets server**: Python 3.12, `fastmcp>=2.0`, `httpx>=0.27`, and `pydantic>=2.0`
- **005-chatgpt-mcp-widgets UI**: TypeScript, React 19, Vite 6, and TypeScript 5
- **005-chatgpt-mcp-widgets storage**: Stateless MCP server; all data comes from the existing FastAPI backend

---

<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->