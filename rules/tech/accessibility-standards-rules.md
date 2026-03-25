---
name: a11y
scope: tech
applies-to:
  - a11y-adviser
  - component-adviser
  - frontend-test-adviser
description: 'Web accessibility standards: WCAG 2.2 AA, ARIA patterns, keyboard navigation, semantic HTML.'
paths:
  - "**/*.{tsx,jsx}"
---

# Accessibility Standards

## WCAG 2.2 Level AA Requirements

### Perceivable

| Criterion                    | Requirement                                                             | Check                                 |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------- |
| 1.1.1 Non-text Content       | Images have `alt` text; decorative images use `alt=""` or `aria-hidden` | All `<img>`, `<svg>`, icon components |
| 1.3.1 Info and Relationships | Use semantic HTML; form labels linked to inputs                         | Structure, headings, lists, tables    |
| 1.3.2 Meaningful Sequence    | DOM order matches visual order                                          | Tab order, reading order              |
| 1.4.1 Use of Color           | Color is not the sole means of conveying info                           | Error states, status indicators       |
| 1.4.3 Contrast (Minimum)     | Text: 4.5:1; Large text: 3:1                                            | All text against backgrounds          |
| 1.4.4 Resize Text            | Functional at 200% zoom                                                 | Layout, overflow, truncation          |
| 1.4.11 Non-text Contrast     | UI components and graphics: 3:1                                         | Borders, icons, focus rings           |

### Operable

| Criterion                 | Requirement                                        | Check                                |
| ------------------------- | -------------------------------------------------- | ------------------------------------ |
| 2.1.1 Keyboard            | All functionality via keyboard                     | Interactive elements, custom widgets |
| 2.1.2 No Keyboard Trap    | Can always navigate away                           | Modals, dropdowns, focus traps       |
| 2.4.1 Bypass Blocks       | Skip navigation mechanism                          | Skip link to main content            |
| 2.4.3 Focus Order         | Logical and predictable                            | Tab sequence, modal focus            |
| 2.4.6 Headings and Labels | Descriptive headings                               | Heading hierarchy, label text        |
| 2.4.7 Focus Visible       | Visible focus indicator                            | `:focus-visible` styles              |
| 2.5.7 Dragging Movements  | No drag required; provide click/tap alternative    | Drag-and-drop, sliders, reorder      |
| 2.5.8 Target Size         | Interactive targets ≥ 24×24 CSS px (or have spacing) | Buttons, links, form controls        |

### Understandable

| Criterion                    | Requirement                         | Check                      |
| ---------------------------- | ----------------------------------- | -------------------------- |
| 3.1.1 Language of Page       | `lang` attribute on `<html>`        | Document language          |
| 3.2.1 On Focus               | No context change on focus          | Auto-submit, auto-navigate |
| 3.3.1 Error Identification   | Errors identified and described     | Form validation messages   |
| 3.3.2 Labels or Instructions | Labels for user input               | All form fields            |
| 3.3.7 Accessible Auth        | No cognitive function test for auth | CAPTCHA alternatives, passkeys |

### Robust

| Criterion               | Requirement                                     | Check                         |
| ----------------------- | ----------------------------------------------- | ----------------------------- |
| 4.1.2 Name, Role, Value | All UI components have accessible name and role | Custom components, ARIA       |
| 4.1.3 Status Messages   | Status conveyed without focus                   | Toasts, loading, live updates |

## Semantic HTML Rules

Always prefer semantic HTML over ARIA:

```tsx
// ✅ Correct: semantic HTML
<button onClick={handleClick}>Save</button>
<nav aria-label="Main">...</nav>
<main>...</main>
<h1>Page Title</h1>

// ❌ Wrong: div with ARIA
<div role="button" tabIndex={0} onClick={handleClick}>Save</div>
<div role="navigation">...</div>
<div role="main">...</div>
<div role="heading" aria-level={1}>Page Title</div>
```

## ARIA Usage Rules

### When to Use ARIA

Use ARIA **only** when:

