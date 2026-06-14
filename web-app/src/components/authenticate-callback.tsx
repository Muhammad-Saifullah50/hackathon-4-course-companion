"use client";

import { useStytch } from "@stytch/nextjs";
import { useEffect, useState } from "react";

import { BrandedLoader } from "@/components/loading-ui";
import { consumeReturnTo } from "@/lib/auth-navigation";
import { SESSION_DURATION_MINUTES } from "@/lib/stytch-config";

export function AuthenticateCallback() {
  const stytch = useStytch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void stytch
      .authenticateByUrl({
        session_duration_minutes: SESSION_DURATION_MINUTES,
      })
      .then((result) => {
        if (!result?.handled) {
          throw new Error("The authentication callback did not contain a valid token.");
        }
        window.location.assign(consumeReturnTo());
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Authentication could not be completed.",
        );
      });
  }, [stytch]);

  if (!error) {
    return (
      <BrandedLoader
        label="Finishing sign in"
        description="Please keep this page open for a moment."
      />
    );
  }

  return (
    <div className="protected-empty">
      <h1>Authentication failed</h1>
      <p>{error}</p>
    </div>
  );
}
