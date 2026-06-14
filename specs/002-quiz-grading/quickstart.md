# Quickstart: Rule-Based Quiz Grading

**Branch**: `002-quiz-grading` | **Date**: 2026-06-03

## Pre-requisites

- Python 3.12+, `uv` installed
- Cloudflare R2 bucket configured (or local file fallback — see below)
- `backend/.env` with R2 credentials set

## Running the Backend

```bash
cd backend
uv sync
uv run uvicorn src.main:app --reload
```

API docs: http://localhost:8000/docs

## R2 Quiz File Setup

Quiz files go in your R2 bucket at `quizzes/{chapter_slug}.json`.

**Minimal valid quiz file** (`quizzes/mcp-introduction.json`):

```json
{
  "chapter_slug": "mcp-introduction",
  "questions": [
    {
      "id": "q1",
      "text": "What does MCP stand for?",
      "options": [
        { "label": "A", "text": "Model Context Protocol" },
        { "label": "B", "text": "Multi-Channel Processing" },
        { "label": "C", "text": "Machine Control Pipeline" },
        { "label": "D", "text": "Managed Compute Platform" }
      ],
      "correct_answer": "A",
      "explanation": "MCP stands for Model Context Protocol, the open standard for connecting AI models to external tools and data sources."
    }
  ]
}
```

Upload via wrangler:
```bash
npx wrangler r2 object put claudeteacher-content/quizzes/mcp-introduction.json \
  --file=content/quizzes/mcp-introduction.json
```

## Using the API

### Get quiz questions (no answers exposed)

```bash
curl http://localhost:8000/quizzes/mcp-introduction
```

Expected response:
```json
{
  "chapter_slug": "mcp-introduction",
  "questions": [
    {
      "id": "q1",
      "text": "What does MCP stand for?",
      "options": [
        { "label": "A", "text": "Model Context Protocol" },
        ...
      ]
    }
  ]
}
```

### Submit an answer and get feedback

```bash
curl -X POST http://localhost:8000/quizzes/mcp-introduction/submit \
  -H "Content-Type: application/json" \
  -d '{"question_id": "q1", "selected_answer": "A"}'
```

Expected response (correct):
```json
{
  "question_id": "q1",
  "is_correct": true,
  "correct_answer": "A",
  "explanation": "MCP stands for Model Context Protocol..."
}
```

## Running Tests

```bash
cd backend
uv run pytest tests/test_quizzes.py -v
```

## Local Development (No R2)

For local development without R2, set these in `backend/.env`:

```env
R2_ACCOUNT_ID=dev
R2_ACCESS_KEY_ID=dev
R2_SECRET_ACCESS_KEY=dev
R2_BUCKET_NAME=claudeteacher-content
USE_LOCAL_CONTENT=true
LOCAL_CONTENT_PATH=../content
```

When `USE_LOCAL_CONTENT=true`, the `QuizService` reads from `LOCAL_CONTENT_PATH/quizzes/{slug}.json` instead of R2.

## Error Responses

| Scenario | HTTP | Body |
|----------|------|------|
| Quiz not found for slug | 404 | `{"detail": "Quiz not found for chapter: slug"}` |
| question_id not in quiz | 400 | `{"detail": "Question 'q99' not found in quiz for chapter: slug"}` |
| R2 unreachable (after 1 retry) | 503 | `{"detail": "Quiz service unavailable"}` |
| Malformed quiz JSON | 503 | `{"detail": "Quiz data is malformed: ..."}` |

## Phase 1 Compliance Check

Run this to verify no LLM imports snuck in:

```bash
grep -r "anthropic\|openai\|langchain\|litellm" backend/src/routers/quizzes.py backend/src/services/quiz.py backend/src/models/quiz.py
# Should return nothing
```
