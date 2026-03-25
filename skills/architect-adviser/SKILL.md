---
name: architect-adviser
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

## Output Format

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
