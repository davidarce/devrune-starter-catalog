# MSW Patterns

Reference for mocking external HTTP services in TypeScript integration tests using Mock Service Worker (MSW).

## MSW (TypeScript/HTTP)

```typescript
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const server = setupServer(
  http.post('https://api.stripe.com/v1/charges', () =>
    HttpResponse.json({ id: 'ch_123', status: 'succeeded' })
  )
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

it('returns authorized status when Stripe accepts the charge', async () => {
  const result = await stripeAdapter.charge({ amount: 5000, currency: 'USD' })
  expect(result.status).toBe('AUTHORIZED')
})
```

## Key Practices

- Use `setupServer` for Node.js test environments (Vitest, Jest)
- Always call `server.resetHandlers()` in `afterEach` to prevent handler leakage between tests
- Use `server.use()` inside individual tests to override default handlers for error scenarios
- Use `http.get()`, `http.post()`, etc. from `msw` — they match on method and URL
- For request assertions, use `HttpResponse.json()` or capture the request in the handler
