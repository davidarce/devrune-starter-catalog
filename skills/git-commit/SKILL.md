---
name: git-commit
description: 'Use when the user asks to create/make/save a commit in ANY language (English/Spanish/paraphrase). Follows Conventional Commits with JIRA ticket detection.'
metadata:
  version: "1.1"
  scope: [git, vcs]
  trigger: "User requests creating a new commit, in any language or paraphrase"
  auto_invoke: 'Invoke by INTENT not literal phrase. EN: "commit", "commit my changes", "create/make a commit", "save as commit", "ship this as a commit". ES: "haz commit", "crea un commit", "mete commit", "guarda en commit", "genera el commit". Skip for history reads ("show last commit", "what was in commit X").'
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(git add:*)
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git branch:*)
  - Bash(git log:*)
  - Bash(git commit:*)
  - Bash(git rev-parse:*)
  - mcp__atlassian__jira_get_issue
model: haiku
---

# Smart Commit

## Dynamic Context (pre-resolved)

- **Branch**: !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "__NO_GIT__"`
- **Status**: !`git status --short 2>/dev/null || echo "__NO_GIT__"`
- **Diff stat**: !`git diff --stat 2>/dev/null || echo "__NO_GIT__"`
- **Recent log**: !`git log --oneline -10 2>/dev/null || echo "__NO_GIT__"`

> If any value above shows `__NO_GIT__`, the working directory is not a git repository. Ask the user which project to target, then run the git commands from that directory using `git -C <path>`.

## Overview

This skill automates the creation of git commits following the Conventional Commits specification with optional JIRA ticket integration. Analyze local changes, determine commit type and scope, detect breaking changes, and create properly formatted commits automatically.

## When to Invoke

Invoke this skill whenever the user asks you to create a commit, **in any language or paraphrase**. Match by intent, not by literal phrase:

- English: "commit", "commit my changes", "create a commit", "make a commit", "commit this", "save as commit", "let's commit", "ship it as a commit"
- Spanish: "haz commit", "hazme un commit", "commit de esto", "mete commit", "crea un commit", "genera el commit", "guarda en commit", "vamos con el commit"
- Indirect cues: the user pivots to "push this", "ship this", or "save progress" right after changes — confirm intent to commit, then invoke.

Do NOT invoke for history reads or amendments ("show me the last commit", "what was in commit X", "amend the previous commit"). The trigger is **creating a new commit** on top of working-tree changes.

## Configuration

This skill reads `config.json` from its own directory for project-specific settings:
- `default_base_branch` — Base branch for comparisons (default: "main")
- `jira_project_prefix` — Expected JIRA project prefix for branch detection (optional, e.g., "BUYERS")

If `config.json` is not present or has empty values, the skill falls back to auto-detection from git context.

## Commit Format

All commits must follow this format:

```
[JIRA-ID] <type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Breaking changes** use this format:
```
[JIRA-ID] <type>(<scope>)!: <description>
```

## Workflow

**Quick path**: If the branch name does not contain a JIRA-like pattern (`[A-Z]+-\d+`) AND no JIRA ID is found in recent commits, skip JIRA context enrichment (steps 1-2) and proceed directly to change analysis (step 3).

### Step 1: Extract JIRA ID from Branch Name

Extract the JIRA ticket ID from the current git branch name.

**Branch naming convention:**
```
<type>/<JIRA-ID>-<description>
```

**Examples:**
- `feature/PROJ-123-user-authentication` → `PROJ-123`
- `bugfix/PROJ-456-fix-validation` → `PROJ-456`
- `refactor/APP-789-improve-performance` → `APP-789`

**Commands:**
```bash
# Get current branch name
git rev-parse --abbrev-ref HEAD

# Extract JIRA ID using regex pattern: [A-Z]+-[0-9]+
```

**Extraction pattern:**
- Find the first occurrence of uppercase letters followed by hyphen and numbers
- Pattern: `[A-Z]+-[0-9]+`

**Handle edge case:** If no JIRA ID is found in branch name, skip the JIRA ID prefix in the commit message and proceed without JIRA context.

A helper script `scripts/branch-to-jira.sh` is available for reliable JIRA ID extraction from branch names. Usage: `bash scripts/branch-to-jira.sh [branch-name]` — returns the JIRA ID or empty string. If no argument is provided, it reads the current branch from git automatically.

### Step 2: Fetch JIRA Ticket Information

Once the JIRA ID is extracted, fetch the ticket details to enrich the commit message with context.

