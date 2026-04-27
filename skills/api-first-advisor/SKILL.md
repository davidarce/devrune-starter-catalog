---
name: api-first-advisor
scope: [backend, api]
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

## Adviser Mode (SDD Orchestrator Integration)

This skill supports **adviser mode**: when invoked by the SDD orchestrator with a `GUIDANCE CONTEXT FROM PLANNER` block in the prompt, use the following procedure instead of the standard interactive review flow.

### Entry Conditions
Adviser mode is active when the prompt contains:
- A `GUIDANCE CONTEXT FROM PLANNER:` block
- A `CURRENT PLAN EXCERPT:` block

### Adviser Mode Procedure
1. Read the `GUIDANCE CONTEXT FROM PLANNER` block to understand what the planner needs reviewed.
2. Read the `CURRENT PLAN EXCERPT` to see the specific tasks and design decisions.
3. Apply your domain expertise to the plan content — do NOT read codebase files unless the plan references specific existing code that is relevant. In adviser mode, focus on contract specs and API shape from the plan (not codebase files).
4. Produce structured advice in the format below.
5. Save output to engram and return summary + observation ID.

Focus ONLY on your specialist domain: REST conventions, OpenAPI spec quality, error models, versioning.

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
  title: "sdd/{change-name}/guidance/api-first-adviser",
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
