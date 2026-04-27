---
name: web-accessibility-advisor
scope: [frontend, accessibility]
description: Web accessibility patterns — WCAG 2.1 AA, ARIA, keyboard navigation, screen readers
version: "1.0"
tags: [accessibility, a11y, wcag, aria, keyboard, screen-reader]
---

# Accessibility Adviser Skill

Review and guide web accessibility implementation to meet WCAG 2.1 Level AA compliance. Focus on semantic HTML, ARIA usage, keyboard navigation, and screen reader compatibility.

## Core Principle: Semantic HTML First

Use native HTML elements before reaching for ARIA. Native elements have built-in accessibility semantics, keyboard handling, and screen reader support.

The ARIA rule: **No ARIA is better than bad ARIA.** Only add ARIA when semantic HTML is insufficient.

## References

Detailed patterns and examples are available in the `references/` directory. Load these on demand when the review touches the specific topic.

- See `references/wcag-criteria.md` for WCAG 2.1 AA success criteria, the POUR principles, and color contrast requirements.
- See `references/aria-patterns.md` for ARIA landmark roles, interactive widget roles, properties, and states with examples.
- See `references/keyboard-navigation.md` for tab order rules, keyboard interactions by widget type, and focus management patterns.
- See `references/accessible-components.md` for accessible form, modal dialog, navigation menu, skip link, and live region patterns.

Before finalizing your review, check `gotchas.md` for common Claude mistakes in this domain.

## Review Checklist

- [ ] All images have descriptive `alt` text (empty `alt=""` for decorative images)
- [ ] Color contrast meets 4.5:1 for normal text, 3:1 for large text
- [ ] No information conveyed by color alone
- [ ] All interactive elements reachable and operable via keyboard
- [ ] Focus indicator is clearly visible (do not remove `outline`)
- [ ] Form inputs have associated labels (not just placeholder text)
- [ ] Error messages are programmatically associated with their inputs
- [ ] Modal dialogs trap focus and restore focus on close
- [ ] Dynamic content updates announced via `aria-live` or `role="alert"`
- [ ] Page has a logical heading hierarchy (h1 → h2 → h3)
- [ ] Skip navigation link provided
- [ ] ARIA roles match the interaction model of custom widgets

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

Focus ONLY on your specialist domain: WCAG 2.1 AA, ARIA patterns, keyboard navigation, focus management.

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
  title: "sdd/{change-name}/guidance/web-accessibility-adviser",
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
