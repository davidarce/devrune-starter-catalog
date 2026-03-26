---
name: web-accessibility-adviser
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
