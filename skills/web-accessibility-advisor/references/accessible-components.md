# Common Accessible Patterns

Reference for accessible component implementations.

## Accessible Form

```html
<form>
  <div>
    <label for="email">Email address <span aria-hidden="true">*</span></label>
    <input id="email" type="email" aria-required="true" aria-describedby="email-error" />
    <span id="email-error" role="alert" aria-live="polite"></span>
  </div>
</form>
```

## Accessible Modal Dialog

```html
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Order</h2>
  <p>Are you sure you want to place this order?</p>
  <button>Confirm</button>
  <button aria-label="Close dialog">Cancel</button>
</div>
```
Trap focus within the modal while open. Return focus to trigger on close.

## Accessible Navigation Menu

```html
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/" aria-current="page">Home</a></li>
    <li><a href="/products">Products</a></li>
  </ul>
</nav>
```

## Skip Links

Provide a skip navigation link as the first focusable element on the page:
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<!-- ... navigation ... -->
<main id="main-content">
```

## Live Regions for Dynamic Updates

```html
<!-- Polite: announces after current speech completes -->
<div aria-live="polite" aria-atomic="true">
  Item added to cart (3 items total)
</div>

<!-- Assertive: interrupts immediately (use sparingly) -->
<div role="alert">
  Error: payment failed. Please try again.
</div>
```
