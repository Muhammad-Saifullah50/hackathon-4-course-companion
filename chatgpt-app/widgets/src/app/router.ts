import type { JsonObject } from "./bridge";

export type WidgetView =
  | "chapter-list"
  | "chapter-reader"
  | "quiz"
  | "quiz-result"
  | "progress"
  | "search"
  | "access";

export interface WidgetRoute {
  view: WidgetView;
  data: JsonObject | null;
  loading: boolean;
  error: string | null;
}

export type RouteAction =
  | { type: "initial-result"; payload: JsonObject }
  | { type: "navigation-start" }
  | { type: "navigation-success"; view: WidgetView; payload: JsonObject }
  | { type: "navigation-error"; message: string };

export function createInitialRoute(view: WidgetView): WidgetRoute {
  return { view, data: null, loading: true, error: null };
}

export function reduceRoute(
  route: WidgetRoute,
  action: RouteAction,
): WidgetRoute {
  switch (action.type) {
    case "initial-result":
      return {
        view: inferView(action.payload, route.view),
        data: action.payload,
        loading: false,
        error: null,
      };
    case "navigation-start":
      return { ...route, loading: true, error: null };
    case "navigation-success":
      return {
        view: action.view,
        data: action.payload,
        loading: false,
        error: null,
      };
    case "navigation-error":
      return { ...route, loading: false, error: action.message };
  }
}

export function inferView(payload: JsonObject, fallback: WidgetView): WidgetView {
  if (Array.isArray(payload.chapters)) return "chapter-list";
  if (typeof payload.content === "string" && typeof payload.slug === "string") {
    return "chapter-reader";
  }
  if (typeof payload.score === "number") return "quiz-result";
  if (Array.isArray(payload.questions)) return "quiz";
  if (Array.isArray(payload.chapter_list)) return "progress";
  if (Array.isArray(payload.results)) return "search";
  if (typeof payload.tier === "string") return "access";
  return fallback;
}

export function payloadError(payload: JsonObject): string | null {
  const error = payload.error;
  if (typeof error === "string") {
    return error;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return null;
}
