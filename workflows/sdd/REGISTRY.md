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
1. Read `{WORKFLOW_DIR}/ORCHESTRATOR.md` FIRST and COMPLETELY — this is your playbook
2. Read `{WORKFLOW_DIR}/_shared/launch-templates.md` — these are your copy-paste templates for Task() calls
3. Create artifact directory: `mkdir -p .sdd/{change-name}` (use RELATIVE path, not absolute)
4. Follow the Orchestrator instructions to launch sub-agents via `Task()` tool

**Do NOT** try `Skill("sdd")` — the orchestrator is NOT a skill. Read the ORCHESTRATOR.md file directly.
**Do NOT** call `Skill("sdd-explore")` or any `Skill("sdd-*")` directly — those are loaded BY the sub-agent INSIDE a `Task()`. The orchestrator launches `Task()`, the sub-agent loads the Skill.

## SDD — Delegation Rules

1. The orchestrator NEVER reads/writes code and NEVER calls Skill() directly — sub-agents do that. ONLY: track state, show summaries, collect decisions, launch sub-agents via `Task()`.
2. To launch a phase: use `Task()` with prompt that tells the sub-agent to call `Skill("sdd-{phase}")`. See `{WORKFLOW_DIR}/_shared/launch-templates.md` for exact templates.
3. After EVERY sub-agent, execute the Post-Phase Protocol from ORCHESTRATOR.md — NEVER skip it.
4. Skills return envelopes; the orchestrator decides next steps. Auto-transitions: explore(ok)→plan, implement(ok)→review.

Full orchestrator instructions: {WORKFLOW_DIR}/ORCHESTRATOR.md

### SDD -- Compaction Recovery (MANDATORY)

After compaction, if memory has `sdd/*/active-workflow` observations starting with "ACTIVE":

1. Re-read `{WORKFLOW_DIR}/ORCHESTRATOR.md` and its recovery reference `{WORKFLOW_DIR}/_shared/recovery.md`.
2. Read `.sdd/{change}/state.yaml` for current phase and resume point.
3. Resume as delegate-only orchestrator via sub-agents, NEVER execute phase work inline.

If no `active-workflow` marker is found, do nothing.
