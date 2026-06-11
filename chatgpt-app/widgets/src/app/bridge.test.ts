import { describe, expect, it } from "vitest";

import {
  McpAppsBridge,
  extractStructuredContent,
  type BridgeHost,
} from "./bridge";

class FakeHost implements BridgeHost {
  readonly messages: unknown[] = [];
  readonly parent = {
    postMessage: (message: unknown): void => {
      this.messages.push(message);
    },
  };

  private listener: ((event: MessageEvent) => void) | null = null;

  addEventListener(
    _type: "message",
    listener: (event: MessageEvent) => void,
  ): void {
    this.listener = listener;
  }

  removeEventListener(
    _type: "message",
    listener: (event: MessageEvent) => void,
  ): void {
    if (this.listener === listener) {
      this.listener = null;
    }
  }

  emit(data: unknown, source: unknown = this.parent): void {
    this.listener?.({ data, source } as MessageEvent);
  }
}

describe("extractStructuredContent", () => {
  it("extracts notification and response payloads", () => {
    expect(
      extractStructuredContent({
        jsonrpc: "2.0",
        method: "ui/notifications/tool-result",
        params: { structuredContent: { slug: "chapter-one" } },
      }),
    ).toEqual({ slug: "chapter-one" });

    expect(
      extractStructuredContent({
        jsonrpc: "2.0",
        result: { structured_content: { score: 4 } },
      }),
    ).toEqual({ score: 4 });
  });

  it("rejects malformed messages", () => {
    expect(extractStructuredContent(null)).toBeNull();
    expect(extractStructuredContent({ jsonrpc: "1.0" })).toBeNull();
    expect(
      extractStructuredContent({
        jsonrpc: "2.0",
        result: { structuredContent: [] },
      }),
    ).toBeNull();
  });
});

describe("McpAppsBridge", () => {
  it("initializes, matches request IDs, and returns tool output", async () => {
    const host = new FakeHost();
    const bridge = new McpAppsBridge(host);
    const initialize = host.messages[0] as { id: number; method: string };

    expect(initialize.method).toBe("ui/initialize");
    host.emit({ jsonrpc: "2.0", id: initialize.id, result: {} });
    await Promise.resolve();

    expect(host.messages).toContainEqual({
      jsonrpc: "2.0",
      method: "ui/notifications/initialized",
      params: {},
    });

    const pending = bridge.callTool("get_chapter", { slug: "chapter-one" });
    await Promise.resolve();
    const toolCall = host.messages.at(-1) as {
      id: number;
      method: string;
      params: unknown;
    };

    expect(toolCall).toMatchObject({
      method: "tools/call",
      params: {
        name: "get_chapter",
        arguments: { slug: "chapter-one" },
      },
    });

    host.emit(
      {
        jsonrpc: "2.0",
        id: toolCall.id,
        result: {
          structuredContent: {
            slug: "chapter-one",
            title: "Chapter One",
          },
        },
      },
      {},
    );
    host.emit({
      jsonrpc: "2.0",
      id: toolCall.id,
      result: {
        structuredContent: {
          slug: "chapter-one",
          title: "Chapter One",
        },
      },
    });

    await expect(pending).resolves.toEqual({
      slug: "chapter-one",
      title: "Chapter One",
    });
    bridge.destroy();
  });

  it("publishes only parent tool-result notifications", async () => {
    const host = new FakeHost();
    const bridge = new McpAppsBridge(host);
    const initialize = host.messages[0] as { id: number };
    host.emit({ jsonrpc: "2.0", id: initialize.id, result: {} });
    await Promise.resolve();

    const received: unknown[] = [];
    bridge.subscribe((payload) => received.push(payload));
    const notification = {
      jsonrpc: "2.0",
      method: "ui/notifications/tool-result",
      params: { structuredContent: { chapters: [] } },
    };

    host.emit(notification, {});
    host.emit(notification);

    expect(received).toEqual([{ chapters: [] }]);
    bridge.destroy();
  });

  it("replays an initial result received before React subscribes", async () => {
    const host = new FakeHost();
    const bridge = new McpAppsBridge(host);
    const initialize = host.messages[0] as { id: number };
    host.emit({ jsonrpc: "2.0", id: initialize.id, result: {} });
    await Promise.resolve();

    host.emit({
      jsonrpc: "2.0",
      method: "ui/notifications/tool-result",
      params: { structuredContent: { chapters: [{ slug: "one" }] } },
    });

    const received: unknown[] = [];
    bridge.subscribe((payload) => received.push(payload));

    expect(received).toEqual([{ chapters: [{ slug: "one" }] }]);
    bridge.destroy();
  });

  it("rejects tool errors without losing request matching", async () => {
    const host = new FakeHost();
    const bridge = new McpAppsBridge(host);
    const initialize = host.messages[0] as { id: number };
    host.emit({ jsonrpc: "2.0", id: initialize.id, result: {} });
    await Promise.resolve();

    const pending = bridge.callTool("get_progress", {});
    await Promise.resolve();
    const toolCall = host.messages.at(-1) as { id: number };
    host.emit({
      jsonrpc: "2.0",
      id: toolCall.id,
      error: { code: -32000, message: "Service unavailable" },
    });

    await expect(pending).rejects.toThrow("Service unavailable");
    bridge.destroy();
  });
});