**Use the JIRA MCP tool:**
```
mcp__atlassian__jira_get_issue
```

**Parameters:**
- `issue_key`: The extracted JIRA ID (e.g., "PROJ-456")
- `fields`: "summary,description,issuetype,labels"

**Extract relevant information:**
1. **Summary**: The ticket title/summary - use this to understand the high-level goal
2. **Issue Type**: Bug, Story, Task, Epic, etc. - helps determine commit type
3. **Description**: Detailed context about what needs to be done
4. **Labels**: Additional context about the feature area

**Mapping JIRA Issue Type to Commit Type:**
| JIRA Issue Type | Suggested Commit Type | Notes |
|-----------------|----------------------|-------|
| Bug, Defect | `fix` | Bug fixes |
| Story, User Story | `feat` | New features |
| Task | `feat` or `refactor` | Depends on the nature of work |
| Technical Debt | `refactor` | Code improvements |
| Epic | `feat` | Large features (usually) |
| Spike | `docs` or `refactor` | Research work |

**How to use JIRA context:**
- Use the **summary** as guidance for the commit description
- Check **issue type** to help determine the correct commit type
- Review **description** to understand if it's breaking, adds features, or fixes bugs
- Consider **labels** for determining scope (e.g., "backend", "api", "domain")

**Example:**
```
JIRA ID: PROJ-456
Summary: "Migrate external service integration to v2"
Issue Type: Task
Description: "Update integration with external service to use new v2 API..."

→ This suggests:
  - Type: `feat` (new integration version)
  - Scope: `infrastructure` (external service integration)
  - Description should mention "migrate" and "v2"
```

**Handle errors gracefully:**
- If JIRA API call fails (network, permissions, invalid ticket), log a warning and continue without JIRA context
- Do NOT block the commit if JIRA is unavailable
- The git diff analysis should still be the primary source of truth

### Step 3: Analyze Local Changes

Analyze the current git diff to understand what has changed.

**Commands:**
```bash
# Get list of changed files with status
git diff --name-status

# Get detailed diff
git diff

# Get diff statistics
git diff --stat
```

**Analyze the diff output to identify:**
1. **Files changed**: Which files were modified, added, or deleted
2. **Change magnitude**: How many lines added/removed
3. **Change location**: Which modules/packages affected (domain, application, infrastructure, api-rest, etc.)
4. **Change nature**: What kind of changes (new features, bug fixes, refactoring, etc.)

**Combine with JIRA context:**
- The git diff shows WHAT was actually changed in code
- The JIRA ticket shows WHY and the intended outcome
- Use BOTH sources to create an accurate commit message
- If there's a mismatch (e.g., JIRA says "bug" but code shows new features), trust the git diff but consider mentioning the JIRA context

### Step 4: Determine Commit Type

Based on the analyzed changes, determine the commit type using these patterns:

| Type | When to Use | Keywords in Changes |
|------|------------|---------------------|
| `feat` | New functionality or feature | "add", "implement", "introduce", "create" |
| `fix` | Bug fix or error correction | "fix", "resolve", "correct", "repair", "patch" |
| `refactor` | Code restructuring without behavior change | "refactor", "rename", "extract", "move", "simplify" |
| `docs` | Documentation only changes | Changes only to .md files, docstrings, comments |
| `test` | Test additions or modifications | Changes only to test files (*_test.go, *Test.java, *.test.ts, etc.) |
| `style` | Code formatting, no logic change | "format", "style", "lint", whitespace only |
| `perf` | Performance improvements | "cache", "optimize", "performance", "efficient" |
| `build` | Build system or dependencies | Changes to build config (pom.xml, go.mod, package.json, Makefile, etc.) |
| `ci` | CI/CD pipeline changes | Changes to .github/workflows, pipelines |
| `chore` | Maintenance tasks | Configuration updates, cleanup |

**Priority when multiple types apply:**
1. Breaking changes (always mark with '!')
2. `feat` (new functionality)
3. `fix` (bug fixes)
4. `perf` (performance)
5. `refactor` (code improvements)
6. Other types

**Combine git diff analysis with JIRA issue type:**
- Start with the JIRA issue type suggestion (from Step 2)
- Validate against the actual code changes in git diff
- Final decision: git diff takes priority, but JIRA provides context
- Example: JIRA says "Task" but code adds new API endpoints → use `feat`

**Reference:** For detailed detection patterns and examples, see [commit-patterns.md](references/commit-patterns.md) when needed.

### Step 5: Determine Scope

