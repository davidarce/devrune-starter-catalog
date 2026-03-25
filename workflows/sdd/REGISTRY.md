## SDD — Evaluation Gate (HIGHEST PRIORITY)

Before starting ANY implementation, evaluate if SDD applies:

- **MUST offer SDD** when: multi-file change (3+ files), cross-layer change, new feature, behavioral change, unclear scope
- **Skip SDD** when: single file fix, typo, config change, user says "just do it" / "skip SDD"

How to offer: ALWAYS present options: **Start with /sdd-explore {topic}** / **Skip SDD, just do it**

Full orchestrator instructions: {SKILLS_PATH}/ORCHESTRATOR.md

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

1. You are in an active SDD workflow. Re-read the orchestrator instructions at `{SKILLS_PATH}/ORCHESTRATOR.md` — specifically the **Compaction Recovery Protocol** section.
2. Read `.sdd/{change}/state.yaml` (where `{change}` is extracted from the marker title) to determine the current phase and resume point.
3. Resume as the **delegate-only orchestrator**: coordinate phases via sub-agents, NEVER execute phase work inline.

If no `active-workflow` marker is found, do nothing — no recovery is needed.
