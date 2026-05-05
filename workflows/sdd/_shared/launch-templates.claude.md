# SDD Launch Templates

<!-- SYNC WITH: launch-templates.copilot.md, launch-templates.opencode.md, launch-templates.md -->

## Generic Sub-Agent Template

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
  - Artifact directory: {project path}/.sdd/{change-name}/ (already created)
  - Previous artifacts: {list of {project path}/.sdd/{change-name}/ files to read}

  TASK:
  {specific task description}'
)
```

---

## Implement Phase: Sequential Batch Template (foreground)

For `Parallel=No` batches, or batches that depend on other batches in the same wave.

```
Agent(
  description: 'implement wave {N} for {change-name}',
  subagent_type: 'sdd-implementer',
  run_in_background: false,
  prompt: 'CONTEXT:
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

---

## Implement Phase: Parallel Batch Template (background)

For `Parallel=Yes` batches with no cross-dependencies. Launch all such batches simultaneously via multiple `Agent()` calls in a single message.

```
Agent(
  description: 'implement batch {batch-id} for {change-name}',
  subagent_type: 'sdd-implementer',
  run_in_background: true,
  prompt: 'CONTEXT:
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

---

## Background Execution Guide

`run_in_background: true` is allowed ONLY for `Parallel=Yes` implement batches. Every other phase and batch type must use foreground.

| Phase | Default Mode | Background Allowed? |
|-------|--------------|---------------------|
| explore | foreground | No (orchestrator needs envelope for auto-transition) |
| plan | foreground | No (Deep Interview is interactive) |
| implement (sequential) | foreground | No (dependent or `Parallel=No`) |
| implement (parallel) | background | Yes (`Parallel=Yes`, no cross-deps) |
| review | foreground | No (single pass; needs envelope for fix-cycle decision) |

Background `Agent()` returns when complete; the orchestrator reads the envelope from the return value (same as foreground). Sub-agents also write all artifacts to `.sdd/{change}/` files as the primary persistence channel.

---

## Plan Phase: Re-entry with Crit Feedback Template

```
Agent(
  description: 'plan re-entry (crit round {N}) for {change-name}',
  subagent_type: 'sdd-planner',
  run_in_background: false,
  prompt: 'CONTEXT:
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
  content: "ACTIVE SDD workflow: {change}. Workdir: .sdd/{change}/. Phase: starting explore."
)
```

This enables compaction recovery (see `_shared/recovery.md`).
