---
name: adapter-it-patterns
scope: testing
applies-to:
  - integration-test-adviser
description: "Adapter integration test patterns with WireMock for HTTP service simulation"
paths:
  - "**/*IT.java"
---

# Adapter Integration Test Patterns

> **Note:** Examples use generic package names — adapt to your project's package structure.

## Complete Test Class Example

```java
@SpringBootTest(classes = {RepositoryAdapter.class, Config.class, MapperImpl.class})
@AutoConfigureWireMock(port = 0)
class RepositoryAdapterIT {

  @Autowired
  private RepositoryAdapter adapter;

  @BeforeEach
  void setUp() {
    WireMock.reset(); // MANDATORY - prevents test pollution
  }

  @Test
  void shouldRetrieveDataWhenServiceReturnsOk() {
    // Given
    final var id = UUID.randomUUID();
    final var expected = this.mockSuccessfulResponse(id);

    // When
    final var result = this.adapter.findById(id);

    // Then
    assertThat(result).isPresent()
        .get().satisfies(entity -> {
          assertThat(entity.id()).isEqualTo(expected.id());
          assertThat(entity.name()).isEqualTo(expected.name());
        });
  }

  @Test
  void shouldReturnEmptyWhenServiceReturns404() {
    // Given
    final var id = UUID.randomUUID();
    this.mock404Response(id);

    // When & Then
    assertThat(this.adapter.findById(id)).isEmpty();
  }

  // ========== HELPER METHODS ==========

  private Entity mockSuccessfulResponse(final UUID id) {
    final var entity = EntityMother.create().withId(id).build();

    stubFor(get(urlEqualTo("/api/entities/" + id))
        .willReturn(aResponse()
            .withStatus(200)
            .withHeader("Content-Type", "application/json")
            .withBody(toJson(new EntityResponseDTO().id(id).name(entity.name())))));

    return entity;
  }

  private void mock404Response(final UUID id) {
    stubFor(get(urlEqualTo("/api/entities/" + id))
        .willReturn(aResponse()
            .withStatus(404)
            .withHeader("Content-Type", "application/json")
            .withBody("{\"status\":404,\"title\":\"Not Found\"}")));
  }
}
```

## WireMock Stub Patterns

### GET Request Stubbing

```java
stubFor(get(urlEqualTo("/api/resource/" + id))
    .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        .withBody(toJson(responseDto))));
```

### POST/PUT Request Stubbing

Use `equalToJson` to match request body:

```java
stubFor(post(urlEqualTo("/api/resource"))
    .withRequestBody(equalToJson(toJson(requestDto)))
    .willReturn(aResponse()
        .withStatus(201)
        .withHeader("Content-Type", "application/json")
        .withBody(toJson(responseDto))));
```

### Error Stubbing

```java
stubFor(get(urlEqualTo("/api/resource/" + id))
    .willReturn(aResponse()
        .withStatus(500)
        .withHeader("Content-Type", "application/json")
        .withBody("{\"status\":500,\"title\":\"Internal Server Error\"}")));
```

### Timeout Stubbing

```java
stubFor(get(urlEqualTo("/api/resource/" + id))
    .willReturn(aResponse()
        .withFixedDelay(5000)
        .withStatus(200)));
```

## Required Imports

```java
// Spring Boot Test
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;

// WireMock
import com.github.tomakehurst.wiremock.client.WireMock;
import static com.github.tomakehurst.wiremock.client.WireMock.*;

// Spring
import org.springframework.beans.factory.annotation.Autowired;

// AssertJ
import static org.assertj.core.api.Assertions.*;
```

## Code Quality Standards

### Naming

- Test classes end with `IT.java` suffix
- Test methods use `should[Behavior]When[Condition]` pattern

### Structure

Use Given-When-Then with comment separators:

```java
@Test
void shouldReturnEmptyWhenNotFound() {
    // Given
    final var id = UUID.randomUUID();
    this.mockNotFoundResponse(id);

    // When
    final var result = this.adapter.findById(id);

    // Then
    assertThat(result).isEmpty();
}
```

### Assertions

Use AssertJ fluent style:

```java
assertThat(result).isPresent()
    .get().satisfies(entity -> {
        assertThat(entity.id()).isEqualTo(expectedId);
        assertThat(entity.status()).isEqualTo(ACTIVE);
    });
```

### Helper Methods

Name descriptively to document mock behavior:

| Method Name | Purpose |
|-------------|---------|
| `mockSuccessfulResponse(id)` | Returns domain entity, sets up 200 response |
| `mock404Response(id)` | Sets up 404 not found response |
| `mock500Response()` | Sets up 500 server error response |
| `mockTimeoutResponse()` | Sets up connection timeout |

## Test Scenarios to Cover

| Scenario | HTTP Status | Expected Behavior |
|----------|-------------|-------------------|
| Happy path | 200 OK | Return populated result |
| Resource not found | 404 | Return empty/Optional.empty() |
| Bad request | 400 | Throw validation exception |
| Unauthorized | 401 | Throw auth exception |
| Server error | 500 | Throw infrastructure exception |
| Service unavailable | 503 | Throw temporary failure exception |
| Gateway timeout | 504 | Throw timeout exception |

## Context Discovery

When needing reference implementations, search for:

| Resource | Location |
|----------|----------|
| Existing IT tests | `infrastructure/src/test/java/**/*IT.java` |
| Mother builders | `domain/src/test/java/*/mother/` |
| DTO structures | `rest-client/` or adapter packages |
| Configuration classes | `infrastructure/src/main/java/**/config/` |

## Quality Standards

Integration tests should:
- Serve as living documentation for adapter behavior
- Be maintainable and easy to understand
- Enable confident refactoring
- Run fast (< 5 seconds per test method)
- Use minimal Spring context loading
