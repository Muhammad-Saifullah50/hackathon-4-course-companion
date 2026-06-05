# Research: Progress, Streaks, Search & Access Control

**Feature**: 004-progress-streaks-search-access  
**Date**: 2026-06-05

---

## 1. SQLAlchemy 2.0 Async Upsert (PostgreSQL)

**Decision**: Use `sqlalchemy.dialects.postgresql.insert` with `.on_conflict_do_update()` for the chapter_progress upsert.

**Rationale**: PostgreSQL's `INSERT ... ON CONFLICT DO UPDATE` is atomic and avoids a round-trip SELECT + conditional INSERT. SQLAlchemy 2.0 exposes this via `from sqlalchemy.dialects.postgresql import insert`. The async session `await session.execute(stmt)` runs it without blocking.

**Pattern**:
```python
from sqlalchemy.dialects.postgresql import insert

stmt = insert(ChapterProgress).values(
    user_id=user_id,
    chapter_slug=slug,
    completed_at=now,
    quiz_score=quiz_score,
).on_conflict_do_update(
    index_elements=["user_id", "chapter_slug"],
    set_={"completed_at": now, "quiz_score": quiz_score},
)
await session.execute(stmt)
```

**Alternatives considered**:
- `session.merge()` — works but issues a SELECT first; less efficient.
- Application-level SELECT + INSERT/UPDATE — two round-trips; race-condition prone.

---

## 2. Streak Calculation Logic

**Decision**: Pure Python date arithmetic using `datetime.date` in UTC. Streak fields (`current_streak`, `last_active_date`) live on the `users` row and are updated inside the same DB transaction as the progress upsert.

**Rules implemented**:
1. If `last_active_date` is `None` → first ever completion → streak = 1.
2. If `last_active_date == today_utc` → already completed today → streak unchanged (idempotent).
3. If `last_active_date == today_utc - 1 day` → consecutive day → streak += 1.
4. Else (gap > 1 day) → streak resets to 1.

**Why today's date not timestamp**: The spec says "calendar day = UTC midnight boundary". Using `datetime.now(tz=timezone.utc).date()` gives the correct UTC date regardless of server locale.

**Alternatives considered**:
- Storing streak in a separate table — overkill; two columns on the user row are sufficient.
- Computing streak on-the-fly from progress rows — O(N) per request and requires GROUP BY date; denormalized column is O(1).

---

## 3. In-Memory Keyword Search

**Decision**: Scan `ContentService._chapter_cache` (dict of `slug → (markdown_body, loaded_at)`) and the manifest (for titles) at query time with case-insensitive substring matching, ranking title hits above body hits.

**Ranking scheme**:
- Score 2 if query term found in title.
- Score 1 if query term found in body (and not already scored 2).
- Sort descending by score.
- Extract excerpt: first 200-char window containing the match in the body (or title if body has no match).

**Validation gate**: Reject blank/whitespace queries with HTTP 400 before cache access.

**503 guard**: If `_manifest_cache` is `None` (cache not warmed), raise `ServiceUnavailableError` → router returns 503.

**Rationale**: Phase 1 has no vector DB or Postgres FTS extension enabled. The chapter count is small (~50 chapters). Linear scan with string search is well within the 300 ms budget. No extra dependency needed.

**Alternatives considered**:
- PostgreSQL `tsvector` FTS — would require altering the content pipeline to push chapter text into DB rows; high integration cost, overkill for ~50 chapters.
- `whoosh` / `tantivy` Python libraries — adds a build dependency and an index maintenance step; unnecessary at this scale.
- `rapidfuzz` fuzzy matching — fuzzy matching would surface false positives; spec calls for keyword/substring match, not fuzzy.

---

## 4. Access Tier Check

**Decision**: Read `access_tier` from the `users` row (already fetched via `UserService.get_or_create`). Compare against the optional `resource` query param.

**Tier values**: `"free"` (default) and `"premium"`. Any `resource` value other than `"premium"` is treated as a free resource — `allowed: true` for all tiers.

**Rationale**: `access_tier` already exists on the `User` ORM model. This endpoint is a pure DB read; no new columns needed.

**Alternatives considered**:
- Storing permissions in a separate table — too much overhead for a two-tier system.
- Trusting a tier claim in the JWT — spec explicitly says server-side check required.

---

## 5. Auth Integration

**Decision**: Reuse the existing `get_current_user` FastAPI dependency (Stytch JWT validation) for all four new routers. User identity comes from `AuthenticatedUser.user_id`.

**Ownership enforcement**: Progress endpoints include `user_id` as a path parameter. The service layer compares it against `current_user.user_id` and raises HTTP 403 if they differ.

**Rationale**: Stytch auth is already wired; no new auth infrastructure needed.

---

## 6. Database Migration Strategy

**Decision**: Single Alembic migration `002_add_progress_and_streaks.py` that:
1. Adds `current_streak INTEGER NOT NULL DEFAULT 0` to `users`.
2. Adds `last_active_date DATE NULL` to `users`.
3. Creates `chapter_progress` table with a composite unique constraint on `(user_id, chapter_slug)`.

**Rationale**: Batching into one migration keeps the revision chain linear and avoids intermediate invalid states.

**Alternatives considered**:
- Separate migration per change — more granular but creates unnecessary revision hops for a single atomic feature.
