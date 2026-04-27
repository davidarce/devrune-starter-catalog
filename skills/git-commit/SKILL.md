---
name: git-commit
description: "Automate git commits following Conventional Commits with JIRA ticket integration."
allowed-tools:
  - Bash(git:*)
  - Bash(pwd)
  - Bash(find:*)
  - Read
  - Write
  - AskUserQuestion
model: sonnet
---

# git:commit

Automate git commits following the Conventional Commits specification.

## When to Invoke

Invoke this skill when the user requests a commit, says "commit my changes", or asks you to "create a commit".

## Dynamic Context (pre-resolved)

- **CWD**: !`pwd`
- **Is git repo**: !`git rev-parse --is-inside-work-tree 2>/dev/null || echo "__NO_GIT__"`

> Heavy git context (status, diff, log) is resolved in **Step 0** below using `git -C <target_path>` after the target repo is determined. This avoids frontmatter pre-execution failures when CWD is a workspace, not a repo.

## Configuration

This skill reads `config.json` from its own directory:
- `default_base_branch` — Base branch for comparisons (default: "main")
- `jira_project_prefix` — Expected JIRA project prefix for branch detection (optional)
- `workspace` — Workspace-aware target resolution. See **Step 0** below.

**Configuration write-back (opt-in)**: the skill may propose updates to `config.json` (via `Write` tool) when it learns something new. Always asks via `AskUserQuestion` before persisting; never overwrites a non-empty value silently.

## Step 0: Resolve Target Repository

This skill must work in two scenarios: (a) CWD is a git repository (direct mode) and (b) CWD is a workspace containing one or more git repositories nested inside (workspace mode). Resolve the target repo before running any git command.

**Inputs:**
- `CWD` and `Is git repo` from the Dynamic Context block above
- `config.json` in this skill's directory, specifically the `workspace` block:
  ```json
  {
    "workspace": {
      "mode": "auto",
      "default_target": "",
      "known_repos": []
    }
  }
  ```
- Any explicit user argument naming a repo (e.g. `commit on lib-purchaseai`)

**Resolution algorithm:**

1. Read `config.json` from this skill's directory.
2. **Repo mode detection**: if `Is git repo` == `true` AND `workspace.mode != "multi-repo"` → set `target_path = "."`, skip to step 6 (direct mode).
3. **Workspace mode**: resolve target by priority:
   a. **Explicit user argument** — if the user named a repo, match against `known_repos[].name` first, else against `known_repos[].path`, else against any directory at `<CWD>/<arg>` containing a `.git/` entry.
   b. **`workspace.default_target`** — if non-empty AND the resolved path exists AND contains `.git/`, use it.
   c. **Single known repo** — if `known_repos.length == 1` AND the path is valid, use it.
   d. **Multiple known repos** — call `AskUserQuestion` listing `known_repos[].name` as options. Add an "Other / scan again" option.
   e. **Empty `known_repos`** — scan with `find . -maxdepth 2 -name .git -type d 2>/dev/null | grep -v "/worktrees/" | grep -v "/.claude/"`. Each match's parent directory is a repo. Populate a discovery list with `{name: <basename>, path: <relative>}`. If exactly one → use it. If many → AskUserQuestion. If none → report "no git repository found" and stop.
4. Store the choice in two variables for the rest of the skill:
   - `target_path` — relative or absolute path to the repo (input to `git -C`)
   - `target_owner_repo` — owner/repo string for `gh` (compute via `git -C <target_path> remote get-url origin`, parse SSH or HTTPS form, e.g., `git@github.com:owner/repo.git` → `owner/repo`). Not used by `git:commit` directly but kept for parity across skills.
5. **Configuration write-back (opt-in only)**: if any of these conditions hold, propose a write-back via `AskUserQuestion`. Never write silently; never overwrite a non-empty value without explicit confirmation:
   - Step 3.e populated new `known_repos` from a scan → "Save these N repos to `known_repos` so I don't re-scan?"
   - User chose a repo via 3.d that's not yet in `known_repos` → "Add it to `known_repos`?"
   - User chose a repo and the conversation suggests permanence ("always", "default") → "Set as `default_target`?"
   - The skill detected a recurring JIRA prefix in the last 10 commits and `jira_project_prefix` is empty → "Save `jira_project_prefix: <PREFIX>`?"
   On confirmation, use the `Write` tool to update `config.json` (preserve all other fields, write the file atomically).
6. From this point on, **every** git command in this skill uses `git -C <target_path> <subcommand>`. Never `cd <target_path> && git ...` — Claude Code's anti-pattern alert blocks compound `cd && git` even with allowlists.

**Anti-patterns:**
- 🚫 `cd <target_path> && git <cmd>` — blocked by Claude Code, prompts user, cannot be silenced.
- 🚫 Pre-resolving git state in frontmatter (`!`<git-cmd>``) without `|| echo "__NO_GIT__"` — fails skill loading when CWD is not a git repo.
- 🚫 Silently writing to `config.json` based on a single signal — always confirm with the user before persisting.

## Process

1. Run `git -C <target_path> status` to see all untracked and modified files.
2. Run `git -C <target_path> diff --staged` to see staged changes.
3. Run `git -C <target_path> log --oneline -5` to understand the commit style used in this repo.
4. Analyze the changes and draft a commit message following Conventional Commits.
5. Stage relevant files (`git -C <target_path> add <file>`) and create the commit (`git -C <target_path> commit -m "..."`).

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
