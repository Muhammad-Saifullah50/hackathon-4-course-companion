import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChapterList } from "./ChapterList";
import { ChapterReader } from "./ChapterReader";
import { ErrorPanel } from "./ErrorPanel";
import { ProgressDashboard } from "./ProgressDashboard";
import { QuizPanel } from "./QuizPanel";
import { SearchResults } from "./SearchResults";

describe("widget components", () => {
  it("uses semantic chapter controls and disabled navigation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { rerender } = render(
      <ChapterList
        chapters={[{ slug: "intro", title: "Introduction", order: 1 }]}
        onSelectChapter={onSelect}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Introduction/i }),
    );
    expect(onSelect).toHaveBeenCalledWith("intro");

    rerender(
      <ChapterReader
        slug="intro"
        title="Introduction"
        content={"# Introduction\n\n## Concepts\n\nHello."}
        order={1}
        prev_slug={null}
        next_slug="advanced"
        onNavigate={onSelect}
      />,
    );

    expect(
      (screen.getByRole("button", { name: "Previous" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      screen.getByRole("heading", { name: "Concepts" }),
    ).toBeTruthy();
  });

  it("collects and submits quiz answers", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <QuizPanel
        chapter_slug="intro"
        chapter_title="Introduction"
        total_questions={2}
        questions={[
          {
            question_id: "q1",
            text: "What is an agent?",
            options: ["A program", "A database"],
          },
          {
            question_id: "q2",
            text: "What does MCP define?",
            options: ["A protocol", "A color"],
          },
        ]}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /A program/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /A protocol/ }));
    await user.click(screen.getByRole("button", { name: "Submit quiz" }));

    expect(onSubmit).toHaveBeenCalledWith({
      q1: "A program",
      q2: "A protocol",
    });
  });

  it("exposes progress values and empty states accessibly", () => {
    const { rerender } = render(
      <ProgressDashboard
        user_id="user"
        current_streak={3}
        completion_percentage={42}
        total_chapters={5}
        completed_chapters={2}
        chapter_list={[]}
        onSelectChapter={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("progressbar", { name: "Course completion" })
        .getAttribute("aria-valuenow"),
    ).toBe("42");
    expect(screen.getByText("Start your first chapter")).toBeTruthy();

    rerender(
      <SearchResults
        query="missing"
        total_matches={0}
        results={[]}
        onSelectChapter={vi.fn()}
      />,
    );
    expect(screen.getByText("No results found")).toBeTruthy();
  });

  it("announces errors", () => {
    render(<ErrorPanel error={{ message: "Service unavailable" }} />);
    expect(screen.getByRole("alert").textContent).toContain(
      "Service unavailable",
    );
  });
});
