import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./theme-toggle";

const setTheme = vi.fn();
let resolvedTheme: string | undefined;

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme,
    setTheme,
  }),
}));

beforeEach(() => {
  resolvedTheme = "light";
  setTheme.mockClear();
});

afterEach(cleanup);

describe("ThemeToggle", () => {
  it("switches from resolved light mode to dark mode", () => {
    render(<ThemeToggle />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle color theme" }),
    );

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("switches from resolved dark mode to light mode", () => {
    resolvedTheme = "dark";
    render(<ThemeToggle />);

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle color theme" }),
    );

    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("keeps icon-only and labeled variants accessible", () => {
    const { rerender } = render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Toggle color theme" }),
    ).toBeInTheDocument();

    rerender(<ThemeToggle showLabel />);
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
    expect(screen.getByText("Light mode")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle color theme" }),
    ).toBeInTheDocument();
  });
});
