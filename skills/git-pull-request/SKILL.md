---
name: git-pull-request
description: 'Use when the user asks to create/open a PR or MR in ANY language or paraphrase (English/Spanish). Auto-detects GitHub/GitLab, selects PR template, and enriches with JIRA context.'
metadata:
  version: "2.1"
  scope: [git, vcs]
  trigger: "User requests creating/opening a new PR or MR, in any language or paraphrase"
  auto_invoke: 'Invoke by INTENT not literal phrase. EN: "create/open PR", "open MR", "merge request", "submit PR", "push up a PR", "send for review", "raise a PR". ES: "abre el PR", "crea el PR", "si crea el pr", "mete un PR", "sube el PR", "lanza el PR", "haz el PR", "abre la MR". Skip for reviewing/listing/commenting on existing PRs — that belongs to review-pr.'
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(git:*)
  - Bash(gh:*)
  - Bash(glab:*)
  - mcp__atlassian__jira_get_issue
model: haiku
---

# PR Creator

## Dynamic Context (pre-resolved)

- **Remote URL**: !`git remote get-url origin 2>/dev/null || echo "__NO_GIT__"`
- **Branch**: !`git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "__NO_GIT__"`
- **Base branch**: !`git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || echo "main"`
- **Status**: !`git status --short 2>/dev/null || echo "__NO_GIT__"`
- **Diff vs base**: !`git diff --stat origin/HEAD...HEAD 2>/dev/null || echo "__NO_GIT__"`
- **Commits vs base**: !`git log --oneline origin/HEAD..HEAD 2>/dev/null || echo "__NO_GIT__"`

> If any value above shows `__NO_GIT__`, the working directory is not a git repository. Ask the user which project to target, then run the git commands from that directory using `git -C <path>`.

## Overview

This skill enables intelligent pull request creation by analyzing local git changes, fetching JIRA ticket context, suggesting the most appropriate PR template based on change type, and helping fill out comprehensive PR descriptions that accurately reflect the code modifications and business requirements. It supports both GitHub (via `gh`) and GitLab (via `glab`) with automatic platform detection.

## When to Invoke

Invoke this skill whenever the user asks you to create or open a PR/MR, **in any language or paraphrase**. Match by intent, not by literal phrase:

- English: "create PR", "create pull request", "open a pull request", "open PR", "open MR", "open a merge request", "submit PR", "push up a PR", "send it for review", "raise a PR"
- Spanish: "abre el PR", "crea el PR", "crea un pull request", "si crea el pr", "mete un PR", "abre una MR", "sube el PR", "lanza el PR", "haz el PR", "abre la merge request"
- Indirect cues: after a feature branch is pushed, the user says "ship this for review" or "send it upstream" — treat as an open-PR request.

Do NOT invoke when the user is asking to **review, list, comment on, or merge** an existing PR — those belong to `review-pr` or direct `gh pr` commands. The trigger here is exclusively **creating a new PR or MR** from the current branch.

## Configuration

This skill reads `config.json` from its own directory for project-specific settings:
- `default_base_branch` — Base branch for PR target (default: "main")
- `jira_project_prefix` — Expected JIRA project prefix for branch detection (optional, e.g., "BUYERS")
- `pr_platform` — Force platform override: "github" or "gitlab" (optional, auto-detected if empty)

If `config.json` is not present or has empty values, the skill falls back to auto-detection from git remote URL.

## Workflow

### Step 1: Understand Parameters

Extract parameters from the context or ask the user:
- `base_branch`: Branch to compare against (default: `develop` or `main` depending on project)
- `head_branch`: Branch with changes (default: current branch from `git rev-parse --abbrev-ref HEAD`)
- `working_directory`: Git repository path (default: current working directory)

### Step 2: Detect Git Platform

Determine whether the repository is hosted on GitHub or GitLab by inspecting the git remote URL.

**Commands:**
```bash
# Get the remote URL
git remote get-url origin
```

**Platform detection patterns:**
| Remote URL Pattern | Platform | CLI Tool |
|-------------------|----------|----------|
| Contains `github.com` or `github.` | GitHub | `gh` |
| Contains `gitlab.com` or `gitlab.` | GitLab | `glab` |

