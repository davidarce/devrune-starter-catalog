---
name: api-first-adviser
description: API-first design patterns — OpenAPI, REST conventions, error models, versioning
version: "1.0"
tags: [api, openapi, rest, http, versioning, error-handling]
---

# API-First Adviser Skill

Guide API design using an API-first approach: define the contract in OpenAPI before writing implementation code. Apply consistent REST conventions, proper HTTP semantics, RFC 7807 error models, and versioning strategies.

## API-First Principle

Design the API contract **before** implementation. The OpenAPI specification is the source of truth; code is generated from or validated against it. This enables frontend and backend teams to work in parallel, contract tests before implementation, and breaking changes visible in spec diffs.

## REST Resource Conventions

### Nouns, not verbs
```
# Avoid: verb-based paths
POST /createOrder
GET  /getOrderById?id=123

# Prefer: noun-based with HTTP method as the verb
POST   /orders
GET    /orders/{orderId}
DELETE /orders/{orderId}
POST   /orders/{orderId}/cancellations   <- sub-resource for actions
```

### Plural resource names
```
/orders        <- collection
/orders/{id}   <- item
/products
/customers
```

### Nested resources for clear ownership
```
/customers/{customerId}/orders
/orders/{orderId}/items
/orders/{orderId}/items/{itemId}
```

Keep nesting to 2 levels maximum. Deep nesting becomes hard to maintain.

### Query parameters for filtering, sorting, pagination
```
GET /orders?status=pending&customerId=c-123
GET /products?sort=price&direction=asc
GET /orders?page=2&pageSize=25
```

### Response conventions
- Use ISO 8601 UTC for dates: `"placedAt": "2026-03-22T14:30:00Z"`
- Use camelCase for JSON field names
- Include `Location` header on 201 Created responses
- Wrap collections in a `data` field with `pagination` metadata

## References

Detailed patterns and examples are available in the `references/` directory. Load these on demand when the review touches the specific topic.

- See `references/openapi-guide.md` for OpenAPI 3.1 specification structure, reusable schemas, and spec authoring patterns.
- See `references/error-model.md` for RFC 7807 Problem Details format, field definitions, and domain-specific error extension examples.
- See `references/versioning.md` for URL path versioning, header versioning, and deprecation policy with Sunset headers.

Before finalizing your review, check `gotchas.md` for common Claude mistakes in this domain.

## API Design Review Checklist

- [ ] Paths use nouns (resources), not verbs
- [ ] HTTP method matches the operation semantics
- [ ] Correct status code returned for each outcome
- [ ] Error responses follow RFC 7807 Problem Details format
- [ ] All breaking changes increment the major version
- [ ] OpenAPI spec updated before (or alongside) implementation
- [ ] Pagination applied to all list endpoints
- [ ] Dates in ISO 8601 UTC format
- [ ] `Location` header returned on 201 Created responses
- [ ] Deprecation communicated via `Sunset` and `Deprecation` headers
