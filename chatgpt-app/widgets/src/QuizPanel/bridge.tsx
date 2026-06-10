import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";
import { QuizPanel, QuizResult } from "./index";

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

  // submit_quiz returns { score, total, percentage, per_question, ... }
  // get_quiz returns { questions, total_questions, chapter_slug, ... }
  if ("score" in data) {
    return (
      <QuizResult
        chapter_slug={data.chapter_slug ?? ""}
        score={data.score ?? 0}
        total={data.total ?? 0}
        percentage={data.percentage ?? 0}
        per_question={data.per_question ?? []}
        onViewProgress={() => callTool("get_progress", {})}
      />
    );
  }

  return (
    <QuizPanel
      chapter_slug={data.chapter_slug ?? ""}
      chapter_title={data.chapter_title ?? ""}
      questions={data.questions ?? []}
      total_questions={data.total_questions ?? 0}
      onSubmit={(answers) =>
        callTool("submit_quiz", { chapter_slug: data.chapter_slug, answers })
      }
      error={data.error}
    />
  );
}

createRoot(document.getElementById("root")!).render(<App />);
