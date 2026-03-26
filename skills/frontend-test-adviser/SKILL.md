---
name: frontend-test-adviser
description: Frontend testing patterns — React Testing Library, Vitest/Jest, Cypress e2e
version: "1.0"
tags: [testing, react, rtl, vitest, jest, cypress, frontend]
---

# Frontend Test Adviser Skill

Guide frontend testing strategy using React Testing Library (RTL), Vitest/Jest, and Cypress. Focus on testing behavior from the user's perspective rather than implementation details.

## Core Philosophy: Test Behavior, Not Implementation

The React Testing Library guiding principle: **"The more your tests resemble the way your software is used, the more confidence they give you."**

- Do NOT test component internal state
- Do NOT test which methods are called on child components
- DO test what the user sees and can interact with
- DO query elements the way assistive technologies would

## userEvent vs fireEvent

**Always prefer `userEvent`** — it simulates real user interactions including focus, keyboard events, and pointer events.

```tsx
// Preferred — simulates real interaction
const user = userEvent.setup()
await user.click(button)
await user.type(input, 'hello')
await user.keyboard('{Enter}')
await user.selectOptions(select, 'option-value')

// Avoid — low-level synthetic event only
fireEvent.click(button)
```

`userEvent.setup()` creates an instance that maintains state across interactions (pointer position, clipboard, etc.). Create it once per test.

## References

Detailed patterns and examples are available in the `references/` directory. Load these on demand when the review touches the specific topic.

- See `references/rtl-queries.md` for RTL query priority (getByRole, getByLabelText, etc.), component test structure, async testing, and custom hook testing patterns.
- See `references/vitest-setup.md` for Vitest configuration, mocking with vi.mock()/jest.mock(), partial mocks, and error state testing patterns.
- See `references/cypress-e2e.md` for Cypress E2E test patterns with @testing-library/cypress queries.

Before finalizing your review, check `gotchas.md` for common Claude mistakes in this domain.

## Review Checklist

When reviewing frontend tests:
- [ ] Queries use role/label/text over testId
- [ ] `userEvent` used instead of `fireEvent`
- [ ] `findBy` or `waitFor` used for async assertions
- [ ] No assertions on component internal state or implementation details
- [ ] Mocks reset between tests (`beforeEach(() => vi.clearAllMocks())`)
- [ ] Error and loading states covered
- [ ] Accessibility attributes tested (role, name, disabled state)
