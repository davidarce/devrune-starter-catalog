# OpenAPI Specification Guide

Reference for structuring OpenAPI 3.1 API specifications.

## OpenAPI Specification

Start with an OpenAPI 3.1 document:

```yaml
openapi: 3.1.0
info:
  title: Orders API
  version: "1.0.0"
  description: Manages customer orders

paths:
  /orders:
    get:
      summary: List orders
      operationId: listOrders
      tags: [orders]
      parameters:
        - name: customerId
          in: query
          schema: { type: string }
      responses:
        "200":
          description: List of orders
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrderListResponse'
        "400":
          $ref: '#/components/responses/BadRequest'
```

Define reusable schemas and responses in `components` to avoid repetition.

## Key Practices

- Define the contract **before** implementation — the spec is the source of truth
- Use `operationId` on every operation for code generation compatibility
- Group related endpoints with `tags`
- Use `$ref` for shared schemas, parameters, and responses
- Include `description` on every schema property for documentation clarity
- Use `examples` to illustrate expected payloads

## Request/Response Conventions

### Response envelope for collections

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 142,
    "totalPages": 6
  }
}
```

### Consistent date/time format

Use ISO 8601 in UTC:
```
"placedAt": "2026-03-22T14:30:00Z"
```

### Use camelCase for JSON field names (consistent with JavaScript conventions)

```json
{ "customerId": "c-123", "totalAmount": 99.99 }
```

### Include `Location` header on 201 Created

```
Location: /orders/order-456
```
