# Data Model: ChatGPT App — MCP Server + React Widgets

**Feature**: `005-chatgpt-mcp-widgets` | **Date**: 2026-06-07

> The MCP server layer has no persistent state. All entities below are **response shapes** — Pydantic v2 models that the MCP server constructs from backend API responses and serializes as visual panel data for ChatGPT.

---

## Tool Response Models (MCP Server)

### ChapterSummary
Represents a single chapter in a listing.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `slug` | `str` | backend `/chapters` | URL-safe identifier |
| `title` | `str` | backend | Display title |
| `chapter_number` | `int` | backend | Sort order |
| `completed` | `bool` | backend | User-specific (false if unauthenticated) |

### ChapterPanel
Full chapter for display in ChapterReader widget.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `slug` | `str` | backend `/chapters/{slug}` | |
| `title` | `str` | backend | |
| `content_html` | `str` | backend | Full chapter markdown rendered as HTML |
| `chapter_number` | `int` | backend | |
| `next_slug` | `str \| None` | backend | Null on last chapter |
| `prev_slug` | `str \| None` | backend | Null on first chapter |
| `has_quiz` | `bool` | backend | Whether a quiz exists for this chapter |

### QuizQuestion
Single question inside a quiz.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `question_id` | `str` | backend `/quizzes/{slug}` | |
| `text` | `str` | backend | Question prompt |
| `options` | `list[str]` | backend | 4 choices (A–D) |

### QuizPanel
Full quiz panel data returned by `get_quiz`.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `chapter_slug` | `str` | path param | |
| `chapter_title` | `str` | backend | For panel header |
| `questions` | `list[QuizQuestion]` | backend | All questions at once (stateless) |
| `total_questions` | `int` | derived | `len(questions)` |

### QuizResult
Score summary returned after `submit_quiz`.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `chapter_slug` | `str` | request | |
| `score` | `int` | backend `/quizzes/{slug}/submit` | Number correct |
| `total` | `int` | backend | Total questions |
| `percentage` | `float` | derived | `score / total * 100` |
| `per_question` | `list[QuestionResult]` | backend | Correct/incorrect per question |

### QuestionResult
| Field | Type | Notes |
|-------|------|-------|
| `question_id` | `str` | |
| `correct` | `bool` | |
| `correct_answer` | `str` | Displayed after submission |

### ProgressPanel
Dashboard panel for `get_progress`.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `user_id` | `str` | backend `/users/{user_id}/progress` | |
| `current_streak` | `int` | backend | Consecutive active days |
| `completion_percentage` | `float` | derived | Completed chapters / total |
| `total_chapters` | `int` | backend | |
| `completed_chapters` | `int` | backend | |
| `chapter_list` | `list[ChapterProgressItem]` | backend | Per-chapter status |

### ChapterProgressItem
| Field | Type | Notes |
|-------|------|-------|
| `slug` | `str` | |
| `title` | `str` | |
| `completed` | `bool` | |
| `quiz_score` | `int \| None` | Null if quiz not taken |

### SearchResultsPanel
Panel returned by `search_content`.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `query` | `str` | request | Echo back for display |
| `total_matches` | `int` | backend `/search` | May exceed returned results |
| `results` | `list[SearchResult]` | backend | Capped at 20 |

### SearchResult
| Field | Type | Notes |
|-------|------|-------|
| `chapter_slug` | `str` | |
| `chapter_title` | `str` | |
| `excerpt` | `str` | Short snippet with keyword in context |

### AccessStatusPanel
Panel returned by `check_access`.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `user_id` | `str` | backend `/access/check` | |
| `tier` | `Literal["free", "premium"]` | backend | |
| `is_premium` | `bool` | derived | |
| `upgrade_url` | `str \| None` | config | Present for free-tier users only |

---

## Tool Input Models (MCP Tool Arguments)

### GetChapterArgs
| Field | Type | Validation |
|-------|------|-----------|
| `slug` | `str` | Non-empty, URL-safe characters |

### GetQuizArgs / SubmitQuizArgs
| Field | Type | Validation |
|-------|------|-----------|
| `chapter_slug` | `str` | Non-empty |

### SubmitQuizBody (part of SubmitQuizArgs)
| Field | Type | Notes |
|-------|------|-------|
| `answers` | `dict[str, str]` | question_id → selected option |

### SearchArgs
| Field | Type | Validation |
|-------|------|-----------|
| `query` | `str` | Non-empty, max 200 chars |
| `limit` | `int` | Default 10, max 20 |

---

## Entity Relationships

```
ChatGPT Tool Call
    │
    ├── Public tools (no auth)
    │   ├── list_chapters  → ChapterSummary[]
    │   ├── get_chapter    → ChapterPanel
    │   └── search_content → SearchResultsPanel
    │
    └── Protected tools (Bearer token required)
        ├── get_quiz       → QuizPanel
        ├── submit_quiz    → QuizResult
        ├── get_progress   → ProgressPanel
        └── check_access   → AccessStatusPanel
```

---

## Validation Rules

- `slug`: lowercase, alphanumeric + hyphens only (`^[a-z0-9-]+$`)
- `query`: stripped of leading/trailing whitespace; rejected if empty after strip
- `answers`: must contain exactly one answer per question; validated in FastAPI backend
- `limit`: clamped to [1, 20]; MCP server applies clamp before forwarding to backend
- All monetary/tier checks: delegated entirely to FastAPI backend; MCP server never caches tier decisions
