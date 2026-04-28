> **Scope**: This file is consumed by **Codex and Factory** variants only.
> Other variants use their own launch-template files.

---

# SDD Launch Templates

## Generic Sub-Agent Template

All SDD phases use this template. Replace `{phase}` with explore/plan/implement/review.

Subagent type mapping per phase:
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
  prompt: 'You are an SDD sub-agent. Your first action MUST be to try loading your phase instructions via the Skill tool:

  Skill(skill: "sdd-{phase}", args: "{change-name}")

  If the Skill tool succeeds, follow the loaded instructions for {phase}.
  If the Skill tool fails (skill not found/not registered), fall back to reading the skill file at {project path}/{SKILLS_PATH}/sdd-{phase}/SKILL.md directly.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/ (already created)
  - Previous artifacts: {list of .sdd/{change-name}/ files to read}

  TASK:
  {specific task description}

  PERSISTENCE: See {project path}/{WORKFLOW_DIR}/_shared/persistence-contract.md
  - Primary: always write to .sdd/{change-name}/
  - Engram: save summary if available, skip silently if not
  - Save significant discoveries/decisions/bugfixes to engram independently of phase artifacts

  IMPORTANT: Your LAST output MUST be the SDD Envelope per _shared/envelope-contract.md.'
)
```

## Implement Phase: Sequential Batch Template (foreground)

The implement phase is special: the orchestrator reads plan.md and launches one sub-agent per batch or wave. Use this template for `Parallel=No` batches or when a batch has dependencies on other batches in the same wave.

```
Task(
  description: 'implement wave {N} for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_IMPLEMENTER}',
  model: '{WORKFLOW_MODEL_IMPLEMENTER}',
  run_in_background: false,
  prompt: 'You are an SDD sub-agent. Your first action MUST be to try loading:

  Skill(skill: "sdd-implement", args: "{change-name}")

  If that fails, read {project path}/{SKILLS_PATH}/sdd-implement/SKILL.md directly.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md

  TASK:
  Implement ONLY the following batches from this wave:
  {paste batch table rows for this wave only}

  Previously completed batches: {list of completed batch IDs}

  After implementing each task:
  1. Mark completed tasks as [X] in plan.md IMMEDIATELY (not at the end)
  2. Run quality gate (build/test) per task
  3. Return the SDD Envelope with status reflecting THIS wave only

  Do NOT implement batches beyond this wave. The orchestrator manages wave progression.

  PERSISTENCE: See {project path}/{WORKFLOW_DIR}/_shared/persistence-contract.md'
)
```

## Implement Phase: Parallel Batch Template (background)

Use this template for `Parallel=Yes` batches with no cross-dependencies within the wave. Launch all such batches simultaneously using multiple Task() calls in a single message.

The orchestrator waits for all background tasks to complete via notification before running the Post-Phase Protocol.

```
Task(
  description: 'implement batch {batch-id} for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_IMPLEMENTER}',
  model: '{WORKFLOW_MODEL_IMPLEMENTER}',
  run_in_background: true,
  prompt: 'You are an SDD sub-agent running in background mode. Your first action MUST be to try loading:

  Skill(skill: "sdd-implement", args: "{change-name}")

  If that fails, read {project path}/{SKILLS_PATH}/sdd-implement/SKILL.md directly.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md

  TASK:
  Implement ONLY the following batches from this wave:
  {paste batch table rows for this batch only}

  Previously completed batches: {list of completed batch IDs}

  BACKGROUND MODE: You are running as a background sub-agent. You cannot interact with the user (no AskUserQuestion). Write ALL output to .sdd/{change-name}/ files — these artifact files are the primary communication channel. Mark completed tasks as [X] in plan.md IMMEDIATELY after each task.

  After implementing each task:
  1. Mark completed tasks as [X] in plan.md IMMEDIATELY (not at the end)
  2. Run quality gate (build/test) per task
  3. Return the SDD Envelope with status reflecting THIS batch only

  Do NOT implement batches beyond this batch. The orchestrator manages wave progression.

  PERSISTENCE: See {project path}/{WORKFLOW_DIR}/_shared/persistence-contract.md'
)
```

## Background Execution Guide

### When to Use Background Mode

Only use `run_in_background: true` for `Parallel=Yes` implement batches with no cross-dependencies within the same wave. All other phases and batch types must use foreground (`run_in_background: false`).

### Default Mode Per Phase

| Phase | Default Mode | Background Allowed? | Rationale |
|-------|-------------|---------------------|-----------|
| explore | foreground | No | Interactive: orchestrator needs envelope immediately for auto-transition to plan. Short duration. |
| plan | foreground | No | Interactive: Deep Interview requires user Q&A. Orchestrator needs plan.md for Crit review protocol. |
| implement (sequential batch) | foreground | No | Batch has dependencies or is Parallel=No; must complete before next batch starts. |
| implement (parallel batch) | background | Yes | Parallel=Yes batches with no cross-dependencies benefit from concurrent execution. |
| review | foreground | No | Single pass, needs envelope for Post-Review Fix Cycle decisions. Short duration. |

### Output Capture

Background Task() returns when complete; the orchestrator reads the envelope from the Task() return value (same as foreground). Sub-agents also write all artifacts to `.sdd/{change}/` files (plan.md markers, state files) as the primary persistence channel.

### Limitation

Background sub-agents cannot interact with the user (no AskUserQuestion). Only implement phase sub-agents using the Parallel Batch Template are safe for background execution since they do not require user interaction during implementation.

### Agent Compatibility

`run_in_background` is natively supported by Claude Code. Agents that do not support background Task() execution (Codex, OpenCode, Copilot, Factory Droid) should fall back to sequential foreground execution for all batches. The `run_in_background: false` default is safe for all agents.

---

## Plan Phase: Re-entry with Crit Feedback Template

When the orchestrator re-enters `sdd-plan` after a Crit review round:

```
Task(
  description: 'plan re-entry (crit round {N}) for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_PLANNER}',
  model: 'opus',
  run_in_background: false,  // plan re-entry is always foreground (interactive crit feedback loop)
  prompt: 'You are an SDD sub-agent. Your first action MUST be to try loading your phase instructions via the Skill tool:

  Skill(skill: "sdd-plan", args: "{change-name}")

  If the Skill tool succeeds, follow the loaded instructions for plan.
  If the Skill tool fails (skill not found/not registered), fall back to reading the skill file at {project path}/{SKILLS_PATH}/sdd-plan/SKILL.md directly.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md (EXISTING — revise, do not recreate)

  CRIT_FEEDBACK (Round {N}):
  {formatted markdown list of unresolved comments from .crit.json}

  TASK:
  Address each comment in the CRIT_FEEDBACK block by revising plan.md.
  Reply to each addressed comment using: crit comment --plan {change-name} --reply-to {id} --author "Claude Code" "<what you did>"
  Skip the Deep Interview and Advice Phase (already completed).
  Re-run the Detail Quality Gate.
  Return the SDD Envelope.

  PERSISTENCE: See {project path}/{WORKFLOW_DIR}/_shared/persistence-contract.md
  - Primary: always write to .sdd/{change-name}/
  - Engram: save summary if available, skip silently if not
  - Save significant discoveries/decisions/bugfixes to engram independently of phase artifacts

  IMPORTANT: Your LAST output MUST be the SDD Envelope per _shared/envelope-contract.md.'
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
