export type JsonObject = Record<string, unknown>;

interface JsonRpcError {
  code?: number;
  message?: string;
}

interface JsonRpcMessage {
  jsonrpc?: string;
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: JsonRpcError;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

export interface BridgeHost {
  parent: {
    postMessage: (message: unknown, targetOrigin: string) => void;
  };
  addEventListener: (
    type: "message",
    listener: (event: MessageEvent) => void,
    options?: AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    type: "message",
    listener: (event: MessageEvent) => void,
  ) => void;
}

export function extractStructuredContent(message: unknown): JsonObject | null {
  if (!isObject(message) || message.jsonrpc !== "2.0") {
    return null;
  }

  const envelope =
    message.method === "ui/notifications/tool-result"
      ? message.params
      : message.result;

  if (!isObject(envelope)) {
    return null;
  }

  const content = envelope.structuredContent ?? envelope.structured_content;
  return isObject(content) ? content : null;
}

export class McpAppsBridge {
  private nextId = 0;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly subscribers = new Set<(payload: JsonObject) => void>();
  private readonly ready: Promise<void>;
  private latestPayload: JsonObject | null = null;

  constructor(private readonly host: BridgeHost = window) {
    this.host.addEventListener("message", this.handleMessage, { passive: true });
    this.ready = this.initialize();
  }

  subscribe(listener: (payload: JsonObject) => void): () => void {
    this.subscribers.add(listener);
    if (this.latestPayload) {
      listener(this.latestPayload);
    }
    return () => this.subscribers.delete(listener);
  }

  async callTool(name: string, args: JsonObject): Promise<JsonObject> {
    await this.ready;
    const result = await this.request("tools/call", {
      name,
      arguments: args,
    });
    const payload = extractStructuredContent({
      jsonrpc: "2.0",
      result,
    });

    if (!payload) {
      throw new Error(`Tool "${name}" returned no structured content.`);
    }
    return payload;
  }

  destroy(): void {
    this.host.removeEventListener("message", this.handleMessage);
    this.pending.clear();
    this.subscribers.clear();
  }

  private async initialize(): Promise<void> {
    await this.request("ui/initialize", {
      appInfo: { name: "claudeteacher-widgets", version: "1.0.0" },
      appCapabilities: {},
      protocolVersion: "2026-01-26",
    });
    this.host.parent.postMessage(
      {
        jsonrpc: "2.0",
        method: "ui/notifications/initialized",
        params: {},
      },
      "*",
    );
  }

  private request(method: string, params: JsonObject): Promise<unknown> {
    const id = ++this.nextId;
    const promise = new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    this.host.parent.postMessage(
      { jsonrpc: "2.0", id, method, params },
      "*",
    );
    return promise;
  }

  private readonly handleMessage = (event: MessageEvent): void => {
    if (event.source !== this.host.parent) {
      return;
    }

    const message = parseMessage(event.data);
    if (!message || message.jsonrpc !== "2.0") {
      return;
    }

    if (typeof message.id === "number") {
      const request = this.pending.get(message.id);
      if (!request) {
        return;
      }

      this.pending.delete(message.id);
      if (message.error) {
        request.reject(new Error(message.error.message ?? "Tool call failed."));
      } else {
        request.resolve(message.result);
      }
      return;
    }

    if (message.method !== "ui/notifications/tool-result") {
      return;
    }

    const payload = extractStructuredContent(message);
    if (payload) {
      this.latestPayload = payload;
      this.subscribers.forEach((listener) => listener(payload));
    }
  };
}

function parseMessage(value: unknown): JsonRpcMessage | null {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return isObject(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isObject(value) ? value : null;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
