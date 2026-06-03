# ChatGPT App Development — Python MCP SDK Research

> Research compiled for Course Companion FTE — ChatGPT App (Phase 1 & 2)
> Date: 2026-06-03

---

## 1. Architecture Overview

Three separate services, two frontends sharing one backend:

```
ChatGPT (model + iframe host)          Next.js Web App (Phase 3)
         ↕  MCP protocol                       ↕  REST/HTTP
    chatgpt-app/                          web-app/
  (FastMCP server)                     (Next.js frontend)
         ↕  HTTP calls to REST API             ↕
              FastAPI backend (backend/)
                       ↕
         Neon (PostgreSQL)  +  Cloudflare R2 (content)
```

**Three components of a ChatGPT App:**
- **MCP server** (`chatgpt-app/`) — defines tools ChatGPT calls, calls FastAPI backend, returns structured data + widget HTML
- **Widget/UI** (`chatgpt-app/widgets/`) — HTML/JS/CSS served as MCP resources, rendered in ChatGPT's iframe
- **Model** — ChatGPT decides when to call tools and narrates results; does all reasoning

**Key principle:** The `chatgpt-app/` MCP server is a thin adapter layer. It translates MCP tool calls into HTTP requests to the FastAPI backend — it contains no business logic and no DB access. The FastAPI backend is the single source of truth for both frontends.

**Project structure:**
```
hackathon-4-course-companion/
├── backend/              # FastAPI REST API — business logic, DB, R2
│   └── src/routers/      # content, quizzes, progress, search, access
│
├── chatgpt-app/          # MCP server (Python, FastMCP) — ChatGPT adapter
│   ├── server.py         # FastMCP app + tool definitions
│   ├── widgets/          # HTML/CSS/JS widget files (served as MCP resources)
│   └── skills/           # Tutor instruction .md files → server instructions
│
└── web-app/              # Next.js frontend (Phase 3)
```

---

## 2. Python SDK Setup

```bash
# Inside chatgpt-app/
uv add mcp fastmcp httpx
```

FastMCP is the idiomatic Python layer over the MCP Python SDK. It uses decorators and type hints to auto-generate JSON Schema for tools and resources .

### chatgpt-app/server.py skeleton

```python
# chatgpt-app/server.py
import httpx
from fastmcp import FastMCP

BACKEND_URL = "https://api.course-companion.example.com"  # env var in practice

mcp = FastMCP(name="course-companion", version="1.0.0", instructions="""
You are a Course Companion tutor for AI Agent Development.
Always call get_chapter before explaining a topic.
For quizzes, call get_quiz first, then grade with submit_quiz_answer.
Use get_progress to motivate the user with their streak data.
""")

# have to see the tool calls later

# All tool handlers call the FastAPI backend — no DB access here
http = httpx.AsyncClient(base_url=BACKEND_URL)
```

Run it standalone:
```bash
cd chatgpt-app
uv run uvicorn server:mcp.http_app() --port 8001
```

The `instructions` field is sent to ChatGPT during MCP initialization and guides
cross-tool behavior — this is where your tutor persona lives (not in individual tool descriptions).

---

## 3. Defining Tools

Tools are the contract the model reasons about. Use the `@mcp.tool` decorator:

```python
@mcp.tool(annotations={"readOnlyHint": True, "openWorldHint": False})
async def get_chapter(slug: str) -> dict:
    """Fetch a course chapter by its slug. Returns markdown content and navigation info."""
    # Call the FastAPI backend — no DB or R2 access here
    response = await http.get(f"/chapters/{slug}")
    response.raise_for_status()
    chapter = response.json()

    return {
        "structuredContent": {
            "slug": chapter["slug"],
            "title": chapter["title"],
            "chapter_number": chapter["chapter_number"],
            "total_chapters": chapter["total_chapters"],
            # Keep this short — model reads structuredContent
            "summary": chapter["summary"],
        },
        "content": [{"type": "text", "text": f"Fetched chapter: {chapter['title']}"}],
        "_meta": {
            # Full markdown lives here — widget only, never reaches model
            "content_markdown": chapter["content_markdown"],
            "ui": {"resourceUri": "ui://widget/chapter-reader.html"},
            "widgetSessionId": slug,
        }
    }
```

