---
name: architect-advisor
scope: [architecture]
description: "Clean architecture patterns: hexagonal, DDD, ports and adapters, layered design."
allowed-tools:
  - Read
  - Grep
  - Glob
model: sonnet
---

# architect-adviser

Provide expert guidance on clean architecture patterns, hexagonal architecture, and Domain-Driven Design.

## When to Invoke

Invoke this skill when the user:
- Asks to review an architecture or design a service.
- Mentions DDD, hexagonal architecture, ports and adapters, or clean architecture.
- Asks "how should I structure this?" for a complex system.

## Core Principles

### Hexagonal Architecture

```
          ┌─────────────────────────────────┐
          │           Domain                │
          │  (entities, value objects,      │
          │   domain services, events)      │
          └────────────┬────────────────────┘
                       │ depends on
          ┌────────────▼────────────────────┐
          │         Application             │
          │     (use cases, DTOs)           │
          └────────────┬────────────────────┘
                       │ depends on
          ┌────────────▼────────────────────┐
          │        Infrastructure           │
          │  (adapters, repositories,       │
          │   external clients)             │
          └─────────────────────────────────┘
```

**Dependency rule**: All dependencies point inward. Infrastructure depends on Application, Application depends on Domain. Domain has ZERO external dependencies.

### Review Methodology

Apply Beck's 4 Rules of Simple Design in order:
1. **Passes the Tests** — Verify test coverage first.
2. **Reveals Intention** — Check naming and structure clarity.
3. **No Duplication** — Look for duplicated domain knowledge.
4. **Fewest Elements** — Flag unused abstractions.

### Quality Checklist

- [ ] Domain layer has zero framework imports (no Spring, no ORM annotations).
- [ ] Repository interfaces defined in domain, implementations in infrastructure.
- [ ] Use case classes describe business operations (not technical ones).
- [ ] No circular dependencies between modules.
- [ ] Each layer has a single, well-defined responsibility.

## Anti-Patterns to Flag

| Anti-Pattern | Signal |
|-------------|--------|
| Anemic domain model | Entities with only getters/setters, logic in services |
| God class | Single class over 300 lines doing too many things |
| Leaky abstraction | Infrastructure types (ORM entities) in domain interfaces |
| Speculative generality | Interface with one implementation and no planned extension |
| Generic naming | Classes named `Manager`, `Helper`, `Utils`, `Processor` |

## Output Format (Standard Review Mode)

Structure findings as:

```
## Architecture Review

### Critical Issues (Rule 1: Passes the Tests)
- ...

### Design Issues (Rule 2: Reveals Intention)
- ...

### Duplication (Rule 3: No Duplication)
- ...

### Over-Engineering (Rule 4: Fewest Elements)
- ...

### Recommendations
- ...
```

Before finalizing your review, check `gotchas.md` for common Claude mistakes in this domain.

## Adviser Mode (SDD Orchestrator Integration)

This skill supports **adviser mode**: when invoked by the SDD orchestrator with a `GUIDANCE CONTEXT FROM PLANNER` block in the prompt, use the following procedure instead of the standard interactive review flow.

### Entry Conditions
Adviser mode is active when the prompt contains:
- A `GUIDANCE CONTEXT FROM PLANNER:` block
- A `CURRENT PLAN EXCERPT:` block

### Adviser Mode Procedure
1. Read the `GUIDANCE CONTEXT FROM PLANNER` block to understand what the planner needs reviewed.
2. Read the `CURRENT PLAN EXCERPT` to see the specific tasks and design decisions.
3. Apply your domain expertise to the plan content — do NOT read codebase files unless the plan references specific existing code that is relevant.
4. Produce structured advice in the format below.
5. Save output to engram and return summary + observation ID.

Focus ONLY on your specialist domain: Architecture patterns, layer separation, dependency flow, DDD tactical patterns.

### Output Format (Adviser Mode)
```
### Strengths
- [What looks sound in the plan from this skill's domain perspective]

### Issues Found
[Severity: Critical / Major / Minor — reference specific task IDs or section names]
- T001: [issue description]

### Recommendations
[Specific, actionable. Reference task ID or section name for each recommendation.]
- T001: [recommendation]
```

### Persistence (Adviser Mode)
Save full advice output to engram:
```
mem_save(
  title: "sdd/{change-name}/guidance/architect-adviser",
  type: "architecture",
  project: "{project-name}",
  content: "{your full structured advice output}"
)
```
If engram is unavailable, skip silently.

### Return Format (Adviser Mode)
Return a concise summary (3-5 bullet points) plus the engram observation ID:
```
### Summary
- [key point 1]
- [key point 2]
- ...

### Engram ID
{observation_id or "unavailable"}
```
Do NOT return an SDD Envelope when in adviser mode.
