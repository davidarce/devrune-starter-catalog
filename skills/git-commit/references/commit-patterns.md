# Commit Type Detection Patterns

This reference provides detailed patterns for detecting commit types and scopes from git changes.

## Commit Type Mapping

### feat (Feature)
**Indicators:**
- New files added with business logic (entities, services, controllers, use cases)
- New API endpoints or methods
- New functionality in existing classes
- New configuration for features
- Keywords in changes: "add", "implement", "introduce", "create"

**Examples:**
- Adding new REST endpoint
- Creating new domain entity or value object
- Implementing new use case
- Adding new service method

### fix (Bug Fix)
**Indicators:**
- Changes to conditional logic or validation
- Error handling improvements
- Null checks or defensive programming
- Test fixes that correct behavior
- Keywords in changes: "fix", "resolve", "correct", "repair", "patch"

**Examples:**
- Fixing null pointer exceptions
- Correcting validation logic
- Resolving race conditions
- Fixing incorrect calculations

### refactor (Code Refactoring)
**Indicators:**
- Renaming classes, methods, or variables
- Extracting methods or classes
- Moving code between files
- Changing code structure without behavior change
- Simplifying logic
- Keywords in changes: "refactor", "rename", "extract", "move", "simplify", "reorganize"

**Examples:**
- Extracting common logic into utility methods
- Renaming for clarity
- Restructuring packages
- Simplifying complex conditions

### docs (Documentation)
**Indicators:**
- Only changes to .md files
- Only changes to Javadoc comments
- Only changes to README, CHANGELOG, or documentation files
- Keywords in changes: "document", "comment", "readme", "changelog"

**Examples:**
- Updating README
- Adding Javadoc to methods
- Updating API documentation
- Adding architecture diagrams

### test (Testing)
**Indicators:**
- Only changes to test files (*Test.java, *IT.java)
- Adding or modifying test cases
- Test data or mock changes
- Keywords in changes: "test", "mock", "assert", "verify"

**Examples:**
- Adding unit tests
- Adding integration tests
- Updating test data
- Fixing flaky tests

### style (Code Style)
**Indicators:**
- Formatting changes only
- Import organization
- Code style compliance (linting)
- Whitespace changes
- Keywords in changes: "format", "style", "lint", "whitespace"

**Examples:**
- Running code formatter
- Organizing imports
- Fixing linting errors
- Removing trailing whitespace

### perf (Performance)
**Indicators:**
- Caching implementations
- Query optimization
- Algorithm improvements
- Lazy loading
- Batch processing
- Keywords in changes: "cache", "optimize", "performance", "speed", "efficient"

**Examples:**
- Adding caching layer
- Optimizing database queries
- Improving algorithm complexity
- Adding indexes

### build (Build System)
**Indicators:**
- Changes to pom.xml
- Changes to build configuration
- Dependency updates
- Maven plugin configuration
- Keywords in changes: "dependency", "maven", "build", "plugin"

**Examples:**
- Updating dependencies
- Adding new Maven plugin
- Changing Java version
- Updating build configuration

### ci (CI/CD)
**Indicators:**
- Changes to .github/workflows
- Changes to pipeline configuration
- Changes to deployment scripts
- Keywords in changes: "pipeline", "workflow", "deploy", "ci", "cd"

**Examples:**
- Updating GitHub Actions
- Modifying deployment pipeline
- Adding CI checks

### chore (Maintenance)
**Indicators:**
- Configuration file changes (not build)
- Routine maintenance
- Miscellaneous changes that don't fit other categories
- Keywords in changes: "chore", "maintenance", "update", "cleanup"

**Examples:**
- Updating application.yml
- Cleaning up unused code
- Updating gitignore
- General maintenance

## Scope Detection Patterns

The scope should reflect the affected module or component. Extract scope from:

### By Module
- Changes in `domain/` → scope: `domain`
- Changes in `application/` → scope: `application`
- Changes in `infrastructure/` → scope: `infrastructure`
- Changes in `api-rest/` → scope: `api` or `rest`
- Changes in `boot/` → scope: `boot`

### By Domain Concept
- Changes to files with common prefix → scope: prefix
  - `OrderService.java`, `OrderRepository.java` → scope: `order`
  - `UserEntity.java`, `UserMapper.java` → scope: `user`

### By Feature Area
- Multiple related files → scope: feature name
  - Authentication files → scope: `auth`
  - Validation files → scope: `validation`

### Multiple Scopes
- If changes span multiple unrelated areas, consider omitting scope or using the most significant one

## Breaking Change Detection

A change is breaking if it:

1. **Removes public API methods or endpoints**
2. **Changes method signatures** (parameters, return types)
3. **Changes API contract** (request/response models)
4. **Removes or renames configuration properties**
5. **Changes database schema** (breaking migrations)
6. **Changes behavior** that clients depend on

**Keywords indicating breaking changes:**
- "remove", "delete", "breaking"
- "rename" (for public APIs)
- "change signature"
- "incompatible"
- "migration required"

**Format:** Add `!` after type/scope: `feat(api)!:` or `fix!:`

## Priority Rules for Multiple Change Types

When changes include multiple types, prioritize in this order:

1. **Breaking changes** → Always mention first with `!`
2. **feat** → New functionality takes precedence
3. **fix** → Bug fixes are important
4. **perf** → Performance improvements
5. **refactor** → Code improvements
6. **test** → Test additions
7. **docs** → Documentation updates
8. **style** → Style changes
9. **build/ci/chore** → Maintenance

If changes are truly mixed and equal, consider splitting into multiple commits.

## Examples

### Example 1: Adding New Feature
```diff
+ public class OrderService {
+   public Order createOrder(OrderRequest request) {
+     // new business logic
+   }
+ }
```
**Type:** `feat`, **Scope:** `order`, **Message:** `feat(order): add order creation service`

### Example 2: Fixing Bug
```diff
- if (user == null) {
-   return null;
- }
+ if (user == null) {
+   throw new UserNotFoundException();
+ }
```
**Type:** `fix`, **Scope:** `user`, **Message:** `fix(user): handle null user with proper exception`

### Example 3: Breaking Change
```diff
- public String getOrderId()
+ public OrderId getOrderId()
```
**Type:** `feat`, **Breaking:** yes, **Scope:** `order`, **Message:** `feat(order)!: change order ID to value object`

### Example 4: Refactoring
```diff
- private void validateOrder(Order order) { /* 50 lines */ }
+ private void validateOrder(Order order) {
+   orderValidator.validate(order);
+ }
```
**Type:** `refactor`, **Scope:** `order`, **Message:** `refactor(order): extract validation logic to dedicated validator`

### Example 5: Performance Improvement
```diff
+ @Cacheable("users")
  public User findUserById(String id) {
```
**Type:** `perf`, **Scope:** `user`, **Message:** `perf(user): add caching to user lookup`