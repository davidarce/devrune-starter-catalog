---
name: microfrontends
scope: tech
applies-to:
  - microfrontend-adviser
  - component-adviser
description: 'Microfrontend architecture: host/shell mediator pattern, EventBus communication, no MFE versioning, zero breaking changes.'
---

# Microfrontend Architecture Standards

## Critical Constraint: No MFE Versioning

The host application does **NOT** support microfrontend versioning. All MFEs are loaded at their latest deployed version. This means:

- **Zero breaking changes** in any contract (events, initialProps, shared store, dependencies)
- Any change to an event payload, initialProp shape, or shared store structure **MUST be backward-compatible**
- Additive changes only — new optional fields are safe; removing or renaming fields is a breaking change
- Coordinate with the host/shell team before modifying any `mfe::*` event payload

### Backward Compatibility Rules

| Change Type                         | Allowed?                 | Example                              |
| ----------------------------------- | ------------------------ | ------------------------------------ |
| Add optional field to event payload | ✅ Yes                   | `{ ...existing, newField?: string }` |
| Add optional field to initialProps  | ✅ Yes                   | New optional prop from shell         |
| Remove field from event payload     | ❌ No                    | Consumers will break                 |
| Rename event name                   | ❌ No                    | Listeners will miss it               |
| Change field type                   | ❌ No                    | `string` → `number` breaks consumers |
| Make optional field required        | ❌ No                    | Existing emitters don't send it      |
| Add new event                       | ✅ Yes                   | New listeners can subscribe          |
| Deprecate event                     | ⚠️ With dual-emit period | Emit both old and new temporarily    |

## Host Application Architecture

### Shell as Mediator

The host application (shell) acts as a **mediator** between microfrontends. MFEs never communicate directly with each other — all communication passes through the shell via an EventBus.

```
┌─────────┐   EventBus    ┌──────────────┐   EventBus    ┌─────────┐
│  MFE-A  │ ──emit()───→  │  Shell       │ ──emit()───→  │  MFE-B  │
│         │ ←─listen()──  │  (Mediator)  │ ←─listen()──  │         │
└─────────┘               └──────────────┘               └─────────┘
```

**Key consequences:**

- MFEs do NOT know about each other's existence
- The shell owns all routing, modal management, and store coordination
- MFEs emit events; the shell decides what to do with them

### Route Manifest Configuration

Each MFE is registered in the shell via a route manifest (e.g., a JSON config or BFF service). The configuration is a tree of nodes:

```
Product (level 1)
├── Purpose (level 2)
│   ├── Feature (level 3) — content: { remote, microfrontend, urls }
│   └── Feature (level 3) — content: { remote, microfrontend, urls }
└── Purpose (level 2)
    └── Feature (level 3)
```

Each node has a `key` that forms the URL path: `shell-hostname/{context}/{product-key}/{purpose-key}/{feature-key}`

#### Node Modes

| Mode               | Behavior                                 |
| ------------------ | ---------------------------------------- |
| `layout` (default) | Renders in the shell's main content area |
| `fullscreen`       | Renders as fullscreen                    |
| `background`       | Runs in background, not visible          |
| `blocker`          | Shows as a blocking modal                |
| `detail`           | Renders in the detail layout             |

### InitialProps

The shell provides `initialProps` when mounting each MFE. These are **read-only, set once at mount time** — they are NOT updated on navigation.

| Prop              | Type                           | Description                                               |
| ----------------- | ------------------------------ | --------------------------------------------------------- |
| `routerBasename`  | `string`                       | Base path for BrowserRouter in the MFE                    |
| `selectedFeature` | `string`                       | Key of the selected feature at mount time                 |
| `store`           | `ShellStore`                   | Shell's shared store snapshot (global + remote partition) |
| `dependencies`    | `Record<string, DependencyBO>` | MFE dependencies for sidebar/modal (with `show()` method) |

## Communication via EventBus

All MFE-to-shell communication uses an EventBus (e.g., a `useEventBus` hook or the browser `CustomEvent` API). Events follow the naming pattern `mfe::{action}`.

### Navigation Events