1. No native HTML element provides the semantics (e.g., `role="tablist"`)
2. Enhancing native elements with state (e.g., `aria-expanded` on a button)
3. Creating relationships not expressible in HTML (e.g., `aria-describedby`)
4. Providing accessible names for icon-only buttons (`aria-label`)

### Required ARIA by Component

| Component          | Minimum ARIA                                                            |
| ------------------ | ----------------------------------------------------------------------- |
| Icon button        | `aria-label="descriptive text"` + **`Tooltip`** (mandatory)            |
| Toggle button      | `aria-pressed="true/false"`                                             |
| Expandable section | `aria-expanded`, `aria-controls`                                        |
| Modal              | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`                 |
| Tab interface      | `role="tablist/tab/tabpanel"`, `aria-selected`, `aria-controls`         |
| Combobox           | `role="combobox"`, `aria-expanded`, `aria-activedescendant`             |
| Alert              | `role="alert"` for critical, `aria-live="polite"` for non-critical      |
| Progress           | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |

## Keyboard Navigation Rules

### Tab Order

- Use `tabIndex={0}` to add custom elements to tab order (rare — prefer semantic HTML)
- Use `tabIndex={-1}` for programmatic focus (focus management)
- **Never use positive `tabIndex`** values — they break natural order

### Required Keyboard Interactions

| Component   | Keys                                                      |
| ----------- | --------------------------------------------------------- |
| Button      | Enter or Space activates                                  |
| Link        | Enter activates                                           |
| Checkbox    | Space toggles                                             |
| Radio group | Arrow keys move between options                           |
| Tabs        | Arrow keys switch tabs, Tab moves to panel                |
| Menu        | Arrow keys navigate, Enter selects, Escape closes         |
| Modal       | Escape closes, Tab cycles within (focus trap)             |
| Combobox    | Arrow keys navigate options, Enter selects, Escape closes |

## Focus Management

### Focus Trap for Modals

When a modal opens:

1. Move focus to the first focusable element (or the dialog itself)
2. Trap Tab cycle within the modal
3. On Escape, close modal and return focus to the trigger element

### Route Changes (SPA)

On route change:

1. Move focus to the main content area or page heading
2. Announce the new page title via `document.title` or a live region

## Forms

### Required Fields

```tsx
// ✅ Correct: accessible required field
<label htmlFor="name">
  Name <span aria-hidden="true">*</span>
</label>
<input id="name" required aria-required="true" />
```

### Error Messages

```tsx
// ✅ Correct: error linked to input
<input
  id="email"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : 'email-hint'}
/>;
{
  error && (
    <p id="email-error" role="alert">
      {error}
    </p>
  );
}
{
  !error && <p id="email-hint">We'll never share your email</p>;
}
```

## Images

| Image Type               | Approach                                                       |
| ------------------------ | -------------------------------------------------------------- |
| Informative              | `alt="description of image content"`                           |
| Decorative               | `alt=""` and optionally `aria-hidden="true"`                   |
| Complex (chart, diagram) | Short `alt` + longer description in text or `aria-describedby` |
| Icon in button           | `aria-label` on button, `aria-hidden="true"` on icon           |
| SVG                      | `role="img"` + `aria-label`, or `<title>` element inside SVG   |

## Testing Requirements

Every component test should include an automated accessibility check:

```tsx
// Vitest + vitest-axe
import { axe, toHaveNoViolations } from 'vitest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  expect(await axe(container)).toHaveNoViolations();
});

// Jest + jest-axe (legacy)
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  expect(await axe(container)).toHaveNoViolations();
});
```

### Manual Testing Checklist

- [ ] Tab through all interactive elements — logical order, no traps
- [ ] Activate every control via keyboard (Enter, Space, Escape, Arrows)
- [ ] Verify visible focus indicator on every focusable element
- [ ] Zoom to 200% — no information loss, no horizontal scroll
- [ ] Test with screen reader (VoiceOver/NVDA) — all content announced
- [ ] Check color contrast with browser DevTools or axe
