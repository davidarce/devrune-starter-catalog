---
name: react
scope: tech
applies-to:
  - component-adviser
  - frontend-test-adviser
description: 'React and TypeScript coding standards: component patterns, hooks, props, naming, file structure.'
---

# React & TypeScript Standards

## Component Patterns

### Functional Components Only

All components must be functional components with TypeScript.

```tsx
// ✅ Correct
interface UserCardProps {
  name: string;
  role: 'admin' | 'member';
  onSelect?: (id: string) => void;
}

export function UserCard({ name, role, onSelect }: UserCardProps) {
  return (/* ... */);
}

// ❌ Wrong: class components, default exports, React.FC
export default class UserCard extends React.Component {}
const UserCard: React.FC<Props> = (props) => {};
```

### Named Exports

Prefer named exports over default exports for components, hooks, and utilities. This improves refactoring, auto-imports, and tree shaking.

```tsx
// ✅ Correct
export function UserCard() {}
export function useUserData() {}

// ❌ Wrong
export default function UserCard() {}
```

### File & Naming Conventions

| Element          | Convention                                | Example               |
| ---------------- | ----------------------------------------- | --------------------- |
| Component files  | PascalCase                                | `UserCard.tsx`        |
| Hook files       | camelCase with `use` prefix               | `useUserData.ts`      |
| Utility files    | camelCase                                 | `formatDate.ts`       |
| Test files       | `.test.tsx` / `.test.ts` suffix           | `UserCard.test.tsx`   |
| Style files      | `.module.css` / `.module.scss`            | `UserCard.module.css` |
| Constants        | UPPER_SNAKE_CASE                          | `MAX_RETRY_COUNT`     |
| Types/Interfaces | PascalCase, `Props` suffix for components | `UserCardProps`       |

### Directory Structure

```
src/
├── components/          # Shared/reusable components
│   ├── UserCard/
│   │   ├── UserCard.tsx
│   │   ├── UserCard.test.tsx
│   │   ├── UserCard.module.css
│   │   └── index.ts     # Re-export
│   └── Button/
├── hooks/               # Shared custom hooks
│   ├── useUserData.ts
│   └── useDebounce.ts
├── pages/               # Route-level components (or features/)
├── services/            # API clients and external integrations
├── stores/              # State management (Zustand / Redux slices)
├── types/               # Shared TypeScript types
└── utils/               # Pure utility functions
```

## Hooks Rules

### Custom Hook Extraction

Extract a custom hook when:

- A component has 3+ `useState` or `useEffect` calls
- Stateful logic is reused across 2+ components
- Logic is complex enough to benefit from isolated testing

```tsx
// ✅ Correct: extracted hook
function useUserSearch(query: string) {
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // fetch logic
  }, [query]);

  return { results, loading, error };
}

// ❌ Wrong: all logic inline in component
function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    /* fetch */
  }, [query]);
  useEffect(() => {
    /* debounce */
  }, [query]);
  useEffect(() => {
    /* analytics */
  }, [results]);
  // ... 200 lines of JSX
}
```

### useEffect Discipline

| Use `useEffect` For             | Do NOT Use `useEffect` For                      |
| ------------------------------- | ----------------------------------------------- |
| Subscribing to external systems | Deriving state from props                       |
| DOM measurements after render   | Responding to events (use handlers)             |
| Syncing with browser APIs       | Transforming data for rendering (use `useMemo`) |
| Connecting to WebSockets        | Fetching on mount (use React Query / SWR)       |

```tsx
// ❌ Wrong: derived state in effect
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ Correct: compute during render
const fullName = `${firstName} ${lastName}`;
// or with useMemo if expensive
const fullName = useMemo(
  () => expensiveFormat(firstName, lastName),
  [firstName, lastName],
);
```

### Dependency Arrays

- Always include all referenced variables in dependency arrays
- Use ESLint rule `react-hooks/exhaustive-deps` — never disable it
- If a dependency causes infinite loops, restructure the code rather than omitting dependencies

### React 19+ Compiler Note

React 19 introduces the **React Compiler** which auto-memoizes components and hooks, reducing the need for manual `React.memo`, `useMemo`, and `useCallback`. When using React 19+:
- Let the compiler handle memoization — remove manual `useMemo`/`useCallback` unless profiling shows a need
- Use `use()` for reading promises and context in render
- Use `useActionState` for form actions with pending state

## Props Design

### Interface Over Type

