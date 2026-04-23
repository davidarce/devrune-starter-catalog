# PR Templates Guide

Detailed guidance for filling out each PR template using JIRA context and git diff analysis.

## Template Assets

Available templates in `assets/templates/`:
- `bug.md`: Bug fix template
- `feature.md`: New feature template
- `docs.md`: Documentation template
- `refactor.md`: Refactoring template
- `test.md`: Test addition template
- `performance.md`: Performance optimization template
- `security.md`: Security fix template

## Per-Template Fill-Out Guidance

### bug.md

- **Issue Description**: Extract from JIRA description + git diff analysis
- **Root Cause**: Technical reason from code analysis
- **Fix Description**: Changes from git diff + JIRA acceptance criteria
- **Testing**: How the fix was verified + JIRA test requirements
- **Related Issues**: Reference the JIRA ticket ID (e.g., `JIRA-ID`). If the JIRA server URL is known, include a full link.

### feature.md

- **Description**: JIRA summary + technical details from git diff
- **Motivation**: Extract from JIRA description (business context, user needs)
- **Implementation**: High-level approach from git diff analysis
- **Acceptance Criteria**: Parse from JIRA description (look for bullet points, numbered lists)
- **Testing**: Test coverage details + JIRA test scenarios
- **Related Issues**: Link to JIRA ticket and any dependencies mentioned

### refactor.md

- **Motivation**: JIRA description (technical debt context) + why refactoring needed
- **Changes Made**: What was restructured from git diff
- **Impact**: How behavior is preserved or improved
- **Related Issues**: Link to JIRA technical debt ticket

### docs.md

- **Documentation Updates**: What was changed/added from git diff
- **Impact**: Who benefits (from JIRA context if available)
- **Related Issues**: Link to JIRA documentation task

### test.md

- **Test Coverage**: What scenarios are now tested
- **Test Type**: Unit, integration, or end-to-end tests
- **Coverage Improvements**: Metrics if available
- **Related Issues**: Link to JIRA test task

### performance.md

- **Performance Issue**: What was slow (from JIRA if mentioned)
- **Optimization**: Changes made from git diff
- **Metrics**: Before/after measurements if available
- **Related Issues**: Link to JIRA performance ticket

### security.md

- **Vulnerability**: Security issue from JIRA + technical details
- **Fix**: How the vulnerability was mitigated
- **Impact**: Severity and affected versions from JIRA
- **Related Issues**: Link to JIRA security ticket

## Example PR Description

Combining JIRA context with git diff analysis:

```markdown
# [PROJ-123] Migrate external service integration to v2

## Description
Migrates the external service integration from v1 to v2 API endpoints. This update is required to support the new data model where resources are now separate entities instead of being nested within categories.

## Motivation
The external service team has deprecated v1 endpoints and requires all consumers to migrate to v2. The new version provides better separation of concerns and improved data modeling.

**JIRA Context**: Service v1 endpoints are being migrated to v2 across all consumers. This is part of the larger initiative tracked in PROJ-100.

## Implementation
- Updated rest client dependency to v2.0.0
- Refactored domain model to accommodate new API contract
- Updated repository adapters and mappers for v2 endpoints
- Extracted related entities into separate domain objects
- Updated configuration across all environments
- Updated tests to reflect new data model

## Acceptance Criteria
- [x] All v1 endpoints replaced with v2 equivalents
- [x] Contracts maintained (no breaking changes to our API)
- [x] New entities properly extracted
- [x] Configuration updated for all environments
- [x] All tests passing with new data model

## Testing
- Unit tests updated for new domain model
- Integration tests updated for v2 API contract
- All existing tests passing
- Manual testing in staging environment

## Related Issues
- JIRA: PROJ-123
- Initiative: PROJ-100

## Files Changed
- 20 files modified
- 84 insertions, 172 deletions
```
