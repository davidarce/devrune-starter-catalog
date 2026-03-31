---
name: review-pr
description: 'Use when the user asks to review a PR/MR, review a pull request or merge request, or says "review PR <number>" or "review MR <number>". Fetches PR/MR from GitHub or GitLab, analyzes with project rules via sdd-review, and posts inline comments. Supports both GitHub (gh CLI) and GitLab (glab CLI).'
argument-hint: <pr-number> [project-dir] [focus]
metadata:
  version: "1.0"
  scope: [git, review]
  trigger: "When the user requests a PR/MR review with a number"
  auto_invoke: "User says review PR, review MR, review pull request, review merge request, review PR #123, review MR !456, or check this PR"
allowed-tools: Read, Grep, Glob, Bash(gh:*), Bash(glab:*), Bash(git:*), Bash(grep:*), Bash(grep -n:*), Bash(cd:*), Bash(cd /tmp/*), Bash(ls:*), Agent, AskUserQuestion
---

# PR / MR Reviewer

## Dynamic Context (pre-resolved)

- **Workspace root**: !`pwd`

## Configuration

This skill reads `config.json` from its own directory:
- `max_comments` — Maximum inline comments to post (default: 20)
- `review_event` — GitHub review event type (default: "COMMENT", never "APPROVE" or "REQUEST_CHANGES")
- `platform` — Platform override: "github", "gitlab", or "auto" (default: "auto" — detect from remote URL)

## Overview

This skill orchestrates PR/MR code reviews in 3 steps:
1. **Delegate** — a single sub-agent detects the platform, fetches the PR/MR, creates an isolated worktree, and analyzes using `sdd-review` with dynamic adviser discovery. Returns a structured JSON.
2. **Review with user** — present findings for user approval before publishing (human-in-the-loop)
3. **Publish** — post only user-approved findings as inline comments on the detected platform

> **Design principle**: The orchestrator NEVER loads the diff or PR/MR metadata into its own context. Everything heavy happens inside the sub-agent. You only receive the lightweight JSON result.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `pr-number` | Yes | The GitHub PR number or GitLab MR ID to review |
| `project-dir` | No | Directory containing the git repo. If relative, resolved as `<workspace-root>/<project-dir>`. If omitted, uses workspace root. |
| `focus` | No | Business logic or feature context to prioritize (e.g., "validate discount calculation logic", "check error handling in payment flow"). Findings in this area get tagged as "Business Logic". |

## Workflow

### Step 0: Detect Platform

Before resolving the project directory, detect which platform hosts this repository:

```bash
git -C <project-dir> remote get-url origin
```

| URL contains | Platform | CLI |
|--------------|----------|-----|
| `github.com` or `github` | GitHub | `gh` |
| `gitlab.com` or `gitlab` | GitLab | `glab` |
| neither | ambiguous | ask user |

If ambiguous, ask the user via AskUserQuestion: "Is this repository hosted on GitHub or GitLab?"

Store `platform` (github | gitlab) and `cli` (gh | glab) for use in all subsequent steps.

### Step 1: Resolve Project Directory

1. Absolute path → use directly
2. Relative name → `<workspace-root>/<project-dir>`
3. Not provided → workspace root (single-project workspace)
4. Ambiguous → ask user via AskUserQuestion

### Step 2: Launch Review Sub-Agent

> **CRITICAL**: Delegate ALL heavy work to the sub-agent. Do NOT fetch the diff, read PR/MR metadata, or analyze code yourself.

Launch a **general-purpose Agent** with the following prompt:

```
You are a PR/MR review sub-agent. Detect the platform, fetch PR/MR info, create an isolated worktree, analyze the changes, and return ONLY a JSON block.

## Command Rules (apply to ALL steps)

- Use `git -C <dir>` for ALL git commands. NEVER use `cd <dir> && git ...` — blocked by security policy.
- Use `gh -R <owner>/<repo>` for ALL gh read commands. `gh` does NOT support `-C`.
- Use `glab` commands from the repo directory using `git -C <dir>` patterns where possible.
- Use absolute paths (`/tmp/pr-review-<pr-number>/path/to/file`) when reading files from the worktree.

## Step A: Detect owner/repo

git -C <project-dir> remote get-url origin

Parse owner and repo from the URL (SSH or HTTPS format).

Also determine the platform from the remote URL:
- URL contains "github" → platform = github, cli = gh
- URL contains "gitlab" → platform = gitlab, cli = glab

## Step B: Fetch PR/MR Information (run in parallel where possible)

### GitHub

gh pr view <pr-number> -R <owner>/<repo> --json title,body,headRefName,baseRefName,files,url
gh pr diff <pr-number> -R <owner>/<repo>
gh pr view <pr-number> -R <owner>/<repo> --json headRefOid --jq '.headRefOid'

### GitLab

glab mr view <pr-number> --json title,description,source_branch,target_branch,web_url
glab mr diff <pr-number>
glab mr view <pr-number> --json sha --jq '.sha'

Note GitLab field name differences: `description` (not `body`), `source_branch` (not `headRefName`),
`target_branch` (not `baseRefName`), `web_url` (not `url`), `sha` (not `headRefOid`).

## Step C: Create Isolated Worktree

git -C <project-dir> worktree add /tmp/pr-review-<pr-number> --detach

### Fetch the PR/MR head — platform-conditional:

GitHub:
git -C /tmp/pr-review-<pr-number> fetch origin pull/<pr-number>/head:pr-review-<pr-number>

GitLab:
git -C /tmp/pr-review-<pr-number> fetch origin merge-requests/<pr-number>/head:pr-review-<pr-number>

Then checkout:
git -C /tmp/pr-review-<pr-number> checkout pr-review-<pr-number>

## Step D: Analyze Changes

Load the sdd-review skill via the Skill tool: Skill("sdd-review"). Follow its Standalone Mode instructions (no change_name).

When the skill says to check for *-adviser skills, discover and invoke them via the Skill tool (advisers ARE slash commands).

{if focus provided:}
## Review Focus (PRIORITY)
{focus}
Pay special attention to this area. Evaluate business logic correctness, edge cases, and intended feature behavior. Tag findings as "Business Logic".
{end if}

## Step E: Validate Line Numbers

The platform API rejects comments where the line is not in the diff (HTTP 422 on GitHub; similar on GitLab). For each finding:

1. Parse diff hunks: `@@ -old,count +new,count @@`
2. Verify the finding's line falls within a hunk range (+new to +new+count)
3. If not in any hunk → adjust to nearest valid line
4. If file has no hunks → drop the finding

## Step F: Return Results

Return ONLY this JSON (no other text):

{
  "platform": "github|gitlab",
  "owner": "<owner>",
  "repo": "<repo>",
  "head_sha": "<HEAD SHA>",
  "pr_url": "<PR/MR URL>",
  "summary": "Brief assessment",
  "verdict": "APPROVE | COMMENT | REQUEST_CHANGES",
  "highlights": ["Positive 1", "Positive 2"],
  "advisers_used": ["architect-adviser", "unit-test-adviser"],
  "findings": [
    {
      "path": "relative/path/to/file.java",
      "line": 63,
      "severity": "Critical | Major | Minor | Suggestion",
      "category": "Architecture | Code Quality | Testing | Bug Risk | Performance | Security | Business Logic",
      "rule": "adviser or rule name",
      "body": "Description with suggestion"
    }
  ]
}

Requirements:
- path must match PR/MR files list exactly
- line must be in the NEW file version (validated in Step E)
- Do NOT return the sdd-review envelope

## Step G: Cleanup Worktree

git -C <project-dir> worktree remove /tmp/pr-review-<pr-number> --force

Non-blocking if it fails.
```

**Template variables:**
- `<project-dir>` — resolved absolute path from Step 1
- `<pr-number>` — from user argument
- `{focus}` — include Review Focus section only if provided; omit otherwise

### Step 3: Present Findings to User (Human-in-the-Loop)

> **CRITICAL**: NEVER post to GitHub/GitLab without explicit user approval.

> **Language**: Present ALL output in the **same language the user used** when invoking the skill. JSON keys stay in English internally, but all user-facing text (findings, summary, highlights, posted comments) MUST match the user's language.

Present:

1. **Platform**: GitHub / GitLab
2. **Verdict**: APPROVE / COMMENT / REQUEST_CHANGES
3. **Summary**: One-line assessment
4. **Advisers used**: Which `*-adviser` skills contributed
5. **Highlights**: What the PR/MR does well
6. **Findings table**:

```
| # | Severity | Category | File:Line | Finding |
|---|----------|----------|-----------|---------|
| 1 | Critical | Bug Risk | Service.java:63 | Description... |
| 2 | Major    | Architecture | Adapter.java:120 | Description... |
```

Ask the user:
- **"Publish all"** → post all findings
- **"Publish selected: 1, 2, 5"** → post only those
- **"Skip"** → end without posting
- **"Edit"** → user modifies findings before posting

Wait for explicit response before proceeding.

### Step 4: Post Review

Using user-approved findings and `platform`, `owner`, `repo`, `head_sha` from the JSON:

#### GitHub

```bash
gh api repos/{owner}/{repo}/pulls/<pr-number>/reviews \
  --method POST \
  --input - <<'EOF'
{
  "commit_id": "<head_sha>",
  "event": "COMMENT",
  "body": "<review-summary>",
  "comments": [<approved-findings>]
}
EOF
```

#### GitLab

Post the overall review summary as a note:

```bash
glab mr note <pr-number> --message "<review-summary>"
```

Post each inline comment as a discussion (one call per comment):

```bash
glab api projects/:id/merge_requests/<pr-number>/discussions \
  --method POST \
  -f body="<comment-body>" \
  -f position[position_type]="text" \
  -f position[new_path]="<path>" \
  -f position[new_line]="<line>" \
  -f position[base_sha]="<base_sha>" \
  -f position[head_sha]="<head_sha>" \
  -f position[start_sha]="<head_sha>"
```

**Rules (both platforms):**
- Comments and summary in the **user's language**
- Review body includes: summary, advisers applied, highlights, verdict, footer `Generated with [Claude Code](https://claude.com/claude-code)`
- GitHub event MUST be `"COMMENT"`
- Max `max_comments` findings (default: 20), prioritized by severity

### Step 5: Report to User

Display: platform, advisers used, comments posted count, findings by severity, PR/MR link, verdict.

## Gotchas

See `gotchas.md` in this skill directory for the full list. Key points:

- **Human-in-the-loop is mandatory**: Never post findings without user approval.
- **Validate line numbers or the entire review fails**: Parse diff hunks; verify every line before returning results.
- **Use worktree, never checkout in user's directory**: Always clean up after.
- **`cd && git` is blocked by Claude Code**: Use `git -C <dir>` and `gh -R owner/repo`.
- **GitLab fetch ref differs from GitHub**: `merge-requests/<N>/head` not `pull/<N>/head`.
- **`glab` uses different JSON field names**: `description` not `body`, `source_branch` not `headRefName`, etc.
- **GitLab inline comments use discussions API**: One API call per comment; no batch reviews endpoint.
- **Sub-agent must load sdd-review via Skill tool**: Use `Skill("sdd-review")`, not a manual file Read.
- **Keep orchestrator context clean**: Sub-agent handles all I/O; orchestrator receives only the lightweight JSON.
- **Match the user's language**: All user-facing output and posted comments must match the user's language.

## Error Handling

| Error | Action |
|-------|--------|
| PR/MR not found | Tell user the number may be wrong or they lack access |
| No adviser skills installed | Proceed with general review only |
| Diff too large (>5000 lines) | Warn and proceed — suggest batch review |
| Sub-agent returns invalid JSON | Parse what you can; post valid findings, report errors |
| GitHub API error posting review | Show error and dump review as text for manual posting |
| GitLab API error posting discussion | Show error and dump review as text for manual posting |
| `glab` not installed | Tell user to install glab CLI from https://gitlab.com/gitlab-org/cli |
| Worktree creation fails | Fall back to direct checkout (warn user their branch will change) |
| Worktree cleanup fails | Non-blocking — user can run `git worktree remove /tmp/pr-review-<N>` manually |
| User chooses "Skip" | End without posting — display summary only |

## References

- `sdd-review` — core analysis engine (standalone mode) with dynamic adviser discovery
- `git-pull-request` — PR/MR creation (complementary: create → review)
- `git-commit` — commit automation (complementary: review → commit)