### Three sibling payloads in every tool response

| Payload | Who sees it | What to put there |
|---|---|---|
| `structuredContent` | Model + widget | Concise JSON for model reasoning |
| `content` | Model narration | Short text/markdown, optional |
| `_meta` | Widget only, never model | Large/sensitive data, widget state |

Keep `structuredContent` tight — oversized payloads degrade model performance.

### Tool annotations (required)

```python
@mcp.tool(annotations={
    "readOnlyHint": True,      # True = only reads, no side effects
    "openWorldHint": False,    # False = bounded target (your DB only)
    "destructiveHint": False   # True = delete/overwrite ops
})
```

Omitting these is a validation error. Set them accurately.

---

## 4. Registering HTML Widget Resources

Each tool can optionally point to a UI widget rendered in ChatGPT's iframe.
Register HTML as an MCP resource with MIME type `text/html;profile=mcp-app`:

Widget HTML files live in `chatgpt-app/widgets/` and are loaded at startup:

```python
# chatgpt-app/server.py
from pathlib import Path
from mcp.types import TextResourceContents

WIDGETS_DIR = Path(__file__).parent / "widgets"

def load_widget(name: str) -> str:
    return (WIDGETS_DIR / name).read_text()

@mcp.resource(uri="ui://widget/chapter-reader.html")
async def chapter_reader_widget() -> TextResourceContents:
    return TextResourceContents(
        uri="ui://widget/chapter-reader.html",
        mimeType="text/html;profile=mcp-app",
        text=load_widget("chapter-reader.html"),
        _meta={
            "ui": {
                "prefersBorder": True,
                "domain": "https://course-companion.example.com",
                "csp": {
                    "connectDomains": ["https://api.course-companion.example.com"],
                    "resourceDomains": ["https://cdn.tailwindcss.com"],
                }
            }
        }
    )
```

Tools reference widget URIs in their `_meta`:

```python
"_meta": {
    "ui": {"resourceUri": "ui://widget/chapter-reader.html"},
    "widgetSessionId": slug,
}
```

**Cache-busting:** When you update widget HTML, change the URI
(`chapter-reader-v2.html`) so ChatGPT doesn't serve a stale bundle.

---

## 5. Building Beautiful UI Widgets

### Sandbox constraints

Widgets run in a double-iframe sandbox with strict CSP. Rules:

- **Inline `<style>` and `style=` always work** — no external CSS needed
- **Tailwind CSS CDN** is available via `https://cdn.tailwindcss.com`
- **No external fetch** unless domain is in `connectDomains`
- **No external scripts** unless domain is in `resourceDomains`
- **No subframes** unless `frameDomains` is declared (discouraged, adds review scrutiny)

### Recommended widget stack

For Course Companion, use **React + `@openai/apps-sdk-ui`** for all widgets.
See Section 12 for the full React widget setup. Vanilla JS + Tailwind CDN is a fallback for trivial widgets only.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: { brand: '#6366f1' }
        }
      }
    }
  </script>
