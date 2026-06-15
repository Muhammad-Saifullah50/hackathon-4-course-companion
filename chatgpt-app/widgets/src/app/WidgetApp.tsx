import { useCallback, useEffect, useReducer } from "react";

import { AccessStatus } from "../AccessStatus";
import { ChapterList } from "../ChapterList";
import { ChapterReader } from "../ChapterReader";
import { ErrorPanel } from "../ErrorPanel";
import { ProgressDashboard } from "../ProgressDashboard";
import { QuizPanel, QuizResult } from "../QuizPanel";
import { SearchResults } from "../SearchResults";
import { McpAppsBridge, type JsonObject } from "./bridge";
import {
  createInitialRoute,
  payloadError,
  reduceRoute,
  type WidgetView,
} from "./router";

interface WidgetAppProps {
  initialView: WidgetView;
  bridge: McpAppsBridge;
}

export function WidgetApp({ initialView, bridge }: WidgetAppProps) {
  const [route, dispatch] = useReducer(
    reduceRoute,
    initialView,
    createInitialRoute,
  );

  useEffect(
    () =>
      bridge.subscribe((payload) => {
        dispatch({ type: "initial-result", payload });
      }),
    [bridge],
  );

  const navigate = useCallback(
    async (
      tool: string,
      args: JsonObject,
      destination: WidgetView,
    ): Promise<void> => {
      dispatch({ type: "navigation-start" });
      try {
        const payload = await bridge.callTool(tool, args);
        const message = payloadError(payload);
        if (message) {
          dispatch({ type: "navigation-error", message });
          return;
        }
        dispatch({
          type: "navigation-success",
          view: destination,
          payload,
        });
      } catch (error) {
        dispatch({
          type: "navigation-error",
          message:
            error instanceof Error
              ? error.message
              : "Service unavailable, please try again",
        });
      }
    },
    [bridge],
  );

  if (!route.data) {
    if (route.error) {
      return <ErrorPanel error={{ message: route.error }} />;
    }
    return <StatusMessage message="Loading..." />;
  }

  const data = route.data;
  return (
    <div className="min-w-0">
      {route.loading && <StatusMessage message="Loading..." compact />}
      {route.error && <ErrorPanel error={{ message: route.error }} />}
      {route.view === "chapter-list" && (
        <ChapterList
          chapters={asArray(data.chapters)}
          onSelectChapter={(slug) =>
            void navigate("get_chapter", { slug }, "chapter-reader")
          }
          error={asError(data.error)}
        />
      )}
      {route.view === "chapter-reader" && (
        <ChapterReader
          slug={asString(data.slug)}
          title={asString(data.title)}
          content={asString(data.content)}
          order={asNumber(data.order)}
          next_slug={asNullableString(data.next_slug)}
          prev_slug={asNullableString(data.prev_slug)}
          onNavigate={(slug) =>
            void navigate("get_chapter", { slug }, "chapter-reader")
          }
          error={asError(data.error)}
        />
      )}
      {route.view === "quiz" && (
        <QuizPanel
          chapter_slug={asString(data.chapter_slug)}
          chapter_title={asString(data.chapter_title)}
          questions={asArray(data.questions)}
          total_questions={asNumber(data.total_questions)}
          onSubmit={(answers) =>
            void navigate(
              "submit_quiz",
              { chapter_slug: data.chapter_slug, answers },
              "quiz-result",
            )
          }
          error={asError(data.error)}
        />
      )}
      {route.view === "quiz-result" && (
        <QuizResult
          chapter_slug={asString(data.chapter_slug)}
          score={asNumber(data.score)}
          total={asNumber(data.total)}
          percentage={asNumber(data.percentage)}
          per_question={asArray(data.per_question)}
          saved={asBoolean(data.saved)}
          upgrade_url={asNullableString(data.upgrade_url)}
          onViewProgress={() =>
            void navigate("get_progress", {}, "progress")
          }
        />
      )}
      {route.view === "progress" && (
        <ProgressDashboard
          user_id={asString(data.user_id)}
          current_streak={asNumber(data.current_streak)}
          completion_percentage={asNumber(data.completion_percentage)}
          total_chapters={asNumber(data.total_chapters)}
          completed_chapters={asNumber(data.completed_chapters)}
          chapter_list={asArray(data.chapter_list)}
          onSelectChapter={(slug) =>
            void navigate("get_chapter", { slug }, "chapter-reader")
          }
          error={asError(data.error)}
        />
      )}
      {route.view === "search" && (
        <SearchResults
          query={asString(data.query)}
          total_matches={asNumber(data.total_matches)}
          results={asArray(data.results)}
          onSelectChapter={(slug) =>
            void navigate("get_chapter", { slug }, "chapter-reader")
          }
          error={asError(data.error)}
        />
      )}
      {route.view === "access" && (
        <AccessStatus
          tier={asString(data.tier, "free")}
          allowed={asBoolean(data.allowed)}
          resource={asNullableString(data.resource)}
          upgrade_url={asNullableString(data.upgrade_url)}
          error={asError(data.error)}
        />
      )}
    </div>
  );
}

function StatusMessage({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 ${
        compact ? "px-3 py-2" : "min-h-28 p-6"
      }`}
    >
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 motion-reduce:animate-none dark:border-zinc-700 dark:border-t-zinc-200"
      />
      {message}
    </div>
  );
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function asBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asError(value: unknown): { message: string } | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return { message: value.message };
  }
  return undefined;
}
