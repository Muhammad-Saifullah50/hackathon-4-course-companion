# Research: Stytch Authentication (003-stytch-auth)

## 1. Stytch Python SDK — JWT Verification

**Decision**: Use the `stytch` Python package for local JWT verification via cached JWKS.

**Rationale**: The SDK automatically fetches Stytch's JWKS at client initialization, caches the public keys, and handles rotation. This avoids a remote API call on every request (FR-004) and satisfies the sub-200ms overhead requirement (NFR-001). Stytch JWTs expire every 5 minutes; the SDK falls back to a remote call only for expired tokens.

**Key API**:
```python
from stytch import Client

# Initialized once at startup — persisted across requests
stytch_client = Client(project_id=STYTCH_PROJECT_ID, secret=STYTCH_SECRET)

# Local JWT verification (no network call if token is fresh)
resp = stytch_client.sessions.authenticate_jwt(session_jwt=bearer_token)
# resp.session.user_id  → stable Stytch user ID (maps to JWT `sub`)
# resp.session.attributes.email  → user email
# resp.session.custom_claims     → additional claims
```

**Error handling**: Raises `stytch.core.api_base.StytchError` on invalid/expired tokens; catch and raise `HTTPException(401)`.

**Email extraction**: `resp.session.attributes.email` is NOT reliable across all Stytch auth methods (magic link, OAuth, password). The correct source is `resp.user.emails[0].email`, which is always populated by the SDK for a verified session.

**Audience claim**: The SDK validates `aud` automatically using the `project_id` provided at `Client()` init — no manual claim checking needed.

**Async**: The `stytch` SDK is synchronous. FastAPI sync dependencies run in a thread pool automatically — no explicit `asyncio.to_thread()` required. Because `authenticate_jwt()` with a warm cache is a pure in-process crypto op (~1ms), thread pool overhead is negligible.

**Stytch JWKS endpoint**: `https://api.stytch.com/v1/sessions/jwks/{project_id}`

**JWKS refresh**: SDK auto-refreshes in background. NFR-003 (15-minute schedule) is satisfied by SDK internals; no manual scheduling needed.

**Alternatives considered**: Raw `python-jose` / `PyJWT` with manual JWKS fetch — rejected because the Stytch SDK already handles key rotation, caching, and fallback logic.

---

## 2. MCP Authorization Spec

> **Deferred** — MCP server auth (RFC 9728 protected resource metadata, `WWW-Authenticate` challenge, per-tool scopes) is out of scope for this feature. Research notes preserved for the ChatGPT MCP feature.
>
> Key findings to carry forward: June 2025 spec mandates RFC 9728; Stytch AS metadata at `https://api.stytch.com/v1/public/{project_id}/.well-known/oauth-authorization-server`; `WWW-Authenticate` parameter name is `resource_metadata` (not `resource_metadata_uri`).

---

## 3. SQLAlchemy 2.0 Async + Neon PostgreSQL

**Decision**: Use `sqlalchemy[asyncio]` + `asyncpg` driver with Neon PostgreSQL.

**Key patterns**:
```python
# Neon connection string (asyncpg dialect, SSL required)
DATABASE_URL = "postgresql+asyncpg://user:pass@host.neon.tech/db?sslmode=require"

# Engine
engine = create_async_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Model (SQLAlchemy 2.0 style)
class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)   # Stytch user_id
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    access_tier: Mapped[str] = mapped_column(String(32), default="free")

# Upsert on first login (PostgreSQL ON CONFLICT DO NOTHING)
from sqlalchemy.dialects.postgresql import insert as pg_insert

stmt = pg_insert(User).values(id=stytch_user_id, email=email)
stmt = stmt.on_conflict_do_nothing(index_elements=["id"])
await db.execute(stmt)
await db.commit()
```

**Pool settings for Neon**: `pool_pre_ping=True` (validates connections) and `pool_recycle=3600` (handles Neon's 30-minute idle timeout) are critical.

**Alembic async setup**: `env.py` uses `create_async_engine` + `asyncio.run(run_migrations_online())`.

**Alternatives considered**: Synchronous SQLAlchemy — rejected to maintain consistency with async FastAPI; direct asyncpg — rejected because SQLAlchemy ORM satisfies the no-raw-SQL constraint.

---

## 5. User Identity — Stytch `user_id` as Primary Key

**Decision**: Use the Stytch `user_id` (stable string identifier from `resp.session.user_id`) as the application `User.id` primary key.

**Rationale**: Stytch's `user_id` is stable across login methods (email, OAuth, magic link). Using it as PK avoids a separate UUID column and eliminates a join when looking up the user from a token.

**Alternatives considered**: Application-generated UUID with `stytch_user_id` as a unique column — rejected because it adds unnecessary indirection; there is no reason to hide the Stytch identity.
