---
name: git-pull-request
description: "Create pull requests with template selection and platform auto-detection (GitHub/GitLab)."
allowed-tools:
  - Bash(git:*)
  - Bash(gh:*)
  - Bash(pwd)
  - Bash(find:*)
  - Read
  - Write
  - AskUserQuestion
model: sonnet
---

# git:pull-request

Create pull requests with auto-detection for GitHub and GitLab platforms.

## When to Invoke

Invoke this skill when the user requests "create PR", "create pull request", or "open a pull request".

## Dynamic Context (pre-resolved)

- **CWD**: !`pwd`
- **Is git repo**: !`git rev-parse --is-inside-work-tree 2>/dev/null || echo "__NO_GIT__"`

> Heavy git context (status, diff, log, base branch) is resolved in **Step 0** below using `git -C <target_path>` after the target repo is determined. This avoids frontmatter pre-execution failures when CWD is a workspace, not a repo.

## Configuration

This skill reads `config.json` from its own directory:
- `default_base_branch` — Base branch for PR target (default: "main")
- `jira_project_prefix` — Expected JIRA project prefix (optional)
- `pr_platform` — Force platform override: "github" or "gitlab" (auto-detected if empty)
- `workspace` — Workspace-aware target resolution. See **Step 0** below.

**Configuration write-back (opt-in)**: the skill may propose updates to `config.json` (via `Write` tool) when it learns something new. Always asks via `AskUserQuestion` before persisting; never overwrites a non-empty value silently.

## Step 0: Resolve Target Repository

This skill must work in two scenarios: (a) CWD is a git repository (direct mode) and (b) CWD is a workspace containing one or more git repositories nested inside (workspace mode). Resolve the target repo before running any git/gh command.

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
- Any explicit user argument naming a repo (e.g. `open PR on lib-purchaseai`)

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
   - `target_owner_repo` — owner/repo string for `gh` (compute via `git -C <target_path> remote get-url origin`, parse SSH or HTTPS form, e.g., `git@github.com:owner/repo.git` → `owner/repo`)
5. **Configuration write-back (opt-in only)**: if any of these conditions hold, propose a write-back via `AskUserQuestion`. Never write silently; never overwrite a non-empty value without explicit confirmation:
   - Step 3.e populated new `known_repos` from a scan → "Save these N repos to `known_repos` so I don't re-scan?"
   - User chose a repo via 3.d that's not yet in `known_repos` → "Add it to `known_repos`?"
   - User chose a repo and the conversation suggests permanence ("always", "default") → "Set as `default_target`?"
   - The skill detected `pr_platform` from a remote URL and the field is empty → "Save `pr_platform: <github|gitlab>`?"
   On confirmation, use the `Write` tool to update `config.json` (preserve all other fields, write the file atomically).
6. From this point on, **every** git command in this skill uses `git -C <target_path> <subcommand>` and **every** gh command uses `gh -R <target_owner_repo> <subcommand>`. Never `cd <target_path> && git ...` — Claude Code's anti-pattern alert blocks compound `cd && git` even with allowlists.

**Anti-patterns:**
- 🚫 `cd <target_path> && git <cmd>` — blocked by Claude Code, prompts user, cannot be silenced.
- 🚫 Pre-resolving git state in frontmatter (`!`<git-cmd>``) without `|| echo "__NO_GIT__"` — fails skill loading when CWD is not a git repo.
- 🚫 Silently writing to `config.json` based on a single signal — always confirm with the user before persisting.
- 🚫 Using `gh -C <path>` — `gh` does not support `-C`; use `-R <owner>/<repo>` instead.

## Process

1. Run `git -C <target_path> status` and `git -C <target_path> log` to understand the current branch and commits.
2. Run `git -C <target_path> diff <base-branch>...HEAD` to see all changes since diverging from base.
3. Determine the platform (GitHub via `gh -R <target_owner_repo>`, GitLab via `glab` from `target_path`).
4. Analyze all commits to draft a PR title and summary.
5. Create the PR using the platform CLI (`gh pr create -R <target_owner_repo> ...` for GitHub).

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
- Always push the current branch first (`git -C <target_path> push -u origin HEAD`).
- Never use `--force` unless the user explicitly requests it.
- Return the PR URL when done.

Before finalizing your PR, check `gotchas.md` for common Claude mistakes when creating pull requests.
