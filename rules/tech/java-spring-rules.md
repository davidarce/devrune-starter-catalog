---
name: java-spring
scope: tech
technology: java
applies-to:
  - architect-adviser
  - unit-test-adviser
  - integration-test-adviser
  - api-first-adviser
description: "Java Spring Boot conventions: module structure, DI, testing, API patterns"
paths:
  - "**/*.java"
---

# Java/Spring Boot Reference

Technology-specific guidance for Java Spring Boot applications using hexagonal architecture, covering architecture, unit testing, integration testing, and API patterns.

## Architecture

### Getting Started

Use [Spring Initializr](https://start.spring.io/) to bootstrap new services. Leverage Spring Boot starters for common capabilities (web, data, security, actuator).

### Java Module Structure

```
code/
├── domain/           # Pure business logic, entities, VOs, repository interfaces
├── application/      # Use cases, application services, DTOs
├── infrastructure/   # Adapters, repository implementations, external services
├── api-rest/         # REST API endpoints (API-first approach)
├── boot/             # Spring Boot main application and configuration
├── test-fixtures/    # Test builders and mock objects (Mother pattern)
├── rest-client/      # External service clients
└── api-tests/        # API testing (Karate, REST Assured, etc.)
```

### Framework-Specific Tools

**Allowed build tools:** `Bash(mvn:*)`, `Bash(./mvnw:*)`, `Bash(gradle:*)`

### Exploration Commands

```
Glob("code/domain/**/*.java")               — locate domain entities and value objects
Grep("implements Repository", path="code/infrastructure/") — find adapter implementations
Read("code/application/")                    — list use-case classes
Glob("code/infrastructure/**/*.java")        — survey infrastructure adapters
```

### Spring Boot Considerations

#### API Routes as Thin Adapters

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final CreateOrderUseCase createOrderUseCase;

    @PostMapping
    public ResponseEntity<OrderResponse> create(@RequestBody CreateOrderRequest request) {
        // Controller only translates HTTP to domain
        Order order = createOrderUseCase.execute(request.toCommand());
        return ResponseEntity.ok(OrderResponse.from(order));
    }
}
```

#### Error Handling at API Boundary

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(OrderNotFoundException ex) {
        return ResponseEntity.status(NOT_FOUND)
            .body(ErrorResponse.from(ex));
    }
}
```

#### Dependency Injection

- Use constructor injection exclusively (avoid field injection)
- Spring `@Configuration` classes belong in the `boot` or `infrastructure` module
- Domain layer has zero framework imports (no Spring, no JPA annotations)

### Quality Checklist (Architecture)

- [ ] Domain layer has zero framework imports (no Spring, no JPA annotations)
- [ ] Constructor injection used throughout (no `@Autowired` on fields)
- [ ] MapStruct mappers for DTO conversions (no manual mapping)
- [ ] Repository interfaces in domain, `@Repository` implementations in infrastructure

## Unit Testing

### JUnit 5 Test Structure

```java
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
}
```

### Annotations

| Annotation | Purpose |
|-----------|---------|
| `@ExtendWith(MockitoExtension.class)` | Enable Mockito in JUnit 5 |
| `@Mock` | Create a mock dependency |
| `@InjectMocks` | Inject mocks into class under test |
| `@Captor` | Capture arguments for verification |

### BDDMockito Style

- Use `given()` for stubbing
- Use `then().should()` for verification

```java
// Stubbing
given(repository.findById(id)).willReturn(Optional.of(entity));

// Verification
then(repository).should().findById(id);
then(repository).should(times(2)).save(any());
then(repository).should(never()).delete(any());
```

### Mother Pattern

The Mother pattern provides fluent test data builders using Lombok's `@With` and Instancio for random data generation.

#### Mother Builder Structure

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

#### Key Components

| Annotation/Library | Purpose |
|--------------------|---------|
| `@With` (Lombok) | Generates `withField()` methods for fluent building |
| `Instancio` | Library for random object graph generation |

#### Usage in Tests

```java
EntityMother.create().withField(value).build()
Instancio.ofList(Entity.class).size(count).create()
```

#### Mother File Location

Mother classes are typically located in the `domain` module under `src/test/java/.../mother/`.

### Exploration Commands (Unit Testing)

```
Glob("**/domain/**/*Test.java")   — locate domain unit tests
Grep("@ExtendWith", path="code/domain/") — verify MockitoExtension usage
Glob("**/mother/**/*Mother.java") — locate existing Mother classes
```

### Test File Naming

- Test classes: `*Test.java` suffix
- Test methods: `should[ExpectedBehavior]When[Condition]`

### AssertJ Assertions

```java
assertThat(result.field()).isEqualTo(expected);
assertThat(list).hasSize(3).allMatch(item -> item.isValid());
```

### Reactive Testing (Project Reactor)

```java
StepVerifier.create(resultMono)
    .assertNext(result -> assertThat(result.field()).isEqualTo(expectedValue))
    .verifyComplete();
```

## Integration Testing

> **Note:** Examples use generic package names — adapt to your project's package structure.

