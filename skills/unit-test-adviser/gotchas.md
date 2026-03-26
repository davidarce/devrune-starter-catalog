# Gotchas — unit-test-adviser

Common mistakes Claude makes when writing or reviewing unit tests. Check these before finalizing your output.

## 1. Over-mocking domain objects instead of using real instances

**Wrong**: Mocking the `Order` domain object to return canned values from getters, then testing that the service calls those getters.
**Right**: Use real domain objects (constructed via builders or Mother pattern). Mock only external dependencies — repositories, adapters, and infrastructure ports. Domain logic should execute for real in unit tests.
**Why**: Claude defaults to mocking everything the class under test depends on. Mocking domain objects defeats the purpose of unit testing — you end up testing the mock configuration, not the business logic.

## 2. Vague test names that describe the method, not the behavior

**Wrong**: `testCalculateTotal()`, `shouldCallRepository()`, `testProcess()`
**Right**: `shouldApplyDiscountWhenOrderExceedsMinimumAmount()`, `shouldRejectOrderWhenStockIsInsufficient()`, `shouldReturnEmptyListWhenCustomerHasNoOrders()`
**Why**: Claude generates test names that mirror the method name. Good test names document the behavior and its condition — when a test fails, the name alone should tell you what broke.

## 3. Using any() matchers everywhere instead of specific values

**Wrong**: `verify(repository).save(any(Order.class))` — verifies that save was called with *some* Order, but not *the right* Order.
**Right**: `verify(repository).save(argThat(order -> order.getStatus() == CONFIRMED && order.getTotal().equals(expectedTotal)))` — verify the actual state that matters.
**Why**: Claude uses `any()` for convenience when setting up verifications. This makes tests pass even when the code under test produces wrong output — the test gives false confidence.

## 4. Missing boundary condition tests

**Wrong**: Testing only the happy path (valid order, valid payment, successful save) and skipping edge cases.
**Right**: Explicitly test boundaries: null inputs, empty collections, zero amounts, maximum values, duplicate submissions, concurrent modifications. For each business rule, test both sides of the condition.
**Why**: Claude generates the obvious happy-path test quickly but rarely follows up with boundary cases unprompted. Most production bugs live at boundaries, not in the happy path.

## 5. Testing implementation details rather than behavior

**Wrong**: Asserting that an internal method was called in a specific order, or verifying the exact number of repository calls.
**Right**: Assert on the observable output — the return value, the state change, or the side effect that matters to the caller. Verify interactions only when the interaction IS the behavior (e.g., sending an email).
**Why**: Claude frequently uses `verify()` and `verifyNoMoreInteractions()` to assert on internal call sequences. These tests break on every refactor even when behavior is preserved, creating maintenance burden without safety.

## 6. Not resetting or isolating test state between tests

**Wrong**: Tests that share a mutable static field, reuse a modified domain object, or depend on execution order to pass.
**Right**: Each test sets up its own state from scratch. Use `@BeforeEach` to reinitialize mocks and test data. Never rely on one test modifying state for the next test to consume.
**Why**: Claude sometimes declares shared test fixtures at the class level and mutates them across tests. This creates flaky tests that pass individually but fail when run in a different order.