Extract the scope from the changed files to indicate which part of the codebase is affected.

**Scope detection strategies:**

#### Strategy 1: By Module (preferred for layered/hexagonal architectures)
- Changes in `domain/` or `models/` → `domain`
- Changes in `application/` or `services/` → `application`
- Changes in `infrastructure/` or `adapters/` → `infrastructure`
- Changes in `api/` or `controllers/` or `routes/` → `api`
- Changes in `config/` or `bootstrap/` → `config`

#### Strategy 2: By Domain Concept
- Extract common prefix from changed files:
  - `OrderService.java`, `OrderRepository.java` → `order`
  - `UserEntity.java`, `UserMapper.java` → `user`
  - `PaymentProcessor.java`, `PaymentValidator.java` → `payment`

#### Strategy 3: By Feature Area
- Authentication-related files → `auth`
- Validation-related files → `validation`
- Security-related files → `security`

#### Strategy 4: Multiple Scopes
- If changes affect multiple unrelated areas, either:
  - Omit scope entirely
  - Use the most significant scope
  - Consider this indicates multiple commits might be needed

**Examples:**
```
domain/entities/Order.java → scope: domain or order
api-rest/controllers/UserController.java → scope: api or user
infrastructure/repositories/ProductRepositoryImpl.java → scope: infrastructure or product
```

**Consider JIRA labels for scope:**
- If JIRA ticket has labels like "backend", "api", "infrastructure", use them to validate scope
- Labels can help when changes span multiple modules

### Step 6: Detect Breaking Changes

Identify if the changes include breaking changes that require the '!' marker.

**Breaking change indicators:**
1. Removed public API methods or endpoints
2. Changed method signatures (parameters, return types)
3. Changed API contracts (request/response models)
4. Removed or renamed configuration properties
5. Changed database schema (breaking migrations)
6. Changed behavior that clients depend on

**Keywords in diff:**
- "remove", "delete" (of public APIs)
- "rename" (for public interfaces)
- "change signature"
- "breaking"
- "incompatible"

**If breaking change detected:** Add '!' after type and scope:
- `feat(api)!: remove deprecated endpoint`
- `fix(domain)!: change order status validation`

**Check JIRA description for breaking change mentions:**
- JIRA ticket may explicitly mention "breaking change" or "incompatible"
- Use this as additional signal, but verify with code changes

### Step 7: Generate Commit Description

Create a concise, imperative description of the change.

**Description guidelines:**
- Use imperative mood: "add feature" not "added feature" or "adds feature"
- Start with lowercase letter (exception: proper nouns)
- No period at the end
- Be specific but concise (50 characters or less preferred)
- Focus on WHAT changed, not HOW

**Incorporate JIRA summary:**
- Use the JIRA summary as inspiration for the description
- Extract key terms from JIRA summary (e.g., "Migrate external service to v2" → "migrate external service integration to v2")
- Combine with git diff insights to be more specific
- Example:
  - JIRA: "Update purchase variable integration"
  - Git diff: Shows migration from v1 to v2 API
  - Result: "migrate external service integration to v2"

**Good examples:**
- `add user authentication service`
- `fix null pointer in order validation`
- `refactor payment processing logic`
- `improve query performance with caching`
- `migrate external service integration to v2` (from JIRA + git context)

**Bad examples:**
- `Added new stuff` (too vague, wrong tense)
- `Fixed a bug.` (too vague, has period)
- `I have updated the code to use a better algorithm for processing orders` (too long, wrong perspective)

### Step 8: Create the Commit

Generate the final commit message and create the commit.

**Commit message format:**
```
[JIRA-ID] <type>(<scope>): <description>
```

**Examples:**
```
[PROJ-123] feat(domain): add order creation validation
[PROJ-456] fix(api): handle null pointer in user lookup
[APP-789] refactor(infrastructure): simplify repository implementation
[TASK-321] perf(application)!: change caching strategy for performance
```

**Commands to create commit:**
```bash
# Review staged and unstaged files first
git status

# Stage only reviewed files — avoid git add . to prevent committing sensitive files (.env, credentials)
git add <file1> <file2> …

# Create commit with generated message
git commit -m "[JIRA-ID] type(scope): description"

# Verify commit was created
git log -1 --oneline
```

**Important:**
- **Do NOT include** "Co-Authored-By: Claude <noreply@anthropic.com>" or any references to AI in the commit message
- Do NOT ask for user confirmation, create the commit automatically
- Stage only reviewed files; use `git add .` only if all unstaged files have been verified via `git status`
- Use the exact message format generated

