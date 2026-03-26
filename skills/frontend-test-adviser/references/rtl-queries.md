# RTL Query Priority and Component Test Structure

Reference for React Testing Library query selection and component test patterns.

## Query Priority (Most to Least Preferred)

Always prefer queries that reflect the user's experience:

1. **getByRole** — matches ARIA roles (button, textbox, heading, checkbox...)
   ```tsx
   screen.getByRole('button', { name: /submit/i })
   screen.getByRole('textbox', { name: /email/i })
   screen.getByRole('heading', { level: 1 })
   ```

2. **getByLabelText** — finds form elements by their label
   ```tsx
   screen.getByLabelText('Email address')
   ```

3. **getByText** — finds by text content
   ```tsx
   screen.getByText('Order confirmed')
   ```

4. **getByPlaceholderText** — last resort for inputs without labels
5. **getByTestId** — only when no accessible query is possible (use sparingly)

## Component Test Structure

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckoutForm } from './CheckoutForm'

describe('CheckoutForm', () => {
  it('submits the form with correct values when filled', async () => {
    // Arrange
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<CheckoutForm onSubmit={onSubmit} />)

    // Act
    await user.type(screen.getByLabelText('Email'), 'buyer@example.com')
    await user.click(screen.getByRole('button', { name: /place order/i }))

    // Assert
    expect(onSubmit).toHaveBeenCalledWith({ email: 'buyer@example.com' })
  })
})
```

## Async Testing

### waitFor — wait for a condition to become true
```tsx
await waitFor(() => {
  expect(screen.getByText('Order placed successfully')).toBeInTheDocument()
})
```

### findBy queries — automatically wait for element to appear
```tsx
const successMessage = await screen.findByText('Payment confirmed')
```

### Testing loading states
```tsx
render(<OrderList />)

// Check loading indicator appears
expect(screen.getByRole('progressbar')).toBeInTheDocument()

// Wait for data to load
expect(await screen.findByText('Order #1234')).toBeInTheDocument()

// Loading indicator gone
expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
```

## Testing Custom Hooks

Use `renderHook` from RTL:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

it('increments the counter', () => {
  const { result } = renderHook(() => useCounter())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

## Testing Error States

```tsx
it('shows error message when submission fails', async () => {
  vi.mocked(submitOrder).mockRejectedValue(new Error('Network error'))

  const user = userEvent.setup()
  render(<CheckoutForm />)

  await user.click(screen.getByRole('button', { name: /submit/i }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Network error')
})
```
