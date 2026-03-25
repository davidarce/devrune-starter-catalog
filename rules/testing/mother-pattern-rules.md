---
name: mother-pattern
scope: testing
applies-to:
  - unit-test-adviser
description: "Mother builder pattern, test data construction, BDDMockito"
---

# Mother Pattern Reference

## Mother Builder Structure

```java
@With
@RequiredArgsConstructor
@AllArgsConstructor
public class EntityMother {

  private static final Entity ENTITY = Instancio.of(Entity.class)
      .set(Select.field(Entity::field), UUID.randomUUID())
      .create();

  private final UUID field = ENTITY.field();

  public static EntityMother create() {
    return new EntityMother();
  }

  public Entity build() {
    return new Entity(this.field);
  }
}
```

### Key Components

| Annotation/Library | Purpose |
|--------------------|---------|
| `@With` (Lombok) | Generates `withField()` methods for fluent building |
| `@RequiredArgsConstructor` | Constructor for required fields |
| `@AllArgsConstructor` | Constructor for all fields |
| `Instancio` | Library for random object graph generation |

### Instancio Usage

Use Instancio to generate realistic random base data:

```java
private static final Entity ENTITY = Instancio.of(Entity.class)
    .set(Select.field(Entity::id), UUID.randomUUID())
    .set(Select.field(Entity::status), Status.ACTIVE)
    .create();
```

To generate lists directly:

```java
List<Entity> entities = Instancio.ofList(Entity.class).size(5).create();
```

## Simple Test Structure

```java
/**
 * Unit tests for {@link ClassUnderTest}.
 */
@ExtendWith(MockitoExtension.class)
class ClassUnderTestTest {

  @Mock
  private Repository repository;

  @Mock(lenient = true)
  private OptionalService service;

  @InjectMocks
  private ClassUnderTest classUnderTest;

  @Captor
  private ArgumentCaptor<Entity> entityCaptor;

  // ========== HAPPY PATH TESTS ==========

  @Test
  void shouldReturnEntityWhenValidIdProvided() {
    // Given
    final var id = UUID.randomUUID();
    final var expected = this.shouldFindEntity(id);

    // When
    final var result = this.classUnderTest.execute(id);

    // Then
    assertThat(result.id()).isEqualTo(expected.id());
    assertThat(result.name()).isEqualTo(expected.name());
    then(this.repository).should().findById(id);
  }

  // ========== EDGE CASE TESTS ==========

  @Test
  void shouldReturnEmptyWhenEntityNotFound() {
    // Given
    final var id = UUID.randomUUID();
    this.shouldReturnEmptyForId(id);

    // When
    final var result = this.classUnderTest.execute(id);

    // Then
    assertThat(result).isEmpty();
    then(this.repository).should().findById(id);
  }

  // ========== ERROR HANDLING TESTS ==========

  @Test
  void shouldThrowExceptionWhenValidationFails() {
    // Given
    final var invalidData = DataMother.create().withInvalidField(null).build();

    // When & Then
    assertThatThrownBy(() -> this.classUnderTest.execute(invalidData))
        .isInstanceOf(ValidationException.class)
        .hasMessageContaining("Field cannot be null");

    then(this.repository).should(never()).save(any());
  }

  // ========== HELPER METHODS ==========

  private Entity shouldFindEntity(final UUID id) {
    final var entity = EntityMother.create().withId(id).build();
    given(this.repository.findById(id)).willReturn(Optional.of(entity));
    return entity;
  }

  private void shouldReturnEmptyForId(final UUID id) {
    given(this.repository.findById(id)).willReturn(Optional.empty());
  }
}
```

## Complex Test with Data Factory

Use when tests require multiple coordinated scenarios:

```java
@ExtendWith(MockitoExtension.class)
class ComplexUseCaseTest {

  private final TestDataFactory factory = new TestDataFactory();

  @Mock
  private Repository repository;

  @InjectMocks
  private ComplexUseCase useCase;

  @Test
  void shouldProcessOrderWhenAllItemsValid() {
    // Given
    final var scenario = this.factory.createValidOrderScenario();
    this.shouldFindItems(scenario.items());
    this.shouldCalculatePrice(scenario.price());

    // When
    final var result = this.useCase.process(scenario.order());

    // Then
    assertThat(result.totalPrice()).isEqualTo(scenario.expectedTotal());
    then(this.repository).should().save(scenario.order());
  }

  static class TestDataFactory {
    OrderScenario createValidOrderScenario() {
      final var order = OrderMother.create().withItems(3).build();
      final var items = Instancio.ofList(Item.class).size(3).create();
      final var price = Money.of(100.00);
      return new OrderScenario(order, items, price, Money.of(300.00));
    }

    record OrderScenario(Order order, List<Item> items, Money price, Money expectedTotal) {}
  }
}
```

## Mocking Standards

### Prefer Real Values

```java
// Prefer specific values
given(repo.findById(specificId)).willReturn(...);

// Use any() only when testing flexible behavior
given(repo.findById(any())).willReturn(...);
```

### Mock External Dependencies Only

- Repositories
- Domain services
- External clients

### Don't Mock

- Value objects
- Domain entities
- DTOs under test

## Assertions and Verifications

### AssertJ Fluent Style

```java
assertThat(result.field()).isEqualTo(expected);
assertThat(list).hasSize(3).allMatch(item -> item.isValid());
```

### BDDMockito Verifications

```java
then(dependency).should().method(specificValue);
then(dependency).should(times(2)).method(any());
then(dependency).should(never()).method(any());
```

### ArgumentCaptors

```java
then(repository).should().save(entityCaptor.capture());
assertThat(entityCaptor.getValue().status()).isEqualTo(ACTIVE);
```

## Test Organization

### Order Tests Logically

1. Happy path scenarios first
2. Edge cases (empty, null, boundary conditions)
3. Error handling and exceptions

### Group with Comments

```java
// ========== HAPPY PATH TESTS ==========
// ========== EDGE CASE TESTS ==========
// ========== ERROR HANDLING TESTS ==========
// ========== HELPER METHODS ==========
```

## Naming Conventions

### Test Methods

Pattern: `should[ExpectedBehavior]When[Condition]`

```java
shouldReturnEntityWhenValidIdProvided()
shouldThrowExceptionWhenValidationFails()
shouldReturnEmptyListWhenNoResultsFound()
```

### Helper Methods

Pattern: `should[MockBehavior]()`

```java
shouldFindOrderById(UUID id)
shouldThrowExceptionWhenSaving(Entity entity)
shouldReturnEmptyForId(UUID id)
```

## Coverage Requirements

Test each component for:
- All public methods with happy path
- Validation rules and constraints
- Error handling and exception propagation
- Boundary conditions (empty collections, null optionals, zero values)
- All business logic branches

## Reactive Testing

For Project Reactor methods:

```java
@Test
void shouldReturnMonoWithResultWhenExecuted() {
    // Given
    final var data = DataMother.create().build();
    this.shouldReturnMono(data);

    // When
    final var resultMono = this.useCase.execute(data);

    // Then
    StepVerifier.create(resultMono)
        .assertNext(result -> assertThat(result.field()).isEqualTo(expectedValue))
        .verifyComplete();
}
```

## Quality Standards

Domain tests must:
- Be the foundation of system reliability
- Serve as living documentation
- Be maintainable to reduce long-term costs
- Enable confident refactoring
