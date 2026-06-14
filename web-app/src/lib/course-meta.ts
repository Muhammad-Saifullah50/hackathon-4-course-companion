export const COURSE_META: Record<
  string,
  { description: string; minutes: number }
> = {
  "claude-agent-sdk-foundations": {
    description:
      "Understand agent loops, tools, messages, and the core Claude Agent SDK building blocks.",
    minutes: 18,
  },
  "claude-agent-sdk-advanced": {
    description:
      "Explore orchestration, streaming, prompt caching, recovery, and production patterns.",
    minutes: 22,
  },
  "mcp-introduction": {
    description:
      "Learn how Model Context Protocol connects AI applications to tools and data.",
    minutes: 16,
  },
  "mcp-building-servers": {
    description:
      "Build production-ready MCP tools, resources, prompts, and lifecycle hooks.",
    minutes: 24,
  },
  "agent-skills": {
    description:
      "Create reusable behavioral modules that make agents focused and composable.",
    minutes: 15,
  },
};

export function courseMeta(slug: string) {
  return (
    COURSE_META[slug] ?? {
      description: "Continue your AI agent development course.",
      minutes: 18,
    }
  );
}
