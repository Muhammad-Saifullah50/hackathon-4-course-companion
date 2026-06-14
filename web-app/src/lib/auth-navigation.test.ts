import { describe, expect, it } from "vitest";

import {
  currentRelativeUrl,
  safeReturnTo,
  withReturnTo,
} from "./auth-navigation";

describe("safeReturnTo", () => {
  it("allows relative paths with OAuth query parameters", () => {
    expect(
      safeReturnTo(
        "/oauth/authorize?client_id=chatgpt&redirect_uri=https%3A%2F%2Fchatgpt.com",
      ),
    ).toBe(
      "/oauth/authorize?client_id=chatgpt&redirect_uri=https%3A%2F%2Fchatgpt.com",
    );
  });

  it("rejects absolute and protocol-relative redirects", () => {
    expect(safeReturnTo("https://evil.example")).toBe("/dashboard");
    expect(safeReturnTo("//evil.example/path")).toBe("/dashboard");
    expect(safeReturnTo(null)).toBe("/dashboard");
  });
});

describe("OAuth navigation helpers", () => {
  it("encodes the complete authorization request in the login URL", () => {
    expect(
      withReturnTo(
        "/login",
        "/oauth/authorize?client_id=chatgpt&scope=openid+email",
      ),
    ).toBe(
      "/login?return_to=%2Foauth%2Fauthorize%3Fclient_id%3Dchatgpt%26scope%3Dopenid%2Bemail",
    );
  });

  it("reconstructs the current relative URL", () => {
    expect(
      currentRelativeUrl(
        "/oauth/authorize",
        new URLSearchParams("client_id=chatgpt&scope=openid"),
      ),
    ).toBe("/oauth/authorize?client_id=chatgpt&scope=openid");
  });
});
