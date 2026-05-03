> **Scope**: this file is consumed by **Codex and Factory** variants only.
> Other variants use their own launch-template files.

---

# SDD Launch Templates

Launch prompts carry **dynamic context only** — project path, change name, artifact list, batch directive. The full operational contract for each phase (persistence, envelope format, wave-scope discipline, quality gate, large-file rules) lives in the phase's `SKILL.md` and the shared contracts under `_shared/` (`persistence-contract.md`, `envelope-contract.md`). Sub-agents load `sdd-{phase}/SKILL.md` at start; the launch prompt does NOT need to repeat the contract.

## Generic Sub-Agent Template

All SDD phases use this template. Replace `{phase}` with explore/plan/implement/review.

| Phase | Subagent Type |
|-------|---------------|
| explore | `{WORKFLOW_SUBAGENT_EXPLORER}` |
| plan | `{WORKFLOW_SUBAGENT_PLANNER}` |
| implement | `{WORKFLOW_SUBAGENT_IMPLEMENTER}` |
| review | `{WORKFLOW_SUBAGENT_REVIEWER}` |

```
Task(
  description: '{phase} for {change-name}',
  subagent_type: '{subagent type from table above}',
  model: '{model from Phase-to-Model Table}',
  run_in_background: false,  // set true only for parallel implement batches
  prompt: 'Load your phase instructions:

  Skill(skill: "sdd-{phase}", args: "{change-name}")

  If the Skill tool fails, fall back to {project path}/{SKILLS_PATH}/sdd-{phase}/SKILL.md.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: {project path}/.sdd/{change-name}/ (already created)
  - Previous artifacts: {list of {project path}/.sdd/{change-name}/ files to read}

  TASK:
  {specific task description}'
)
```

## Implement Phase: Sequential Batch Template (foreground)

For `Parallel=No` batches, or batches that depend on other batches in the same wave.

```
Task(
  description: 'implement wave {N} for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_IMPLEMENTER}',
  model: '{WORKFLOW_MODEL_IMPLEMENTER}',
  run_in_background: false,
  prompt: 'Load your phase instructions:

  Skill(skill: "sdd-implement", args: "{change-name}")

  If that fails, fall back to {project path}/{SKILLS_PATH}/sdd-implement/SKILL.md.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: {project path}/.sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md

  TASK:
  Implement ONLY these batches from this wave:
  {paste batch table rows for this wave only}

  Previously completed batches: {list of completed batch IDs}'
)
```

## Implement Phase: Parallel Batch Template (background)

For `Parallel=Yes` batches with no cross-dependencies. Launch all such batches simultaneously via multiple `Task()` calls in a single message.

```
Task(
  description: 'implement batch {batch-id} for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_IMPLEMENTER}',
  model: '{WORKFLOW_MODEL_IMPLEMENTER}',
  run_in_background: true,
  prompt: 'Load your phase instructions:

  Skill(skill: "sdd-implement", args: "{change-name}")

  If that fails, fall back to {project path}/{SKILLS_PATH}/sdd-implement/SKILL.md.

  BACKGROUND MODE: you cannot interact with the user (no AskUserQuestion). Write all output to {project path}/.sdd/{change-name}/ files — they are the primary communication channel.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: {project path}/.sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md

  TASK:
  Implement ONLY this batch from the wave:
  {paste batch table rows for this batch only}

  Previously completed batches: {list of completed batch IDs}'
)
```

## Background Execution Guide

`run_in_background: true` is allowed ONLY for `Parallel=Yes` implement batches. Every other phase and batch type must use foreground.

| Phase | Default Mode | Background Allowed? |
|-------|--------------|---------------------|
| explore | foreground | No (orchestrator needs envelope for auto-transition) |
| plan | foreground | No (Deep Interview is interactive) |
| implement (sequential) | foreground | No (dependent or `Parallel=No`) |
| implement (parallel) | background | Yes (`Parallel=Yes`, no cross-deps) |
| review | foreground | No (single pass; needs envelope for fix-cycle decision) |

`run_in_background` is natively supported by Claude Code. Codex / OpenCode / Copilot / Factory fall back to sequential foreground for all batches.

## Plan Phase: Re-entry with Crit Feedback Template

```
Task(
  description: 'plan re-entry (crit round {N}) for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_PLANNER}',
  model: 'opus',
  run_in_background: false,
  prompt: 'Load your phase instructions:

  Skill(skill: "sdd-plan", args: "{change-name}")

  If that fails, fall back to {project path}/{SKILLS_PATH}/sdd-plan/SKILL.md.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: {project path}/.sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md (EXISTING — revise, do not recreate)

  CRIT_FEEDBACK (Round {N}):
  {formatted markdown list of unresolved comments from .crit.json}'
)
```

The orchestrator populates `{formatted markdown list}` using the CRIT_FEEDBACK format defined in the Crit Plan Review Protocol section of ORCHESTRATOR.md.

## Initial Workflow Marker

Before the FIRST sub-agent launch in a new SDD workflow, the orchestrator saves (if engram available):

```
mem_save(
  topic_key: "sdd/{change}/active-workflow",
  type: "architecture", project: "{project}",
  title: "sdd/{change}/active-workflow",
  content: "ACTIVE SDD workflow: {change}. Orchestrator: {WORKFLOW_DIR}/ORCHESTRATOR.md. Phase: starting explore."
)
```

This enables compaction recovery (see `_shared/recovery.md`).
