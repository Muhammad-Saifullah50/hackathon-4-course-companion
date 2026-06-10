import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { ProgressDashboard } from "./index";

const win = window as any;

function callTool(name: string, args: Record<string, unknown>) {
  window.parent.postMessage(
    { jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } },
    "*"
  );
}

function extractPayload(msg: any): Record<string, unknown> | null {
  if (!msg || msg.jsonrpc !== "2.0") return null;
  if (msg.method === "ui/notifications/tool-result") {
    return msg.params?.structuredContent ?? msg.params?.structured_content ?? null;
  }
  if (msg.result) {
    return msg.result.structuredContent ?? msg.result.structured_content ?? null;
  }
  return null;
}

function App() {
  const [data, setData] = useState<any>(win.openai?.widgetState ?? null);

  useEffect(() => {
    if (!win.openai?.widgetState) {
      callTool("get_progress", {});
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
    <ProgressDashboard
      user_id={data.user_id ?? ""}
      current_streak={data.current_streak ?? 0}
      completion_percentage={data.completion_percentage ?? 0}
      total_chapters={data.total_chapters ?? 0}
      completed_chapters={data.completed_chapters ?? 0}
      chapter_list={data.chapter_list ?? []}
      onSelectChapter={(slug) => callTool("get_chapter", { slug })}
      error={data.error}
    />
  );
}

createRoot(document.getElementById("root")!).render(<App />);
