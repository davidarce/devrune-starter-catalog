---
name: component-adviser
description: React component design patterns — composition, hooks, state management, performance
version: "1.0"
tags: [react, components, hooks, design-patterns, performance]
---

# Component Adviser Skill

Guide React component design toward maintainable, composable, and performant patterns. Apply composition principles, proper hooks usage, and clear prop contracts to produce components that are easy to test and extend.

## Core Principle: Composition Over Inheritance

React components compose by nesting. Prefer small, focused components that assemble into larger structures over monolithic components with many responsibilities. Use `children` and render props for extensibility rather than adding flags and conditional branches.

## Props Design

### Keep props minimal and explicit
```tsx
// Avoid: pass-through object anti-pattern
function Button({ config }) { ... }

// Prefer: explicit props
function Button({ label, onClick, disabled, variant = 'primary' }) { ... }
```

### Avoid prop drilling — use composition or context
Pass data where it is actually needed rather than threading it through intermediate components. Use Context for truly global state (theme, auth, locale).

### Distinguish required vs optional props with good defaults
```tsx
interface CardProps {
  title: string          // required
  description?: string   // optional
  variant?: 'outlined' | 'filled'  // optional with default
}

function Card({ title, description, variant = 'outlined' }: CardProps) { ... }
```

## File Structure Conventions

Co-locate component files:

```
components/
  ProductCard/
    index.tsx          <- main export
    ProductCard.tsx    <- component
    ProductCard.test.tsx
    ProductCard.module.css  (if using CSS modules)
    useProductCard.ts  <- extracted hook (if needed)
```

For simple components, a single file is fine:
```
components/
  Button.tsx
  Button.test.tsx
```

## References

Detailed patterns and examples are available in the `references/` directory. Load these on demand when the review touches the specific topic.

- See `references/hooks-patterns.md` for custom hooks extraction patterns, logic-vs-rendering separation, and hook testing guidance.
- See `references/state-management.md` for local state, lifting state up, Context usage, memoizing context values, and when to add external state management.
- See `references/performance.md` for React.memo, useMemo, useCallback patterns and guidance on when memoization is justified.

Before finalizing your review, check `gotchas.md` for common Claude mistakes in this domain.

## Review Checklist

When reviewing React components:
- [ ] Component has a single clear responsibility
- [ ] Logic extracted into custom hooks where appropriate
- [ ] Props are explicit, minimal, and typed with TypeScript
- [ ] No prop drilling more than 2 levels deep
- [ ] `React.memo`, `useMemo`, `useCallback` used only where profiling justifies it
- [ ] Context values are memoized to prevent unnecessary re-renders
- [ ] Components are composable — children/render props used for extensibility
- [ ] No business logic in components (use hooks or services)
