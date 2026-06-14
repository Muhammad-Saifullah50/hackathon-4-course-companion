import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { QuizPublic } from "@/lib/api-types";
import { QuizRunner } from "./quiz-runner";

afterEach(cleanup);

const quiz: QuizPublic = {
  chapter_slug: "intro",
  questions: [
    {
      id: "q1",
      text: "What does an agent use?",
      options: [
        { label: "A", text: "Tools" },
        { label: "B", text: "Only static text" },
      ],
    },
  ],
};

describe("QuizRunner", () => {
  it("is interactive before optional authentication resolves", async () => {
    const authentication = new Promise<boolean>(() => undefined);

    await act(async () => {
      render(
        <QuizRunner
          authentication={authentication}
          order={1}
          quiz={quiz}
          title="Agent Foundations"
        />,
      );
    });

    expect(
      screen.getByRole("button", { name: "Begin quiz" }),
    ).toBeEnabled();
    expect(screen.queryByText("Sign in to save your final score")).toBeNull();
  });

  it("shows the sign-in hint for a resolved guest session", async () => {
    await act(async () => {
      render(
        <QuizRunner
          authentication={Promise.resolve(false)}
          order={1}
          quiz={quiz}
          title="Agent Foundations"
        />,
      );
    });
    expect(
      await screen.findByText("Sign in to save your final score"),
    ).toBeInTheDocument();
  });
});
