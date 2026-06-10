# Quickstart: ChatGPT App — MCP Server + React Widgets

**Feature**: `005-chatgpt-mcp-widgets` | **Date**: 2026-06-07

---

## Prerequisites

- Python 3.12+ with `uv` installed
- Node.js 20+ with `npm`
- A deployed Course Companion FastAPI backend (feature 001–004 complete)
- Stytch project with **Connected Apps** enabled in the dashboard
- Vercel CLI (`npm i -g vercel`)

---

## 1. Environment Setup

Create `chatgpt-app/server/.env` (never commit this file):

```env
# Required — Stytch Connected Apps
STYTCH_PROJECT_DOMAIN=https://<your-project-id>.api.stytch.com
STYTCH_PROJECT_ID=<your-project-id>

# Required — Backend URL (no trailing slash)
BACKEND_URL=https://api.your-domain.com

# Optional — for upgrade CTA in AccessStatus widget
UPGRADE_URL=https://your-domain.com/upgrade
```

---

## 2. MCP Server (Python)

```bash
cd chatgpt-app/server

# Install dependencies
uv sync

# Run locally (hot reload)
uv run fastmcp dev src/main.py

# Run tests
uv run pytest tests/ -v
```

The server starts at `http://localhost:8000`. ChatGPT requires HTTPS for production — use `vercel dev` for local tunneling, or deploy to Vercel for a public URL.

### Available tools (local testing)

```bash
# List chapters (public)
curl http://localhost:8000/mcp/tools/list_chapters

# Get chapter (public)
curl http://localhost:8000/mcp/tools/get_chapter \
  -d '{"slug": "intro-to-mcp"}'

# Get quiz (requires Bearer token)
curl http://localhost:8000/mcp/tools/get_quiz \
  -H "Authorization: Bearer <stytch_jwt>" \
  -d '{"chapter_slug": "intro-to-mcp"}'
```

---

## 3. Widget Bundle (React)

```bash
cd chatgpt-app/widgets

# Install dependencies
npm install

# Start dev server (for local component development)
npm run dev

# Build production bundle
npm run build
# Output: chatgpt-app/widgets/dist/

# Run tests
npm run test
```

Widgets are developed in isolation using Storybook or Vitest. The built bundle (`dist/`) is referenced by the MCP server's panel responses.

---

## 4. ChatGPT App Manifest

`chatgpt-app/manifest.yaml` declares:
- App name, description, and icon
- All 7 tools with their descriptions (ChatGPT uses these to decide when to call each tool)
- OAuth config pointing to Stytch Connected Apps
- MCP server base URL

After editing:
```bash
# Validate manifest structure
cat chatgpt-app/manifest.yaml | python -c "import sys, yaml; yaml.safe_load(sys.stdin.read()); print('valid')"
```

Submit `manifest.yaml` to the OpenAI Apps dashboard for review.

---

## 5. Deploy to Vercel

### MCP Server

```bash
cd chatgpt-app/server
vercel deploy                  # Preview deployment
vercel deploy --prod           # Production deployment

# Set env vars in Vercel dashboard or via CLI:
vercel env add STYTCH_PROJECT_DOMAIN
vercel env add STYTCH_PROJECT_ID
vercel env add BACKEND_URL
```

### Widget Bundle

The widget build output (`dist/`) is deployed as a Vercel static site or served directly from the MCP server's Vercel deployment.

```bash
cd chatgpt-app/widgets
npm run build
vercel deploy                  # Deploys dist/ as static site
```

---

## 6. Test in ChatGPT Developer Mode

1. Open ChatGPT → Apps → Add App → Developer Mode
2. Paste your MCP server URL (e.g., `https://chatgpt-app.vercel.app`)
3. ChatGPT fetches `/.well-known/ai-plugin.json` and reads your manifest
4. Connect the app and try each user story:

| Story | Test prompt |
|-------|-------------|
| US-1 Chapter list | "Show me all course chapters" |
| US-1 Chapter read | "Show me chapter 1" |
| US-2 Quiz | "Quiz me on chapter 1" (must be signed in) |
| US-3 Progress | "What's my learning progress?" (must be signed in) |
| US-4 Search | "Find chapters about tool use" |
| US-5 Access | "What's my account tier?" (must be signed in) |

---

## 7. Verify Success Criteria

- [ ] SC-001: Chapter browsable in <30 s, no sign-in required
- [ ] SC-002: Full quiz completable without leaving ChatGPT
- [ ] SC-003: All 7 tools return a visual panel in Developer Mode
- [ ] SC-004: Keyword search returns results in <3 s
- [ ] SC-005: Protected tools rejected for unauthenticated requests
- [ ] SC-006: Account-linking flow completes in <2 min
- [ ] SC-007: All panels render at ChatGPT panel width (no horizontal scroll)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `chatgpt-app/server/src/main.py` | FastMCP entry point — tool registration |
| `chatgpt-app/server/src/auth.py` | BearerAuthProvider config (Stytch JWKS) |
| `chatgpt-app/server/src/client.py` | httpx backend client |
| `chatgpt-app/server/src/tools/chapters.py` | `list_chapters`, `get_chapter` |
| `chatgpt-app/server/src/tools/quiz.py` | `get_quiz`, `submit_quiz` |
| `chatgpt-app/server/src/tools/progress.py` | `get_progress` |
| `chatgpt-app/server/src/tools/search.py` | `search_content` |
| `chatgpt-app/server/src/tools/access.py` | `check_access` |
| `chatgpt-app/widgets/src/` | React widget components |
| `chatgpt-app/manifest.yaml` | ChatGPT App manifest |
| `specs/005-chatgpt-mcp-widgets/contracts/tools.yaml` | MCP tool schemas |
| `specs/005-chatgpt-mcp-widgets/contracts/widgets.ts` | Widget prop types |
