# Quickstart: Feature 004 — Progress, Streaks, Search & Access Control

## Prerequisites

- Feature 003 (Stytch auth) deployed and passing tests.
- Neon database accessible via `DATABASE_URL` in `.env`.
- R2 bucket populated and `R2_*` vars set.
- `uv` installed; `cd backend && uv sync` already run.

---

## Step 1 — Run the Database Migration

```bash
cd backend
uv run alembic upgrade head
```

This applies `002_add_progress_and_streaks.py`, which adds `current_streak` and `last_active_date` to `users` and creates the `chapter_progress` table.

Verify:
```bash
uv run alembic current   # should show 002_add_progress_and_streaks
```

---

## Step 2 — Start the Dev Server

```bash
cd backend
uv run uvicorn src.main:app --reload
```

The server warms the chapter cache on startup (`ContentService.warm_cache()`). Check logs for:
```
INFO: Manifest cache warmed on startup
```

If you see a warning instead, R2 may be unavailable — search will return 503 until the cache warms.

---

## Step 3 — Get a Test JWT

Use Stytch's test magic link or your project's login flow to obtain a session JWT. Export it:

```bash
export JWT="eyJ..."
export USER_ID="user-test-..."   # your Stytch user_id
```

---

## Step 4 — Mark a Chapter Complete

```bash
curl -s -X PUT \
  "http://localhost:8000/users/$USER_ID/progress?chapter_slug=01-intro-to-agents" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"quiz_score": 85}' | python -m json.tool
```

Expected response:
```json
{
  "user_id": "...",
  "chapter_slug": "01-intro-to-agents",
  "completed_at": "2026-06-05T10:00:00Z",
  "quiz_score": 85,
  "current_streak": 1
}
```

---

## Step 5 — View Progress

```bash
curl -s \
  "http://localhost:8000/users/$USER_ID/progress" \
  -H "Authorization: Bearer $JWT" | python -m json.tool
```

Expected response:
```json
{
  "user_id": "...",
  "completions": [
    {"chapter_slug": "01-intro-to-agents", "completed_at": "...", "quiz_score": 85}
  ],
  "current_streak": 1,
  "last_active_date": "2026-06-05"
}
```

---

## Step 6 — Search Chapters

```bash
curl -s \
  "http://localhost:8000/search?q=agent+sdk" \
  -H "Authorization: Bearer $JWT" | python -m json.tool
```

Expected (when cache is warm):
```json
{
  "results": [
    {"slug": "02-claude-agent-sdk", "title": "Claude Agent SDK", "excerpt": "...agent sdk...", "rank": 2}
  ],
  "total": 1
}
```

Test the 400 guard:
```bash
curl -s "http://localhost:8000/search?q=%20" -H "Authorization: Bearer $JWT"
# → {"detail": "Query must not be blank"}
```

---

## Step 7 — Check Access Tier

```bash
# Own tier only
curl -s "http://localhost:8000/access/check" -H "Authorization: Bearer $JWT"
# → {"tier": "free", "resource": null, "allowed": true}

# Check premium resource
curl -s "http://localhost:8000/access/check?resource=premium" -H "Authorization: Bearer $JWT"
# → {"tier": "free", "resource": "premium", "allowed": false}
```

---

## Step 8 — Run Tests

```bash
cd backend
uv run pytest tests/ -v
```

Key test files for this feature:
- `tests/unit/test_streak_logic.py` — pure streak calculation unit tests
- `tests/integration/test_progress.py` — completion upsert, streak transitions, 401/403
- `tests/integration/test_search.py` — ranking, empty results, 400 guard, 503 guard
- `tests/integration/test_access.py` — tier check, premium gating

---

## Environment Variables Checklist

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://...` |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 API token secret |
| `R2_BUCKET_NAME` | Yes | Default: `claudeteacher-content` |
| `STYTCH_PROJECT_ID` | Yes | From Stytch dashboard |
| `STYTCH_SECRET` | Yes | From Stytch dashboard |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `503` on search | Cache not warmed | Check R2 vars; restart server |
| `404` on completion | `chapter_slug` not in manifest | Check R2 manifest.json |
| `403` on progress GET | `user_id` in path ≠ JWT sub | Use the correct user_id from your token |
| Migration fails | DB URL wrong or DB not reachable | Check `DATABASE_URL` in `.env` |
| `401` everywhere | JWT missing or expired | Obtain a fresh Stytch session JWT |