**Examples:**
- `git@github.com:org/repo.git` --> GitHub --> use `gh`
- `https://github.com/org/repo.git` --> GitHub --> use `gh`
- `git@gitlab.com:org/repo.git` --> GitLab --> use `glab`
- `https://gitlab.company.com/org/repo.git` --> GitLab --> use `glab`

**Fallback:** If the remote URL does not match either pattern, ask the user which platform they are using.

### Step 3: Extract JIRA ID from Branch Name

Extract the JIRA ticket ID from the current git branch name to fetch ticket context.

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

**Handle edge case:** If no JIRA ID is found in branch name, skip JIRA enrichment and proceed with git diff analysis only.

### Step 4: Fetch JIRA Ticket Information

Once the JIRA ID is extracted, fetch the ticket details to enrich the PR description.

**Use the JIRA MCP tool:**
```
mcp__atlassian__jira_get_issue
```

**Parameters:**
- `issue_key`: The extracted JIRA ID (e.g., "PROJ-456")
- `fields`: "summary,description,issuetype,labels,assignee,status,priority,fixVersions,components"

**Extract relevant information:**
1. **Summary**: The ticket title - use for PR title
2. **Issue Type**: Bug, Story, Task, Epic - helps determine PR template
3. **Description**: Detailed context - use for "Motivation" or "Background" sections
4. **Labels**: Additional context for categorization
5. **Components**: Affected system components
6. **Acceptance Criteria**: Often in description - use for testing section

**Mapping JIRA Issue Type to PR Template:**
| JIRA Issue Type | PR Template | Rationale |
|-----------------|-------------|-----------|
| Bug, Defect | `bug.md` | Fixing issues |
| Story, User Story | `feature.md` | New functionality |
| Task | Based on git diff | Could be feature, refactor, or maintenance |
| Technical Debt | `refactor.md` | Code improvements |
| Epic | `feature.md` | Large features |
| Spike | `docs.md` or `refactor.md` | Research work |

**How to use JIRA context in PR:**
- **PR Title**: Use JIRA summary prefixed with ticket ID: `[JIRA-123] Summary from ticket`
- **Motivation/Background**: Extract from JIRA description
- **Acceptance Criteria**: Parse from JIRA description (often marked with headers)
- **Related Issues**: Link to JIRA ticket and any related tickets mentioned
- **Business Context**: Use JIRA description to explain "why" this change matters

**Example:**
```
JIRA ID: PROJ-456
Summary: "Migrate external service integration to v2"
Issue Type: Task
Description: "Migrate all v1 endpoints to v2 API..."
Components: ["Infrastructure", "Integration"]

→ This suggests:
  - PR Title: "[PROJ-456] Migrate external service integration to v2"
  - Template: feature.md (migration to new version)
  - Motivation: From JIRA description
  - Testing: Focus on endpoint compatibility
```

**Handle errors gracefully:**
- If JIRA API call fails, log a warning and continue without JIRA context
- Do NOT block PR creation if JIRA is unavailable
- Git diff analysis remains the primary source for technical details

### Step 5: Analyze File Changes

Use git commands to gather comprehensive change information:

```bash
# Get current branch
git rev-parse --abbrev-ref HEAD

# Get repository root
git rev-parse --show-toplevel

# Get changed files with status
git diff --name-status <base_branch>...<head_branch>

# Get diff statistics
git diff --stat <base_branch>...<head_branch>

# Get commit messages
git log --oneline <base_branch>..<head_branch>

# Get full diff
git diff <base_branch>...<head_branch>
```

Analyze the output to understand:
1. **Change scope**: Number of files changed, lines added/removed
2. **Change type**: Bug fix, feature, refactor, docs, test, performance, security
3. **Change impact**: Which modules/components are affected
4. **Breaking changes**: API changes, removed functionality

**Combine with JIRA context:**
- Git diff shows WHAT was changed technically
- JIRA ticket shows WHY and the business requirements
- Use BOTH to create a comprehensive PR description
- JIRA description may reveal context not obvious from code (e.g., regulatory requirements, customer requests)

### Step 6: Determine Change Type

Based on the diff analysis, classify the change into one of these types:

- **bug/fix**: Fixes defects, errors, or unexpected behavior
- **feature/enhancement**: Adds new functionality or capabilities
- **docs/documentation**: Documentation-only changes
- **refactor/cleanup**: Code restructuring without behavior changes
- **test/testing**: Test additions or corrections
- **performance/optimization**: Performance improvements
- **security**: Security fixes or hardening

