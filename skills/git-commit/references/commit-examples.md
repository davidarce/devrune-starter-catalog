# Commit Examples

End-to-end workflow examples and advanced scenarios for the `git:commit` skill.

## Complete Example Workflow

**Scenario:** User says "commit my changes"

**Step-by-step execution:**

1. **Extract JIRA ID:**
   ```bash
   $ git rev-parse --abbrev-ref HEAD
   feature/PROJ-456-add-order-validation
   ```
   JIRA ID: `PROJ-456`

2. **Fetch JIRA ticket information:**
   ```
   mcp__atlassian__jira_get_issue(
     issue_key: "PROJ-456",
     fields: "summary,description,issuetype,labels"
   )
   ```
   Response:
   ```json
   {
     "key": "PROJ-456",
     "fields": {
       "summary": "Add custom validation rules for purchase orders",
       "issuetype": {"name": "Story"},
       "labels": ["backend", "validation"],
       "description": "Implement validation logic for order creation..."
     }
   }
   ```

3. **Analyze git changes:**
   ```bash
   $ git diff --name-status
   A    domain/entities/OrderValidation.java
   M    domain/services/OrderService.java
   A    domain/valueobjects/ValidationResult.java
   M    application/usecases/CreateOrderUseCase.java
   ```

4. **Determine type:**
   - JIRA suggests: `feat` (Story type)
   - Git diff confirms: `feat` (new files added with business logic)
   - Final: `feat`

5. **Determine scope:**
   - Git diff shows: mostly `domain/` changes
   - JIRA labels: "backend", "validation"
   - Final: `domain` (primary location)

6. **Check breaking changes:** None detected

7. **Generate description:**
   - JIRA summary: "Add custom validation rules for purchase orders"
   - Git changes: new validation entities and use case updates
   - Final: `add order validation with custom rules`

8. **Create commit:**
   ```bash
   $ git add .
   $ git commit -m "[PROJ-456] feat(domain): add order validation with custom rules"
   ```

9. **Verify and report:**
   ```bash
   $ git log -1 --format="%h %s"
   a3f5d21 [PROJ-456] feat(domain): add order validation with custom rules
   ```

   Report: "Created commit a3f5d21: [PROJ-456] feat(domain): add order validation with custom rules"

## Advanced Scenarios

### Scenario: Multiple Unrelated Changes

If the diff shows multiple unrelated changes (e.g., domain changes + documentation + CI fixes), consider the dominant change type or suggest the user commit separately.

**Approach:**
1. Identify the most significant change
2. Use that for the commit type
3. Optionally mention other changes in commit body

**Example:**
```
[PROJ-123] feat(domain): add user preferences

- Add domain entity and value objects
- Update API documentation
- Fix CI pipeline warning
```

### Scenario: Breaking Change

When a breaking change is detected:

```
[PROJ-123] feat(api)!: remove deprecated authentication endpoint

BREAKING CHANGE: The /auth/legacy endpoint has been removed.
Use /auth/v2 instead.
```

### Scenario: No JIRA ID in Branch

If branch name doesn't contain JIRA ID (e.g., `main`, `develop`, or malformed branch name):

**Option 1:** Omit JIRA ID prefix
```
feat(domain): add order validation
```

**Option 2:** Ask user for JIRA ID (if context suggests it's needed)

### Scenario: JIRA Context Improves Commit Message

**Without JIRA integration:**
```
Branch: dependency/PROJ-4991-migracion-bc-
Git diff: Shows changes in infrastructure/, pom.xml updates, config changes
Result: [PROJ-4991] refactor(infrastructure): update dependencies
```

**With JIRA integration:**
```
Branch: dependency/PROJ-4991-migracion-bc-
JIRA Summary: "Migrate BC Assortment Planning integration to v2"
JIRA Type: Task
Git diff: Shows bc-assortment-planning-rest v1->v2, API contract changes
Result: [PROJ-4991] feat(infrastructure): migrate BC Assortment Planning integration to v2
```

The JIRA context reveals:
- The change is a migration (more specific than "update")
- It's specifically about BC Assortment Planning (extracted from JIRA)
- It's version 2 (from JIRA summary)
- It should be `feat` not `refactor` (new version = new functionality)
