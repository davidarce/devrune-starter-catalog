# Vitest Setup and Mocking

Reference for Vitest configuration and mocking patterns in frontend tests.

## Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  }
})
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
```

## Mocking with vi.mock() / jest.mock()

### Mocking a module
```typescript
vi.mock('../api/orders', () => ({
  fetchOrders: vi.fn()
}))

import { fetchOrders } from '../api/orders'

beforeEach(() => {
  vi.mocked(fetchOrders).mockResolvedValue([
    { id: '1', status: 'confirmed', total: 99.99 }
  ])
})
```

### Mocking a hook
```typescript
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Alice' }, isAuthenticated: true })
}))
```

### Partial mocks
```typescript
vi.mock('../utils/dates', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils/dates')>()
  return {
    ...original,
    formatDate: vi.fn().mockReturnValue('Jan 1, 2026')
  }
})
```