**Commit body (optional but recommended for complex changes):**
If the change is complex or involves multiple aspects, use the commit body to provide more context:
```
[JIRA-ID] type(scope): description

- Detail 1 from git diff
- Detail 2 from git diff
- Detail 3 from git diff
```

Example incorporating JIRA context:
```
[PROJ-456] feat(infrastructure): migrate external service integration to v2

- Update rest client to use service-rest v2.0.0
- Refactor domain model and mapper for new API contract
- Update repository implementation for v2 endpoints
- Remove deprecated fields from domain model
- Add new configuration properties for v2 endpoints
```

### Step 9: Verify and Report

After creating the commit, verify it was successful and report to the user.

**Verification commands:**
```bash
# Show the created commit
git log -1 --format="%h %s"

# Show commit details
git show --stat HEAD
```

**Report to user:**
- Confirm commit was created
- Show the commit hash and message
- Show brief statistics of what was committed

## Gotchas

- **JIRA ID regex**: Do not use `[A-Z]+[A-Z]+-[0-9]+` for JIRA ID extraction — it fails on single-letter project keys (e.g., `A-123`). Always use `[A-Z]+-\d+`.
- **Staging**: Do not run `git add .` without first reviewing `git status` — unverified files (`.env`, credentials, binaries) may be staged accidentally.
- **Empty diff**: Do not create a commit when `git diff` is empty — report "nothing to commit" instead of proceeding.
- **AI attribution**: Do not include "Co-Authored-By: Claude" or any AI co-authorship lines in the commit message.
- **Commit type priority**: Do not override the priority order when multiple types apply — breaking changes (`!`) always take precedence, then `feat`, then `fix`.
- **JIRA unavailability**: If the JIRA MCP call fails, continue with git diff analysis only — do not block the commit.

Before finalizing your commit, also review [gotchas.md](gotchas.md) for broader anti-patterns Claude commonly makes when committing.

## Complete Example Workflow

A full end-to-end walkthrough covering branch parsing, JIRA lookup, diff analysis, and commit creation. For the detailed step-by-step execution, see [commit-examples.md](references/commit-examples.md).

## Advanced Scenarios

Covers multiple unrelated changes, breaking changes, missing JIRA IDs, and how JIRA context improves commit messages. For detailed scenarios and examples, see [commit-examples.md](references/commit-examples.md#advanced-scenarios).

## References

- [commit-patterns.md](references/commit-patterns.md) - Comprehensive patterns for commit type detection, scope determination, and breaking change identification with real examples
- [commit-examples.md](references/commit-examples.md) - Full end-to-end workflow example and advanced scenario walkthroughs
- [gotchas.md](gotchas.md) - Common Claude anti-patterns when committing
- [git-pull-request](../git-pull-request/SKILL.md) - Create a pull request after committing (`git-pull-request`)

## Best Practices

1. **Be specific but concise** - Describe what changed, not how it was implemented
2. **Use project conventions** - Follow the project's module and directory naming for scopes
3. **One logical change per commit** - If changes are unrelated, suggest separate commits
4. **Focus on user impact** - Describe changes from user/developer perspective
5. **Detect breaking changes carefully** - Only mark as breaking if it truly affects consumers
6. **Keep scope consistent** - Use the same scope naming throughout the project

## Anti-patterns to Avoid

- 🚫 Do not use the regex `[A-Z]+[A-Z]+-[0-9]+` for JIRA ID extraction; use `[A-Z]+-[0-9]+`
- 🚫 Do not stage files with `git add .` without first running `git status` to review
- 🚫 Do not include AI co-authorship lines in the commit message
- 🚫 Do not commit when `git diff` is empty — report "nothing to commit" instead
- 🚫 Do not override the commit-type priority order when multiple types apply

## Notes

- This skill operates in "local mode" using git commands directly
- No user confirmation is required - analyze and commit automatically
- All changes are staged with `git add .` before committing
- JIRA ID in branch names is optional; if not found, the `[JIRA-ID]` prefix is omitted from the commit message
- For multi-module projects, prefer module-based scopes (domain, application, infrastructure)
- **JIRA integration is optional**: If JIRA API is unavailable or fails, the skill continues with git diff analysis only
- **Git diff is the source of truth**: JIRA provides context and suggestions, but actual code changes determine the final commit type and scope
- The JIRA MCP tool (`mcp__atlassian__jira_get_issue`) requires proper authentication and network access to Jira instance