| Event                      | Direction   | Description                                |
| -------------------------- | ----------- | ------------------------------------------ |
| `mfe::navigate-to-url`    | MFE → Shell | Navigate from one MFE to another           |
| `mfe::location-changed`   | Shell → MFE | Notify MFE that a location change occurred |

**Navigation rules:**

- MFEs MUST use `mfe::navigate-to-url` to navigate — never manipulate `window.location` or the browser router directly
- The shell owns all routing; MFEs only declare intent via events

### Store Events (Shared State)

The shell maintains an **in-memory store** with two partitions:

- **`global`**: Common to all products (filters, campaigns, brands, etc.)
- **`{remoteName}`**: Scoped to a specific remote's purposes

| Event                            | Direction   | Description                                   |
| -------------------------------- | ----------- | --------------------------------------------- |
| `mfe::save-shared-value`        | MFE → Shell | Save value in the remote's partition          |
| `mfe::save-global-value`        | MFE → Shell | Save value in the global partition            |
| `mfe::saved-shared-value`       | Shell → MFE | Confirmation: value saved successfully        |
| `mfe::invalid-shared-value`     | Shell → MFE | Error: save failed (validation, etc.)         |
| `mfe::updated-storage`          | Shell → MFE | Store updated — MFE should refresh local copy |

**Store rules:**

- Store is **in-memory only** — cleared on page refresh
- MFEs receive the store snapshot via `initialProps.store` at mount time
- To update the store, emit `mfe::save-shared-value` — never mutate the store object directly
- Listen to `mfe::updated-storage` to keep your local copy in sync

```typescript
// ✅ Correct: save via event
const { emit } = useEventBus();
emit('mfe::save-shared-value', { key: 'filters', value: newFilters });

// ❌ Wrong: mutate store directly
initialProps.store.remoteName.filters = newFilters;
```

### Modal / Sidebar Events

| Event                        | Direction   | Description                                                   |
| ---------------------------- | ----------- | ------------------------------------------------------------- |
| `mfe::open-modal`           | MFE → Shell | Open an MFE in sidebar, modal, fullscreen, or sidebarFloating |
| `mfe::close-modal`          | MFE → Shell | Close a modal/sidebar                                         |
| `mfe::modal-closed`         | Shell → MFE | Notify: modal was closed                                      |
| `mfe::confirm-properties`   | MFE → Shell | Confirm from a dependency MFE in Modal/Sidebar                |

**Modal rules:**

- Open modals/sidebars via the `dependency.show(emit, parameters)` method provided in `initialProps.dependencies`
- Dependencies must be declared in the route manifest — you cannot load arbitrary MFEs at runtime
- No nesting: do NOT open a sidebar/modal from within another sidebar/modal

```typescript
// ✅ Correct: open dependency via show() method
const { emit } = useEventBus();
const dependency = initialProps.dependencies['my-sidebar-mfe'];
dependency.show(emit, {
  kind: 'sidebar',
  modal: {
    sidebarProperties: {
      /* sidebar content props */
    },
  },
  initialProps: { articleId: '12345' },
});

// ❌ Wrong: emit open-modal directly without show()
emit('mfe::open-modal', {
  /* manual payload */
});
```

### Grid Layout Events

| Event                 | Direction   | Description                          |
| --------------------- | ----------- | ------------------------------------ |
| `mfe::slot-change`   | MFE → Shell | Change the MFE loaded in a grid slot |

### Detail Layout Events

| Event                                  | Direction   | Description                     |
| -------------------------------------- | ----------- | ------------------------------- |
| `mfe::update-detail-layout-context`   | MFE → Shell | Send context to a Detail Layout |

### Other Events

| Event                                | Direction   | Description                          |
| ------------------------------------ | ----------- | ------------------------------------ |
| `mfe::disable-chat`                 | MFE → Shell | Disable chat button until navigation |
| `mfe::enable-chat`                  | MFE → Shell | Re-enable chat button                |
| `mfe::enable-confirm-close-popup`   | MFE → Shell | Enable confirmation dialog on close  |
| `mfe::ws-push-notification`         | Shell → MFE | Broadcast WebSocket notification     |

## Module Boundary Rules

### Decomposition Principles

