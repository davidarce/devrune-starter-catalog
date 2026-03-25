---
name: 4-rules-of-simple-design
scope: architecture
applies-to:
  - architect-adviser
description: "Kent Beck's 4 Rules of Simple Design: test-first, clarity, DRY, minimality"
paths:
  - "**/*.java"
  - "**/*.{ts,tsx}"
---

# Beck's 4 Rules of Simple Design

Kent Beck's 4 Rules of Simple Design provide a strict priority for evaluating design quality. Apply them in order -- a higher-priority rule always wins when rules conflict.

## Priority Order

| Priority | Rule | Principle |
|----------|------|-----------|
| 1 | Passes the Tests | The system must work correctly and be verified by automated tests |
| 2 | Reveals Intention | Code clearly communicates what it does and why |
| 3 | No Duplication | Every piece of knowledge has a single, unambiguous representation |
| 4 | Fewest Elements | Remove anything that does not serve the first three rules |

## Rule 1: Passes the Tests

**Definition**: The system does what it is supposed to do, verified by automated tests. Without passing tests, no other design quality matters.

**Rationale**: Tests are the foundation of confidence. Untested code is unverifiable -- any claim about its correctness is speculation. Tests also enable safe refactoring for Rules 2-4.

**Architecture Review Application**:
- Verify domain logic has unit tests independent of frameworks
- Check that use cases have tests covering success and failure paths
- Confirm infrastructure adapters have integration tests with realistic simulations
- Flag any behavioral code path that lacks test coverage

## Rule 2: Reveals Intention

**Definition**: Code clearly communicates its purpose. A reader should understand what a module does and why without decoding implementation tricks or reading external documentation.

**Rationale**: Code is read far more often than written. Clarity reduces onboarding time, review effort, and defect rate. Names, structure, and abstractions must express domain concepts using ubiquitous language.

**Architecture Review Application**:
- Check that class, method, and variable names express domain concepts
- Verify layer boundaries make the system's intent obvious (domain vs. infrastructure)
- Confirm use case names describe business operations, not technical ones
- Flag obscure abbreviations, generic names (`Manager`, `Helper`, `Utils`), or misleading identifiers

## Rule 3: No Duplication

**Definition**: Every piece of knowledge has a single, unambiguous, authoritative representation in the system. Duplication is not only repeated code -- it includes duplicated logic, structure, and concepts.

**Rationale**: Duplicated knowledge diverges over time, causing inconsistencies and bugs. Eliminating duplication drives the creation of proper abstractions (interfaces, shared services, value objects).

**Architecture Review Application**:
- Look for duplicated domain logic across use cases or services
- Check that cross-cutting concerns use shared abstractions (not copy-paste)
- Verify repository interfaces are not repeated across aggregates without justification
- Flag mapper/converter logic duplicated between layers

## Rule 4: Fewest Elements

**Definition**: Remove any class, method, variable, or abstraction that does not serve Rules 1-3. Every element must earn its place.

**Rationale**: Unnecessary abstractions increase cognitive load and maintenance burden. Speculative generality (building for future needs that never arrive) violates this rule. Simplicity is the goal.

**Architecture Review Application**:
- Flag empty interfaces, unused abstractions, or layers with no real behavior
- Check for over-engineered patterns (e.g., strategy pattern with only one implementation)
- Verify each architectural layer adds value -- collapse layers that merely pass through
- Question any abstraction that exists "just in case" without a current concrete use

## Conflict Resolution

**Strict priority**: When rules conflict, the higher-priority rule always wins. The most common tension is between Rule 2 (Reveals Intention) and Rule 3 (No Duplication).

**Rule 2 wins over Rule 3**: If removing duplication makes the code harder to understand, keep the duplication. Clarity is more important than DRY.

| Scenario | Rule 2 Says | Rule 3 Says | Resolution |
|----------|-------------|-------------|------------|
| Two use cases share similar validation logic, but each has domain-specific naming and semantics | Keep separate with clear names | Extract shared validation | **Keep separate** -- domain-specific naming reveals intention; forced extraction obscures the distinct business reasons |
| Identical DTO mappers in two adapters mapping to different domain concepts | Name each mapper after its domain concept | Extract a generic mapper | **Keep separate** -- each mapper name communicates its domain purpose; a generic mapper hides intent |

**When Rule 3 wins**: If duplication can be removed WITHOUT sacrificing clarity (e.g., extracting a well-named shared value object), always do so.

## Anti-Pattern Table

| Rule Violated | Anti-pattern | Signal in Code |
|---------------|-------------|----------------|
| Rule 1 | Untested domain logic | Domain service with no corresponding test file |
| Rule 1 | Tests coupled to infrastructure | Unit tests that require database or HTTP connections to run |
| Rule 2 | Generic naming | Classes named `Manager`, `Helper`, `Utils`, `Processor` without domain context |
| Rule 2 | Misleading abstraction | Interface name suggests one behavior but implementations do something different |
| Rule 3 | Copy-paste services | Two services with near-identical methods differing only in entity type |
| Rule 3 | Scattered validation | Same business rule validated in controller, service, and repository |
| Rule 4 | Speculative generality | Interface with exactly one implementation and no planned extension point |
| Rule 4 | Pass-through layer | Application service that only delegates to repository without adding logic |

## Quality Checklist Mapping

| Beck Rule | Quality Checklist Item | Connection |
|-----------|----------------------|------------|
| Rule 1: Passes the Tests | Domain logic can be tested without frameworks | Testability requires framework independence |
| Rule 1: Passes the Tests | Domain layer has zero framework-specific imports | Framework-free domain enables pure unit tests |
| Rule 2: Reveals Intention | Each layer has single, well-defined responsibility | Clear responsibilities reveal system intent |
| Rule 2: Reveals Intention | Interfaces designed around domain concepts | Domain-centric interfaces communicate purpose |
| Rule 3: No Duplication | No circular dependencies between modules | Circular deps often signal duplicated or misplaced knowledge |
| Rule 3: No Duplication | All dependencies point inward toward domain | Inward deps prevent duplicating domain logic in outer layers |
| Rule 4: Fewest Elements | Solution supports future changes without modifying core logic | Minimal elements -- only abstractions that enable real extensibility, not speculative ones |

## Review Methodology

When applying these rules during architecture reviews, follow this sequence:

1. **Start with Rule 1** -- Check test coverage for the changed code. If critical paths lack tests, flag this before analyzing design quality. Untested design improvements are unverifiable.
2. **Apply Rule 2** -- Read the code as a newcomer. Can you understand each module's purpose from its name and structure alone? Flag anything that requires "insider knowledge" to decode.
3. **Apply Rule 3** -- Search for duplicated knowledge (not just duplicated lines). Check if the same business rule appears in multiple places or if similar abstractions could be unified without losing clarity (respect Rule 2 priority).
4. **Apply Rule 4** -- Identify elements that do not serve Rules 1-3. Question unused abstractions, empty layers, and speculative patterns.
5. **Report findings** using the architect-adviser output format: Issues sorted by severity, with each issue referencing the specific rule violated.
