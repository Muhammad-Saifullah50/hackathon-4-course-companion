import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { SearchResults } from "./index";

const win = window as any;

function callTool(name: string, args: Record<string, unknown>) {
  window.parent.postMessage(
    { jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } },
    "*"
  );
}

function App() {
  const [data, setData] = useState<any>(win.openai?.widgetState ?? null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      let msg: any;
      try { msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      if (!msg || msg.jsonrpc !== "2.0") return;
      const payload =
        msg.method === "ui/notifications/tool-result"
          ? (msg.params?.structuredContent ?? msg.params?.structured_content)
          : msg.result
          ? (msg.result.structuredContent ?? msg.result.structured_content)
          : null;
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
    <SearchResults
      query={data.query ?? ""}
      total_matches={data.total_matches ?? 0}
      results={data.results ?? []}
      onSelectChapter={(slug) => callTool("get_chapter", { slug })}
      error={data.error}
    />
  );
}

createRoot(document.getElementById("root")!).render(<App />);
