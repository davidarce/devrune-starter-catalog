# WCAG 2.1 AA Requirements and Color Contrast

Reference for WCAG success criteria and color contrast requirements.

## WCAG 2.1 AA Requirements

The four principles (POUR):
- **Perceivable** — information must be presentable to users in ways they can perceive
- **Operable** — interface components must be navigable and operable
- **Understandable** — information and operation must be understandable
- **Robust** — content must be interpretable by assistive technologies

Key AA success criteria to check:
- 1.1.1 — Non-text content has text alternatives
- 1.3.1 — Info and relationships are programmatically determinable
- 1.4.3 — Color contrast: 4.5:1 for normal text, 3:1 for large text (18pt / 14pt bold)
- 1.4.4 — Text can be resized to 200% without loss of content
- 2.1.1 — All functionality available via keyboard
- 2.4.3 — Focus order is logical
- 2.4.7 — Keyboard focus is visually visible
- 3.2.2 — No unexpected context changes on input
- 4.1.2 — Name, role, value for all UI components

## Color Contrast

Check contrast ratios using the WCAG formula:
- **Normal text** (< 18pt / 14pt bold): minimum **4.5:1**
- **Large text** (>= 18pt / >= 14pt bold): minimum **3:1**
- **UI components and graphics**: minimum **3:1** against adjacent color

When reviewing color usage:
- Never convey information by color alone — add a text label, icon, or pattern
- Check both light and dark theme variants
- Use tools: axe, Lighthouse, browser color contrast checkers
