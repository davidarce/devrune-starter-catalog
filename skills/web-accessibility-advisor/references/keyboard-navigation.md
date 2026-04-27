# Keyboard Navigation

Reference for keyboard interaction patterns and focus management.

## Tab order

- Ensure logical tab order matches visual layout
- Do not use `tabindex > 0` — it breaks natural flow
- Use `tabindex="0"` only to make non-interactive elements focusable when truly needed
- Use `tabindex="-1"` to allow programmatic focus without tab stop

## Keyboard interactions by pattern

| Widget       | Keys                                                    |
|--------------|---------------------------------------------------------|
| Button       | Enter / Space to activate                               |
| Link         | Enter to follow                                         |
| Checkbox     | Space to toggle                                         |
| Radio group  | Arrow keys to navigate between options                  |
| Dropdown/Select | Arrow keys, Enter to select, Escape to close        |
| Modal dialog | Tab/Shift+Tab within dialog, Escape to close            |
| Tabs         | Arrow keys between tabs, Enter/Space to activate        |
| Tree view    | Arrow keys to navigate, Enter to expand/collapse        |

## Focus management

Move focus programmatically when content changes significantly:
```typescript
// After opening a modal, move focus to the first focusable element
dialogRef.current?.querySelector<HTMLElement>('[autofocus], button, [href], input')?.focus()

// After closing a modal, return focus to the trigger
triggerRef.current?.focus()
```
