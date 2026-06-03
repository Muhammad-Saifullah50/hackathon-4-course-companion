# Implementation Plan: Content Delivery

**Branch**: `1-content-delivery` | **Date**: 2026-06-03 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/1-content-delivery/spec.md`

---

## Summary

Content Delivery serves 5 authored Markdown course chapters from Cloudflare R2 via a FastAPI backend. A manifest.json in R2 defines chapter order and slugs. The service exposes four endpoint groups: list chapters, get chapter by slug (with nav context), next/prev navigation, and short-lived signed media URLs. An in-process TTL cache (default 5 min) for the manifest and chapter bodies meets the 2-second performance target. No database is used for content metadata — all ordering is manifest-driven.

---

## Technical Context

**Language/Version**: Python 3.12  
**Primary Dependencies**: FastAPI, Pydantic v2, boto3 (sync in thread pool) or aioboto3 (async), pydantic-settings, pytest  
**Storage**: Cloudflare R2 (S3-compatible) for chapter Markdown files, manifest.json, and media assets. No DB for content metadata.  
**Testing**: pytest + pytest-asyncio + httpx AsyncClient  
**Target Platform**: Linux server (Vercel serverless functions via ASGI adapter)  
**Project Type**: Web application (FastAPI backend only for this feature)  
**Performance Goals**: Chapter fetch ≤2s p95, media signed URL ≤1s p95 under cache-warm conditions  
**Constraints**: Zero LLM calls (Phase 1 hard constraint). No DB for content metadata. In-memory cache only — no Redis. Content updates are infrequent (TTL invalidation is sufficient).  
**Scale/Scope**: 5 chapters, ~5-20 concurrent learners for the hackathon demo

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Zero LLM calls (Phase 1) | ✅ PASS | No LLM library imports anywhere in this feature |
| Content in Cloudflare R2 | ✅ PASS | All chapters, manifest, and media served from R2 |
| Service/repository layer | ✅ PASS | `services/content.py` holds all R2 and cache logic; router is thin |
| Pydantic v2 models for all I/O | ✅ PASS | Request/response shapes and manifest schema are Pydantic models |
| pydantic-settings for config | ✅ PASS | R2 credentials and TTL via settings class |
| No raw SQL | ✅ PASS | No database access in this feature |
| No secrets in committed files | ✅ PASS | .env in .gitignore; credentials via env vars only |
| Public endpoints (no auth) | ✅ PASS | All content endpoints are public per spec FR-011 |
| Functions ≤50 lines | ✅ PASS | Will enforce during implementation |

**Verdict**: No violations. Proceed to Phase 0.

---

## Project Structure

### Documentation (this feature)

```text
specs/1-content-delivery/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── openapi.yaml
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── main.py                   # FastAPI app entrypoint
│   ├── core/
│   │   ├── config.py             # pydantic-settings Settings class
│   │   └── dependencies.py       # Shared FastAPI dependencies
│   ├── models/
│   │   └── content.py            # ChapterSummary, ChapterDetail, MediaUrl, Manifest
│   ├── routers/
│   │   └── content.py            # Chapter list, get, nav, media URL endpoints
│   └── services/
│       └── content.py            # R2 client, cache, manifest loading, chapter fetching
├── tests/
│   └── test_content.py           # pytest test suite for content service + router
├── pyproject.toml
└── .env.example

content/
├── chapters/                     # Authored .md chapter files (synced to R2)
│   ├── claude-agent-sdk-foundations.md
│   ├── claude-agent-sdk-advanced.md
│   ├── mcp-introduction.md
│   ├── mcp-building-servers.md
│   └── agent-skills.md
└── manifest.json                 # Authoritative chapter order and metadata
```

**Structure Decision**: Single backend project (`backend/`). Content lives in `content/` at repo root and is synced to R2. No frontend changes for this feature.

---

## Complexity Tracking

> No constitution violations — this section left intentionally minimal.

| Design Choice | Why | Simpler Alternative Rejected Because |
|---|---|---|
| In-memory TTL cache | R2 latency would exceed 2s SLA on every request | Cache is required per spec FR-012 |
| boto3 in thread pool (vs aioboto3) | aioboto3 is less mature; boto3 `generate_presigned_url` is synchronous-only anyway | aioboto3 presigned URL support is incomplete |
