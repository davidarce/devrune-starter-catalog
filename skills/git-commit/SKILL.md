---
name: git-commit
description: "Automate git commits following Conventional Commits with JIRA ticket integration."
allowed-tools:
  - Bash(git:*)
  - Read
model: sonnet
---

# git:commit

Automate git commits following the Conventional Commits specification.

## When to Invoke

Invoke this skill when the user requests a commit, says "commit my changes", or asks you to "create a commit".

## Process

1. Run `git status` to see all untracked and modified files.
2. Run `git diff --staged` to see staged changes.
3. Run `git log --oneline -5` to understand the commit style used in this repo.
4. Analyze the changes and draft a commit message following Conventional Commits.
5. Stage relevant files and create the commit.

## Commit Message Format

```
<type>(<scope>): <short description>

[optional body explaining WHY, not WHAT]

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only changes |
| `chore` | Maintenance tasks (deps, config) |
| `ci` | CI/CD pipeline changes |

## Rules

- Keep the subject line under 72 characters.
- Use imperative mood: "add feature" not "added feature".
- Reference JIRA ticket in scope when available: `feat(PROJECT-123): add login`.
- Never skip hooks (`--no-verify`) unless the user explicitly asks.
- Never commit `.env` files or credentials.

Before finalizing your commit, check `gotchas.md` for common Claude mistakes when committing.
