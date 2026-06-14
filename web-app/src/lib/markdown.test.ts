import { describe, expect, it } from "vitest";

import { extractToc, readingMinutes, slugifyHeading } from "./markdown";

describe("markdown helpers", () => {
  it("extracts stable heading ids", () => {
    expect(slugifyHeading("Tools & Resources")).toBe("tools-resources");
    expect(extractToc("## Intro\n### Detail\n## Next")).toEqual([
      { id: "intro", text: "Intro", level: 2 },
      { id: "detail", text: "Detail", level: 3 },
      { id: "next", text: "Next", level: 2 },
    ]);
  });

  it("calculates at least one minute", () => {
    expect(readingMinutes("short chapter")).toBe(1);
  });
});
