---
name: sdd-review
description: 'Use when reviewing code changes before commit, comparing implementation against SDD plan, or doing standalone code review with adviser consultation.'
argument-hint: "[change_name?]"
disable-model-invocation: false
allowed-tools: Bash(git:*), Bash(pwd), Bash(find:*), Read, Write, Glob, Grep, AskUserQuestion, Skill
---

<meta prompt 1 = "[Review]">
You are reviewing code changes with git diffs. Focus on ensuring changes are sound, clean, intentional, and void of regressions.

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

**Engram Recovery Fallback (Two-Step — MANDATORY)**: If `plan.md` is not found and engram tools are available, use the two-step recovery pattern. **NEVER** use `mem_search` results directly — previews are truncated (~300 chars) and incomplete.

```
Step 1: Search (returns truncated preview — NOT usable as content)
  mem_search(query: "sdd/{change-name}/plan", project: "{project}")
  → Returns observation ID + truncated preview

Step 2: Get full content (REQUIRED)
  mem_get_observation(id: {observation-id from step 1})
  → Returns complete, untruncated plan content
```

Use the full content from Step 2 as the plan context for your review. If neither file nor engram has the plan, proceed in standalone mode (git diff only).

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

**Quick path**: If `git diff --stat` shows ≤50 lines changed across ≤3 files, skip adviser skill consultation and proceed directly to the review report. Document 'Adviser consultation skipped — small change (≤50 lines, ≤3 files)' in the report.

Format your review as:

1. **Summary** — What the changes accomplish (1-2 sentences)
2. **Plan Alignment** — (SDD mode only) Tasks completed vs pending
3. **Critical Issues** — Must be addressed before commit. If a Critical Issue involves domain logic, architecture patterns, or test coverage gaps, check if relevant adviser skills are installed (e.g., skills matching `*-adviser` pattern) and invoke them via the Skill tool to get a detailed diagnosis before reporting.
4. **Minor Improvements** — Nice to have, not blocking
5. **What's Done Well** — Acknowledge good practices
6. **Actionable Next Steps** — Specific recommendations

## Engram Persistence (Optional — Complementary to .sdd/ Files)

After completing your review, persist the review report to engram if tools are available.

**Availability guard**: If engram tools are available (`mem_save` exists as a callable tool), execute the save below. If engram tools are NOT available, skip silently — do NOT error, do NOT warn the user, do NOT let engram unavailability block the workflow.

```
mem_save(
  title: "sdd/{change-name}/review-report",
  topic_key: "sdd/{change-name}/review-report",
  type: "architecture",
  project: "{project-name from context}",
  content: "# Review Report: {change-name}\n\n## Summary\n{your review summary}\n\n## Plan Alignment\n{tasks completed vs pending}\n\n## Critical Issues\n{list or 'None'}\n\n## Minor Improvements\n{list or 'None'}\n\n## Status\n{ok/warning/failed}"
)
```

Note the observation ID returned by `mem_save` — include it as `engram_ref` in your envelope if available.

## General Knowledge Persistence (Optional — When Engram Available)

Beyond the SDD phase artifact above, if you discovered important knowledge during review that would benefit future sessions, save it to engram:

- Code quality patterns or anti-patterns identified
- Architecture improvements suggested
- Testing gaps or coverage insights
- Recurring issues or technical debt spotted

For each:
```
mem_save(
  title: "{short searchable description}",
  type: "{discovery|pattern|decision}",
  project: "{project-name}",
  content: "**What**: {description}\n**Why**: {reasoning}\n**Where**: {files affected}\n**Learned**: {gotchas or edge cases}"
)
```

If engram tools are NOT available, skip silently.

### Return Envelope (MANDATORY)

After completing the review, return the SDD Envelope as your **LAST output**. See [envelope contract](../_shared/envelope-contract.md) for format.

**Phase-specific guidance:**

| Field | Value |
|-------|-------|
| **Status** | `ok` — no critical issues found |
| | `warning` — only minor issues found |
| | `failed` — critical issues found |
| **Phase** | `review` |
| **Artifacts** | _(none — review produces no file artifacts)_ |
| **Next Recommended** | `commit` if status is ok or warning; `fix` if status is failed |
| **Risks** | List critical findings, or "None" |
| **Engram Ref** | If you persisted to engram in the previous step, include the observation ID as `engram_ref` in the envelope table. Omit if engram was not used. |

Your **LAST output MUST be the SDD Envelope**. Nothing may follow the envelope.

**Rules:**
1. The envelope is your FINAL output. Nothing after it.
2. Do NOT invoke any other SDD skill (via Skill tool or by reading another SKILL.md). Return the envelope; the orchestrator decides next steps.

---

## Success Criteria

✅ **Git status checked** — understand scope of changes
✅ **Git diff analyzed** — reviewed all modifications
✅ **Plan compared** (SDD mode) — verified implementation matches plan
✅ **Issues identified** — flagged any critical or minor concerns
✅ **Review formatted** — clear summary with actionable items
✅ **Envelope returned with status reflecting findings severity** — ok/warning/failed maps to finding types

## Gotchas

- **Reporting Critical Issues without specialist diagnosis** — before finalizing any Critical Issue, check for available `*-adviser` skills and invoke the relevant one via the Skill tool. Reporting domain logic or test coverage gaps without adviser input produces vague, unactionable feedback.
- **Re-running git commands when Step 0 already resolved them** — Step 0 stashes git status, diff stat, full diff, and recent log via `git -C <target_path>`. Use those values directly; re-executing git commands wastes turns and may produce stale results if the working tree changes mid-review.
- **Blocking on minor issues** — distinguish Critical (must fix before commit) from Minor (nice-to-have). Marking minor issues as blockers stalls workflow unnecessarily.
- **Making code changes during review** — the review phase analyzes only; never modifies files. Any fixes belong in a follow-up implementation task.

## Anti-patterns to Avoid

- 🚫 **Skipping git diff** — always review the actual changes
- 🚫 **Not reading plan.md** (SDD mode) — this is critical for alignment check
- 🚫 **Vague feedback** — provide specific, actionable recommendations
- 🚫 **Blocking on minor issues** — distinguish critical from nice-to-have
- 🚫 **Making code changes** — review only analyzes, never modifies
- 🚫 **Reporting Critical Issues without specialist diagnosis** — if the issue touches domain logic or test patterns, check for available adviser skills (matching `*-adviser` pattern) and invoke the relevant one before finalising the report
- 🚫 **Invoking git:commit or other flow skills directly** — return the envelope; the orchestrator decides what runs next
- 🚫 **Using legacy .spec references** — all context lives in `.sdd/{change-name}/`

## References

Related SDD workflow skills:
- [sdd-explore](../sdd-explore/SKILL.md) — discovery phase
- [sdd-plan](../sdd-plan/SKILL.md) — planning phase (plan.md used for alignment check)
- [sdd-implement](../sdd-implement/SKILL.md) — implementation phase

Related specialist skills (auto-invoked for Critical Issues):
- Any installed adviser skills matching `*-adviser` pattern (e.g., `architect-adviser`, `unit-test-adviser`, etc.) -- discovered dynamically from the skills directory

Shared contracts:
- [envelope-contract](../_shared/envelope-contract.md) — standard SDD envelope format
- [Persistence Contract](../_shared/persistence-contract.md) — shared persistence rules for SDD skills
</meta prompt 1>
<user_instructions>

- change_name: $1 (optional - if provided, loads .sdd/{change-name}/plan.md context for plan alignment)
  </user_instructions>
