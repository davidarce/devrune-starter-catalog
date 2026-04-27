# SDD Launch Templates

<!-- SYNC WITH: launch-templates.claude.md, launch-templates.copilot.md
     When editing invocation syntax, contract sections (WAVE-SCOPE, QUALITY GATE,
     PERSISTENCE, ENVELOPE), or template structure in this file, apply equivalent
     changes to the other two variant files listed above. Each file targets a
     different invocation mechanism (Agent() / @agent-name / Task()) but carries
     the same operational contract. -->

> **Note**: This file is consumed by the **OpenCode** variant only.
> The installed name is always `launch-templates.md` (devrune install strips the `.opencode.md` suffix).
> All internal references use `launch-templates.md` — never `launch-templates.opencode.md`.

---

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
  prompt: 'Your instructions are in {WORKFLOW_DIR}/sdd-{phase}/SKILL.md — read it first, then follow those instructions.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/ (already created)
  - Previous artifacts: {list of .sdd/{change-name}/ files to read}

  TASK:
  {specific task description for this phase}

  PERSISTENCE: See {project path}/{WORKFLOW_DIR}/_shared/persistence-contract.md
  - Primary: always write to .sdd/{change-name}/
  - Engram: save summary if available, skip silently if not
  - Save significant discoveries/decisions/bugfixes to engram independently of phase artifacts

  ENVELOPE: Your LAST output MUST be the SDD Envelope as a markdown table per
  `{WORKFLOW_DIR}/_shared/envelope-contract.md`. Nothing may follow the envelope.'
)
```

> **OpenCode note**: OpenCode agent files are 1-line prompts in `opencode.json` and have no native
> skill pre-loading mechanism. The Skill-load directive above ("read SKILL.md first") is intentional
> and must be retained in every prompt template. If a future OpenCode renderer inlines SKILL.md
> content into the agent prompt, this directive can be dropped at that time.

---

## Implement Phase: Sequential Batch Template (foreground)

The implement phase is special: the orchestrator reads plan.md and launches one sub-agent per batch or wave. Use this template for each batch. OpenCode does not support `run_in_background` — all batches execute as foreground Task() calls, one at a time.

```
Task(
  description: 'implement batch {batch-id} for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_IMPLEMENTER}',
  prompt: 'Your instructions are in {WORKFLOW_DIR}/sdd-implement/SKILL.md — read it first, then follow those instructions.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md

  TASK:
  Implement ONLY the following batch from this wave:

  | Batch | Tasks | File | Parallel | Depends on |
  |-------|-------|------|----------|------------|
  {paste the single batch row for this wave}

  Read the full task detail from plan.md for each task listed above.

  Previously completed batches: {list of completed batch IDs, or "none" if first wave}

  After implementing each task:
  1. Mark completed tasks as [X] in plan.md IMMEDIATELY (not at the end)
  2. Run the Phase Checkpoint from plan.md for this batch (not a generic test suite) —
     if any checkpoint fails, STOP and return envelope with status: failed
  3. Return the SDD Envelope with status reflecting THIS batch only

  Do NOT implement batches beyond this batch. The orchestrator manages wave progression.

  WAVE-SCOPE DISCIPLINE: Your scope is the batch listed above. Do NOT read ahead, infer,
  or launch additional Task() calls for other batches. The orchestrator owns progression.

  PERSISTENCE: See {project path}/{WORKFLOW_DIR}/_shared/persistence-contract.md
  - Primary: always write to .sdd/{change-name}/
  - Engram: save summary if available, skip silently if not

  QUALITY GATE: After the LAST task of each batch, run the Phase Checkpoint criteria
  from plan.md (the Checkpoint block for this batch). Stop and return failed if any
  checkpoint criterion fails.

  ENVELOPE: Your LAST output MUST be the SDD Envelope as a markdown table per
  `{WORKFLOW_DIR}/_shared/envelope-contract.md`. Nothing may follow the envelope.'
)
```

---

## Implement Phase: Parallel Batches (foreground-only for OpenCode)

> **OpenCode limitation**: OpenCode does not support `run_in_background`. There is no parallel
> batch template for OpenCode. When the Batch Assignment Table contains `Parallel=Yes` batches,
> execute them sequentially as foreground Task() calls — one at a time — using the Sequential
> Batch Template above.
>
> Concretely: launch batch A (foreground), wait for completion, launch batch B (foreground),
> wait for completion, etc. Do NOT attempt to launch multiple Task() calls simultaneously.

For each `Parallel=Yes` batch, use the Sequential Batch Template above with the single batch row.
Update `Previously completed batches:` before each launch.

---

## Plan Phase: Re-entry with Crit Feedback Template

When the orchestrator re-enters `sdd-plan` after a Crit review round:

```
Task(
  description: 'plan re-entry (crit round {N}) for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_PLANNER}',
  prompt: 'Your instructions are in {WORKFLOW_DIR}/sdd-plan/SKILL.md — read it first, then follow those instructions.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md (EXISTING — revise, do not recreate)

  CRIT_FEEDBACK (Round {N}):
  {formatted markdown list of unresolved comments from .crit.json}

  TASK:
  Address each comment in the CRIT_FEEDBACK block by revising plan.md.
  Reply to each addressed comment using:
    crit comment --plan {change-name} --reply-to {id} --author "Claude Code" "<what you did>"
  Skip the Deep Interview and Advice Phase (already completed).
  Re-run the Detail Quality Gate.

  PERSISTENCE: See {project path}/{WORKFLOW_DIR}/_shared/persistence-contract.md
  - Primary: always write to .sdd/{change-name}/
  - Engram: save summary if available, skip silently if not

  ENVELOPE: Your LAST output MUST be the SDD Envelope as a markdown table per
  `{WORKFLOW_DIR}/_shared/envelope-contract.md`. Nothing may follow the envelope.'
)
```

The orchestrator populates `{formatted markdown list}` using the CRIT_FEEDBACK format defined in
the Crit Plan Review Protocol section of `{WORKFLOW_DIR}/ORCHESTRATOR.opencode.md`.

---

## Initial Workflow Marker

Before the FIRST sub-agent launch in a new SDD workflow, the orchestrator saves (if engram available):

```
mem_save(
  topic_key: "sdd/{change}/active-workflow",
  type: "architecture", project: "{project}",
  title: "sdd/{change}/active-workflow",
  content: "ACTIVE SDD workflow: {change}. Orchestrator: {WORKFLOW_DIR}/ORCHESTRATOR.opencode.md. Phase: starting explore. NEXT: explore -> launch explore sub-agent"
)
```

This enables compaction recovery (see `{WORKFLOW_DIR}/_shared/recovery.md`).

---

## WAVE-SCOPE Reference

Every implement prompt includes a WAVE-SCOPE DISCIPLINE block. This is intentional and mandatory.
The directive prevents the implementer from self-orchestrating additional batches — a failure mode
observed when the implementer reads ahead in the Batch Assignment Table and launches its own Task()
calls. Under wave-driven orchestration, the orchestrator owns progression; the implementer owns only
the batch(es) explicitly listed in its launch prompt.

Summary of the rule embedded in every implement prompt:
- Implement ONLY the batch(es) listed in the TASK block
- Mark [X] in plan.md IMMEDIATELY after each task (not at the end)
- Run the Phase Checkpoint from plan.md (not a generic test suite) after each batch
- Do NOT launch Task() or Skill() calls for other batches
- Return envelope with status reflecting THIS batch/wave only
