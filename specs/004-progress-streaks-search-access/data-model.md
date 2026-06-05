# Data Model: Progress, Streaks, Search & Access Control

**Feature**: 004-progress-streaks-search-access  
**Date**: 2026-06-05

---

## Entities

### 1. User (extended)

**Table**: `users` (existing — extended via migration 002)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `VARCHAR(64)` | PK | Stytch user_id |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL, INDEX | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, server_default=now() | |
| `access_tier` | `VARCHAR(32)` | NOT NULL, DEFAULT 'free' | `'free'` \| `'premium'` |
| `current_streak` | `INTEGER` | NOT NULL, DEFAULT 0 | **NEW** |
| `last_active_date` | `DATE` | NULLABLE | **NEW** — UTC date of last completion |

**ORM class** (`src/db/models.py`):
```python
current_streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
last_active_date: Mapped[date | None] = mapped_column(Date, nullable=True)
```

---

### 2. ChapterProgress

**Table**: `chapter_progress` (new — created via migration 002)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `INTEGER` | PK, AUTOINCREMENT | Surrogate key |
| `user_id` | `VARCHAR(64)` | NOT NULL, FK → users.id, INDEX | |
| `chapter_slug` | `VARCHAR(128)` | NOT NULL | Matches R2 manifest slug |
| `completed_at` | `TIMESTAMPTZ` | NOT NULL | UTC timestamp, updated on re-completion |
| `quiz_score` | `SMALLINT` | NULLABLE | 0–100; optional |

**Unique constraint**: `(user_id, chapter_slug)` — enforces one row per (user, chapter).

**ORM class** (`src/db/models.py`):
```python
class ChapterProgress(Base):
    __tablename__ = "chapter_progress"
    __table_args__ = (UniqueConstraint("user_id", "chapter_slug"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chapter_slug: Mapped[str] = mapped_column(String(128), nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    quiz_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
```

---

### 3. SearchResult (value object — not persisted)

Lives in the chapter cache (`ContentService`) and is returned from `SearchService`. Not stored in DB.

| Field | Type | Notes |
|-------|------|-------|
| `slug` | `str` | Chapter slug |
| `title` | `str` | Chapter title from manifest |
| `excerpt` | `str` | Up to 200-char window around match |
| `rank` | `int` | 2 = title match; 1 = body-only match |

**Pydantic model** (`src/models/search.py`):
```python
class SearchResult(BaseModel):
    slug: str
    title: str
    excerpt: str
    rank: int

class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
```

---

### 4. AccessStatus (value object — not persisted)

| Field | Type | Notes |
|-------|------|-------|
| `tier` | `str` | User's stored `access_tier` |
| `resource` | `str \| None` | Echo of the query param if provided |
| `allowed` | `bool` | True if `tier == 'premium'` OR resource != 'premium' |

**Pydantic model** (`src/models/access.py`):
```python
class AccessStatus(BaseModel):
    tier: str
    resource: str | None
    allowed: bool
```

---

### 5. CompletionRequest / CompletionResponse / ProgressResponse

**Pydantic models** (`src/models/progress.py`):

```python
class CompletionRequest(BaseModel):
    quiz_score: int | None = Field(None, ge=0, le=100)

class CompletionResponse(BaseModel):
    user_id: str
    chapter_slug: str
    completed_at: datetime
    quiz_score: int | None
    current_streak: int

class ProgressEntry(BaseModel):
    chapter_slug: str
    completed_at: datetime
    quiz_score: int | None

class ProgressResponse(BaseModel):
    user_id: str
    completions: list[ProgressEntry]
    current_streak: int
    last_active_date: date | None
```

---

## State Transitions

### Streak State Machine

```
State: (last_active_date, current_streak)

Event: completion recorded for user_id + chapter_slug

Condition A: last_active_date is None
  → set last_active_date = today_utc
  → set current_streak = 1

Condition B: last_active_date == today_utc
  → no-op (already completed today — idempotent)

Condition C: last_active_date == today_utc - 1 day
  → set last_active_date = today_utc
  → set current_streak += 1

Condition D: last_active_date < today_utc - 1 day
  → set last_active_date = today_utc
  → set current_streak = 1
```

---

## Validation Rules

| Model | Field | Rule |
|-------|-------|------|
| `CompletionRequest` | `quiz_score` | 0 ≤ value ≤ 100 when provided |
| `SearchResponse` | query `q` | Reject blank/whitespace with 400 |
| `AccessStatus` | `resource` | Only `"premium"` triggers gating; anything else → `allowed: true` |
| All endpoints | JWT | Missing or invalid → 401 |
| Progress endpoints | `user_id` path | Must match JWT `sub` → else 403 |

---

## Migration: 002_add_progress_and_streaks.py

```python
# Adds to users:
op.add_column("users", sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"))
op.add_column("users", sa.Column("last_active_date", sa.Date(), nullable=True))

# Creates chapter_progress:
op.create_table(
    "chapter_progress",
    sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
    sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    sa.Column("chapter_slug", sa.String(128), nullable=False),
    sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
    sa.Column("quiz_score", sa.SmallInteger(), nullable=True),
    sa.UniqueConstraint("user_id", "chapter_slug"),
)
op.create_index("ix_chapter_progress_user_id", "chapter_progress", ["user_id"])
```
