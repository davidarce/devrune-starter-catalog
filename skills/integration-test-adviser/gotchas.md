# Gotchas — integration-test-adviser

Common mistakes Claude makes when writing or reviewing integration tests. Check these before finalizing your output.

## 1. Loading the full application context instead of a test slice

**Wrong**: Annotating an integration test with `@SpringBootTest` when only the JPA repository layer needs testing.
**Right**: Use the narrowest test slice: `@DataJpaTest` for repositories, `@WebMvcTest` for controllers, `@JsonTest` for serialization. Load only the beans the test actually exercises.
**Why**: Claude defaults to `@SpringBootTest` because it always works. But loading the full context makes tests slow (30+ seconds startup), masks dependency issues, and tests more than intended — turning an integration test into a partial end-to-end test.

## 2. Shared mutable state between tests causing flaky failures

**Wrong**: Tests that insert data in `@BeforeAll` and share it across multiple test methods, or tests that depend on another test's side effects.
**Right**: Each test manages its own data. Use `@Transactional` for automatic rollback, or explicit cleanup in `@AfterEach`. Tests must pass when run individually, in any order, and in parallel.
**Why**: Claude creates shared setup for efficiency. This introduces ordering dependencies — one test's cleanup failure poisons subsequent tests, producing intermittent failures that waste hours to debug.

## 3. Port conflicts when running tests in parallel

**Wrong**: Hardcoding `port: 5432` or `port: 8080` for test databases or WireMock servers, causing failures when tests run concurrently on CI.
**Right**: Use dynamic port allocation: `@DynamicPropertySource` with TestContainers, `WireMockRuntimeInfo::getHttpPort()`, or `server.port=0` for embedded servers. Pass allocated ports to the test configuration.
**Why**: Claude hardcodes familiar port numbers. This works locally but breaks on CI where multiple test jobs run in parallel on the same machine, or where those ports are already occupied.

## 4. Recreating the entire database schema per test instead of using rollback

**Wrong**: Running `DROP SCHEMA` + `CREATE SCHEMA` + full migration in `@BeforeEach`, adding 5-10 seconds per test.
**Right**: Use transaction rollback (`@Transactional` in Spring, or wrap each test in a transaction that rolls back). For TypeScript, use `deleteMany()` on relevant tables in `afterEach`. Reserve full schema recreation for rare cases where DDL changes are under test.
**Why**: Claude sometimes generates heavyweight setup because it guarantees isolation. But the cost is test suites that take minutes instead of seconds, discouraging developers from running them.

## 5. Testing domain logic inside integration tests

**Wrong**: An integration test for `OrderRepository` that also validates business rules like discount calculation or stock validation.
**Right**: Integration tests verify the adapter boundary — that data persists correctly, that HTTP requests are constructed correctly, that messages are published with the right structure. Business logic validation belongs in unit tests.
**Why**: Claude blurs the boundary between test levels. When domain logic is tested in integration tests, failures are ambiguous — is it a persistence issue or a business logic bug? This slows root cause analysis.

## 6. Asserting only on return values without verifying stored state

**Wrong**: `assertThat(repo.save(order)).isNotNull()` — verifies the save returned something, but not what was actually persisted.
**Right**: After saving, query the database directly (raw query or separate find) to verify the actual stored state matches expectations. Assert on specific field values, not just non-null.
**Why**: Claude tests the adapter's return value, which may come from the in-memory object rather than what was actually written to storage. This misses serialization bugs, constraint violations, and mapping errors.
