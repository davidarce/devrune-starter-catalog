# WireMock Patterns

Reference for mocking external HTTP services in Java integration tests using WireMock.

## WireMock (Java/HTTP)

```java
@WireMockTest
class PaymentGatewayAdapterTest {

    @Test
    void shouldReturnAuthorizedWhenPaymentAccepted(WireMockRuntimeInfo wm) {
        stubFor(post(urlEqualTo("/v1/charges"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBodyFile("charge-authorized.json")));

        var result = adapter.charge(new ChargeRequest("tok_visa", Money.of(50)));

        assertThat(result.status()).isEqualTo(ChargeStatus.AUTHORIZED);
    }
}
```

## Key Practices

- Use `@WireMockTest` for automatic lifecycle management
- Use `WireMockRuntimeInfo` to get the dynamic port — avoid hardcoding ports
- Store response bodies in `src/test/resources/__files/` as JSON files (`withBodyFile`)
- Stub both success and error responses for the same endpoint
- Use `verify(postRequestedFor(...))` to assert on request structure when the outbound request itself is the behavior under test
