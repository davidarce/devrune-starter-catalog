# Gotchas — architect-adviser

Common mistakes Claude makes when reviewing or advising on architecture. Check these before finalizing your output.

## 1. Over-applying DDD to simple CRUD operations

**Wrong**: Recommending aggregates, domain events, value objects, and a full hexagonal setup for a straightforward CRUD service with no business rules.
**Right**: Match the architecture complexity to the domain complexity. Simple CRUD with validation can use a thin service layer with direct repository access. Reserve DDD tactical patterns for domains with genuine business invariants.
**Why**: Claude defaults to the most sophisticated architecture it knows. A CRUD resource with no invariants does not benefit from an aggregate root — it just adds indirection without value.

## 2. Recommending speculative interfaces for single implementations

**Wrong**: Creating `OrderRepository` (interface) and `OrderRepositoryImpl` (class) when there is only one persistence strategy and no foreseeable alternative.
**Right**: Start with the concrete class. Extract an interface only when there is a second implementation, a testing need that stubs cannot satisfy, or a clear architectural boundary (port in hexagonal architecture) that justifies it.
**Why**: Claude applies "program to an interface" as a universal rule. Premature interfaces add navigation complexity, make IDE "go to definition" less useful, and communicate a flexibility that does not exist.

## 3. Allowing framework annotations to leak into the domain layer

**Wrong**: Accepting `@Entity`, `@Column`, or `@JsonProperty` annotations on domain model classes and not flagging them in a review.
**Right**: Domain objects should be framework-free. JPA annotations belong on persistence entities in the infrastructure layer. Map between domain and persistence models at the adapter boundary.
**Why**: Claude tends to accept whatever annotations are present on domain classes without questioning them. Framework coupling in the domain violates the dependency rule and makes the domain untestable without framework context.

## 4. Tolerating anemic domain models as "clean architecture"

**Wrong**: Reviewing a service class with 300 lines of business logic that operates on data-only entities and calling the architecture "clean" because the layers are separated.
**Right**: Flag anemic models where behavior should live. If `OrderService.calculateTotal()` manipulates `Order` fields, that logic belongs on the `Order` domain object. Layer separation alone is not clean architecture — behavior must live with the data it operates on.
**Why**: Claude evaluates layer structure but rarely flags behavioral misplacement. An anemic model with a fat service is a procedural design wearing an OOP costume.

## 5. Recommending too many layers for a small service

**Wrong**: Advising controller -> application service -> domain service -> repository for a microservice with 3 endpoints and simple business logic.
**Right**: For small services, a two-layer structure (controller + service/repository) is sufficient. Add layers only when they carry distinct responsibilities. A domain service layer with pass-through methods adds no value.
**Why**: Claude applies enterprise patterns uniformly regardless of scale. Extra layers in a small service increase cognitive load, slow development, and make the codebase harder to navigate — the opposite of simple design.

## 6. Ignoring Beck's "fewest elements" rule during reviews

**Wrong**: Approving an architecture with unused abstractions, empty marker interfaces, or configuration classes that duplicate framework defaults — just because the patterns are "standard."
**Right**: Apply Kent Beck's fourth rule: the design has the fewest elements possible. Challenge every class, interface, and layer to justify its existence. If removing it changes nothing, it should not be there.
**Why**: Claude errs on the side of adding structure rather than removing it. Unnecessary elements are not harmless — they consume reading time, create false extension points, and dilute the signal in the codebase.
