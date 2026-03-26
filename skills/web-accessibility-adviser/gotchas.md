# Gotchas — web-accessibility-adviser

Common mistakes Claude makes when implementing or reviewing web accessibility. Check these before finalizing your output.

## 1. Adding ARIA roles where native HTML elements suffice

**Wrong**: `<div role="button" tabindex="0" onclick="submit()">Submit</div>` or `<div role="navigation"><ul>...</ul></div>`.
**Right**: `<button type="submit">Submit</button>` and `<nav><ul>...</ul></nav>`. Native HTML elements have built-in accessibility semantics, keyboard handling, and screen reader support.
**Why**: Claude adds ARIA roles to generic elements instead of using semantic HTML. The ARIA spec itself states: "No ARIA is better than bad ARIA." A `<div role="button">` lacks keyboard activation (Enter/Space), focus styling, and form submission behavior that `<button>` provides for free.

## 2. Misusing ARIA roles on elements that already have the correct semantics

**Wrong**: `<button role="button">Click me</button>` or `<nav role="navigation">`.
**Right**: `<button>Click me</button>` and `<nav>`. Do not add ARIA roles that duplicate the element's implicit role.
**Why**: Claude adds redundant ARIA as a "safety measure." Redundant roles are harmless in most cases but signal a misunderstanding of semantic HTML. Worse, they can confuse linters and code reviewers into thinking ARIA is always necessary.

## 3. Broken focus management in modal dialogs

**Wrong**: Opening a modal without moving focus into it, allowing tab to escape the modal to background content, or not returning focus to the trigger element on close.
**Right**: On open: move focus to the first focusable element (or the modal container with `tabindex="-1"`). Trap tab/shift+tab within the modal. On close: return focus to the element that triggered the modal. Pressing Escape should close the modal.
**Why**: Claude generates the modal markup correctly but omits the JavaScript focus management. Without focus trapping, keyboard users can tab to invisible background elements, and screen reader users lose their place entirely.

## 4. Omitting skip navigation links

**Wrong**: A page with 20+ navigation links before the main content, and no way for keyboard users to bypass them.
**Right**: Add `<a href="#main-content" class="skip-link">Skip to main content</a>` as the first focusable element on the page. The skip link can be visually hidden until focused.
**Why**: Claude builds navigation menus without considering the keyboard user who must tab through every link on every page load to reach the content. Skip links are a WCAG 2.4.1 requirement and one of the most impactful accessibility features.

## 5. Conveying information by color alone

**Wrong**: Using red text for errors and green text for success with no other visual indicator, or color-coding chart data without patterns.
**Right**: Pair color with a secondary indicator: an icon (warning triangle for errors, checkmark for success), a text label ("Error:", "Success:"), or a pattern/shape in charts. Ensure 4.5:1 contrast ratio for all text.
**Why**: Claude uses color to indicate state (red/green, highlighted/dimmed) without a secondary channel. Users with color vision deficiencies cannot distinguish the states. WCAG 1.4.1 requires information conveyed by color to also be available without color.

## 6. Using aria-live regions incorrectly for dynamic updates

**Wrong**: Adding `aria-live="assertive"` to every dynamic content area, or putting `aria-live` on an element that is rendered with its content already present (not a live update).
**Right**: Use `aria-live="polite"` for most updates (cart count, status messages). Use `aria-live="assertive"` only for urgent alerts (session expiring, form submission errors). The live region element must exist in the DOM before content is injected into it.
**Why**: Claude applies `aria-live="assertive"` as the default because it guarantees the message is announced. But assertive interrupts whatever the screen reader is currently speaking, which is disorienting for users. Most updates should be polite.
