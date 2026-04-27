# ARIA Roles, Properties, and States

Reference for correct ARIA usage in web applications.

## Landmark roles

Use to identify page regions (use native HTML equivalents when available):
```html
<header role="banner">     <!-- or just <header> -->
<nav role="navigation">    <!-- or just <nav> -->
<main role="main">         <!-- or just <main> -->
<footer role="contentinfo"> <!-- or just <footer> -->
<aside role="complementary"> <!-- or just <aside> -->
```

## Interactive widget roles

When building custom widgets, apply the correct role:
```html
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
</div>
<div role="tabpanel" id="panel-1">...</div>
```

## ARIA properties

```html
<!-- Label an element when visible label is not enough -->
<button aria-label="Close dialog">x</button>

<!-- Reference another element as the label -->
<section aria-labelledby="section-heading">
  <h2 id="section-heading">Order Summary</h2>
</section>

<!-- Describe additional context -->
<input aria-describedby="password-hint" type="password" />
<p id="password-hint">Must be at least 8 characters.</p>
```

## ARIA states

```html
<button aria-expanded="false" aria-controls="menu">Menu</button>
<ul id="menu" hidden>...</ul>

<input aria-required="true" aria-invalid="true" />
<span role="alert">Email is required.</span>

<li role="option" aria-selected="true">Option 1</li>
```
