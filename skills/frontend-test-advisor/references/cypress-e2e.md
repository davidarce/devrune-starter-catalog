# Cypress E2E Basics

Reference for end-to-end testing with Cypress and Testing Library integration.

## Cypress E2E

```typescript
// cypress/e2e/checkout.cy.ts
describe('Checkout flow', () => {
  it('completes a purchase successfully', () => {
    cy.visit('/products')
    cy.findByRole('button', { name: /add to cart/i }).first().click()
    cy.findByRole('link', { name: /view cart/i }).click()
    cy.findByRole('button', { name: /checkout/i }).click()
    cy.findByLabelText('Email').type('buyer@example.com')
    cy.findByRole('button', { name: /place order/i }).click()
    cy.findByText('Order confirmed').should('be.visible')
  })
})
```

Use `@testing-library/cypress` for consistent RTL-style queries in Cypress.

## Key Practices

- Use `cy.findByRole`, `cy.findByLabelText`, `cy.findByText` from `@testing-library/cypress` for accessibility-friendly queries
- Avoid `cy.get('[data-testid=...]')` when a role or label query is available
- Use `cy.intercept()` to stub API responses and control test determinism
- Keep e2e tests focused on critical user flows — not every edge case
- Use `cy.visit()` at the start of each test for isolation
