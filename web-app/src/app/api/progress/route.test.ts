import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "./route";

const getOptionalSession = vi.fn();
const saveServerCompletion = vi.fn();

vi.mock("@/lib/auth-dal", () => ({
  getOptionalSession: () => getOptionalSession(),
}));

vi.mock("@/lib/authenticated-api", () => ({
  saveServerCompletion: (...args: unknown[]) =>
    saveServerCompletion(...args),
}));

beforeEach(() => {
  getOptionalSession.mockReset();
  saveServerCompletion.mockReset();
  getOptionalSession.mockResolvedValue({
    user_id: "server-user",
    email: "learner@example.com",
    expires_at: null,
  });
  saveServerCompletion.mockResolvedValue({
    user_id: "server-user",
    chapter_slug: "intro",
    quiz_score: 80,
  });
});

describe("progress BFF route", () => {
  it("rejects an invalid browser payload", async () => {
    const request = new NextRequest("https://course.example/api/progress", {
      method: "PUT",
      body: JSON.stringify({
        chapter_slug: "intro",
        quiz_score: 101,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);

    expect(response.status).toBe(400);
    expect(saveServerCompletion).not.toHaveBeenCalled();
  });

  it("derives the user ID from the server session", async () => {
    const request = new NextRequest("https://course.example/api/progress", {
      method: "PUT",
      body: JSON.stringify({
        user_id: "attacker-controlled",
        chapter_slug: "intro",
        quiz_score: 80,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(saveServerCompletion).toHaveBeenCalledWith(
      "server-user",
      "intro",
      80,
    );
  });
});
