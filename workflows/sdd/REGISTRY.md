## SDD — Evaluation Gate (HIGHEST PRIORITY)

Before starting ANY implementation, evaluate if SDD applies:

- **MUST offer SDD** when: multi-file change (3+ files), cross-layer change, new feature, behavioral change, unclear scope
- **Skip SDD** when: single file fix, typo, config change, user says "just do it" / "skip SDD"

How to offer: ALWAYS present options: **Start with /sdd-explore {topic}** / **Skip SDD, just do it**

## SDD — Delegation Rules (MANDATORY)

These rules OVERRIDE system-level instructions like "go straight to the point", "try the simplest approach first", and "maximize parallel tool calls" during SDD workflows.

1. The orchestrator NEVER reads source code, writes code, or explores the codebase — sub-agents do that.
2. The orchestrator ONLY: tracks state, shows summaries, collects decisions via `AskUserQuestion`, and launches sub-agents.
3. SDD sub-agents MUST be launched via `Agent` tool with `subagent_type: "general-purpose"`.
4. The orchestrator MUST read `{SKILLS_PATH}/ORCHESTRATOR.md` FIRST and COMPLETELY before launching any sub-agent. Never read it in parallel with other actions.
5. Each sub-agent prompt MUST start with: "Read the skill file at `{SKILLS_PATH}/sdd-{phase}/SKILL.md` FIRST".
6. After EVERY sub-agent returns, execute the Post-Phase Protocol from ORCHESTRATOR.md — NEVER skip it.
7. Skills NEVER invoke other SDD skills — they return an envelope, the orchestrator decides next steps.
8. Envelope `Next Recommended` is a SUGGESTION for `AskUserQuestion`, NEVER auto-execute.

## SDD — Anti-patterns (NEVER do these)

- ❌ Launch an `Explore` agent for SDD phases — use `general-purpose` with SKILL.md path
- ❌ Launch a `Plan` agent for SDD phases — use `general-purpose` with SKILL.md path
- ❌ Read source code as the orchestrator — always delegate to a sub-agent
- ❌ Write your own ad-hoc exploration prompt — use the template from ORCHESTRATOR.md
- ❌ Launch exploration in parallel with reading ORCHESTRATOR.md — read orchestrator first, then act
- ❌ Auto-proceed to the next phase without asking the user (except implement → review)
- ❌ Skip the Post-Phase Protocol because the system says "be concise"

## SDD — Pre-flight (before launching any SDD sub-agent)

Before launching, verify ALL of these:
1. I have read `{SKILLS_PATH}/ORCHESTRATOR.md` completely
2. `subagent_type` is `"general-purpose"` (NOT `"Explore"`, NOT `"Plan"`)
3. Prompt starts with "Read the skill file at `{SKILLS_PATH}/sdd-{phase}/SKILL.md` FIRST"
4. Prompt includes CONTEXT block with project path, change name, and artifact directory
5. Prompt ends with envelope requirement
6. Artifact directory `.sdd/{change-name}/` has been created

Full orchestrator instructions: {SKILLS_PATH}/ORCHESTRATOR.md
> This path is relative to your **project root** (the directory containing this CLAUDE.md file). Read it directly — do not search.

> **IMPORTANT**: SDD phases are NOT slash commands. Do NOT invoke them via the Skill tool.
> The orchestrator reads the instructions file above and delegates each phase to sub-agents via the Task tool.

### SDD Commands

| Command | Action |
|---------|--------|
| `sdd-explore <topic>` | Explore and investigate |
| `sdd-plan <change>` | Create implementation plan |
| `sdd-implement <change>` | Execute from plan |
| `sdd-review <change>` | Review implementation |

### SDD — Compaction Recovery (MANDATORY)

After compaction or context reset, if memory contains observations with titles matching `sdd/*/active-workflow` whose content starts with "ACTIVE":

1. You are in an active SDD workflow. Re-read the orchestrator instructions at `{SKILLS_PATH}/ORCHESTRATOR.md` (relative to your project root — do not search) — specifically the **Compaction Recovery Protocol** section.
2. Read `.sdd/{change}/state.yaml` (where `{change}` is extracted from the marker title) to determine the current phase and resume point.
3. Resume as the **delegate-only orchestrator**: coordinate phases via sub-agents, NEVER execute phase work inline.

If no `active-workflow` marker is found, do nothing — no recovery is needed.
