# Gotchas — api-first-adviser

Common mistakes Claude makes when designing or reviewing APIs. Check these before finalizing your output.

## 1. Using 400 Bad Request when 422 Unprocessable Entity is correct

**Wrong**: Returning `400` for a request with valid JSON structure but semantically invalid data (e.g., order quantity of -5, end date before start date).
**Right**: Return `400` for malformed requests (invalid JSON, wrong content type, missing required fields). Return `422` for well-formed requests that fail business validation (semantic errors).
**Why**: Claude lumps all validation errors under `400`. The distinction matters: `400` means "I cannot parse your request" while `422` means "I understand your request but it violates business rules." Clients need this distinction for error handling logic.

## 2. Omitting pagination on list endpoints

**Wrong**: Designing `GET /orders` to return all orders in a single response without pagination parameters.
**Right**: Every list endpoint must support pagination from day one: `GET /orders?page=1&pageSize=25`. Return pagination metadata in the response: `{ data: [...], pagination: { page, pageSize, totalItems, totalPages } }`.
**Why**: Claude designs APIs for the current data volume (10 orders in development) without considering production scale. An unpaginated endpoint becomes a performance bomb when the dataset grows to thousands of records.

## 3. Introducing breaking changes without a version bump

**Wrong**: Renaming a response field from `orderDate` to `placedAt`, removing an endpoint, or changing a field type without incrementing the API version.
**Right**: Any change that breaks existing clients requires a major version bump (`/v1` to `/v2`). Announce deprecation on the old version with `Sunset` and `Deprecation` headers. Provide a migration guide.
**Why**: Claude makes field name improvements inline without recognizing them as breaking changes. Renaming a field is invisible in code review but breaks every client that parses the response.

## 4. Inconsistent naming conventions across endpoints

**Wrong**: Mixing `customerId` and `customer_id` in the same API, or using `GET /orders` alongside `GET /product-list`.
**Right**: Apply one convention everywhere: camelCase for JSON fields, plural nouns for resource paths, consistent path patterns (`/orders`, `/products`, `/customers` — not `/order-list`).
**Why**: Claude generates endpoints independently and does not cross-check naming consistency. Inconsistent naming increases integration effort for client developers who must remember which convention applies where.

## 5. Using verbs instead of nouns in resource paths

**Wrong**: `POST /createOrder`, `GET /getCustomerOrders`, `PUT /updateOrderStatus`.
**Right**: `POST /orders`, `GET /customers/{customerId}/orders`, `PATCH /orders/{orderId}`. For non-CRUD actions, model as sub-resources: `POST /orders/{orderId}/cancellations`.
**Why**: Claude occasionally reverts to RPC-style naming, especially for action-oriented operations like "cancel" or "approve." The HTTP method already serves as the verb — adding verbs to the path creates redundancy and inconsistency.

## 6. Missing Location header on 201 Created responses

**Wrong**: Returning `201 Created` with just the response body but no `Location` header pointing to the newly created resource.
**Right**: Include `Location: /orders/{newOrderId}` in the response headers alongside the 201 status. This tells the client where to find the resource they just created.
**Why**: Claude focuses on the response body and forgets the header. The `Location` header is part of the HTTP standard for 201 responses and is relied upon by REST clients for resource discovery.
