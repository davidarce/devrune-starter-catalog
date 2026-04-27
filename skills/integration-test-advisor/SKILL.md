---
name: integration-test-advisor
scope: [backend, testing]
description: Integration test patterns — adapter testing, external service mocking, test slicing
version: "1.0"
tags: [testing, integration-tests, adapters, mocking, database]
---

# Integration Test Adviser Skill

Guide the design of integration tests that verify how components collaborate across boundaries — specifically how adapters interact with databases, external HTTP services, and messaging systems.

## Core Philosophy

Integration tests verify that **adapters work correctly with their external dependencies**. They sit between unit tests (fully isolated) and end-to-end tests (full system).

**Test at the boundary — not through the domain:**
- Test a database adapter by calling it directly and verifying what was persisted
- Test an HTTP client adapter by calling it and inspecting the request/response
- Do NOT test business logic in integration tests — that belongs in unit tests

## What to Test at Integration Level

Test **infrastructure adapters** at their boundary: repositories (DB), HTTP clients, message publishers/consumers, cache adapters, file storage adapters.

**Do NOT include in integration tests:** business logic, domain rules, controller routing, or authentication middleware.

## Test Slicing

A test slice loads only the components needed for the integration test — not the full application context. Use `@DataJpaTest` (Spring), `@WebMvcTest`, or equivalent framework-specific annotations to load only the relevant slice.

## References

Detailed patterns and examples are available in the `references/` directory. Load these on demand when the review touches the specific topic.

- See `references/wiremock-patterns.md` for WireMock stub patterns, verification, and fault injection examples (Java/HTTP).
- See `references/testcontainers.md` for TestContainers setup with real database instances in integration tests.
- See `references/msw-patterns.md` for MSW (Mock Service Worker) patterns for TypeScript/HTTP service mocking.
- See `references/database-testing.md` for database integration test setup/teardown strategies and assertion patterns.

Before finalizing your review, check `gotchas.md` for common Claude mistakes in this domain.

## Review Checklist

When reviewing integration tests:
- [ ] Test targets a specific adapter boundary (not domain logic)
- [ ] Only relevant infrastructure is loaded (test slicing)
- [ ] External HTTP services are mocked (WireMock, MSW) or use TestContainers
- [ ] Database is real (preferably) or uses an in-memory substitute
- [ ] Tests clean up after themselves (rollback, delete, or isolated schema)
- [ ] Both success and failure/error paths are tested
- [ ] Tests don't depend on execution order (no shared mutable state between tests)
- [ ] Assertions verify the actual stored/transmitted state, not just return values

## Adviser Mode (SDD Orchestrator Integration)

This skill supports **adviser mode**: when invoked by the SDD orchestrator with a `GUIDANCE CONTEXT FROM PLANNER` block in the prompt, use the following procedure instead of the standard interactive review flow.

### Entry Conditions
Adviser mode is active when the prompt contains:
- A `GUIDANCE CONTEXT FROM PLANNER:` block
- A `CURRENT PLAN EXCERPT:` block

### Adviser Mode Procedure
1. Read the `GUIDANCE CONTEXT FROM PLANNER` block to understand what the planner needs reviewed.
2. Read the `CURRENT PLAN EXCERPT` to see the specific tasks and design decisions.
3. Apply your domain expertise to the plan content — do NOT read codebase files unless the plan references specific existing code that is relevant. In adviser mode, focus on adapter boundaries and test slicing as described in plan tasks.
4. Produce structured advice in the format below.
5. Save output to engram and return summary + observation ID.

Focus ONLY on your specialist domain: @AdapterIT patterns, SimulationRepository, external service mocking.

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
  title: "sdd/{change-name}/guidance/integration-test-adviser",
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
