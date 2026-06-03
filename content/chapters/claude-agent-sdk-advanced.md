# Claude Agent SDK Advanced

## Introduction

Having mastered the agent loop, we now explore advanced patterns: multi-agent systems, streaming, prompt caching, computer use, and production-grade patterns like error handling and token budgeting. These techniques transform a prototype agent into a robust system.

## Core Concepts

### Multi-Agent Architectures

Agents can orchestrate other agents. An orchestrator agent breaks down a complex task and delegates sub-tasks to specialized subagents. This enables parallelism and specialization.

**Patterns:**
- **Sequential**: each agent's output feeds the next
- **Parallel**: subagents work concurrently on independent sub-tasks
- **Hierarchical**: nested orchestrators with specialized workers

### Streaming

For long-running tool calls, stream responses token-by-token to keep the user informed:

```python
with client.messages.stream(
    model="claude-opus-4-8",
    max_tokens=1024,
    messages=messages,
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

### Prompt Caching

Repeated context (system prompts, large documents) can be cached at the API level to reduce latency and cost. Mark cacheable blocks with `cache_control`:

```python
{
    "type": "text",
    "text": large_document_text,
    "cache_control": {"type": "ephemeral"}
}
```

### Token Budgeting

Set `max_tokens` conservatively and monitor `usage` in each response to track cumulative costs:

```python
total_tokens = 0
response = client.messages.create(...)
total_tokens += response.usage.input_tokens + response.usage.output_tokens
```

### Human-in-the-Loop

Agents should pause and request clarification when they are uncertain rather than hallucinating forward. Implement a confirmation tool:

```python
{
    "name": "request_clarification",
    "description": "Ask the user a clarifying question before proceeding",
    "input_schema": {
        "type": "object",
        "properties": {"question": {"type": "string"}},
        "required": ["question"]
    }
}
```

## Code Examples

### Orchestrator + Subagent

```python
def orchestrator(task: str) -> str:
    plan = plan_task(task)  # LLM breaks task into steps
    results = []
    for step in plan.steps:
        result = subagent(step)
        results.append(result)
    return synthesize(results)  # LLM combines outputs

def subagent(step: str) -> str:
    return run_agent(step, specialist_tools)
```

### Error Handling with Retries

```python
import time

def safe_agent_call(messages: list, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            return run_agent_loop(messages)
        except anthropic.APIStatusError as e:
            if e.status_code == 529 and attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise
```

### Streaming with Tool Use

```python
with client.messages.stream(
    model="claude-opus-4-8",
    max_tokens=2048,
    tools=tools,
    messages=messages,
) as stream:
    response = stream.get_final_message()

if response.stop_reason == "tool_use":
    process_tool_calls(response)
```

## Key Takeaways

- Multi-agent systems enable parallelism and specialization
- Streaming keeps users informed during long operations
- Prompt caching reduces cost for repeated context
- Always budget tokens and monitor usage in production
- Human-in-the-loop tools prevent runaway agents
- Retry with exponential backoff for transient API errors
- Orchestrators delegate; subagents execute