**Type detection patterns:**
- Bug fixes: Keywords like "fix", "bug", "error", "issue" in commits/changes
- Features: New files, classes, or public APIs; keywords like "add", "implement"
- Refactor: Moved code, renamed classes/methods, structural changes
- Docs: Only markdown/documentation files changed
- Tests: Changes primarily in test directories
- Performance: Optimization-related changes, caching, query improvements
- Security: Authentication, authorization, encryption, vulnerability fixes

**Combine git diff analysis with JIRA issue type:**
- Start with JIRA issue type suggestion (from Step 3)
- Validate against actual code changes in git diff
- Final decision: Consider both sources
- Example: JIRA says "Task" + git shows v1→v2 API migration → use `feature` template

### Step 7: Select Template

**Quick path**: If `git diff --stat` shows changes to a single file only, skip template selection and use the default template (`feature.md`). For changes affecting 2+ files, proceed with full template selection below.

Map the change type to the appropriate template from `assets/templates/`:

| Change Type | Template File | Description |
|-------------|--------------|-------------|
| bug, fix | `bug.md` | Bug fix template with issue description and fix details |
| feature, enhancement | `feature.md` | New feature template with motivation and implementation |
| docs, documentation | `docs.md` | Documentation change template |
| refactor, cleanup | `refactor.md` | Refactoring template with before/after context |
| test, testing | `test.md` | Test addition template with coverage details |
| performance, optimization | `performance.md` | Performance improvement template with metrics |
| security | `security.md` | Security fix template with vulnerability details |

Read the selected template from `assets/templates/<template-file>`.

### Step 8: Fill Out Template with JIRA Context

Based on the analyzed changes AND JIRA ticket information, populate each section of the selected template. Each template has specific sections to fill (issue description, motivation, implementation, testing, related issues, etc.).

**Key principles:**
- Use JIRA description for business context (motivation, acceptance criteria)
- Use git diff for technical details (implementation, files changed)
- Always include a JIRA reference in "Related Issues": use the JIRA ticket ID (e.g., `JIRA-ID`). If the JIRA server URL is known (e.g., from MCP Atlassian configuration), construct a full link; otherwise, reference the ticket ID in plain text.
- If JIRA has acceptance criteria, include them as checkboxes

For detailed per-template fill-out guidance and a full example, see [references/pr-templates-guide.md](references/pr-templates-guide.md).

### Step 9: Create Pull Request

Use the platform-specific command based on the platform detected in Step 2.

**GitHub (using `gh`):**

```bash
gh pr create \
  --base <base_branch> \
  --draft \
  --title "<title>" \
  --body "<filled-template>"
```

**GitLab (using `glab`):**

```bash
glab mr create \
  --source-branch <head_branch> \
  --target-branch <base_branch> \
  --draft \
  --title "<title>" \
  --description "<filled-template>"
```

**Validation checklist before running command:**
- [ ] `--draft` flag is present
- [ ] Title starts with `[JIRA-ID]` (if JIRA ID was found)
- [ ] Body includes JIRA reference in "Related Issues" section

**Important guidelines:**
- **Title format**: `[JIRA-ID] <Summary from JIRA or descriptive title>`
  - Example: `[PROJ-123] Migrate service integration to v2`
  - Use JIRA summary as the base, refined if needed for clarity
- Do NOT include Claude Code co-authorship
- Ensure body includes reference to JIRA ticket in "Related Issues" section
- If JIRA has acceptance criteria, include them as checkboxes in PR description
- Add labels as needed for your team's workflow (e.g., `--label "ready-for-review"` on GitHub)

### Step 10: Handle Special Cases

**Multiple change types:**
- If changes span multiple types, choose the dominant type
- List other changes as "Additional changes" in PR description

**Breaking changes:**
- Add `BREAKING CHANGE:` section to description
- Clearly document what breaks and migration path

**Follow-up items:**
- If issues are discovered that need separate PRs, list them as action items
- Use checkboxes for clarity: `- [ ] Follow-up: Add unit tests for edge cases`

## Gotchas

