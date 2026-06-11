import { describe, expect, it } from "vitest";

import {
  createInitialRoute,
  inferView,
  payloadError,
  reduceRoute,
  type WidgetView,
} from "./router";

describe("widget routing", () => {
  it.each([
    ["chapter-list", { chapters: [] }],
    ["chapter-reader", { slug: "one", content: "<p>One</p>" }],
    ["quiz", { questions: [] }],
    ["quiz-result", { score: 2 }],
    ["progress", { chapter_list: [] }],
    ["search", { results: [] }],
    ["access", { tier: "free" }],
  ] satisfies [WidgetView, Record<string, unknown>][])(
    "infers the %s view from tool output",
    (view, payload) => {
      expect(inferView(payload, "chapter-list")).toBe(view);
    },
  );

  it.each([
    ["chapter list to reader", "chapter-list", "chapter-reader"],
    ["search to reader", "search", "chapter-reader"],
    ["progress to reader", "progress", "chapter-reader"],
    ["reader to adjacent reader", "chapter-reader", "chapter-reader"],
    ["quiz to result", "quiz", "quiz-result"],
    ["quiz result to progress", "quiz-result", "progress"],
  ] satisfies [string, WidgetView, WidgetView][])(
    "routes %s after a successful tool call",
    (_label, from, to) => {
      const initial = {
        ...createInitialRoute(from),
        data: { existing: true },
        loading: false,
      };
      const loading = reduceRoute(initial, { type: "navigation-start" });
      const result = reduceRoute(loading, {
        type: "navigation-success",
        view: to,
        payload: { destination: to },
      });

      expect(loading).toMatchObject({
        view: from,
        data: { existing: true },
        loading: true,
      });
      expect(result).toEqual({
        view: to,
        data: { destination: to },
        loading: false,
        error: null,
      });
    },
  );

  it("keeps the current panel visible when navigation fails", () => {
    const current = {
      ...createInitialRoute("chapter-list"),
      data: { chapters: [{ slug: "one" }] },
      loading: true,
    };
    const failed = reduceRoute(current, {
      type: "navigation-error",
      message: "Service unavailable",
    });

    expect(failed).toEqual({
      view: "chapter-list",
      data: { chapters: [{ slug: "one" }] },
      loading: false,
      error: "Service unavailable",
    });
  });

  it("extracts structured tool errors", () => {
    expect(payloadError({ error: { message: "Chapter not found" } })).toBe(
      "Chapter not found",
    );
    expect(payloadError({ error: "Unavailable" })).toBe("Unavailable");
    expect(payloadError({ chapters: [] })).toBeNull();
  });
});
