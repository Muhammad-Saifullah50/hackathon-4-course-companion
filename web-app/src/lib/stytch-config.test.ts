import { describe, expect, it } from "vitest";

import {
  buildAuthPresentation,
  buildLoginConfig,
} from "./stytch-config";

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

describe("buildAuthPresentation", () => {
  it("uses the app surface and text colors in dark mode", () => {
    const presentation = buildAuthPresentation("dark");

    expect(presentation.theme).toMatchObject({
      "color-scheme": "dark",
      background: "#1C1F1C",
      foreground: "#F0F1EE",
      primary: "#1DB87E",
      border: "#343934",
    });
  });

  it("uses an adaptive palette until the resolved theme is available", () => {
    const presentation = buildAuthPresentation();

    expect(Array.isArray(presentation.theme)).toBe(true);
  });
});
