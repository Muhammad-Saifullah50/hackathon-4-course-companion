import { createRoot } from "react-dom/client";

import "../styles.css";
import { WidgetApp } from "./WidgetApp";
import { McpAppsBridge } from "./bridge";
import type { WidgetView } from "./router";

export function mountWidget(initialView: WidgetView): void {
  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Widget root element was not found.");
  }

  const bridge = new McpAppsBridge();
  createRoot(root).render(
    <WidgetApp initialView={initialView} bridge={bridge} />,
  );
}
