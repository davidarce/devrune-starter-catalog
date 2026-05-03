---
name: sdd-review
description: 'Use when reviewing code changes before commit, comparing implementation against SDD plan, or doing standalone code review with advisor consultation.'
argument-hint: "[change_name?]"
disable-model-invocation: false
allowed-tools: Bash(git:*), Bash(pwd), Bash(find:*), Read, Write, Glob, Grep, AskUserQuestion, Skill
---

## Dynamic Context (pre-resolved)

- **CWD**: !`pwd`
- **Is git repo**: !`git rev-parse --is-inside-work-tree 2>/dev/null || echo "__NO_GIT__"`

> Heavy git context (base branch, status, diff, log) is resolved in **Step 0** below using `git -C <target_path>` after the target repo is determined. This avoids frontmatter pre-execution failures when CWD is a workspace, not a repo.

## Configuration

This skill reads `config.json` from its own directory (if present):
- `workspace` — Workspace-aware target resolution. See **Step 0** below for the schema and algorithm. If `config.json` is absent, the skill falls back to scanning the CWD on each invocation.

### Configuration write-back (opt-in)

The skill may propose updates to `config.json` (via `Write` tool) when it discovers repos in a workspace or the user asks to "always" review a specific repo. **Write-back is always opt-in**: the skill asks via `AskUserQuestion` before persisting, never overwrites a non-empty value silently, and only modifies its own `config.json`.

## Step 0: Resolve Target Repository

This skill must work in two scenarios: (a) CWD is a git repository (direct mode) and (b) CWD is a workspace containing one or more git repositories nested inside (workspace mode). Resolve the target repo before any git command.

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
- Any explicit user argument naming a repo

**Resolution algorithm:**

1. Read `config.json` from this skill's directory (if it exists; otherwise treat as empty `workspace` block).
2. **Repo mode detection**: if `Is git repo` == `true` AND `workspace.mode != "multi-repo"` → set `target_path = "."`, skip to step 6 (direct mode).
3. **Workspace mode**: resolve target by priority:
   a. **Explicit user argument** — if the user named a repo, match against `known_repos[].name` first, else against `known_repos[].path`, else against any directory at `<CWD>/<arg>` containing a `.git/` entry.
   b. **`workspace.default_target`** — if non-empty AND the resolved path exists AND contains `.git/`, use it.
   c. **Single known repo** — if `known_repos.length == 1` AND the path is valid, use it.
   d. **Multiple known repos** — call `AskUserQuestion` listing `known_repos[].name` as options. Add an "Other / scan again" option.
   e. **Empty `known_repos`** — scan with `find . -maxdepth 2 -name .git -type d 2>/dev/null | grep -v "/worktrees/" | grep -v "/.claude/"`. Each match's parent directory is a repo. Populate a discovery list with `{name: <basename>, path: <relative>}`. If exactly one → use it. If many → AskUserQuestion. If none → report "no git repository found" and stop.
4. Store `target_path` for the rest of the skill (input to `git -C`).
5. **Configuration write-back (opt-in only)**: if `config.json` exists and any of these conditions hold, propose a write-back via `AskUserQuestion`. Never write silently; never overwrite a non-empty value without explicit confirmation:
   - Step 3.e populated new `known_repos` from a scan → "Save these N repos to `known_repos` so I don't re-scan?"
   - User chose a repo via 3.d that's not yet in `known_repos` → "Add it to `known_repos`?"
   - User chose a repo and the conversation suggests permanence ("always", "default") → "Set as `default_target`?"
   On confirmation, use the `Write` tool to update `config.json` (preserve all other fields, write the file atomically).
