import {
  OAuthProviders,
  Products,
  type PresentationConfig,
  type Theme,
  type StytchLoginConfig,
} from "@stytch/nextjs";

export const SESSION_DURATION_MINUTES = Number(
  process.env.NEXT_PUBLIC_STYTCH_SESSION_DURATION_MINUTES ?? "30",
);

export function buildLoginConfig(
  appOrigin: string,
): StytchLoginConfig {
  const callback = new URL("/authenticate", appOrigin);
  const reset = new URL("/reset-password", appOrigin);

  return {
    products: [Products.oauth, Products.passwords],
    oauthOptions: {
      providers: [{ type: OAuthProviders.Google }],
      loginRedirectURL: callback.toString(),
      signupRedirectURL: callback.toString(),
    },
    passwordOptions: {
      loginRedirectURL: callback.toString(),
      resetPasswordRedirectURL: reset.toString(),
      resetPasswordExpirationMinutes: 30,
    },
    sessionOptions: {
      sessionDurationMinutes: SESSION_DURATION_MINUTES,
    },
  };
}

const sharedAuthTheme: Partial<Theme> = {
  "font-family": "Arial, Helvetica, sans-serif",
  "font-family-mono": '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
  "container-width": "100%",
  "rounded-base": "5px",
  "button-radius": "10px",
  "input-radius": "10px",
  "container-radius": "0px",
  "container-border": "transparent",
  shadow: "none",
};

const lightAuthTheme: Partial<Theme> = {
  ...sharedAuthTheme,
  "color-scheme": "light",
  background: "#FFFFFF",
  foreground: "#171A18",
  primary: "#0A7F5A",
  "primary-foreground": "#FFFFFF",
  secondary: "#EEF0EC",
  "secondary-foreground": "#171A18",
  muted: "#EEF0EC",
  "muted-foreground": "#626861",
  accent: "#EEF0EC",
  "accent-foreground": "#171A18",
  border: "#DDE1DB",
  input: "#DDE1DB",
  ring: "#0A7F5A",
  destructive: "#B4232C",
  success: "#137447",
};

const darkAuthTheme: Partial<Theme> = {
  ...sharedAuthTheme,
  "color-scheme": "dark",
  background: "#1C1F1C",
  foreground: "#F0F1EE",
  primary: "#1DB87E",
  "primary-foreground": "#0E1110",
  secondary: "#252825",
  "secondary-foreground": "#F0F1EE",
  muted: "#252825",
  "muted-foreground": "#A4AAA2",
  accent: "#252825",
  "accent-foreground": "#F0F1EE",
  border: "#343934",
  input: "#343934",
  ring: "#1DB87E",
  destructive: "#F16B75",
  success: "#2ECC78",
};

export function buildAuthPresentation(
  resolvedTheme?: string,
): PresentationConfig {
  const theme =
    resolvedTheme === "dark"
      ? darkAuthTheme
      : resolvedTheme === "light"
        ? lightAuthTheme
        : ([lightAuthTheme, darkAuthTheme] as const);

  return {
    theme,
    options: {
      hideHeaderText: false,
    },
  };
}
