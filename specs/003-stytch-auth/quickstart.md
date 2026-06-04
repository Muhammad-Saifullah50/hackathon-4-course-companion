# Quickstart: Stytch Authentication — Backend API

## Prerequisites

- Python 3.12+ with `uv`
- Stytch Consumer project created (dashboard: stytch.com)
- Neon PostgreSQL database provisioned

---

## Step 1 — Stytch Tenant Setup

1. In the Stytch dashboard, open your **Consumer** project.
2. Note your **Project ID** (`project-test-xxx`) and **Secret** from API Keys.
3. No OAuth flow configuration needed for the backend — the backend only verifies tokens, it never initiates auth.

---

## Step 2 — Add Environment Variables

```bash
cd backend
cp .env.example .env
```

Add to `.env`:
```
DATABASE_URL=postgresql+asyncpg://user:pass@host.neon.tech/dbname?sslmode=require
STYTCH_PROJECT_ID=project-test-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
STYTCH_SECRET=secret-test-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Step 3 — Install Dependencies

```bash
cd backend
uv add stytch "sqlalchemy[asyncio]" asyncpg alembic
uv sync
```

---

## Step 4 — Run Database Migration

```bash
cd backend
uv run alembic upgrade head
```

Creates the `users` table in Neon.

---

## Step 5 — Start the Backend

```bash
cd backend
uv run uvicorn src.main:app --reload --port 8000
```

---

## Step 6 — Test the Endpoints

```bash
# Without token → 401
curl http://localhost:8000/users/me

# With a valid Stytch JWT → 200 UserProfile
curl -H "Authorization: Bearer <stytch_session_jwt>" http://localhost:8000/users/me
```

---

## Obtaining a Test JWT

Use the Stytch Python SDK to authenticate a test user (requires a live Stytch project):

```python
from stytch import Client

client = Client(project_id="project-test-xxx", secret="secret-test-xxx")

# Magic link: send to test email, then authenticate the token from the link
resp = client.magic_links.authenticate(token="<token_from_magic_link_url>")
print(resp.session_jwt)   # use as Bearer token
print(resp.user_id)       # should match User.id after first /users/me call
```

Or use Stytch's **Sandbox** magic link tokens listed in the dashboard → SDK Configuration.

---

## Step 7 — Run Tests

```bash
cd backend
uv run pytest tests/unit/test_auth.py tests/integration/test_users_me.py -v
```
