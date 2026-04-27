# Gotchas — component-adviser

Common mistakes Claude makes when writing or reviewing React components. Check these before finalizing your output.

## 1. Premature memoization with React.memo, useMemo, and useCallback

**Wrong**: Wrapping every component in `React.memo` and every function in `useCallback` "for performance" without evidence of a rendering problem.
**Right**: Write components without memoization first. Add `React.memo`, `useMemo`, or `useCallback` only when React DevTools profiling shows unnecessary re-renders causing measurable lag.
**Why**: Claude applies memoization defensively on every component. Memoization has a cost — it adds memory overhead, increases code complexity, and makes debugging harder. For most components, the re-render is faster than the memo comparison.

## 2. Over-abstracting hooks for single-use logic

**Wrong**: Extracting a custom hook `useProductCardState()` that is used by exactly one component and contains trivial logic (a single useState + useEffect).
**Right**: Keep simple state logic inline in the component. Extract to a custom hook only when: (a) the logic is reused across multiple components, (b) the hook encapsulates complex behavior worth testing independently, or (c) the component is becoming hard to read.
**Why**: Claude extracts hooks aggressively to follow the "separate logic from rendering" pattern. A hook with one consumer adds indirection without reuse benefit — the reader now has to jump between two files to understand one component.

## 3. Building god components with too many responsibilities

**Wrong**: A single `Dashboard` component that fetches data, manages filters, handles sorting, renders charts, tables, and modals — all in 300+ lines.
**Right**: Decompose into focused components: `DashboardFilters`, `DashboardChart`, `OrdersTable`, `OrderDetailModal`. Each component owns one concern. The parent orchestrates composition.
**Why**: Claude generates working code in a single component because it is the fastest path to a complete answer. But monolithic components are untestable, unreviewable, and impossible to reuse.

## 4. Prop drilling beyond 2 levels deep

**Wrong**: Passing `userId`, `theme`, or `onLogout` through 3+ intermediate components that do not use these props themselves.
**Right**: Use component composition (pass the consuming component as children), or use Context for truly cross-cutting concerns. Two levels of prop passing is the maximum before restructuring.
**Why**: Claude threads props through intermediary components because it is explicit and avoids context setup. But deep prop drilling couples intermediate components to data they do not care about, making refactoring painful.

## 5. Using Context for local state that belongs in a parent component

**Wrong**: Creating a `FilterContext` to share filter state between `FilterBar` and `ProductList` that are siblings rendered by the same parent.
**Right**: Lift state to the common parent and pass it down as props. Context is for cross-cutting concerns (theme, auth, locale) that are needed by many disconnected components across the tree.
**Why**: Claude reaches for Context as a general-purpose state sharing mechanism. But Context triggers re-renders for all consumers on any value change. For colocated siblings, prop passing from a shared parent is simpler and more performant.

## 6. Forgetting to memoize Context provider values

**Wrong**: `<ThemeContext.Provider value={{ theme, setTheme }}>` — creates a new object on every render, causing all consumers to re-render.
**Right**: `const value = useMemo(() => ({ theme, setTheme }), [theme])` then `<ThemeContext.Provider value={value}>`.
**Why**: Claude creates Context providers with inline object literals. Since objects are compared by reference, every parent re-render creates a new reference, forcing every consumer to re-render — even when the actual theme value has not changed.
