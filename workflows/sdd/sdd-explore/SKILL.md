---
name: sdd-explore
description: 'Use when starting an SDD workflow to discover codebase context, curate relevant files, and prepare exploration.md for planning.'
argument-hint: "[change_name] [instructions]"
disable-model-invocation: false
allowed-tools: Bash, Bash(tree:*), Read, Glob, Grep, Write, Edit, AskUserQuestion, Skill, mcp__atlassian__jira_get_issue
---

Curate the perfect file selection and craft a precise handoff prompt for the planning phase. Do **not** implement or edit code outside `.sdd/{change-name}/`. The next phase (sdd-plan) sees only what you write to `exploration.md` — when in doubt, include rather than exclude.

Token budget for the final selection: target **50–80k tokens** across files + prompt text; exceed when completeness demands.

## Discovery Workflow

> **Incremental writing**: never accumulate all findings and write `exploration.md` in one giant `Write` at the end — that exceeds output token limits and loops the agent. Initialise the file with the template, then append/update sections via `Edit` after every 3–5 files discovered.

1. **Create the session file** with the template
   - Path: `.sdd/{change-name}/exploration.md`
   - Template: [templates/exploration_template.md](templates/exploration_template.md) (do not omit any section)
   - Use `Write` once to seed the file with placeholders. Fill `## Objective` immediately if the task is clear from the prompt.

2. **Get Jira ticket details** (only when a ticket ID was provided)
   - Tool: `mcp__atlassian__jira_get_issue` with `{"issue_key": "<ticket_id>"}`
   - Immediately after: `Edit` `## Objective` and `### Task:` in `exploration.md` with what you learned.
   - Skip this step entirely if no ticket ID was provided.

3. **Get the codebase overview**

    ```bash
    tree --gitignore -L 6
    ```

   Drill into specific directories as needed:

    ```bash
    tree --gitignore -L 3 path/to/subdirectory
    ```

   Do **not** add pipes/redirects/`head`/`tail` — `tree --gitignore -L 6` is sufficient and free of permission prompts. Use `Glob`/`Grep` for filtering, never `ls | grep` or `find`.

4. **Explore the codebase** — identify relevant files and understand the task
   - `Glob` — find files by pattern
   - `Grep` — search for keywords, types, functions where user terms appear
   - `Read` — implementation details for specific sections
   - `tree` — drill into specific directories
   - After every 3–5 files read: `Edit` `### Selected Context:` and `### Architecture:` in `exploration.md`. Do not defer.

5. **Build selection iteratively**
   - Add ALL task-relevant files as full files or directories.
   - Update `### Selected Code Structure` and `### Selected Files Tree` after each batch via `Edit`.
   - **Mode priority**: full files > slices > codemaps. Prefer full files when they fit; use slices for large files; use codemaps for architectural awareness only when budget-constrained. The next model cannot ask for more — when in doubt, include the full file. See [references/file_slicing.md](references/file_slicing.md) for slice quality rules.

6. **Craft the handoff prompt** (MANDATORY)

   The next model's entire world is what you curate. Skipping or vague handoff text forces the planner to re-derive context that exploration already resolved. Use `Edit` to update each remaining section individually — do **not** rewrite the entire file.

   Sections to finalise (one `Edit` per section):
   - `### Relationships:` — call chains and data flow
   - `### Ambiguities:` — open questions or "None"

   **Handoff Contract** — sdd-plan reads `exploration.md` expecting these exact headings, verbatim:

   - `## Objective` — what the feature must achieve
   - `## User Requirements`
     - `### Task:` — clear restatement of what needs to be done
     - `### Architecture:` — key modules and responsibilities
     - `### Selected Context:` — file paths with one-line descriptions
     - `### Relationships:` — call chains and data flow
     - `### Ambiguities:` — open questions or "None"
   - `## Selected Code Structure` — flat list of selected file paths
   - `## Selected Files Tree` — directory tree of selected files

7. **Verify** — read `exploration.md` once, confirm no `[PENDING]` placeholders remain. Fill any gaps via `Edit`.

## Persistence

Save the exploration artifact and any general-knowledge discoveries per `_shared/persistence-contract.md` (Phase Artifact Save Convention + General Knowledge Persistence Mandate). For this phase, `title`/`topic_key` is `sdd/{change}/explore`.

> Do NOT persist the full `exploration.md` (can be 50–80k tokens). Persist only the structured summary: Objective, Architecture, Selected Files (paths + one-liner), Relationships, Ambiguities — typically 2–5k tokens.

## Return Envelope

Return the SDD Envelope as your **last** output (format: `_shared/envelope-contract.md`). Nothing may follow it.

| Field            | Value                                                                                                                                |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Status           | `ok` (successful exploration) · `warning` (ambiguities remain unresolved) · `blocked` (critical context is missing)                  |
| Phase            | `explore`                                                                                                                            |
| Artifacts        | `.sdd/{change-name}/exploration.md`                                                                                                  |
| Next Recommended | `/sdd-plan {change-name}`                                                                                                            |
| Risks            | Architectural concerns, missing test coverage, unclear requirements; or "None"                                                       |
| Engram Ref       | Observation ID from the persistence step, or omit if engram unavailable                                                              |

Do **not** invoke `sdd-plan` (or any other SDD skill) yourself — return the envelope; the orchestrator handles phase transitions.

## Self-Check (before returning the envelope)

- `exploration.md` was written **incrementally** via `Edit` after each batch of files — not in one large `Write` at the end.
- Selection was **executed** (not just planned), targeting 50–80k tokens; over budget is acceptable when completeness demands it.
- Any file that might be edited is included with full implementation, not codemap-only.
- Handoff prompt explains what's included and why; no proposed solutions or implementation approaches in `exploration.md`.
- Selection covers context for **different approaches**, not only your imagined solution — the next model may solve it differently.
- Jira ticket fetched (Step 2) when a ticket ID was provided.
- Did not invoke any other SDD skill, did not edit code outside `.sdd/{change-name}/`.

## References

Related SDD workflow skills: [sdd-plan](../sdd-plan/SKILL.md), [sdd-implement](../sdd-implement/SKILL.md), [sdd-review](../sdd-review/SKILL.md). Shared contracts: [persistence-contract](../_shared/persistence-contract.md), [envelope-contract](../_shared/envelope-contract.md). Phase-specific reference material: [file_slicing.md](references/file_slicing.md).

<user_instructions>

- $ARGUMENTS

- change_name: $1
- instructions: $2
</user_instructions>