### Spring Boot Test with WireMock

Use `@SpringBootTest` with `@AutoConfigureWireMock` to load a minimal Spring context for testing infrastructure adapters with HTTP service simulation.

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
}
```

#### Key Rules

1. **ALWAYS** call `WireMock.reset()` in `@BeforeEach`
2. Load minimal Spring context via `@SpringBootTest(classes = {...})` with specific classes
3. Do NOT load the full Spring context

### WireMock Stub Patterns

#### GET Request Stubbing

```java
stubFor(get(urlEqualTo("/api/resource/" + id))
    .willReturn(aResponse()
        .withStatus(200)
        .withHeader("Content-Type", "application/json")
        .withBody(toJson(responseDto))));
```

#### POST/PUT Request Stubbing

```java
stubFor(post(urlEqualTo("/api/resource"))
    .withRequestBody(equalToJson(toJson(requestDto)))
    .willReturn(aResponse()
        .withStatus(201)
        .withHeader("Content-Type", "application/json")
        .withBody(toJson(responseDto))));
```

#### Error Stubbing

```java
stubFor(get(urlEqualTo("/api/resource/" + id))
    .willReturn(aResponse()
        .withStatus(500)
        .withHeader("Content-Type", "application/json")
        .withBody("{\"status\":500,\"title\":\"Internal Server Error\"}")));
```

### Required Imports

```java
// Spring Boot Test + WireMock
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import static com.github.tomakehurst.wiremock.client.WireMock.*;

// Static imports for HTTP
import static org.springframework.http.HttpMethod.*;
import static org.springframework.http.HttpStatus.*;

// AssertJ
import static org.assertj.core.api.Assertions.*;
```

### Mocking Strategy

| Mock | Don't Mock |
|------|-----------|
| External HTTP services (via WireMock) | MapStruct mappers |
| External databases | Configuration classes |
| Third-party APIs | Adapters under test |
| | Spring auto-configurations |
| | Domain objects |

### Test Scenarios to Cover

| Scenario | HTTP Status | Expected Behavior |
|----------|-------------|-------------------|
| Happy path | 200 OK | Return populated result |
| Resource not found | 404 | Return empty/Optional.empty() |
| Bad request | 400 | Throw validation exception |
| Unauthorized | 401 | Throw auth exception |
| Server error | 500 | Throw infrastructure exception |
| Service unavailable | 503 | Throw temporary failure exception |
| Gateway timeout | 504 | Throw timeout exception |

### Exploration Commands (Integration Testing)

```
Glob("**/infrastructure/**/*IT.java")  — find existing integration tests
Grep("@SpringBootTest", path="code/")  — locate annotated test classes
Grep("@AutoConfigureWireMock", path="code/") — locate WireMock-enabled tests
Glob("**/mother/**/*Mother.java")       — locate Mother builders for test data
```

### Test File Naming (Integration)

- Test classes: `*IT.java` suffix
- Test methods: `should[Behavior]When[Condition]`
- Helper methods: `mock[Behavior]()`

## API

### OpenAPI Project Structure

```
components/      # Schema components (request, responses, parameters, examples)
paths/           # Individual API paths: <scope>-<api-version>-<operationId>.yml
metadata.yml     # API metadata information
openapi-rest.yml # Main specification file
```

### Exploration Commands (API)

```
Glob("paths/*.yml")                      — locate existing API path definitions
Grep("version:", path="metadata.yml")    — read current API version
Read("components/errors.yml")            — review standardized error models
```

### Spring Boot Controller Pattern

```java
@RestController
@RequestMapping("/api/v1/resources")
public class ResourceController {
    private final CreateResourceUseCase createResourceUseCase;

    @PostMapping
    public ResponseEntity<ResourceResponse> create(@RequestBody @Valid CreateResourceRequest request) {
        Resource resource = createResourceUseCase.execute(request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).body(ResourceResponse.from(resource));
    }
}
```

### OpenAPI Code Generation

For Java projects using OpenAPI Generator:
- Generate server stubs from the OpenAPI specification
- Implement generated interfaces in controller classes
- Use generated model classes for request/response DTOs
- Ensure generated code does not leak into the domain layer

### Error Model (Java/Spring)

Standard error response structure:

```yaml
'400':
  $ref: "../components/errors.yml#/components/responses/BadRequest400"
'401':
  $ref: '../components/errors.yml#/components/responses/Unauthorized401'
'403':
  $ref: '../components/errors.yml#/components/responses/Forbidden403'
'404':
  $ref: '../components/errors.yml#/components/responses/NotFound404'
'500':
  $ref: '../components/errors.yml#/components/responses/InternalServerError500'
'503':
  $ref: '../components/errors.yml#/components/responses/ServiceUnavailable503'
'504':
  $ref: '../components/errors.yml#/components/responses/GatewayTimeout504'
```

### Maven/Gradle Integration

- Use `openapi-generator-maven-plugin` or Gradle equivalent to generate code during build
- Keep specifications in a dedicated `api/` or `contract/` directory
- Version API specs alongside code changes
