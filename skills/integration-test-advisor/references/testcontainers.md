# TestContainers

Reference for using TestContainers to spin up real database instances for integration tests.

## TestContainers (any language, real databases)

Use TestContainers to spin up real database instances for integration tests:

```java
@Testcontainers
class OrderRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("testdb");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

## Key Practices

- Use `@DynamicPropertySource` to inject container connection details into the Spring context
- Declare containers as `static` so they are shared across tests in the class (faster than per-test startup)
- Use the specific container class (`PostgreSQLContainer`, `MySQLContainer`, `MongoDBContainer`) for type-safe configuration
- Prefer real databases over in-memory substitutes (H2) — they catch dialect and constraint differences
- Combine with `@Transactional` for fast test isolation via rollback
