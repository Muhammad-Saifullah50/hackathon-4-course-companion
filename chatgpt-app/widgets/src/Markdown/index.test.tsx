import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from ".";

describe("Markdown", () => {
  it("renders headings, GFM tables, and fenced code", () => {
    const { container } = render(
      <Markdown
        content={[
          "## Agent tools",
          "",
          "| Name | Type |",
          "| --- | --- |",
          "| Search | Tool |",
          "",
          "```ts",
          "const ready = true;",
          "```",
        ].join("\n")}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Agent tools" }),
    ).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(container.querySelector("pre code")?.textContent).toContain(
      "const ready = true;",
    );
  });

  it("opens external links safely and does not render raw HTML", () => {
    const { container } = render(
      <Markdown
        content={'[OpenAI](https://openai.com)\n\n<script>alert("x")</script>'}
      />,
    );

    const link = screen.getByRole("link", { name: "OpenAI" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer noopener");
    expect(container.querySelector("script")).toBeNull();
  });
});
