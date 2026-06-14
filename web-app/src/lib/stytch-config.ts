import {
  OAuthProviders,
  Products,
  type PresentationConfig,
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

export const authPresentation: PresentationConfig = {
  theme: {
    primary: "#0A7F5A",
    success: "#137447",
    destructive: "#B4232C",
  },
  options: {
    hideHeaderText: false,
  },
};
