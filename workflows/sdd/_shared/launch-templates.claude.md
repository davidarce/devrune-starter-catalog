# SDD Launch Templates

<!-- SYNC WITH: launch-templates.copilot.md, launch-templates.opencode.md
     When editing invocation syntax, contract sections (WAVE-SCOPE, QUALITY GATE,
     PERSISTENCE, ENVELOPE), or template structure in this file, apply equivalent
     changes to the other two variant files listed above. Each file targets a
     different invocation mechanism (Agent() / @agent-name / Task()) but carries
     the same operational contract. -->

## Generic Sub-Agent Template

All SDD phases use this template. Replace `{phase}` with explore/plan/implement/review.

Subagent type mapping per phase:
| Phase | Subagent Type |
|-------|---------------|
| explore | `sdd-explorer` |
| plan | `sdd-planner` |
| implement | `sdd-implementer` |
| review | `sdd-reviewer` |

```
Agent(
  description: '{phase} for {change-name}',
  subagent_type: 'sdd-{phase}',
  run_in_background: false,
  prompt: 'CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/ (already created)
  - Previous artifacts: {list of .sdd/{change-name}/ files to read}

  TASK:
  {specific task description}

  PERSISTENCE: See {project path}/.claude/skills/sdd-orchestrator/_shared/persistence-contract.md
  - Primary: always write to .sdd/{change-name}/
  - Engram: save summary if available, skip silently if not
  - Save significant discoveries/decisions/bugfixes to engram independently of phase artifacts

  ENVELOPE: Your LAST output MUST be the SDD Envelope as a markdown table per
  `_shared/envelope-contract.md`. Nothing may follow the envelope.'
)
```

> **Claude note**: Sub-agents auto-load their assigned skill via the `skills:` frontmatter in their
> agent file (e.g. `sdd-planner.md` has `skills: [sdd-plan]`). The prompt above carries ONLY the
> dynamic context — no Skill-load directive is needed or should be added.

---

## Implement Phase: Sequential Batch Template (foreground)

The implement phase is special: the orchestrator reads plan.md and launches one sub-agent per batch
or wave. Use this template for `Parallel=No` batches or when a batch has dependencies on other
batches in the same wave.

```
Agent(
  description: 'implement wave {N} for {change-name}',
  subagent_type: 'sdd-implementer',
  run_in_background: false,
  prompt: 'CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md

  TASK:
  Implement ONLY the following batches from this wave:
  {paste batch table rows for this wave only}

  Previously completed batches: {list of completed batch IDs}

  WAVE-SCOPE DISCIPLINE:
  - Implement ONLY the listed batches above.
  - Do NOT infer additional batches from the Batch Assignment Table.
  - Do NOT launch Agent()/Task() calls to implement other batches — orchestrator manages progression.
  - Mark ONLY listed batch tasks as [X] in plan.md IMMEDIATELY after each task.
  - Return envelope with status reflecting THIS wave only.

  QUALITY GATE (per-batch):
  After the LAST task of each batch: read the Phase Checkpoint block from plan.md that covers
  this batch phase. Run each checkpoint bullet as a verifiable command (build/test/lint).
  If any checkpoint fails: STOP, return envelope with status: failed.

  PERSISTENCE: See {project path}/.claude/skills/sdd-orchestrator/_shared/persistence-contract.md
  - Primary: always write to .sdd/{change-name}/
  - Engram: save summary if available, skip silently if not

  ENVELOPE: Your LAST output MUST be the SDD Envelope as a markdown table per
  `_shared/envelope-contract.md`. Nothing may follow the envelope.'
)
```

---

## Implement Phase: Parallel Batch Template (background)

Use this template for `Parallel=Yes` batches with no cross-dependencies within the wave. Launch all
such batches simultaneously using multiple Agent() calls in a single message.

The orchestrator waits for all background agents to complete via notification before running the
Post-Phase Protocol.

