---
name: integration-test-adviser
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