</head>
<body class="bg-gray-50 p-4 font-sans">
  <div id="root" class="max-w-2xl mx-auto">
    <p class="text-gray-400 text-sm">Loading...</p>
  </div>

  <script type="module">
    // ── MCP Apps bridge setup ───────────────────────────────────────────
    let rpcId = 0;
    const pending = new Map();

    const notify = (method, params) =>
      window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");

    const request = (method, params) =>
      new Promise((resolve, reject) => {
        const id = ++rpcId;
        pending.set(id, { resolve, reject });
        window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
      });

    window.addEventListener("message", (e) => {
      if (e.source !== window.parent) return;
      const msg = e.data;
      if (!msg || msg.jsonrpc !== "2.0") return;

      if (typeof msg.id === "number") {
        const p = pending.get(msg.id);
        if (!p) return;
        pending.delete(msg.id);
        msg.error ? p.reject(msg.error) : p.resolve(msg.result);
        return;
      }

      if (msg.method === "ui/notifications/tool-result") {
        render(msg.params?.structuredContent);
      }
    }, { passive: true });

    // Initialize bridge
    const ready = request("ui/initialize", {
      appInfo: { name: "chapter-reader", version: "1.0.0" },
      appCapabilities: {},
      protocolVersion: "2026-01-26",
    }).then(() => notify("ui/notifications/initialized", {}));

    // Call a tool from the widget
    const callTool = async (name, args) => {
      await ready;
      return request("tools/call", { name, arguments: args });
    };

    // ── Render function ─────────────────────────────────────────────────
    const render = (data) => {
      if (!data) return;
      document.getElementById("root").innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 class="text-xl font-bold text-gray-900 mb-1">${data.title}</h1>
          <p class="text-xs text-gray-400 mb-4">
            Chapter ${data.chapter_number} of ${data.total_chapters}
          </p>
          <div class="prose prose-sm text-gray-700 leading-relaxed">
            ${data.content_html ?? data.content_markdown}
          </div>
        </div>
      `;
    };
  </script>
</body>
</html>
```

### Widget design principles for ChatGPT

- **Max width ~680px** — ChatGPT's widget panel is narrow on most screens
- **No fixed heights** — let the widget grow naturally; ChatGPT handles scroll
- **System font stack** — `font-family: system-ui, -apple-system, sans-serif`
- **Light theme by default** — ChatGPT dark mode doesn't bleed into the iframe
- **Rounded cards** — `border-radius: 12-16px` matches ChatGPT's UI language
- **Subtle shadows** — `box-shadow: 0 4px 12px rgba(0,0,0,0.06)` feels native

---

## 6. Stateful Widgets with widgetSessionId

The `widgetSessionId` in `_meta` binds a widget instance to a server-side session,
so state persists across conversation turns:

```python
# Server: persist state keyed by session
_sessions: dict[str, dict] = {}  # replace with Redis/DB in production

@mcp.tool()
async def get_quiz(chapter_slug: str, session_id: str) -> dict:
    session = _sessions.setdefault(session_id, {"answers": [], "score": None})
    questions = await r2_service.get_quiz(chapter_slug)
    return {
        "structuredContent": {
            "questions": [{"id": q["id"], "text": q["text"], "options": q["options"]}
                          for q in questions],
            "answered_count": len(session["answers"]),
        },
        "_meta": {
            "ui": {"resourceUri": "ui://widget/quiz.html"},
            "widgetSessionId": session_id,
            "answer_key": {q["id"]: q["answer"] for q in questions},  # widget only
        }
    }
```

```javascript
// Widget: persist local UI state across re-renders
window.openai?.setWidgetState?.({ currentQuestion: 2 });
const saved = await window.openai?.getWidgetState?.();
```

---

## 7. Tool Visibility (model vs. widget-only)

Some tools should be called by the widget directly but hidden from the model's
tool selection. Use `visibility`:

```python
@mcp.tool(
    _meta={"ui": {"resourceUri": "ui://widget/quiz.html", "visibility": ["app"]}}
)
async def submit_quiz_answer(question_id: str, answer: str, session_id: str) -> dict:
    """Internal grading tool — called by quiz widget, not by model."""
    ...
```

`"visibility": ["model", "app"]` — both can call it (default)
`"visibility": ["app"]` — widget only, hidden from model
`"visibility": ["model"]` — model only, not callable from widget

---

## 8. Server Instructions (Tutor Persona)

The `instructions` field on `FastMCP(...)` is the home for your skill files.
Condense `chatgpt-app/skills/*.md` into the instructions string:

```python
mcp = FastMCP(
    name="course-companion",
    instructions="""
You are a Course Companion — an AI tutor for the AI Agent Development course.

TOOL SEQUENCES:
- To explain a topic: call get_chapter first, then explain using the content returned.
- To run a quiz: call get_quiz, present questions one at a time, call submit_quiz_answer per answer.
- To motivate: call get_progress and reference the user's streak and completion %.

TEACHING STYLE:
- Default to Socratic mode: ask guiding questions before revealing answers.
- On wrong quiz answers: give a hint, not the answer directly.
- Celebrate milestones (100% chapter completion, 3-day streak, etc).

CONSTRAINTS:
- Never explain content not in the chapter. If asked, say "that's outside our current module."
- Free-tier users: call check_access before serving premium chapters.
"""
)
```

Keep the first 512 characters self-contained — that's what ChatGPT prioritizes.

---

## 9. Phase 1 Tool List for Course Companion

| Tool | Annotations | Widget |
|---|---|---|
| `list_chapters` | readOnly | chapter-nav widget |
| `get_chapter` | readOnly | chapter-reader widget |
| `get_quiz` | readOnly | quiz widget |
| `submit_quiz_answer` | readOnly=False, openWorld=False | quiz widget (visibility: app) |
| `get_progress` | readOnly | progress-dashboard widget |
| `search_content` | readOnly | search-results widget |
| `check_access` | readOnly | (no widget) |

---

## 10. Local Dev & Testing

```bash
# Terminal 1 — start FastAPI backend
cd backend
uv run uvicorn src.main:app --reload --port 8000

# Terminal 2 — start MCP server (points to backend at localhost:8000)
cd chatgpt-app
BACKEND_URL=http://localhost:8000 uv run uvicorn server:app --reload --port 8001

# Terminal 3 — tunnel the MCP server (ChatGPT requires HTTPS)
ngrok http 8001
# → https://<subdomain>.ngrok.app  ← paste this into ChatGPT developer mode

# Test MCP tools before connecting to ChatGPT
npx @modelcontextprotocol/inspector http://localhost:8001
```

MCP Inspector lets you call tools and verify widget rendering before touching ChatGPT.

---

## 11. Deployment

Both services need separate HTTPS endpoints:

| Service | Deploy target | Notes |
|---|---|---|
| `backend/` (FastAPI) | Vercel (already in stack) | REST API, serverless functions |
| `chatgpt-app/` (FastMCP) | Vercel or Railway | Separate deployment, set `BACKEND_URL` env var |

```bash
# chatgpt-app env vars
BACKEND_URL=https://api.course-companion.vercel.app
```

The MCP server is stateless — all state lives in Neon/R2 via the backend. So Vercel serverless works fine for the hackathon.

---

## 12. React Widgets with @openai/apps-sdk-ui

### What it is

`@openai/apps-sdk-ui` is OpenAI's official React component library for ChatGPT App widgets.
It provides pre-built components that match ChatGPT's visual language, built on Tailwind CSS v4 and Radix primitives for accessibility.

### Install

```bash
# Inside chatgpt-app/widgets/ (its own npm project)
npm install @openai/apps-sdk-ui react react-dom
npm install -D vite @vitejs/plugin-react tailwindcss
```

### Available Components

| Component | Use case |
|---|---|
| `Button` | Actions, quiz submission |
| `Badge` | Status indicators (correct/wrong, streak, tier) |
| `TextLink` / `ButtonLink` | Navigation between chapters |
| `List` | Chapter index, quiz question list |
| `Carousel` | Featured content, chapter highlights |
| `Album` | Media/image grids |
| `Map` | Geo data (not needed for course) |
| `Shop` | Product browsing (not needed for course) |
| `Icon` | Calendar, Invoice, Members, Phone, Maps |
| `AppsSDKUIProvider` | Root wrapper — configures router links |

### Widget project structure

```
chatgpt-app/
├── server.py                  # FastMCP server
├── skills/                    # Tutor instruction files
└── widgets/                   # React widget project
    ├── package.json
    ├── vite.config.ts
    ├── src/
    │   ├── chapter-reader/
    │   │   └── main.tsx       # Chapter reader widget
    │   ├── quiz/
    │   │   └── main.tsx       # Quiz widget
    │   └── progress/
    │       └── main.tsx       # Progress dashboard widget
    └── dist/                  # Built output — loaded by server.py
        ├── chapter-reader.html
        ├── quiz.html
        └── progress.html
```

### Vite config — one HTML entry per widget

```typescript
// chatgpt-app/widgets/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        "chapter-reader": "src/chapter-reader/index.html",
        quiz: "src/quiz/index.html",
        progress: "src/progress/index.html",
      },
    },
    outDir: "dist",
  },
});
```

### Widget entry HTML

```html
<!-- src/chapter-reader/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

### Widget React component

```tsx
// src/chapter-reader/main.tsx
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AppsSDKUIProvider, Badge, Button } from "@openai/apps-sdk-ui";
import "@openai/apps-sdk-ui/tailwind.css";

