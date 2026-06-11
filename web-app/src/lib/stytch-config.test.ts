import { describe, expect, it } from "vitest";

import { buildLoginConfig } from "./stytch-config";

describe("buildLoginConfig", () => {
  it("configures Google, passwords, and fixed callbacks", () => {
    const config = buildLoginConfig("https://learn.example.com");

    expect(config.products).toHaveLength(2);
    expect(config.oauthOptions?.providers).toEqual([{ type: "google" }]);
    expect(config.oauthOptions?.loginRedirectURL).toBe(
      "https://learn.example.com/authenticate",
    );
    expect(config.oauthOptions?.signupRedirectURL).toBe(
      "https://learn.example.com/authenticate",
    );
    expect(config.passwordOptions?.resetPasswordRedirectURL).toBe(
      "https://learn.example.com/reset-password",
    );
    expect(config.sessionOptions?.sessionDurationMinutes).toBe(30);
  });
});
