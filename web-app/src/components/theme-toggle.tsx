"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-button"
      aria-label="Toggle color theme"
    >
      <Moon className="block dark:hidden" size={17} aria-hidden="true" />
      <Sun className="hidden dark:block" size={17} aria-hidden="true" />
      {showLabel && (
        <>
          <span className="block dark:hidden" aria-hidden="true">
            Dark mode
          </span>
          <span className="hidden dark:block" aria-hidden="true">
            Light mode
          </span>
        </>
      )}
    </button>
  );
}