// ── MCP Apps bridge ────────────────────────────────────────────────────
let rpcId = 0;
const pending = new Map<number, { resolve: Function; reject: Function }>();

const notify = (method: string, params: unknown) =>
  window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");

const request = (method: string, params: unknown) =>
  new Promise<any>((resolve, reject) => {
    const id = ++rpcId;
    pending.set(id, { resolve, reject });
    window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  });

window.addEventListener("message", (e) => {
  if (e.source !== window.parent) return;
  const msg = e.data;
  if (!msg || msg.jsonrpc !== "2.0") return;
  if (typeof msg.id === "number") {
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.reject(msg.error) : p.resolve(msg.result);
  }
});

const bridgeReady = request("ui/initialize", {
  appInfo: { name: "chapter-reader", version: "1.0.0" },
  appCapabilities: {},
  protocolVersion: "2026-01-26",
}).then(() => notify("ui/notifications/initialized", {}));

const callTool = async (name: string, args: Record<string, unknown>) => {
  await bridgeReady;
  return request("tools/call", { name, arguments: args });
};

// ── Component ──────────────────────────────────────────────────────────
interface ChapterData {
  title: string;
  chapter_number: number;
  total_chapters: number;
  summary: string;
  content_markdown?: string;  // from _meta
}

function ChapterReader() {
  const [chapter, setChapter] = useState<ChapterData | null>(null);

  useEffect(() => {
    window.addEventListener("message", (e) => {
      if (e.source !== window.parent) return;
      const msg = e.data;
      if (msg?.method === "ui/notifications/tool-result") {
        setChapter(msg.params?.structuredContent ?? null);
      }
    });
  }, []);

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Loading chapter...
      </div>
    );
  }

  return (
    <AppsSDKUIProvider>
      <div className="p-5 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            Chapter {chapter.chapter_number} / {chapter.total_chapters}
          </Badge>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{chapter.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed">{chapter.summary}</p>
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => callTool("get_quiz", { chapter_slug: chapter.slug })}
          >
            Take Quiz
          </Button>
          <Button size="sm" variant="outline"
            onClick={() => callTool("get_progress", {})}
          >
            My Progress
          </Button>
        </div>
      </div>
    </AppsSDKUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<ChapterReader />);
