# Claude Teacher FTE — Project Constitution

## I. Architecture Principles

### Zero-Backend-LLM by Default
Phase 1 backend performs **zero LLM inference**. The backend is deterministic: it serves content, grades quizzes against an answer key, tracks progress, and enforces access control. ChatGPT (via OpenAI Apps SDK/MCP) does all reasoning, explanation, tutoring, and adaptation.

Why: Near-zero marginal cost per user. Predictable scaling. A backend LLM call in Phase 1 is an **immediate disqualifier** from the hackathon.

### Hybrid Intelligence Is Selective and Premium
Phase 2 LLM routes are:
- Isolated on separate API paths (`/premium/...`)
- Gated behind paid-tier access checks
- User-initiated only (never auto-triggered)
- Limited to a maximum of 2 hybrid features
- Cost-tracked per user

Why: Hybrid power without hybrid costs for the default user path.

### Single Backend, Separate Frontend Codebases
One FastAPI backend serves all phases. The ChatGPT app and the Next.js web app are separate frontend codebases that both call the same backend. No logic duplication between frontends.

### Content Lives in Cloudflare R2
All course chapters, media, and quiz banks are stored in and served from Cloudflare R2. The backend fetches content from R2 — it does not embed content in code or database rows.

Why: R2 is required by the hackathon spec and enables content updates without redeployment.

### Repository Layer for All Data Access
All database reads and writes go through a service/repository layer. No direct database queries in route handlers.

---

## II. Technology Constraints

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend language | Python 3.12+ | Strict type checking | UV package managewr
| API framework | FastAPI | Auto-generates OpenAPI docs |
| Data validation | Pydantic v2 | All request/response models |
| Content storage | Cloudflare R2 | **Required** — no substitutes |
| Database | Neon (PostgreSQL) | User progress, streaks, access tiers |
| ChatGPT frontend | OpenAI Apps SDK (MCP) | Phase 1 & 2 |
| Web frontend | Next.js / React | Phase 3 only |
| LLM for hybrid features | Nvidia Nemotron (via openrouter) for primary Phase 2 reasoning; separately approved lightweight OpenRouter models may be used for auxiliary utility agents such as thread titling | Phase 2 only, never Phase 1 |

No LLM SDK (`anthropic`, `openai`, `langchain`, etc.) may be imported in any Phase 1 backend module. If the import exists, the code fails the Phase 1 audit.

---

## III. Code Quality Standards

- All Python functions have type hints on parameters and return values — no `Any`
- All API request/response shapes are Pydantic models
- No function longer than 50 lines — extract helpers
- Tests written before or alongside implementation (TDD where practical)
- Minimum 80% test coverage on business logic
- OpenAPI docs auto-generated via FastAPI — never written by hand
- No raw SQL in application code — use SQLAlchemy ORM or parameterized queries in migrations only
- Environment variables loaded via `pydantic-settings` — never `os.getenv` scattered through code

---

## IV. Security Requirements

- No secrets, API keys, or credentials in any committed file — environment variables only
- `.env` files listed in `.gitignore` before first commit
- All API endpoints validate input at the boundary via Pydantic — no manual string parsing
- Freemium access control checked server-side on every gated endpoint — never trust the client
- JWT or session tokens never logged — only request metadata
- R2 bucket access via signed URLs or scoped service credentials — never public bucket URLs in production

---

## V. Phase-Specific Constraints

### Phase 1 (STRICT — Disqualifier)
The following are **absolutely forbidden** in the backend during Phase 1:
- Any import of LLM libraries (`anthropic`, `openai`, `langchain`, `litellm`, etc.)
- Any HTTP call to an LLM API endpoint
- Any summarization, RAG, prompt orchestration, or agent loop logic
- Any content generation at request time (pre-generate only)

Detection: Code review + API traffic audit. Violation = immediate disqualification from Phase 1.

### Phase 2 (Gated)
Hybrid features must be on routes prefixed `/premium/` and guarded by a `require_premium` dependency. The Phase 1 deterministic routes remain untouched.
Primary mentor and assessment reasoning must use Nvidia Nemotron via OpenRouter unless a feature-specific ADR explicitly grants an auxiliary utility-agent exception, such as chat title generation, to a lighter OpenRouter model.

---

## VI. Workflow Rules

- SDD sequence: Constitution → Spec → Plan → Tasks → Implementation
- Create a PHR (Prompt History Record) after every significant user prompt
- Propose ADR when a significant architectural decision is made — never auto-create, wait for user consent
- When a spec is ambiguous, ask one clarifying question before proceeding
- Never update the constitution mid-task — finish the current task under existing rules, then amend
- Commit after each completed task: `type(scope): description` format

---

## Governance

This constitution supersedes all other practices for this project. Any proposal to violate a Phase 1 constraint must be explicitly flagged as a potential disqualifier before proceeding. Amendments require user consent and are recorded in `history/adr/`.

**Version**: 1.0.0 | **Ratified**: 2026-06-02 | **Course**: AI Agent Development
