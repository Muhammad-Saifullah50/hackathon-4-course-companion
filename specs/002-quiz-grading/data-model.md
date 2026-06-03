# Data Model: Rule-Based Quiz Grading

**Branch**: `002-quiz-grading` | **Date**: 2026-06-03

---

## Entities

### AnswerOption

A single answer choice for an MCQ question.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `label` | `str` | Non-empty, e.g. `"A"` | Unique within a question's options |
| `text` | `str` | Non-empty | The displayed answer text |

---

### Question (Internal — includes answer key)

A single MCQ item stored in the quiz file. **Never serialized directly to API responses.**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `str` | Non-empty, unique within quiz | Stable identifier for submissions |
| `text` | `str` | Non-empty | The question body |
| `options` | `list[AnswerOption]` | Min 2 items | All answer choices |
| `correct_answer` | `str` | Must match one `options[].label` | Validated at load time |
| `explanation` | `str` | Non-empty | Pre-written explanation revealed after grading |

**Validation rule**: `correct_answer` must equal one of the `label` values in `options`. Enforced by `@model_validator(mode='after')`. Load fails with `SchemaValidationError` if violated.

---

### QuizFile (Internal — full quiz with answer key)

The complete quiz for a chapter, as stored in R2.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `chapter_slug` | `str` | Non-empty | Must match the filename slug |
| `questions` | `list[Question]` | Min 1 item | All questions with answers |

**Validation rule**: All `question.id` values must be unique within the quiz. Enforced by `@model_validator(mode='after')`.

---

### QuestionPublic (External — no answer key)

The public view of a question, safe to return in API responses.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `str` | Same as `Question.id` |
| `text` | `str` | Same as `Question.text` |
| `options` | `list[AnswerOption]` | Same as `Question.options` |

`correct_answer` and `explanation` are intentionally absent.

---

### QuizPublic (External — questions only)

The public view of a quiz, returned by `GET /quizzes/{chapter_slug}`.

| Field | Type | Notes |
|-------|------|-------|
| `chapter_slug` | `str` | Chapter identifier |
| `questions` | `list[QuestionPublic]` | Questions without answers |

---

### AnswerSubmission (Request body)

A single answer submission from the learner.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `question_id` | `str` | Non-empty | Must match a question in the quiz |
| `selected_answer` | `str` | Non-empty | The label the learner selected |

**Not persisted.** Never written to the database.

---

### GradedResult (Response)

The result of grading a single answer.

| Field | Type | Notes |
|-------|------|-------|
| `question_id` | `str` | Echoed from submission |
| `is_correct` | `bool` | `True` if `selected_answer == correct_answer` |
| `correct_answer` | `str` | The correct option label |
| `explanation` | `str` | Pre-written explanation |

---

## State Transitions

There are no state machines in this feature — grading is purely stateless. No data is written to the database.

```
R2 Quiz File (quizzes/{slug}.json)
        │
        │  fetch (once per request, one retry on failure)
        ▼
  QuizFile (internal)  ──validate──►  SchemaValidationError (if malformed)
        │
        ├── GET /quizzes/{slug}  ──strip answers──►  QuizPublic
        │
        └── POST /quizzes/{slug}/submit
                │
          AnswerSubmission
                │
                ▼
          GradedResult  (never persisted)
```

---

## R2 Storage Schema

**File path**: `quizzes/{chapter_slug}.json`

**Example file** (`quizzes/mcp-introduction.json`):

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

---

## Module Layout

```
backend/src/
├── models/
│   ├── content.py          # existing
│   └── quiz.py             # NEW: AnswerOption, Question, QuizFile,
│                           #       QuestionPublic, QuizPublic,
│                           #       AnswerSubmission, GradedResult
├── services/
│   ├── content.py          # existing
│   └── quiz.py             # NEW: QuizService, QuizNotFoundError,
│                           #       SchemaValidationError
├── routers/
│   ├── content.py          # existing
│   └── quizzes.py          # NEW: GET /quizzes/{slug}, POST /quizzes/{slug}/submit
└── core/
    ├── config.py           # existing — no changes needed
    └── dependencies.py     # add QuizServiceDep
```