- **JIRA ID prefix in title**: Do not omit the JIRA ID prefix from the PR title when one is available — it breaks traceability in CI/CD pipelines and JIRA automation.
- **Template selection**: Do not select a template based solely on JIRA issue type — always validate against the actual git diff, which is the source of truth.
- **JIRA unavailability**: Do not block PR creation if the JIRA API fails — fall back to git diff analysis and commit messages.
- **AI attribution**: Do not include Claude co-authorship lines in the PR body.
- **Draft flag**: Always create PRs in draft mode (`--draft`) — let the author promote to ready.

Before finalizing your PR, also review [gotchas.md](gotchas.md) for broader anti-patterns Claude commonly makes when opening PRs (wrong base branch, force-pushing protected branches, stale-branch PRs, missing upstream, duplicating the diff in prose, skipping CI check).

## Template Assets

Seven templates are available in `assets/templates/`: `bug.md`, `feature.md`, `docs.md`, `refactor.md`, `test.md`, `performance.md`, and `security.md`. For descriptions and fill-out guidance, see [references/pr-templates-guide.md](references/pr-templates-guide.md).

## Conventions

**PR Title:**
- Prefix PR titles with JIRA ticket ID when available: `[PROJ-123] Description`
- Use JIRA summary as the base for the title
- Follow Conventional Commits in individual commits: `type(scope): description`

**JIRA Integration:**
- Extract acceptance criteria from JIRA description (look for sections marked with "Acceptance Criteria", "AC:", "*Acceptance Criteria*")
- Include JIRA business context in "Motivation" section
- Reference any related JIRA tickets mentioned in the description

**Branch Workflow:**
- Create feature branches from main/develop
- Use descriptive branch names: `feature/add-user-auth`, `fix/login-timeout`
- Keep PRs focused and reasonably sized
- Reference related issues in PR description

## Error Handling

**If git commands fail:**
- Verify working directory is a git repository
- Check that base and head branches exist
- Ensure user has proper git configuration

**If the platform CLI is not available:**
- GitHub: Provide instructions to install `gh`: `brew install gh` (macOS) or download from GitHub
- GitLab: Provide instructions to install `glab`: `brew install glab` (macOS) or download from GitLab
- Suggest manual PR/MR creation with the filled template

**If analysis is ambiguous:**
- Ask user to clarify the change type
- Provide reasoning for suggested template
- Offer to show multiple template options

**If JIRA integration fails:**
- Log a warning but continue with PR creation
- Use git diff analysis and commit messages as fallback
- Suggest manual addition of JIRA context if needed

## Anti-patterns to Avoid

- 🚫 Do not omit the JIRA ID prefix from the PR title when a JIRA ID is available
- 🚫 Do not block PR creation if JIRA API is unavailable — fall back to git diff analysis
- 🚫 Do not select a template based solely on JIRA issue type; validate against actual git diff
- 🚫 Do not include Claude co-authorship in the PR body

## Notes

### JIRA Integration
- **JIRA integration is optional**: If JIRA API is unavailable or fails, the skill continues with git diff analysis only
- **Git diff is the source of truth for technical details**: JIRA provides business context and requirements
- **Acceptance Criteria parsing**: Look for common markers in JIRA description:
  - "*Acceptance Criteria*" (formatted text)
  - "AC:" or "Acceptance Criteria:"
  - Bullet points or numbered lists following these markers
- **Related tickets**: Check JIRA description for links to other tickets (initiatives, dependencies, blockers)
- The JIRA MCP tool (`mcp__atlassian__jira_get_issue`) requires proper authentication and network access to Jira instance
- **PR Title**: Prefer JIRA summary but refine if needed for clarity (e.g., translate to English if JIRA is written in another language)
- **Always include JIRA reference**: Even if JIRA API fails, reference the JIRA ticket ID in the PR description

### Command Templates

**GitHub:**
```bash
gh pr create \
  --base <base_branch> \
  --draft \
  --title "[JIRA-ID] Description" \
  --body "$(cat <<'EOF'
<PR description here>
EOF
)"
```

**GitLab:**
```bash
glab mr create \
  --source-branch <head_branch> \
  --target-branch <base_branch> \
  --draft \
  --title "[JIRA-ID] Description" \
  --description "$(cat <<'EOF'
<PR description here>
EOF
)"
```

## References

- [git-commit](../git-commit/SKILL.md) -- create commits before PR (`git-commit`)
- [PR templates guide](references/pr-templates-guide.md) -- detailed per-template fill-out guidance
- [gotchas.md](gotchas.md) - Common Claude anti-patterns when opening PRs
