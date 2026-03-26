# Performance Patterns

Reference for React performance optimization techniques.

## React.memo — prevent unnecessary re-renders

Wrap components that receive stable props but render expensively:

```tsx
const ProductCard = React.memo(function ProductCard({ product }: Props) {
  return <div>...</div>
})
```

Only memoize when profiling shows a real performance problem — it adds complexity.

## useMemo — memoize expensive computations

```tsx
const sortedOrders = useMemo(
  () => orders.slice().sort((a, b) => b.date.getTime() - a.date.getTime()),
  [orders]
)
```

Do NOT use useMemo for simple computations or inline objects — the overhead outweighs the benefit.

## useCallback — stabilize function references

Use when passing callbacks to memoized children or as effect dependencies:

```tsx
const handleSubmit = useCallback((values: FormValues) => {
  dispatch(submitOrder(values))
}, [dispatch])
```

## Avoid inline objects/functions in JSX

```tsx
// Causes re-render every time (new object reference)
<Component style={{ margin: 8 }} />

// Prefer: define outside or memoize
const styles = { margin: 8 }
<Component style={styles} />
```

## When to Optimize

1. **Profile first** — use React DevTools Profiler to identify slow renders
2. **Memoize only hot paths** — components that re-render frequently with stable props
3. **Measure after** — verify the optimization actually improved performance
4. **Don't optimize prematurely** — most components render fast enough without memoization
