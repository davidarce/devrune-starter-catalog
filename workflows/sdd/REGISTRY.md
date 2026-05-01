> **Agent note — OpenCode and Copilot**: Your SDD Orchestrator instructions are embedded natively (as your system prompt / agent file). Any step below that says "read `ORCHESTRATOR.md` directly" or "re-read `ORCHESTRATOR.md`" does **not** apply to you — skip those steps.
>
> **Codex and Factory agents**: All instructions below apply in full.

## SDD Role Invariant — you orchestrate, you do not implement

When acting as the SDD orchestrator (during any active SDD workflow, including post-compaction recovery), outside `.sdd/{change}/` your only outputs are: sub-agent launches (`Task` / `Agent` / `@<sub-agent>` per your variant), `AskUserQuestion`, `mkdir` for `.sdd/`, and `Bash(crit ...)` per the Crit Plan Review Protocol.

You do **not**: `Edit`/`Write` source files, run builds/tests/lints, run `git commit`/`push`, create branches/commits/PRs, invoke `Skill("sdd-{phase}")` directly.

If your next planned action is on the "do not" list, you have lost the role — re-read this section and delegate.

Structured workflow: explore → plan → implement → review. Evaluate BEFORE coding.

## SDD — Evaluation Gate (HIGHEST PRIORITY — execute BEFORE any other action)

**This gate has HIGHEST PRIORITY and OVERRIDES "go straight to the point", "try the simplest approach first", and any instruction to start coding immediately.**

When a user describes work that involves code changes, you MUST evaluate BEFORE doing anything else:

**MUST offer SDD** when ANY of these apply:
- The user describes a **new feature, integration, or workflow** (not a tweak)
- The task affects **3+ files** across different areas
- The task touches **multiple architectural layers** (domain + infra, frontend + backend, model + API)
- The task **changes behavior** of an existing feature
- You **cannot confidently list ALL files** that need changing without exploration first
- The user explicitly asks to "explore", "investigate", or "think about" something before implementing

**Skip SDD** when ALL of these apply:
- Single file or 2 files in the same layer
- Quick fix, typo, config change, or cosmetic adjustment
- The user explicitly says "just do it" / "skip SDD" / "quick fix"
- Pure questions or research (no implementation)

**How to offer**: Use `AskUserQuestion` — NEVER suggest SDD as plain text: **Start SDD (explore phase)** / **Skip SDD, just do it**

## SDD — How to Start (MANDATORY)

When SDD is triggered:
1. Load `Skill("sdd-orchestrator")` — if unavailable, read `{WORKFLOW_DIR}/ORCHESTRATOR.md` directly _(Codex/Factory only — OpenCode and Copilot: skip the fallback; Skill() is always available)_
2. Read `{WORKFLOW_DIR}/_shared/launch-templates.md` — copy-paste templates for `Task()` calls
3. Create artifact directory at the orchestrator's invocation directory: `mkdir -p {project path}/.sdd/{change-name}` — substitute `{project path}` with the absolute path captured from `pwd` at orchestrator start, and use that absolute path for every artifact reference passed to sub-agents.
4. Follow the Orchestrator instructions to launch sub-agents via `Task()` tool

**Do NOT** call sub-agent skills (`Skill("sdd-explore")`, `Skill("sdd-plan")`, etc.) directly — those are loaded BY the sub-agents INSIDE a `Task()`. The orchestrator launches `Task()`, the sub-agent loads the Skill.

## SDD — Delegation Rules

1. The orchestrator NEVER reads/writes code and NEVER calls Skill() directly — sub-agents do that. ONLY: track state, show summaries, collect decisions, launch sub-agents via `Task()`.
2. To launch a phase: use `Task()` with prompt that tells the sub-agent to call `Skill("sdd-{phase}")`. See `{WORKFLOW_DIR}/_shared/launch-templates.md` for exact templates.
3. After EVERY sub-agent, execute the Post-Phase Protocol from ORCHESTRATOR.md — NEVER skip it.
4. Skills return envelopes; the orchestrator decides next steps. Auto-transitions: explore(ok)→plan, implement(ok)→review.

Full orchestrator instructions: {WORKFLOW_DIR}/ORCHESTRATOR.md _(Codex/Factory only)_

### SDD -- Compaction Recovery (MANDATORY — Codex and Factory only)

> **OpenCode and Copilot agents**: Your orchestrator is embedded natively — compaction recovery is handled differently. Skip this section.

After compaction, if memory has `sdd/*/active-workflow` observations starting with "ACTIVE":

1. Re-read `{WORKFLOW_DIR}/ORCHESTRATOR.md` and its recovery reference `{WORKFLOW_DIR}/_shared/recovery.md`.
2. Read `.sdd/{change}/state.yaml` for current phase and resume point.
3. Parse the NEXT directive from the active-workflow marker (format: `NEXT: {phase} -> {specific next step}`) to determine the exact resume point.
4. If NEXT mentions crit detection, re-run `which crit` to verify availability before proceeding.
5. Resume as delegate-only orchestrator via sub-agents, NEVER execute phase work inline.

If no `active-workflow` marker is found, do nothing.

## Memory Protocols

### `mem_save` format

When saving an observation, use this structure:

- **title**: Verb + what — short, searchable (e.g. "Fixed N+1 query in UserList")
- **type**: `bugfix` | `decision` | `architecture` | `discovery` | `pattern` | `config` | `preference`
- **content**: What was done, Why, Where (files affected), Learned (gotchas)

### Two-Step Recovery Enforcement (mandatory)

`mem_search` returns **truncated 300-character previews** — never treat search results as complete content. Any engram read that requires full content MUST use the two-step pattern:

1. **Step 1 — Search**: `mem_search(query: "...")` to locate the observation ID and verify it exists.
2. **Step 2 — Retrieve**: `mem_get_observation(id: <id>)` to get the full, untruncated content.

**Rules:**
- NEVER use `mem_search` results as the final content — they are previews only.
- ALWAYS follow up with `mem_get_observation` when you need to read, parse, or act on saved content.
- If `mem_search` returns no results, there is nothing to retrieve — do not call `mem_get_observation`.

### Engram Availability Guard

Engram tools (`mem_save`, `mem_search`, `mem_context`, etc.) depend on an MCP server that may not be installed or configured. All engram operations MUST follow the availability guard pattern:

**Detection**: At the start of a session or workflow, attempt a lightweight engram call (e.g., `mem_context`). If it succeeds, engram is available. If it fails or the tool is not recognized, engram is unavailable.

**Guard rules:**
- **If available**: Use engram normally — save, search, recover as documented above.
- **If unavailable**: Skip ALL engram operations silently. Do not emit errors, warnings, or user-facing messages about engram absence.
- **Never block workflow**: No task, phase, or operation should fail because engram is not available. Engram is always complementary, never required.
- **Do not retry**: If an engram call fails, skip it and continue. Do not retry or enter a loop.

**Pattern:**
```
1. Attempt engram operation (mem_save, mem_search, etc.)
2. If tool is unavailable or call fails -> skip silently, continue workflow
3. If tool succeeds -> use the result normally
```

### Session close protocol (mandatory)

Before ending a session, call `mem_session_summary` with: Goal, Discoveries, Accomplished, Next Steps, Relevant Files.