```

### Build and serve from Python MCP server

```bash
# Build all widgets
cd chatgpt-app/widgets
npm run build
# → dist/chapter-reader.html, dist/quiz.html, dist/progress.html
```

The built HTML files are self-contained (all JS/CSS inlined by Vite).
`server.py` loads them from `dist/` as MCP resources:

```python
WIDGETS_DIR = Path(__file__).parent / "widgets" / "dist"
```

### Dev workflow

```bash
# Terminal 1 — widget hot reload
cd chatgpt-app/widgets && npm run dev

# Terminal 2 — rebuild on change, then restart MCP server
cd chatgpt-app/widgets && npm run build --watch

# Terminal 3 — MCP server
cd chatgpt-app && uv run uvicorn server:app --reload --port 8001
```

For production, run `npm run build` as part of the deploy step before starting the MCP server.

---

## References

- [OpenAI Apps SDK: Build MCP Server](https://developers.openai.com/apps-sdk/build/mcp-server)
- [OpenAI Apps SDK: Build ChatGPT UI](https://developers.openai.com/apps-sdk/build/chatgpt-ui)
- [FastMCP Docs](https://gofastmcp.com)
- [FastMCP + FastAPI Integration](https://gofastmcp.com/integrations/fastapi)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [OpenAI Apps SDK Examples (Python)](https://github.com/openai/openai-apps-sdk-examples)
- [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector)
- [MCP Apps Compatibility in ChatGPT](https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt)
- [@openai/apps-sdk-ui Storybook](https://openai.github.io/apps-sdk-ui/)
- [@openai/apps-sdk-ui GitHub](https://github.com/openai/apps-sdk-ui)
