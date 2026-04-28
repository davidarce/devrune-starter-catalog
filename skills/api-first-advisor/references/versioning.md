# Versioning Strategies

Reference for API versioning approaches and deprecation policies.

## URL path versioning (most common, easiest to route)

```
/v1/orders
/v2/orders
```

## Header versioning (cleaner URLs but harder to test in browser)

```
Accept: application/vnd.example.v2+json
```

## Deprecation policy

- Announce deprecation with a `Sunset` header:
  ```
  Sunset: Sat, 31 Dec 2026 00:00:00 GMT
  Deprecation: true
  ```
- Keep deprecated versions running for at least one major release cycle
- Document migration path in API docs

## Key Practices

- Choose one versioning strategy and apply it consistently across the entire API
- URL path versioning is recommended for most projects — it is explicit, easy to route, and easy to test
- Increment the major version only for breaking changes (removed fields, renamed fields, changed types, removed endpoints)
- Non-breaking changes (new optional fields, new endpoints) do not require a version bump
- When deprecating, provide the `Sunset` header on every response from the deprecated version
- Include a `Link` header pointing to the migration guide or the new version's documentation
