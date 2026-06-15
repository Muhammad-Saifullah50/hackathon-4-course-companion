"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";

import { buildAuthPresentation } from "@/lib/stytch-config";

export function useAuthPresentation() {
  const { resolvedTheme } = useTheme();

  return useMemo(
    () => buildAuthPresentation(resolvedTheme),
    [resolvedTheme],
  );
}