1. **Domain-Driven Boundaries**: Align MFEs with business domains (bounded contexts), not UI sections
2. **Team Ownership**: Each MFE is owned by exactly one team
3. **Independent Deployability**: Every MFE can be deployed without coordinating with other teams
4. **Data Ownership**: Each MFE owns its BFF integration — no shared backend clients across MFEs

### Minimum MFE Size

An MFE should represent at least one purpose or feature in the route manifest. Do not create MFEs for:

- Individual components (header, footer, sidebar)
- Shared utilities or design system tokens
- Cross-cutting concerns (auth, analytics) — these belong in the shell

### Module Federation

MFEs expose page-level entry points, not individual components. Module Federation 2.0 supports TypeScript type sharing and manifest-based discovery for improved DX.

```js
// ✅ Correct: expose purpose/feature-level entry points
exposes: {
  './Dashboard': './src/pages/Dashboard.tsx',
  './DetailArticle': './src/pages/DetailArticle.tsx',
}

// ❌ Wrong: expose individual components
exposes: {
  './Button': './src/components/Button.tsx',
  './FilterPanel': './src/components/FilterPanel.tsx',
}
```

### Shared Dependencies

#### Mandatory Singletons

| Package                   | Reason                                                   |
| ------------------------- | -------------------------------------------------------- |
| `react`                   | Cannot have multiple React instances                     |
| `react-dom`               | Must match React version                                 |
| `@your-org/design-system` | Shared design system (eventBus, components, theme)       |

#### DO NOT Share

| Package                       | Reason                                         |
| ----------------------------- | ---------------------------------------------- |
| `lodash`, `date-fns`, `ramda` | Too small to benefit; tree-shake independently |
| `axios`, `ky`                 | MFE-internal implementation detail             |
| Dev dependencies              | Never share dev tooling                        |

### Forbidden Communication

- ❌ Direct imports from another MFE's source code
- ❌ Mutating `initialProps.store` directly — always use store events
- ❌ Using `window.location` or browser router for cross-MFE navigation — use `mfe::navigate-to-url`
- ❌ Nesting sidebars/modals — the shell does not support it
- ❌ Emitting `mfe::open-modal` directly — use `dependency.show(emit, params)`
- ❌ Breaking any event payload contract — no MFE versioning means zero tolerance for breaking changes

## Build & Deploy

### Independent CI/CD

Each MFE MUST have:

- Its own build pipeline (can share pipeline templates)
- Own deployment trigger (not coupled to other MFEs)
- Rollback capability without affecting other MFEs
- CORS configured for all shell hostnames that load the MFE
- CDN or asset hosting with proper cache-busting (content hashes in filenames)

### Performance Budgets

| Metric                             | Budget           |
| ---------------------------------- | ---------------- |
| Initial JS per MFE                 | ≤ 250 KB gzipped |
| Shared runtime (shell + framework) | ≤ 100 KB gzipped |
| Time to Interactive                | ≤ 3s on fast 3G  |
| Largest Contentful Paint           | ≤ 2.5s           |

### Error Isolation

- Each MFE must be wrapped in an Error Boundary at the integration point
- Shell renders fallback UI when a remote MFE fails to load
- MFE loading failures MUST NOT crash the shell or other MFEs

## Review Checklist

When reviewing MFE architecture, verify:

| Aspect              | Check                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| No breaking changes | Event payloads, initialProps, store shape all backward-compatible     |
| Boundaries          | MFEs align with purposes/features, not UI components                  |
| Coupling            | No direct source imports between MFEs                                 |
| Communication       | All via EventBus through shell mediator, no direct MFE-to-MFE         |
| Store usage         | Save via events, listen to `updated-storage`, never mutate directly   |
| Navigation          | Via `mfe::navigate-to-url`, never direct location manipulation        |
| Dependencies        | Sidebar/modal via `dependency.show()`, registered in route manifest   |
| Performance         | Bundle budgets enforced, lazy loading configured                      |
| Error handling      | Error boundaries at integration points, fallback UI                   |
| Deployment          | Independent pipelines, CORS configured, cache-busting enabled         |
| Auth                | Using standard OAuth2/OIDC provider                                   |
