---
name: git-pull-request
description: "Create pull requests with template selection and platform auto-detection (GitHub/GitLab)."
allowed-tools:
  - Bash(git:*)
  - Bash(gh:*)
  - Read
model: sonnet
---

# git:pull-request

Create pull requests with auto-detection for GitHub and GitLab platforms.

## When to Invoke

Invoke this skill when the user requests "create PR", "create pull request", or "open a pull request".

## Process

1. Run `git status` and `git log` to understand the current branch and commits.
2. Run `git diff <base-branch>...HEAD` to see all changes since diverging from base.
3. Determine the platform (GitHub via `gh`, GitLab via `glab`).
4. Analyze all commits to draft a PR title and summary.
5. Create the PR using the platform CLI.

## PR Title Guidelines

- Keep under 70 characters.
- Use imperative mood: "Add login flow" not "Added login flow".
- Reference JIRA/issue number when available.

## PR Body Template

```markdown
## Summary
- <bullet point summary of what changed>
- <and why>

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing done

🤖 Generated with Claude Code
```

## Platform Detection

| CLI Available | Platform |
|---------------|----------|
| `gh` | GitHub |
| `glab` | GitLab |
| Neither | Manual instructions |

## Rules

- Never push to `main` or `master` directly.
- Always push the current branch first (`git push -u origin HEAD`).
- Never use `--force` unless the user explicitly requests it.
- Return the PR URL when done.

Before finalizing your PR, check `gotchas.md` for common Claude mistakes when creating pull requests.
