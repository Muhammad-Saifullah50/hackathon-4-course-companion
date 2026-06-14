---
id: "0001"
title: create-figma-make-web-app-design-specification
stage: general
date: 2026-06-11
surface: codex
model: gpt-5
feature: web-app
branch: main
user: Saifullah
command: direct-request
labels: [design-spec, figma-make, web-app, lms, ux]
links:
  spec: specs/web-app-figma-make-design-spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/web-app-figma-make-design-spec.md
  - history/prompts/general/0001-create-figma-make-web-app-design-specification.general.prompt.md
tests:
  - git diff --check -- specs/web-app-figma-make-design-spec.md
---

## Prompt

Generate a very detailed design specification for the Claude Teacher web app
that can be given to Figma Make, based on project knowledge and the backend
code.

## Response snapshot

Inspected the FastAPI models, routers, feature specifications, course manifest,
chapter and quiz content, current Next.js authentication screens, and project
constitution. Created a self-contained Figma Make prompt covering product
constraints, visual foundations, responsive behavior, components, all product
and authentication screens, states, prototype flows, sample data, accessibility,
and backend-to-UI field mappings.

## Outcome

- Impact: Added an implementation-grounded, high-fidelity web app design brief
  with 32 required frames and explicit guardrails against unsupported features.
- Tests: Markdown passed `git diff --check`; backend route protections were
  cross-checked, including authenticated search and public chapter access.
- Files: Added the Figma Make specification and this prompt history record.
- Next prompts: Use the specification in Figma Make, then translate approved
  frames into the Next.js component system.
- Reflection: Older feature prose disagreed with the implemented search route,
  so the design follows the current FastAPI code and requires sign-in for search.

## Evaluation notes (flywheel)

- Failure modes observed: Initial draft treated search as public based on an
  older ChatGPT widget specification; corrected after checking the router.
- Graders run and results (PASS/FAIL): `git diff --check` - PASS.
- Prompt variant (if applicable): none.
- Next experiment (smallest change to try): Validate generated Figma frames
  against the required-frame checklist before frontend implementation.
