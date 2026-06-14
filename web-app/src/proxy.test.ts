import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  STYTCH_SESSION_COOKIE,
  STYTCH_SESSION_JWT_COOKIE,
} from "@/lib/auth-cookies";
import { proxy } from "./proxy";

function jwt(exp: number): string {
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  return `header.${payload}.signature`;
}

function request(
  path: string,
  cookies: Array<{ name: string; value: string }> = [],
): NextRequest {
  const headers = new Headers();
  if (cookies.length) {
    headers.set(
      "cookie",
      cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; "),
    );
  }
  return new NextRequest(`https://course.example${path}`, { headers });
}

afterEach(() => vi.useRealTimers());

describe("Next.js Proxy authentication routing", () => {
  it("redirects an authenticated root request before rendering", () => {
    const response = proxy(
      request("/", [
        {
          name: STYTCH_SESSION_COOKIE,
          value: "opaque-session",
        },
      ]),
    );

    expect(response.headers.get("location")).toBe(
      "https://course.example/dashboard",
    );
  });

  it("redirects a protected request to login with its full return path", () => {
    const response = proxy(request("/search?q=agent"));

    expect(response.headers.get("location")).toBe(
      "https://course.example/login?return_to=%2Fsearch%3Fq%3Dagent",
    );
  });

  it("does not treat an expired JWT as an authenticated session", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-13T12:00:00Z"));

    const response = proxy(
      request("/dashboard", [
        {
          name: STYTCH_SESSION_JWT_COOKIE,
          value: jwt(Math.floor(Date.now() / 1000) - 1),
        },
      ]),
    );

    expect(response.headers.get("location")).toContain("/login?");
  });

  it("uses the opaque session when the short-lived JWT has expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-13T12:00:00Z"));

    const response = proxy(
      request("/", [
        {
          name: STYTCH_SESSION_JWT_COOKIE,
          value: jwt(Math.floor(Date.now() / 1000) - 1),
        },
        {
          name: STYTCH_SESSION_COOKIE,
          value: "opaque-session",
        },
      ]),
    );

    expect(response.headers.get("location")).toBe(
      "https://course.example/dashboard",
    );
  });

  it("allows a protected request with a valid JWT", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-13T12:00:00Z"));

    const response = proxy(
      request("/dashboard", [
        {
          name: STYTCH_SESSION_JWT_COOKIE,
          value: jwt(Math.floor(Date.now() / 1000) + 60),
        },
      ]),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("does not redirect unrelated public routes", () => {
    const response = proxy(request("/course"));

    expect(response.headers.get("location")).toBeNull();
  });
});