```tsx
// ✅ Correct: interface for props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

// ❌ Wrong: type alias for props
type ButtonProps = {
  /* ... */
};
```

### Props Constraints

- **Max 5 props** for leaf components — use composition or context for more
- **Destructure props** in function signature, not in body
- **Use discriminated unions** for variant props instead of many booleans
- **Never use `any`** for prop types

```tsx
// ❌ Wrong: boolean soup
interface AlertProps {
  isError?: boolean;
  isWarning?: boolean;
  isInfo?: boolean;
  isSuccess?: boolean;
}

// ✅ Correct: discriminated union
interface AlertProps {
  variant: 'error' | 'warning' | 'info' | 'success';
  message: string;
}
```

### Extending Native Elements

```tsx
// ✅ Correct: extend native button props
interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant: 'primary' | 'secondary';
  loading?: boolean;
}

export function Button({ variant, loading, children, ...rest }: ButtonProps) {
  return <button {...rest}>{loading ? <Spinner /> : children}</button>;
}
```

## State Management

### Decision Matrix

| Scenario                      | Solution                                              |
| ----------------------------- | ----------------------------------------------------- |
| Single component state        | `useState` / `useReducer`                             |
| Parent-child shared state     | Lift state up                                         |
| Server data (API cache)       | React Query / SWR / RTK Query                         |
| Simple cross-component state  | React Context + `useReducer`                          |
| Complex cross-component state | Zustand (lightweight, minimal boilerplate) or Redux Toolkit (large apps with devtools needs) |
| URL-driven state              | URL search params / router state                      |
| Form state                    | React Hook Form / Formik                              |

### Context Rules

- One Context per domain concern — never a single global "AppContext"
- Wrap Context value in `useMemo` to prevent re-renders
- Split read-heavy and write-heavy values into separate Contexts

## Performance

### Memoization Rules

Profile with React DevTools before adding `React.memo`, `useMemo`, or `useCallback`.

- `React.memo`: Use for components that receive the same props but re-render due to parent reference changes
- `useMemo`: Use for expensive computations (> 1ms) or maintaining reference identity for objects/arrays passed as props
- `useCallback`: Use for callbacks passed to memoized children

### List Rendering

- Always use stable unique `key` props — never array index for dynamic lists
- Virtualize lists with 100+ items (`@tanstack/virtual`, `react-window`)

## Icon Buttons & Tooltips (Mandatory)

**Every icon button or action represented by an icon MUST have a Tooltip** that describes the action. No exceptions — an icon without a tooltip is an incomplete component.

Use your design system's `Tooltip` component wrapping the icon button, with a descriptive label that explains the action in context.

```tsx
import { Tooltip } from '@your-org/design-system';
import { IconDuplicate, IconDelete } from '@your-org/icons';

// ✅ Correct: icon button with Tooltip describing the action
<Tooltip content={t('orders.duplicate_order')}>
  <Button variant="icon" onClick={handleDuplicate} aria-label={t('orders.duplicate_order')}>
    <IconDuplicate />
  </Button>
</Tooltip>

// ✅ Correct: icon action in a toolbar
<Tooltip content={t('common.delete')}>
  <Button variant="icon" onClick={handleDelete} aria-label={t('common.delete')}>
    <IconDelete />
  </Button>
</Tooltip>

// ❌ Wrong: icon button without tooltip
<Button variant="icon" onClick={handleDuplicate}>
  <IconDuplicate />
</Button>

// ❌ Wrong: hardcoded tooltip text (must use translations)
<Tooltip content="Duplicate order">
  <Button variant="icon" onClick={handleDuplicate}>
    <IconDuplicate />
  </Button>
</Tooltip>
```

### Tooltip Rules

| Rule                              | Requirement                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Every icon button                 | MUST have a `Tooltip`                                                             |
| Tooltip content                   | Describes the **action** (not the icon name)                                      |
| Text                              | Always use i18n translations (`t('key')`)                                         |
| Context-specific                  | Label reflects the domain context (e.g., "Duplicate order", not "Duplicate")      |
| `aria-label`                      | Must match the tooltip content for screen reader parity                           |
| Icon-only actions in tables/lists | Same rule applies — tooltip required                                              |

## Error Handling

- Use Error Boundaries for component tree crash recovery
- Use `try/catch` in async operations (data fetching, event handlers)
- Provide user-facing fallback UI — never render blank screens on error
