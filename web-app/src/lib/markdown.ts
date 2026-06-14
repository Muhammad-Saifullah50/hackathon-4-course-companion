export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractToc(markdown: string): TocItem[] {
  return markdown
    .split("\n")
    .map((line) => /^(##|###)\s+(.+)$/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({
      id: slugifyHeading(match[2]),
      text: match[2],
      level: match[1].length as 2 | 3,
    }));
}

export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function stripFirstHeading(markdown: string): string {
  return markdown.replace(/^#\s+.+\n+/, "");
}
