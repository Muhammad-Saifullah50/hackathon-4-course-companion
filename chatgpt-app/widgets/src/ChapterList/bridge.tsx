import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { ChapterList } from "./index";

const win = window as any;

function callTool(name: string, args: Record<string, unknown>) {
  window.parent.postMessage(
    { jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } },
    "*"
  );
}

function extractPayload(msg: any): Record<string, unknown> | null {
  if (!msg || msg.jsonrpc !== "2.0") return null;
  // Notification: method-based push from ChatGPT
  if (msg.method === "ui/notifications/tool-result") {
    return msg.params?.structuredContent ?? msg.params?.structured_content ?? null;
  }
  // Response: reply to a tools/call we sent
  if (msg.result) {
    return msg.result.structuredContent ?? msg.result.structured_content ?? null;
  }
  return null;
}

function App() {
  const [data, setData] = useState<any>(win.openai?.widgetState ?? null);

  useEffect(() => {
    // Auto-bootstrap: if widgetState wasn't injected, fetch it ourselves
    if (!win.openai?.widgetState) {
      callTool("list_chapters", {});
    }

    const handler = (e: MessageEvent) => {
      let msg: any;
      try { msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      const payload = extractPayload(msg);
      if (payload) {
        setData(payload);
        win.openai?.setWidgetState(payload);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                  height: "100px", color: "#888", fontSize: "0.9rem" }}>
      Loading…
    </div>
  );

  return (
    <ChapterList
      chapters={data.chapters ?? []}
      onSelectChapter={(slug) => callTool("get_chapter", { slug })}
      error={data.error}
    />
  );
}

createRoot(document.getElementById("root")!).render(<App />);
