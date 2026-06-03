# Implementation Plan: Rule-Based Quiz Grading

**Branch**: `002-quiz-grading` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-quiz-grading/spec.md`

## Summary

Serve MCQ quiz questions per chapter from Cloudflare R2 and grade single-answer submissions against a static answer key. Two endpoints: `GET /quizzes/{chapter_slug}` (questions only, no answers) and `POST /quizzes/{chapter_slug}/submit` (graded result with correct answer and explanation). Grading is stateless — no DB writes. Zero LLM calls. Per-request R2 fetch with one retry on failure.

## Technical Context

**Language/Version**: Python 3.12  
**Primary Dependencies**: FastAPI, Pydantic v2, boto3 (S3-compatible R2 client), pytest  
**Storage**: Cloudflare R2 for quiz JSON files — no DB writes for this feature  
**Testing**: pytest with httpx `AsyncClient` (matches existing backend test patterns)  
**Target Platform**: Linux server (Vercel / local dev)  
**Project Type**: Web API (backend only — this feature adds two new routes)  
**Performance Goals**: Quiz response < 2s under normal load (SC-001, SC-002); grading accuracy 100% (SC-003)  
**Constraints**: Zero LLM calls (Phase 1 disqualifier). No DB writes. Answer key never in GET response. One retry on R2 failure.  
**Scale/Scope**: One quiz per chapter (5 chapters). Stateless — no horizontal scaling concerns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Zero LLM calls in Phase 1 | ✅ PASS | No LLM library imports. Grading is `selected == correct_answer` string comparison. |
| No LLM SDK imports | ✅ PASS | `backend/src/models/quiz.py`, `services/quiz.py`, `routers/quizzes.py` — none import anthropic/openai/langchain |
| Pydantic models for all I/O | ✅ PASS | `AnswerOption`, `Question`, `QuizFile` (internal), `QuestionPublic`, `QuizPublic`, `AnswerSubmission`, `GradedResult` |
| Service/repository layer | ✅ PASS | `QuizService` class; router never touches R2 directly |
| No raw SQL | ✅ PASS | No DB access at all in this feature |
| No secrets in code | ✅ PASS | R2 credentials via `pydantic-settings` (already in `Settings`) |
| Content from R2 | ✅ PASS | `quizzes/{chapter_slug}.json` fetched via boto3 S3-compatible client |
| No hardcoded quiz content | ✅ PASS | All quiz data in R2; none in application code |

**Constitution verdict: NO VIOLATIONS. Safe to implement.**

## Project Structure

### Documentation (this feature)

```text
specs/002-quiz-grading/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── openapi.yaml     # Phase 1 output
└── tasks.md             # Phase 2 output (/sp.tasks — NOT created here)
```

### Source Code

```text
backend/
├── src/
│   ├── models/
│   │   ├── content.py          # existing — no changes
│   │   └── quiz.py             # NEW
│   ├── services/
│   │   ├── content.py          # existing — no changes
│   │   └── quiz.py             # NEW
│   ├── routers/
│   │   ├── content.py          # existing — no changes
│   │   └── quizzes.py          # NEW
│   └── core/
│       ├── config.py           # existing — no changes needed
│       ├── dependencies.py     # MODIFY: add QuizServiceDep
│       └── main.py             # MODIFY: include quizzes router
└── tests/
    ├── test_content.py         # existing — no changes
    └── test_quizzes.py         # NEW
```

**Structure Decision**: Single backend project. Quiz feature is a clean addition of three new files plus two small modifications to `dependencies.py` and `main.py`. No new packages or infrastructure required.

## Key Design Decisions

See [research.md](research.md) for full decision rationale. Summary:

| Decision | Choice | Why |
|----------|--------|-----|
| QuizService cache | No cross-request cache; singleton for boto3 client reuse | Spec: fetch fresh per request |
| Retry strategy | Private `_fetch_with_retry` (2 attempts) on `QuizService` | Spec: one retry, then 503 |
| Internal vs public models | Two separate Pydantic model trees | Type safety; answer key can never leak |
| Schema validation | `@model_validator(mode='after')` on `QuizFile` | Fail fast at load time if `correct_answer` not in options |
| R2 path | `quizzes/{chapter_slug}.json` | Mirrors chapter path pattern |
| Error types | `QuizNotFoundError`, `ServiceUnavailableError` (shared) | Consistent with ContentService vocabulary |

## Implementation Sketch

### `backend/src/models/quiz.py`

```python
# Internal models (include answer key — never returned by routes)
class AnswerOption(BaseModel): ...       # label, text
class Question(BaseModel): ...           # id, text, options, correct_answer, explanation
class QuizFile(BaseModel): ...           # chapter_slug, questions — with @model_validator

# Public models (no answer key)
class QuestionPublic(BaseModel): ...     # id, text, options
class QuizPublic(BaseModel): ...         # chapter_slug, questions

# Request / response
class AnswerSubmission(BaseModel): ...   # question_id, selected_answer
class GradedResult(BaseModel): ...       # question_id, is_correct, correct_answer, explanation
```

### `backend/src/services/quiz.py`

```python
class QuizService:
    def __init__(self) -> None:
        self._s3: Any = None  # lazy boto3 client (same pattern as ContentService)

    async def get_quiz_public(self, chapter_slug: str) -> QuizPublic:
        quiz = await self._fetch_with_retry(chapter_slug)
        return _to_public(quiz)

    async def grade_submission(self, chapter_slug: str, sub: AnswerSubmission) -> GradedResult:
        quiz = await self._fetch_with_retry(chapter_slug)
        question = _find_question(quiz, sub.question_id)  # raises QuizValidationError if not found
        return GradedResult(
            question_id=sub.question_id,
            is_correct=sub.selected_answer == question.correct_answer,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
        )
```

### `backend/src/routers/quizzes.py`

```python
router = APIRouter()

@router.get("/{chapter_slug}", response_model=QuizPublic)
async def get_quiz(chapter_slug: str, service: QuizServiceDep) -> QuizPublic: ...

@router.post("/{chapter_slug}/submit", response_model=GradedResult)
async def submit_answer(chapter_slug: str, sub: AnswerSubmission, service: QuizServiceDep) -> GradedResult: ...
```

## Complexity Tracking

*No constitution violations — this section is not required.*
