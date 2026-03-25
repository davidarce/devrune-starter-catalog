---
name: frontend-testing
scope: tech
applies-to:
  - frontend-test-adviser
  - component-adviser
description: 'Frontend testing standards: React Testing Library, Vitest/Jest, Cypress/Playwright e2e, test structure, mocking, coverage.'
paths:
  - "**/*.test.{ts,tsx}"
  - "**/*.spec.{ts,tsx}"
  - "**/*.cy.{ts,tsx}"
---

# Frontend Testing Standards

## Testing Philosophy

Follow the **Testing Trophy** model:

```
        ╱╲
       ╱ E2E ╲          Few — critical user flows (Cypress / Playwright)
      ╱────────╲
     ╱Integration╲      Many — component + hook tests (Vitest/Jest + RTL)
    ╱──────────────╲
   ╱   Unit Tests    ╲   Some — pure logic, utilities (Vitest/Jest)
  ╱────────────────────╲
 ╱    Static Analysis    ╲ TypeScript + ESLint (always on)
╱──────────────────────────╲
```

**Priority**: Integration tests (component behavior) > Unit tests (pure logic) > E2E tests (critical flows).

## Build & Test Runner Stack

| Project Type   | Build Tool  | Test Runner      | Notes                                     |
| -------------- | ----------- | ---------------- | ----------------------------------------- |
| Standard (new) | **Vite**    | **Vitest**       | Aligned transform pipeline, `vi.mock()`   |
| Legacy         | **Webpack** | **Jest**         | `jest.mock()`, consider migrating to Vite |
| E2E            | —           | **Cypress** or **Playwright** | Critical user flows only       |

**No meta-frameworks**: Projects use plain React SPA — no Next.js, Remix, or similar.

## React Testing Library (RTL)

### Query Priority

Always prefer queries closer to how users find elements:

| Priority | Query                  | Use When                                      |
| -------- | ---------------------- | --------------------------------------------- |
| 1        | `getByRole`            | Interactive elements (buttons, inputs, links) |
| 2        | `getByLabelText`       | Form fields with labels                       |
| 3        | `getByPlaceholderText` | Inputs with placeholder (no label)            |
| 4        | `getByText`            | Non-interactive text content                  |
| 5        | `getByDisplayValue`    | Filled form elements                          |
| 6        | `getByAltText`         | Images                                        |
| 7        | `getByTestId`          | **Last resort** — when none of the above work |

```tsx
// ✅ Correct: user-centric queries
const submitButton = screen.getByRole('button', { name: /submit/i });
const emailInput = screen.getByLabelText(/email/i);
const heading = screen.getByRole('heading', { name: /welcome/i });

// ❌ Wrong: implementation-detail queries
const button = screen.getByTestId('submit-btn');
const input = container.querySelector('input.email-field');
const heading = container.querySelector('h1');
```

### Async Queries

| Query      | Returns           | Awaits | Use When                              |
| ---------- | ----------------- | ------ | ------------------------------------- |
| `getBy*`   | Element or throws | No     | Element is in DOM immediately         |
| `queryBy*` | Element or `null` | No     | Asserting element is NOT present      |
| `findBy*`  | Promise<Element>  | Yes    | Element appears after async operation |

```tsx
// ✅ Correct: await async elements
const successMessage = await screen.findByText(/saved successfully/i);

// ✅ Correct: assert absence
expect(screen.queryByText(/error/i)).not.toBeInTheDocument();

// ❌ Wrong: getBy for async elements
const message = screen.getByText(/saved/i); // throws if not yet in DOM
```

### User Events

Always use `@testing-library/user-event` over `fireEvent`:

```tsx
import userEvent from '@testing-library/user-event';

// ✅ Correct: realistic user interactions
const user = userEvent.setup();
await user.click(submitButton);
await user.type(emailInput, 'user@example.com');
await user.selectOptions(dropdown, 'option-1');

// ❌ Wrong: synthetic events
fireEvent.click(submitButton);
fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
```

## Test Structure

### Given-When-Then with `describe`/`it`

```tsx
describe('UserCard', () => {
  describe('when user is admin', () => {
    it('should display admin badge', () => {
      // Given
      const user = createUser({ role: 'admin' });

      // When
      render(<UserCard user={user} />);

      // Then
      expect(
        screen.getByRole('img', { name: /admin badge/i }),
      ).toBeInTheDocument();
    });
  });

  describe('when clicking delete', () => {
    it('should call onDelete with user id', async () => {
      // Given
      const user = createUser({ id: '123' });
      const onDelete = vi.fn();
      render(<UserCard user={user} onDelete={onDelete} />);

      // When
      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: /delete/i }));

      // Then
      expect(onDelete).toHaveBeenCalledWith('123');
    });
  });
});
```

