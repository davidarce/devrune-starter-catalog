---
name: unit-test-adviser
description: "Domain unit test patterns: test structure, mocking strategies, test data builders, Given-When-Then."
allowed-tools:
  - Read
  - Grep
  - Glob
model: sonnet
---

# unit-test-adviser

Provide expert guidance on writing effective unit tests for domain logic following Given-When-Then structure.

## When to Invoke

Invoke this skill when the user:
- Asks to review or improve unit tests.
- Asks "how should I test this?" for domain logic.
- Asks about mocking strategies, test data, or test structure.

## Test Structure: Given-When-Then

Every test method must follow the 3A (Arrange, Act, Assert) pattern with clear comment separators:

```
// Given
<set up test data and mock behaviors>

// When
<invoke the method under test — single line>

// Then
<assert results and verify mock interactions>
```

## Naming Convention

Pattern: `should<ExpectedBehavior>When<Condition>`

| Good | Bad |
|------|-----|
| `shouldReturnUserWhenValidIdProvided` | `test1`, `testFind` |
| `shouldThrowExceptionWhenValidationFails` | `whenUserPresent` |
| `shouldReturnEmptyWhenEntityNotFound` | `testMethodName_1` |

## Test Data: Object Mother Pattern

Use the Object Mother (or factory function) pattern for reusable test data:

```java
// Java/Mother
User user = UserMother.aValidUser();
User admin = UserMother.aValidUser().withRole(ADMIN).build();

// TypeScript/Factory
const user = createUser({ role: 'admin' });
```

Never construct domain objects inline when the same construction is reused across tests.

## Mocking Strategy

| Mock | Do NOT Mock |
|------|------------|
| External repositories | Value objects |
| External API clients | Domain entities |
| Domain services (cross-aggregate) | DTOs |
| Infrastructure adapters | Simple utility functions |

Use BDD-style mocking when available:
```java
given(repo.findById(id)).willReturn(Optional.of(entity));
then(repo).should().findById(id);
then(repo).should(never()).save(any());
```

## Coverage Requirements

Every test class should cover:
- All public methods (happy path)
- Validation rules and invariants
- Error handling and exception propagation
- Boundary conditions (empty collections, null optionals, zero values)
- All business logic branches

## Anti-Patterns

- Tests that require a database or HTTP connection to run (not unit tests).
- Using `any()` matchers when a specific value can be used.
- No assertions after the "When" section.
- Mocking value objects or DTOs.
- `assertTrue(result != null)` — use `assertThat(result).isNotNull()`.

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
3. Apply your domain expertise to the plan content — do NOT read codebase files unless the plan references specific existing code that is relevant. In adviser mode, focus on test scope and coverage gaps identified in the plan's Testing section.
4. Produce structured advice in the format below.
5. Save output to engram and return summary + observation ID.

Focus ONLY on your specialist domain: Test structure, mocking strategies, Mother pattern, Given-When-Then.

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
  title: "sdd/{change-name}/guidance/unit-test-adviser",
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
