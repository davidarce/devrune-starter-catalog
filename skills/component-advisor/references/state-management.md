# State Management

Reference for state management strategies in React applications.

## Local state first

Use `useState` for UI state that belongs to one component: open/closed, selected tab, form values.

## Lift state up

When two sibling components need the same state, lift it to their common ancestor.

## Context for cross-cutting concerns

Use `createContext` + `useContext` for: auth user, theme, locale, notification system.

```tsx
const ThemeContext = createContext<Theme>('light')

function useTheme() {
  return useContext(ThemeContext)
}
```

Keep context values stable — memoize the context value to prevent unnecessary re-renders:
```tsx
const value = useMemo(() => ({ theme, setTheme }), [theme])
<ThemeContext.Provider value={value}>
```

## External state management (when to add)

Add Redux/Zustand/Jotai only when:
- State is needed in many disconnected parts of the tree
- State has complex update logic
- State needs to persist across page navigations

## Decision Guide

| Scenario | Strategy |
|----------|----------|
| Toggle, form input, selected tab | `useState` in the component |
| Siblings sharing state | Lift to common parent |
| Theme, auth, locale | Context |
| Complex cross-tree state with many updaters | External state library |
