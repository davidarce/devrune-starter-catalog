---
name: api-standards
scope: api
applies-to:
  - api-first-adviser
description: "REST API naming, validation, error models, versioning"
---

# API Design Standards

## Error Model References

Ensure shared error models are used consistently:

```yaml
'400':
  $ref: "../components/errors.yml#/components/responses/BadRequest400"
'401':
  $ref: '../components/errors.yml#/components/responses/Unauthorized401'
'403':
  $ref: '../components/errors.yml#/components/responses/Forbidden403'
'404':
  $ref: '../components/errors.yml#/components/responses/NotFound404'
'500':
  $ref: '../components/errors.yml#/components/responses/InternalServerError500'
'503':
  $ref: '../components/errors.yml#/components/responses/ServiceUnavailable503'
'504':
  $ref: '../components/errors.yml#/components/responses/GatewayTimeout504'
```

## Example Requirements

- **ALWAYS** provide comprehensive examples for ALL parameters, requests, and responses
- **NEVER** use empty strings, null values, or placeholder text in examples
- Examples should be realistic and match the schema constraints

## Naming Conventions

| Element | Convention | Examples |
|---------|------------|----------|
| Paths | lowercase kebab-case | `/user-preferences`, `/order-history` |
| Parameters | camelCase | `userId`, `sortBy`, `pageSize` |
| Schema Properties | camelCase | `userName`, `createdDateTime` |
| Boolean Fields | prefix with `is` | `isActive`, `isEnabled`, `isDeleted` |
| Date Fields | suffix with `Date`/`DateTime` | `birthDate`, `lastLoginDateTime` |
| Schema Names | NO DTO suffixes | Use business domain names |

## Validation Constraints

| Type | Requirement |
|------|-------------|
| String Parameters/Properties | ALWAYS include `maxLength` |
| Array Parameters | ALWAYS include `maxItems` limits |
| Numeric Fields | ALWAYS define `minimum` and `maximum` |
| Query Parameters | Make optional with sensible defaults, never null/empty |
| Security | ALWAYS define global security schemes at root level |
| URLs | HTTPS only (except localhost for development) |

## Response Structure Standards

### List Endpoints

Wrap arrays in data object with pagination metadata:

```yaml
ListResponse:
  type: object
  properties:
    data:
      type: array
      items:
        $ref: '#/components/schemas/Item'
    page:
      type: integer
      description: Current page number (0-based)
    size:
      type: integer
      description: Number of items per page
    totalElements:
      type: integer
      description: Total number of items
    totalPages:
      type: integer
      description: Total number of pages
```

### Error Responses

Use shared error models consistently across all endpoints. Define reusable error schemas in a central location (e.g., `components/errors.yml`).

### Status Codes

Apply conditionally based on:
- Security requirements
- Path parameters
- Operation types

### Content Types

- Default to `application/json`
- Specify alternatives when needed (e.g., `multipart/form-data` for file uploads)

## API Versioning

### Version Changes

| Change Type | Version Impact | Examples |
|-------------|----------------|----------|
| BREAKING | Major (1.0.0 -> 2.0.0) | Schema structure changes, removed fields |
| MINOR | Minor (1.0.0 -> 1.1.0) | New APIs, new optional fields |
| PATCH | Patch (1.0.0 -> 1.0.1) | Bug fixes, documentation updates |

### Version Location

Update `metadata.yml` with new version:

```yaml
info:
  version: 1.2.0
  title: Service API
```

## Resource Modeling Guidelines

1. **Design resource hierarchies** following REST principles
2. **Define clear relationships** between resources
3. **Use consistent naming** across all endpoints
4. **Plan for lifecycle management** (create, read, update, delete, archive)

## Contract Definition Best Practices

1. **Create detailed schemas** before any coding
2. **Define precise validation rules** for all fields
3. **Establish error handling patterns** upfront
4. **Document auth requirements** clearly

## Stakeholder Review Process

1. Facilitate API contract reviews with development teams
2. Validate specifications with frontend and backend developers
3. Ensure alignment with security and infrastructure teams
4. Incorporate feedback and iterate on designs
