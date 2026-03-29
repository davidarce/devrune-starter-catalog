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

**How to offer**: Use `AskUserQuestion` — NEVER suggest SDD as plain text: **Start with /sdd-explore {topic}** / **Skip SDD, just do it**

## SDD — How to Start (MANDATORY)

When SDD is triggered:
1. Read `{SKILLS_PATH}/ORCHESTRATOR.md` FIRST and COMPLETELY — this is your playbook
2. Create artifact directory: `mkdir -p .sdd/{change-name}` (use RELATIVE path, not absolute)
3. Follow the Orchestrator instructions to launch sub-agents

**Do NOT** try `Skill("sdd")` — the orchestrator is NOT a skill. Read the ORCHESTRATOR.md file directly.

## SDD — Delegation Rules

1. The orchestrator NEVER reads/writes code — sub-agents do that. ONLY: track state, show summaries, collect decisions, launch sub-agents.
2. After EVERY sub-agent, execute the Post-Phase Protocol from ORCHESTRATOR.md — NEVER skip it.
3. Skills return envelopes; the orchestrator decides next steps. Auto-transitions: explore(ok)→plan, implement(ok)→review.

Full orchestrator instructions: {SKILLS_PATH}/ORCHESTRATOR.md

### SDD -- Compaction Recovery (MANDATORY)

After compaction, if memory has `sdd/*/active-workflow` observations starting with "ACTIVE":

1. Re-read `{SKILLS_PATH}/ORCHESTRATOR.md` and its recovery reference `{SKILLS_PATH}/_shared/recovery.md`.
2. Read `.sdd/{change}/state.yaml` for current phase and resume point.
3. Resume as delegate-only orchestrator via sub-agents, NEVER execute phase work inline.

If no `active-workflow` marker is found, do nothing.
