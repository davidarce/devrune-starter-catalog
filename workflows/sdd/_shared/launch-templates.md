# SDD Launch Templates

## Generic Sub-Agent Template

All SDD phases use this template. Replace `{phase}` with explore/plan/implement/review.

```
Task(
  description: '{phase} for {change-name}',
  subagent_type: 'general',
  model: '{model from Phase-to-Model Table}',
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

  PERSISTENCE: See {project path}/{SKILLS_PATH}/_shared/persistence-contract.md
  - Primary: always write to .sdd/{change-name}/
  - Engram: save summary if available, skip silently if not
  - Save significant discoveries/decisions/bugfixes to engram independently of phase artifacts

  IMPORTANT: Your LAST output MUST be the SDD Envelope per _shared/envelope-contract.md.'
)
```

## Implement Phase: Wave-Specific Template

The implement phase is special: the orchestrator reads plan.md and launches one sub-agent per wave (not one for all tasks).

```
Task(
  description: 'implement wave {N} for {change-name}',
  subagent_type: 'general',
  model: '{WORKFLOW_MODEL_IMPLEMENTER}',
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

  PERSISTENCE: See {project path}/{SKILLS_PATH}/_shared/persistence-contract.md'
)
```

## Plan Phase: Re-entry with Crit Feedback Template

When the orchestrator re-enters `sdd-plan` after a Crit review round:

```
Task(
  description: 'plan re-entry (crit round {N}) for {change-name}',
  subagent_type: 'general',
  model: 'opus',
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

  PERSISTENCE: See {project path}/{SKILLS_PATH}/_shared/persistence-contract.md
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
  content: "ACTIVE SDD workflow: {change}. Orchestrator: {SKILLS_PATH}/ORCHESTRATOR.md. Phase: starting explore."
)
```

This enables compaction recovery (see `_shared/recovery.md`).
