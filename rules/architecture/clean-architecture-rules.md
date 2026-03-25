---
name: clean-architecture
scope: architecture
applies-to:
  - architect-adviser
description: "Hexagonal architecture, DDD patterns, ports and adapters"
paths:
  - "**/*.java"
  - "**/*.{ts,tsx}"
---

# Clean Architecture Reference

## Architectural Approach

### 1. Identify Core Domain Logic

Isolate business rules and domain models from infrastructure concerns. The domain layer must have zero dependencies on external frameworks or libraries.

### 2. Define Clear Boundaries

Establish explicit ports (interfaces) for:

| Port Type | Description | Examples |
|-----------|-------------|----------|
| Primary/Driving | Entry points into the system | API routes, controllers, CLI |
| Secondary/Driven | External dependencies | Databases, external APIs |
| Application Services | Use case orchestration | CreateOrderUseCase |

### 3. Hexagonal Architecture Structure

```
src/
├── domain/           # Pure business logic
│   ├── entities/     # Domain entities with identity
│   ├── valueobjects/ # Immutable value objects
│   ├── services/     # Domain services
│   ├── events/       # Domain events
│   └── repositories/ # Repository interfaces (ports)
│
├── application/      # Use cases and orchestration
│   ├── usecases/     # Business use case implementations
│   ├── services/     # Application services
│   └── dto/          # Data transfer objects
│
├── infrastructure/   # External adapters
│   ├── repositories/ # Repository implementations
│   ├── clients/      # External service clients
│   ├── config/       # Framework configuration
│   └── mappers/      # DTO/Entity mappers
│
├── api/              # API layer (REST, GraphQL, gRPC)
│   ├── controllers/  # HTTP/API endpoints
│   ├── mappers/      # Request/Response mappers
│   └── handlers/     # Exception handlers
│
└── bootstrap/        # Application bootstrap and configuration
```

> **Note:** Directory naming may vary by language and framework. See technology-specific rules (e.g., `tech/java-spring`) for framework-specific conventions.

## DDD Tactical Patterns

### Aggregates

Design with clear consistency boundaries. The Aggregate Root controls all modifications to its internal entities.

**Anti-pattern:** Exposing internal entities directly; access only through the Aggregate Root.

### Value Objects

Immutable objects for concepts without identity. Equality is structural, not identity-based.

**Anti-pattern:** Using identity-based equals(); equality must be structural.

### Domain Events

For cross-aggregate communication. Keep event payloads domain-native; do not couple them to infrastructure DTOs.

**Anti-pattern:** Coupling event payloads to infrastructure DTOs.

### Repository Pattern

Interface in domain, implementation in infrastructure. Repository interfaces must not expose infrastructure types (e.g., ORM entities, datasource handles).

**Anti-pattern:** Leaking infrastructure types through repository interfaces.

## Review Methodology

When reviewing code, check:

| Aspect | What to Verify |
|--------|---------------|
| Layer Separation | Domain, application, infrastructure properly separated |
| Domain Isolation | Business logic framework-agnostic |
| Dependency Flow | Dependencies point inward (dependency inversion) |
| Infrastructure Leakage | No infrastructure concerns in business logic |
| Use Case Orchestration | Application services properly coordinate operations |
| External Dependencies | All external deps abstracted behind interfaces |

## Implementation Standards

### Functional Programming Principles

- Prefer immutability where appropriate
- Use pure functions for business logic
- Avoid side effects in domain operations

### Validation at Boundaries

- Validate input at API layer
- Enforce invariants in domain constructors
- Use domain-specific exceptions

### Self-Documenting Code

- Meaningful names for classes, methods, variables
- Express business intent in code structure
- Use domain language (ubiquitous language)

### Open/Closed Principle

Design for extensibility: define interfaces/contracts that allow adding new implementations without modifying existing code.
