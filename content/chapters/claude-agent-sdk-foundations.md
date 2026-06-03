# Claude Agent SDK Foundations

## Introduction

The Claude Agent SDK is Anthropic's framework for building autonomous AI agents that can reason, plan, and act. Agents built with the SDK can use tools, maintain context, and collaborate with other agents to complete complex multi-step tasks.

In this chapter, we explore the foundational concepts: what agents are, how they differ from simple LLM calls, and what building blocks the SDK provides.

## Core Concepts

### What is an Agent?

An agent is an LLM-powered program that can take actions in the world. Unlike a single inference call, an agent:
- Maintains a goal or objective
- Decides which tools to call based on context
- Loops until the task is complete or it needs human input
- Can delegate sub-tasks to other agents

### The Agent Loop

The fundamental cycle of any agent:

1. **Observe** — receive the current state (messages, tool results)
2. **Think** — the LLM reasons about the next action
3. **Act** — invoke a tool or produce a final answer
4. **Repeat** — loop back to observe with updated context

### Tools

Tools are functions the agent can call. Each tool has a name, description, and input schema. The LLM selects the right tool based on its description.

```python
import anthropic

client = anthropic.Anthropic()

tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "City name"}
            },
            "required": ["location"]
        }
    }
]
```

### Messages and Context

Agents communicate via the messages array. Each turn appends new content. The SDK manages the growing context window automatically.

### The Claude API Agent Primitive

```python
response = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "What is the weather in Karachi?"}]
)
```

If `stop_reason == "tool_use"`, extract the tool call and execute it, then add the result back to messages.

## Code Examples

### Minimal Agent Loop

```python
import anthropic

client = anthropic.Anthropic()

def run_agent(user_message: str, tools: list) -> str:
    messages = [{"role": "user", "content": user_message}]
    
    while True:
        response = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=2048,
            tools=tools,
            messages=messages,
        )
        
        if response.stop_reason == "end_turn":
            return response.content[0].text
        
        if response.stop_reason == "tool_use":
            tool_use = next(b for b in response.content if b.type == "tool_use")
            result = dispatch_tool(tool_use.name, tool_use.input)
            
            messages.append({"role": "assistant", "content": response.content})
            messages.append({
                "role": "user",
                "content": [{"type": "tool_result", "tool_use_id": tool_use.id, "content": result}]
            })
```

### Tool Dispatch

```python
def dispatch_tool(name: str, inputs: dict) -> str:
    if name == "get_weather":
        return fetch_weather(inputs["location"])
    raise ValueError(f"Unknown tool: {name}")
```

## Key Takeaways

- Agents are LLM programs that loop until a task is complete
- Tools extend what the agent can do beyond generating text
- The agent loop: observe → think → act → repeat
- The messages array is the agent's working memory
- `stop_reason` determines whether to process a tool call or return the final answer
- Always validate and sanitize tool inputs before execution
