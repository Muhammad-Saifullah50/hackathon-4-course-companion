# Quickstart: AI Course Mentor

**Feature**: 007-ai-course-mentor  
**Date**: 2026-06-16

## Prerequisites

- Backend dependencies installed with `uv sync`
- Web dependencies installed with `npm install` in `web-app/`
- PostgreSQL/Neon connection configured through `DATABASE_URL`
- R2 course content settings configured
- Stytch authentication settings configured
- OpenRouter, LiteLLM, ChatKit, and vector settings configured for Pro mentor responses:

```bash
OPENROUTER_API_KEY=...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
MENTOR_MODEL=<openrouter/nvidia/nemotron-model-id>
MENTOR_LITELLM_MODEL=openrouter/<nvidia-nemotron-model-id>
MENTOR_EMBEDDING_MODEL=<embedding-model-id>
MENTOR_EMBEDDING_DIMENSIONS=<dimension>
CHATKIT_ENDPOINT_PATH=/premium/mentor/chatkit
```

## Backend Implementation Checks

1. Add SQLAlchemy models and Alembic migration for:
   - `mentor_threads`
   - `mentor_messages`
   - `mentor_citations`
   - `mentor_usage_records`
   - `course_content_chunks` with Neon pgvector embedding index

2. Add Pydantic models in `backend/src/models/mentor.py`.

3. Add agent modules under `backend/src/agents/`:
   - `openai_mentor_agent.py` for the OpenAI Agents SDK mentor agent
   - `tools.py` for the course retrieval function tool backed by Neon pgvector
   - `guardrails.py` for input, output, and tool guardrails

4. Add services:
   - `MentorService` for access checks, quota, persistence, evidence retrieval, and response orchestration
   - `ChatKitServer` subclass using `openai-chatkit` to process ChatKit requests and stream Agents SDK results
   - `ContentIndexer` for deterministic R2 chunking, embedding, and pgvector upserts
   - `VectorRetrievalService` for pgvector similarity search

5. Add router under `backend/src/routers/premium/mentor.py` and include it from `backend/src/main.py` under `/premium/mentor`, including `/premium/mentor/chatkit`.

6. Run backend tests:

```bash
cd backend
uv run pytest tests/unit/test_mentor_service.py tests/unit/test_guardrails.py tests/unit/test_vector_retrieval.py tests/integration/test_mentor_routes.py
```

## Web App Implementation Checks

1. Install and configure `@openai/chatkit-react`.

2. Add a reusable floating chat component at `web-app/src/components/mentor-chat.tsx` with a chat bubble and pop-up ChatKit window.

3. Mount the chat launcher in the authenticated app shell/layout so Pro learners can open it from existing pages.

4. Add typed ChatKit/backend helpers under `web-app/src/lib/chatkit.ts` and shared types under `web-app/src/lib/api-types.ts`.

5. Do not add a standalone `web-app/src/app/mentor` route and do not add `web-app/src/app/api/mentor` route handlers. The frontend calls the FastAPI backend directly.

6. Run web checks:

```bash
cd web-app
npm run typecheck
npm run test
```

## Manual Verification

1. Start the backend:

```bash
cd backend
uv run uvicorn src.main:app --reload
```

2. Start the web app:

```bash
cd web-app
npm run dev
```

3. Sign in as a Pro learner and open the mentor chat bubble.

4. Verify:
   - Pro learner can create/open a thread.
   - Non-Pro learner is blocked before conversation starts.
   - A supported course question gets a grounded answer with lesson/chapter title and section heading when available.
   - A weak-evidence course question is handled by the agent with a grounded limited-evidence explanation and counts against quota.
   - An out-of-scope request is stopped by an Agents SDK guardrail and counts against quota after valid Pro text submission.
   - Five valid text messages are accepted in one UTC day.
   - The sixth valid text message returns a limit message with reset time at 00:00 UTC.
   - File/image/audio/video attempts are rejected and do not count.
   - Thread rename persists after reload.
   - Full message history displays after reload.
   - Follow-up response generation uses at most the latest 20 messages.

## Contract Reference

See [contracts/openapi.yaml](./contracts/openapi.yaml) for the backend endpoint contract.
