# review-pr — Gotchas

Collected from implementation experience. Read before modifying or debugging this skill.

## Human-in-the-loop is mandatory

Never post findings without user approval. Some findings won't apply or need rewording. The user decides what gets published.

## Validate line numbers or the entire review fails

GitHub returns HTTP 422 if any comment references a line outside the diff. The sub-agent must parse diff hunks and verify every line before returning results.

## Use worktree, never checkout in user's directory

`git worktree add /tmp/pr-review-<N>` keeps the user's branch untouched. Always clean up after.

## `cd && git` is blocked by Claude Code

Security policy blocks all compound `cd && git/gh` commands (even for `/tmp`). Use `git -C <dir>` for git and `gh -R owner/repo` for gh. This is the #1 source of permission prompts.

## Sub-agent must load sdd-review via Skill tool

The sub-agent loads sdd-review using `Skill("sdd-review")` — not by reading the SKILL.md file manually. Advisers (`*-adviser`) are also loaded via the Skill tool.

## Keep orchestrator context clean

The diff can be thousands of lines. If loaded in the orchestrator, it wastes context (especially on Sonnet). The sub-agent handles all I/O and returns only the lightweight JSON.

## Match the user's language

All user-facing output and platform comments must be in the language the user used. JSON keys stay in English internally.

## GitLab fetch ref is different from GitHub

- GitHub: `git fetch origin pull/<N>/head:pr-review-<N>`
- GitLab: `git fetch origin merge-requests/<N>/head:pr-review-<N>`

Using the GitHub ref format on a GitLab remote will silently fail with a "couldn't find remote ref" error.

## `glab` uses different JSON field names than `gh`

Key differences when parsing CLI JSON output:

| Concept | `gh` field name | `glab` field name |
|---------|-----------------|-------------------|
| PR/MR body | `body` | `description` |
| Source branch | `headRefName` | `source_branch` |
| Target branch | `baseRefName` | `target_branch` |
| PR/MR URL | `url` | `web_url` |
| Commit SHA | `headRefOid` | `sha` |

Mixing these up produces silent empty values — the diff fetches correctly but metadata fields are blank.

## GitLab inline comments use "discussions" API, not "reviews" API

GitHub has a single `/pulls/<N>/reviews` endpoint that accepts a body, event type, and an array of comments in one call. GitLab has no equivalent. For GitLab:

- Overall review summary → `glab mr note <N> --message "<body>"`
- Inline comments → `glab api projects/:id/merge_requests/<N>/discussions --method POST` (one call per comment)

Attempting to use the GitHub reviews payload format against the GitLab API returns a 404 or 405.

## Platform detection edge cases

- Self-hosted GitLab instances may not contain "gitlab.com" in the URL — match on "gitlab" substring, not the full domain.
- GitHub Enterprise URLs contain "github" but may use a custom domain — check for "github" substring as well.
- If the remote URL is ambiguous (neither "github" nor "gitlab" found), ask the user rather than guessing.

## `glab` must be installed separately

`glab` is not bundled with common dev toolchains. If the platform resolves to GitLab but `glab` is not on PATH, fail fast with a clear message: "glab CLI is not installed. Install it from https://gitlab.com/gitlab-org/cli."
