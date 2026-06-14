import "next/cache";

declare module "next/cache" {
  export function cacheLife(
    profile:
      | "default"
      | "seconds"
      | "minutes"
      | "hours"
      | "days"
      | "weeks"
      | "max",
  ): void;

  export function cacheTag(...tags: string[]): void;
}
