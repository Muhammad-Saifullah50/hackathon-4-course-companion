const DEFAULT_RETURN_TO = "/account";
const RETURN_TO_STORAGE_KEY = "course_companion_return_to";

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_RETURN_TO;
  }

  try {
    const parsed = new URL(value, "https://course-companion.local");
    if (parsed.origin !== "https://course-companion.local") {
      return DEFAULT_RETURN_TO;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}

export function withReturnTo(path: string, returnTo: string): string {
  const params = new URLSearchParams({ return_to: safeReturnTo(returnTo) });
  return `${path}?${params.toString()}`;
}

export function currentRelativeUrl(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function storeReturnTo(value: string): string {
  const returnTo = safeReturnTo(value);
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(RETURN_TO_STORAGE_KEY, returnTo);
  }
  return returnTo;
}

export function consumeReturnTo(): string {
  if (typeof window === "undefined") {
    return DEFAULT_RETURN_TO;
  }

  const returnTo = safeReturnTo(
    window.sessionStorage.getItem(RETURN_TO_STORAGE_KEY),
  );
  window.sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
  return returnTo;
}

export function readReturnTo(): string {
  if (typeof window === "undefined") {
    return DEFAULT_RETURN_TO;
  }
  return safeReturnTo(window.sessionStorage.getItem(RETURN_TO_STORAGE_KEY));
}
