# Agent Skills

## Introduction

Agent Skills are reusable behavioral modules that extend what an AI agent can do. A skill encapsulates a specific capability — tutoring, code review, document analysis — as a portable, composable unit that can be loaded into any compatible agent host.

In the context of the Claude Agent SDK and the Panaversity AI Agent Development course, Skills are Markdown files with a defined schema that describe how an agent should behave when performing a particular task.

## Core Concepts

### What is a Skill?

A skill is a structured Markdown document that contains:
- **Metadata** (YAML frontmatter): name, description, triggers
- **Instructions**: step-by-step behavioral rules for the agent
- **Examples**: few-shot demonstrations
- **Constraints**: what the agent must never do

Skills are stateless — they define behavior, not memory. State lives in the conversation history.

### Skill Schema

```yaml
---
name: concept-explainer
description: Explains AI agent concepts at the learner's current level
triggers:
  - "explain"
  - "what is"
  - "how does"
---
```

### Skill Types

| Type | Purpose | Example |
|------|---------|---------|
| Tutor | Socratic questioning and explanation | `socratic-tutor.md` |
| Reviewer | Assess learner submissions | `quiz-master.md` |
| Motivator | Encourage and track progress | `progress-motivator.md` |
| Explainer | Break down complex concepts | `concept-explainer.md` |

### Skill Loading Patterns

Skills can be loaded:
1. **At startup** — always-available capabilities injected into the system prompt
2. **Dynamically** — loaded when a trigger condition is met
3. **On demand** — explicitly requested by the user or orchestrator

### Composing Skills

Multiple skills can be active simultaneously. The agent uses skill descriptions to route to the right behavior. An orchestrator can select which skill to invoke based on user intent.

### Skills vs Tools

| Aspect | Tool | Skill |
|--------|------|-------|
| Nature | Code function | Behavioral document |
| Execution | Deterministic | LLM-guided |
| Versioning | Code repo | Markdown file |
| Composition | Function calls | Prompt injection |

## Code Examples

### Skill File: Concept Explainer

```markdown
---
name: concept-explainer
description: Explains AI agent development concepts clearly at the learner's level
---

## Instructions

1. Identify the concept the learner is asking about.
2. Gauge their current level from conversation history (beginner/intermediate/advanced).
3. Explain the concept in plain language first, then with a technical definition.
4. Give one concrete code example from the Claude Agent SDK or MCP.
5. End with a "Check your understanding" question.

## Constraints

- Never use jargon without defining it first.
- Never give more than one code example per explanation.
- Always tie the concept back to the course project.
```

### Loading Skills into an Agent

```python
from pathlib import Path

def load_skill(skill_name: str) -> str:
    skill_path = Path("chatgpt-app/skills") / f"{skill_name}.md"
    return skill_path.read_text()

def build_system_prompt(active_skills: list[str]) -> str:
    skill_texts = [load_skill(s) for s in active_skills]
    return "\n\n---\n\n".join(skill_texts)

system_prompt = build_system_prompt(["concept-explainer", "socratic-tutor"])
```

### Dynamic Skill Selection

```python
def select_skill(user_message: str, available_skills: list[dict]) -> str:
    """Use an LLM to pick the best skill for this message."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=64,
        system="Return only the skill name that best matches the user's intent.",
        messages=[
            {"role": "user", "content": f"Skills: {available_skills}\nMessage: {user_message}"}
        ]
    )
    return response.content[0].text.strip()
```

## Key Takeaways

- Skills are behavioral Markdown documents, not code functions
- They define HOW the agent should act in a specific context
- YAML frontmatter provides metadata: name, description, triggers
- Skills compose by being injected into the system prompt together
- Dynamic loading enables context-aware behavior switching
- Skills are portable: the same file works in ChatGPT Apps, Claude Desktop, and custom agents
- Separate skills by responsibility — one skill, one concern