```
Agent(
  description: 'implement batch {batch-id} for {change-name}',
  subagent_type: 'sdd-implementer',
  run_in_background: true,
  prompt: 'CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md

  TASK:
  Implement ONLY the following batch from this wave:
  {paste batch table rows for this batch only}

  Previously completed batches: {list of completed batch IDs}

  WAVE-SCOPE DISCIPLINE:
  - Implement ONLY the listed batch above.
  - Do NOT infer additional batches from the Batch Assignment Table.
  - Do NOT launch Agent()/Task() calls to implement other batches — orchestrator manages progression.
  - Mark ONLY listed batch tasks as [X] in plan.md IMMEDIATELY after each task.
  - Return envelope with status reflecting THIS batch only.

  QUALITY GATE (per-batch):
  After the LAST task of each batch: read the Phase Checkpoint block from plan.md that covers
  this batch phase. Run each checkpoint bullet as a verifiable command (build/test/lint).
  If any checkpoint fails: STOP, return envelope with status: failed.

  BACKGROUND MODE: You are running as a background sub-agent. You cannot interact with the user
  (no AskUserQuestion). Write ALL output to .sdd/{change-name}/ files — these artifact files are
  the primary communication channel. Mark completed tasks as [X] in plan.md IMMEDIATELY after
  each task.

  PERSISTENCE: See {project path}/.claude/skills/sdd-orchestrator/_shared/persistence-contract.md
  - Primary: always write to .sdd/{change-name}/
  - Engram: save summary if available, skip silently if not

  ENVELOPE: Your LAST output MUST be the SDD Envelope as a markdown table per
  `_shared/envelope-contract.md`. Nothing may follow the envelope.'
)
```

---

## Background Execution Guide

### When to Use Background Mode

Only use `run_in_background: true` for `Parallel=Yes` implement batches with no cross-dependencies
within the same wave. All other phases and batch types must use foreground (`run_in_background: false`).

### Default Mode Per Phase

| Phase | Default Mode | Background Allowed? | Rationale |
|-------|-------------|---------------------|-----------|
| explore | foreground | No | Interactive: orchestrator needs envelope immediately for auto-transition to plan. Short duration. |
| plan | foreground | No | Interactive: Deep Interview requires user Q&A. Orchestrator needs plan.md for Crit review protocol. |
| implement (sequential batch) | foreground | No | Batch has dependencies or is Parallel=No; must complete before next batch starts. |
| implement (parallel batch) | background | Yes | Parallel=Yes batches with no cross-dependencies benefit from concurrent execution. |
| review | foreground | No | Single pass, needs envelope for Post-Review Fix Cycle decisions. Short duration. |

### Output Capture

Background Agent() returns when complete; the orchestrator reads the envelope from the Agent()
return value (same as foreground). Sub-agents also write all artifacts to `.sdd/{change}/` files
(plan.md markers, state files) as the primary persistence channel.

### Limitation

Background sub-agents cannot interact with the user (no AskUserQuestion). Only implement phase
sub-agents using the Parallel Batch Template are safe for background execution since they do not
require user interaction during implementation.

---

## Plan Phase: Re-entry with Crit Feedback Template

When the orchestrator re-enters `sdd-plan` after a Crit review round:

```
Agent(
  description: 'plan re-entry (crit round {N}) for {change-name}',
  subagent_type: 'sdd-planner',
  run_in_background: false,
  prompt: 'CONTEXT:
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

  PERSISTENCE: See {project path}/.claude/skills/sdd-orchestrator/_shared/persistence-contract.md
  - Primary: always write to .sdd/{change-name}/
  - Engram: save summary if available, skip silently if not
  - Save significant discoveries/decisions/bugfixes to engram independently of phase artifacts

  ENVELOPE: Your LAST output MUST be the SDD Envelope as a markdown table per
  `_shared/envelope-contract.md`. Nothing may follow the envelope.'
)
```

The orchestrator populates `{formatted markdown list}` using the CRIT_FEEDBACK format defined in
the Crit Plan Review Protocol section of ORCHESTRATOR.md.

## Initial Workflow Marker

Before the FIRST sub-agent launch in a new SDD workflow, the orchestrator saves (if engram available):

```
mem_save(
  topic_key: "sdd/{change}/active-workflow",
  type: "architecture", project: "{project}",
  title: "sdd/{change}/active-workflow",
  content: "ACTIVE SDD workflow: {change}. Orchestrator: .claude/skills/sdd-orchestrator/ORCHESTRATOR.md. Phase: starting explore."
)
```

This enables compaction recovery (see `_shared/recovery.md`).