### Test Naming

Use descriptive names following the pattern: `should [behavior] when [condition]`

```tsx
// ✅ Correct
it('should display error message when form submission fails');
it('should disable submit button when required fields are empty');
it('should redirect to dashboard when login succeeds');

// ❌ Wrong
it('test error');
it('works correctly');
it('renders');
```

## Mocking Strategy

### What to Mock

| Mock                                                   | Don't Mock                                 |
| ------------------------------------------------------ | ------------------------------------------ |
| API calls (use MSW)                                    | React components under test                |
| Browser APIs (IntersectionObserver, etc.)              | Utility functions (test them directly)     |
| External modules (analytics, auth providers)           | Child components (test integration)        |
| Timers (`vi.useFakeTimers()` / `jest.useFakeTimers()`) | CSS/styles                                 |
| Router navigation                                      | DOM behavior                               |
| EventBus / message channels (for MFE isolation)       | Design system component rendering          |

### MSW for API Mocking

```tsx
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ]);
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Module Mocking

```tsx
// ✅ Correct: mock at module boundary (Vitest)
vi.mock('../services/analytics', () => ({
  trackEvent: vi.fn(),
}));

// ✅ Correct: mock at module boundary (Jest - legacy)
jest.mock('../services/analytics', () => ({
  trackEvent: jest.fn(),
}));

// ❌ Wrong: mock internal implementation
vi.mock('../components/UserCard', () => ({
  UserCard: () => <div>mocked</div>,
}));
```

## Hook Testing

```tsx
import { renderHook, act } from '@testing-library/react';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

## Test Data Factories

Use factory functions for test data (equivalent to the Mother pattern for backend):

```tsx
// test/factories/user.ts
function createUser(overrides: Partial<User> = {}): User {
  return {
    id: crypto.randomUUID(),
    name: 'Test User',
    email: 'test@example.com',
    role: 'member',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Usage in tests
const admin = createUser({ role: 'admin', name: 'Admin User' });
const users = Array.from({ length: 5 }, () => createUser());
```

## Coverage

### Thresholds

| Metric     | Minimum |
| ---------- | ------- |
| Statements | 80%     |
| Branches   | 80%     |
| Functions  | 80%     |
| Lines      | 80%     |

### What to Test

- **Always test**: User interactions, conditional rendering, error states, loading states, form validation
- **Skip testing**: Trivial pass-through components, CSS/styles, third-party library internals, implementation details

## Anti-patterns

- Do not test implementation details (internal state, method calls)
- Do not use `container.querySelector` — use RTL queries
- Do not use `fireEvent` when `userEvent` is available
- Do not assert on DOM structure — assert on visible content and behavior
- Do not use `waitFor` wrapping `getBy*` — use `findBy*` instead
- Do not snapshot test entire components — test specific behaviors
- Do not mock child components in integration tests
- Do not use `screen.debug()` in committed tests
- Do not hardcode test data inline when it's reused — use factories

## E2E Standards (Cypress / Playwright)

### When to Write E2E Tests

E2E tests cover **critical user flows** only. Do NOT duplicate unit/integration coverage.

| E2E-worthy                | Not E2E-worthy             |
| ------------------------- | -------------------------- |
| Login/authentication flow | Individual form validation |
| Key CRUD operations       | Component rendering        |
| Multi-step wizards        | Utility function logic     |
| Cross-MFE navigation      | State management           |

### Cypress Best Practices

```typescript
// ✅ Correct: intercept API calls
cy.intercept('GET', '/api/products', { fixture: 'products.json' }).as(
  'getProducts',
);
cy.wait('@getProducts');

// ✅ Correct: use data-testid for e2e selectors
cy.get('[data-testid="submit-button"]').click();

// ✅ Correct: assert on visible content
cy.contains('Product saved successfully').should('be.visible');

// ❌ Wrong: arbitrary waits
cy.wait(3000);

// ❌ Wrong: fragile CSS selectors
cy.get('.btn-primary.submit-form').click();
```

### Playwright Best Practices

```typescript
// ✅ Correct: use locators with accessible roles
await page.getByRole('button', { name: /submit/i }).click();

// ✅ Correct: intercept API calls
await page.route('/api/products', (route) =>
  route.fulfill({ json: [{ id: '1', name: 'Product' }] }),
);

// ✅ Correct: auto-waiting assertions
await expect(page.getByText('Product saved successfully')).toBeVisible();
```

### E2E Anti-patterns

- Do not use `cy.wait(ms)` or `page.waitForTimeout(ms)` — use API intercepts or assertions
- Do not test backend logic via the UI — test it in backend tests
- Do not create tightly coupled selectors — use `data-testid` attributes or accessible roles
- Do not share state between tests — each test should be independent
- Do not duplicate unit/integration test coverage in e2e
