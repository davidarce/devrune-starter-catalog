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

## Adviser Mode (SDD Orchestrator Integration)

This skill supports **adviser mode**: when invoked by the SDD orchestrator with a `GUIDANCE CONTEXT FROM PLANNER` block in the prompt, use the following procedure instead of the standard interactive review flow.

### Entry Conditions
Adviser mode is active when the prompt contains:
- A `GUIDANCE CONTEXT FROM PLANNER:` block
- A `CURRENT PLAN EXCERPT:` block

### Adviser Mode Procedure
1. Read the `GUIDANCE CONTEXT FROM PLANNER` block to understand what the planner needs reviewed.
2. Read the `CURRENT PLAN EXCERPT` to see the specific tasks and design decisions.
3. Apply your domain expertise to the plan content — do NOT read codebase files unless the plan references specific existing code that is relevant.
4. Produce structured advice in the format below.
5. Save output to engram and return summary + observation ID.

Focus ONLY on your specialist domain: RTL queries, user-event, MSW mocking, test structure.

### Output Format (Adviser Mode)
```
### Strengths
- [What looks sound in the plan from this skill's domain perspective]

### Issues Found
[Severity: Critical / Major / Minor — reference specific task IDs or section names]
- T001: [issue description]

### Recommendations
[Specific, actionable. Reference task ID or section name for each recommendation.]
- T001: [recommendation]
```

### Persistence (Adviser Mode)
Save full advice output to engram:
```
mem_save(
  title: "sdd/{change-name}/guidance/frontend-test-adviser",
  type: "architecture",
  project: "{project-name}",
  content: "{your full structured advice output}"
)
```
If engram is unavailable, skip silently.

### Return Format (Adviser Mode)
Return a concise summary (3-5 bullet points) plus the engram observation ID:
```
### Summary
- [key point 1]
- [key point 2]
- ...

### Engram ID
{observation_id or "unavailable"}
```
Do NOT return an SDD Envelope when in adviser mode.
