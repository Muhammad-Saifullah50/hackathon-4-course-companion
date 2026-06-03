# Phase 1 Features — Course Companion FTE

**Constraint**: Backend must have ZERO LLM calls. All reasoning is handled by ChatGPT via OpenAI Apps SDK (MCP). Violation is an immediate hackathon disqualifier.

---

## Features

### 1. Content Delivery
- Serve course chapters (Markdown) from Cloudflare R2
- Chapter navigation: list all, get by ID/slug, get next/previous
- Media delivery via R2 signed URLs
- Router: `backend/src/routers/content.py`

### 2. Rule-Based Quiz Grading
- Serve quiz questions from R2 quiz bank (JSON)
- Grade submitted answers against a static answer key
- Return score, per-question correct/incorrect, and explanations
- Router: `backend/src/routers/quizzes.py`

### 3. Progress Tracking & Streaks
- Record chapter completions per user (Neon/PostgreSQL)
- Track quiz scores over time
- Calculate and return learning streaks
- Router: `backend/src/routers/progress.py`

### 4. Keyword Search
- Search course content by keyword across chapters
- Return matching chapter excerpts and links
- Router: `backend/src/routers/search.py`

### 5. Freemium Access Gate
- Free tier: limited chapters (first N chapters)
- Premium tier: full content unlocked
- Server-side enforcement on every gated endpoint — never trust the client
- Router: `backend/src/routers/access.py`

### 6. ChatGPT App Skills (no backend — SKILL.md files only)
- `concept-explainer.md` — how ChatGPT explains AI Agent concepts
- `quiz-master.md` — how ChatGPT conducts quizzes using backend data
- `socratic-tutor.md` — Socratic Q&A tutoring behavior
- `progress-motivator.md` — motivational responses based on progress

---

## Suggested Build Order

| Step | Feature | Reason |
|------|---------|--------|
| 1 | Content Delivery | Everything depends on content being accessible |
| 2 | Freemium Access Gate | Must gate content before exposing quiz/progress |
| 3 | Rule-Based Quiz Grading | Needs content to exist first |
| 4 | Progress Tracking & Streaks | Requires quiz + content endpoints to be stable |
| 5 | Keyword Search | Add-on; no hard dependencies |
| 6 | ChatGPT App Skills | Wire up after backend is functional |

---

## What Phase 1 Is NOT

- No LLM imports (`anthropic`, `openai`, `langchain`, etc.)
- No summarization, RAG, or prompt orchestration
- No content generation at request time
- No auto-triggered AI responses

Phase 2 hybrid/LLM features live under `backend/src/routers/premium/` and are gated by `require_premium`.
