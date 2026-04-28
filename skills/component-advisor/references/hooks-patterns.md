# Custom Hooks Patterns

Reference for extracting and structuring custom hooks in React components.

## Custom Hooks: Logic Extraction

Extract stateful logic and side effects into custom hooks. Components should focus on rendering; hooks handle behavior.

```tsx
// Before: logic mixed with rendering
function OrderHistory({ userId }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrders(userId)
      .then(setOrders)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Spinner />
  // ...
}

// After: logic in hook, component only renders
function useOrderHistory(userId: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchOrders(userId)
      .then(setOrders)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [userId])

  return { orders, loading, error }
}

function OrderHistory({ userId }) {
  const { orders, loading, error } = useOrderHistory(userId)
  if (loading) return <Spinner />
  if (error) return <ErrorMessage error={error} />
  return <OrderList orders={orders} />
}
```

## When to Extract

- Logic is reused across multiple components
- The hook encapsulates complex behavior worth testing independently
- The component is becoming hard to read (100+ lines of logic before the return)

## When NOT to Extract

- The logic is trivial (single useState, no effects)
- The hook would have exactly one consumer
- The extraction adds indirection without improving readability
