# Data Model: Stytch Authentication (003-stytch-auth)

## Entities

### User

Represents an authenticated student. Created automatically on first successful Stytch login (first-login provisioning — FR-006).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `String(64)` | PRIMARY KEY | Stytch `user_id` from JWT — stable across login methods |
| `email` | `String(255)` | NOT NULL, UNIQUE, INDEX | From Stytch JWT attributes |
| `created_at` | `DateTime(timezone=True)` | NOT NULL, default=now() | UTC; server-side default |
| `access_tier` | `String(32)` | NOT NULL, default="free" | "free" or "premium"; managed by a separate feature |

**SQLAlchemy 2.0 model**:
```python
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    access_tier: Mapped[str] = mapped_column(String(32), nullable=False, default="free")
```

### Token (Not Persisted)

A short-lived JWT issued by Stytch. Verified locally on every request using cached JWKS. Never stored by the backend.

| Field | Source | Notes |
|-------|--------|-------|
| `sub` / `user_id` | JWT claim | Stytch stable user identifier — maps to `User.id` |
| `email` | JWT session attributes | Used during first-login provisioning |
| `iss` | JWT claim | Must be `https://api.stytch.com/v1` |
| `aud` | JWT claim | Must be `stytch_{project_id}` |
| `exp` | JWT claim | 5-minute lifetime; backend rejects expired tokens |
| `scopes` | JWT claim | Granted OAuth scopes for this token |

### Protected Resource Metadata (Static Document)

Served by the MCP server at `GET /.well-known/oauth-protected-resource`. Not stored in a database; generated at startup from environment config.

| Field | Value |
|-------|-------|
| `resource` | Canonical MCP server URI (from env: `MCP_SERVER_URL`) |
| `authorization_servers` | `[STYTCH_AS_URL]` |
| `scopes_supported` | `["chapter.read", "quiz.write", "progress.read", "progress.write"]` |
| `resource_name` | `"Course Companion MCP Server"` |
| `bearer_methods_supported` | `["header"]` |

---

## State Transitions

```
[New User]
    │
    │  first successful Stytch login
    ▼
[User record created] — access_tier="free"
    │
    │  (future feature: tier upgrade)
    ▼
[User record updated] — access_tier="premium"
```

---

## Validation Rules

- `User.id`: Must match the Stytch `user_id` from the verified JWT. Never accepted from the client directly.
- `User.email`: Populated from the JWT; immutable after creation (Stytch is the source of truth for email).
- `User.access_tier`: Defaults to "free". Values constrained to `{"free", "premium"}` at the application layer (not a DB enum to allow future expansion without a migration).
- Token lifetime: Enforced by `stytch_client.sessions.authenticate_jwt()` — expired tokens raise `StytchError` and result in 401.

---

## Database Migration

Migration file: `backend/migrations/versions/001_create_users_table.py`

```sql
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    access_tier VARCHAR(32) NOT NULL DEFAULT 'free'
);
CREATE INDEX ix_users_email ON users (email);
```
