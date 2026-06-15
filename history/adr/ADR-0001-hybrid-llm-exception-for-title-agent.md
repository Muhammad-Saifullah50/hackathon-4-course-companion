# ADR-0001: Hybrid LLM Exception for Title Agent

- **Status:** Accepted
- **Date:** 2026-06-15
- **Feature:** Phase 2 premium hybrid features
- **Context:** Phase 2 requires a constitution-approved LLM for premium hybrid features. The mentor and assessment flows need a high-capability model, while chat thread title generation is a narrow utility task that benefits from faster, cheaper inference and does not require the same reasoning depth.

## Decision

Use Nvidia Nemotron via OpenRouter for primary premium reasoning workflows, including the AI Course Mentor and assessment-related reasoning. Allow a separately approved lightweight OpenRouter model for auxiliary utility agents whose task is limited to presentation or metadata generation, specifically chat thread naming.

## Consequences

### Positive

- Preserves the constitution's default high-capability model for the user-facing mentor.
- Lets the title agent use a cheaper and faster model for a narrow, low-risk task.
- Keeps the exception explicit and reviewable instead of ad hoc.

### Negative

- Introduces one approved exception path that must be maintained in specs and implementation.
- Increases the chance of model drift if future utility agents try to use the exception without review.
- Requires future feature specs to state clearly whether a model is primary reasoning or auxiliary metadata generation.

## Alternatives Considered

- Use Nvidia Nemotron for all Phase 2 agents, including title generation.
  - Rejected because it spends a large model on a lightweight metadata task.
- Allow arbitrary OpenRouter models for any premium route.
  - Rejected because it weakens the constitution's control over hybrid model usage.

## References

- Feature Spec: `/home/saifullah/projects/hackathon-4-course-companion/intelligent-features.md`
- Related ADRs: none
