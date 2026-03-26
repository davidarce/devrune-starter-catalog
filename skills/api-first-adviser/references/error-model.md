# Error Model: RFC 7807 Problem Details

Reference for implementing consistent error responses using RFC 7807.

## RFC 7807 Problem Details

Use RFC 7807 for all error responses:

```json
{
  "type": "https://errors.example.com/insufficient-stock",
  "title": "Insufficient Stock",
  "status": 409,
  "detail": "Item ITEM-42 only has 3 units available, but 5 were requested.",
  "instance": "/orders/order-789",
  "invalidItems": [
    { "sku": "ITEM-42", "requested": 5, "available": 3 }
  ]
}
```

## Fields

- `type` — URI identifying the error type (machine-readable)
- `title` — human-readable summary of the error type
- `status` — HTTP status code (mirrors the response code)
- `detail` — specific explanation of this instance
- `instance` — URI of the resource that triggered the error (optional)
- Extensions allowed for domain-specific error data

## Key Practices

- Every error response in the API should follow this format for consistency
- The `type` URI should be a stable, documented identifier — not a dynamic URL
- Include the `status` field even though it duplicates the HTTP status code — clients may not always have access to the response status
- Use extension fields (like `invalidItems` above) to provide structured error details that clients can parse programmatically
- Map validation errors to an array of field-level errors in an extension field:
  ```json
  {
    "type": "https://errors.example.com/validation-error",
    "title": "Validation Error",
    "status": 422,
    "detail": "Request contains invalid fields.",
    "errors": [
      { "field": "email", "message": "Must be a valid email address" },
      { "field": "quantity", "message": "Must be greater than 0" }
    ]
  }
  ```
