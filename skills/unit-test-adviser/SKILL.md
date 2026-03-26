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