6. **Resolve heavy git context** with `target_path`:
   - Base branch: `git -C <target_path> symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || echo "origin/main"` (fallback chain: try also `origin/master` if `origin/main` doesn't exist)
   - Status: `git -C <target_path> status --short`
   - Diff stat (vs base): `git -C <target_path> diff --stat <base>...HEAD`
   - Diff (vs base): `git -C <target_path> diff <base>...HEAD`
   - Recent log: `git -C <target_path> log --oneline <base>..HEAD`

   Use these values from this point forward. **Never** `cd <target_path> && git ...` — Claude Code's anti-pattern alert blocks compound `cd && git` even with allowlists.

**Two Operating Modes:**

1. **Standalone Mode** (no arguments): Analyze the git diff resolved above without SDD context
2. **SDD Context Mode** (with change_name): Compare implementation against `.sdd/{change-name}/plan.md`

---

## Workflow

### Step 1: Gather Context

The git status, diff, and log were resolved in **Step 0** using `git -C <target_path>`. Use those values directly — no need to re-execute git commands.

**If change_name provided:**
- Read `.sdd/{change-name}/plan.md` to understand expected changes
- Read `.sdd/{change-name}/exploration.md` for additional context if needed

If `plan.md` is not on disk, fall back to engram via the two-step recovery pattern in `_shared/persistence-contract.md`. If neither file nor engram has the plan, proceed in standalone mode (git diff only).

**Optional build verification:** If the diff includes changes to build configuration, dependency files, or structural code, run the project's build command (e.g., `make build`, `mvn compile`, `npm run build`, `go build ./...`) to verify the build still passes before reporting. This catches compilation errors that git diff alone cannot surface.

### Step 2: Analyze Changes

**If SDD context available (change_name provided):**
- Compare implementation against plan tasks
- Verify all planned changes are present
- Flag any unplanned modifications
- Check if implementation matches architectural decisions

**Always verify:**

1. **Change Correctness**:
   - Confirm the changes achieve their intended purpose
   - Check for unintended side effects or regressions
   - Validate edge cases are handled properly
   - Ensure error paths are covered

2. **Code Quality & Cleanliness**:
   - Is the code readable and self-documenting?
   - Are the changes minimal and focused?
   - Do they follow existing patterns in the codebase?
   - Are there any code smells or anti-patterns?

3. **Intentionality Check**:
   - Does every change have a clear purpose?
   - Are there any accidental modifications?
   - Is there dead code being introduced?
   - Are the commit boundaries logical?

4. **Potential Issues to Flag**:
   - Performance degradations
   - Security vulnerabilities
   - Race conditions or concurrency issues
   - Resource leaks (memory, file handles, etc.)
   - Breaking changes to internal APIs

### Step 3: Report Findings

**Quick path**: If `git diff --stat` shows ≤50 lines changed across ≤3 files, skip advisor skill consultation and proceed directly to the review report. Document 'Advisor consultation skipped — small change (≤50 lines, ≤3 files)' in the report.

Format your review as:

1. **Summary** — What the changes accomplish (1-2 sentences)
2. **Plan Alignment** — (SDD mode only) Tasks completed vs pending
3. **Critical Issues** — Must be addressed before commit. If a Critical Issue involves domain logic, architecture patterns, or test coverage gaps, check if relevant advisor skills are installed (e.g., skills matching `*-advisor` pattern) and invoke them via the Skill tool to get a detailed diagnosis before reporting.
4. **Minor Improvements** — Nice to have, not blocking
5. **What's Done Well** — Acknowledge good practices
6. **Actionable Next Steps** — Specific recommendations

## Persistence

Save the review-report artifact and any general-knowledge discoveries per `_shared/persistence-contract.md` (Phase Artifact Save Convention + General Knowledge Persistence Mandate). For this phase, `title`/`topic_key` is `sdd/{change}/review-report`.

## Return Envelope

Return the SDD Envelope as your **last** output (format: `_shared/envelope-contract.md`). Nothing may follow it.

| Field            | Value                                                                                          |
|------------------|------------------------------------------------------------------------------------------------|
| Status           | `ok` (no critical issues) · `warning` (only minor) · `failed` (critical issues)                |
| Phase            | `review`                                                                                       |
| Artifacts        | _(none — review produces no file artifacts)_                                                   |
| Next Recommended | `commit` if `ok`/`warning`; `fix` if `failed`                                                  |
| Risks            | List critical findings, or "None"                                                              |
| Engram Ref       | Observation ID from the persistence step, or omit if engram unavailable                        |

Do **not** invoke any other SDD skill or `git commit` directly — return the envelope; the orchestrator decides what runs next.

## Self-Check (before returning the envelope)

- Step 0 git context (status, diff stat, full diff, log) used directly — not re-executed.
- (SDD mode) `plan.md` was read and the implementation was compared against its tasks.
- Critical Issues that touch domain logic, architecture, or test coverage gaps include an advisor-skill diagnosis (`*-advisor`) — vague verdicts are not Critical Issues.
- Minor improvements are listed separately; they do not block.
- No file edits made during review — review analyzes only.
- Envelope status reflects the severity of findings (`failed` only when something must block commit).

## References

Specialist skills: any installed `*-advisor`. Shared contracts: [envelope-contract](../_shared/envelope-contract.md), [persistence-contract](../_shared/persistence-contract.md).

<user_instructions>

- change_name: $1 (optional - if provided, loads .sdd/{change-name}/plan.md context for plan alignment)
</user_instructions>
