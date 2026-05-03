# SDD Launch Templates

<!-- SYNC WITH: launch-templates.claude.md, launch-templates.copilot.md, launch-templates.md
     When editing invocation syntax or template structure, apply equivalent changes to the
     other variant files. The operational contract (persistence, envelope, wave-scope, quality
     gate) lives in each phase's SKILL.md and in _shared/{persistence,envelope}-contract.md —
     not in launch prompts. Launch prompts carry dynamic context only. -->

> **Note**: this file is consumed by the **OpenCode** variant only. The installed name is always `launch-templates.md` (devrune install strips the `.opencode.md` suffix). All internal references use `launch-templates.md`.

Launch prompts carry **dynamic context only** — project path, change name, artifact list, batch directive. The full operational contract for each phase (persistence, envelope format, wave-scope discipline, quality gate, large-file rules) lives in `sdd-{phase}/SKILL.md` and the shared contracts (`_shared/persistence-contract.md`, `_shared/envelope-contract.md`).

> **OpenCode note**: OpenCode agent files are 1-line prompts in `opencode.json` and have no native skill pre-loading mechanism. The "read SKILL.md first" directive at the top of every prompt is intentional and must be retained. If a future OpenCode renderer inlines SKILL.md content into the agent prompt, this directive can be dropped.

---

## Generic Sub-Agent Template

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
  prompt: 'Your instructions are in {SKILLS_PATH}/sdd-{phase}/SKILL.md — read it first, then follow those instructions.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: {project path}/.sdd/{change-name}/ (already created)
  - Previous artifacts: {list of {project path}/.sdd/{change-name}/ files to read}

  TASK:
  {specific task description for this phase}'
)
```

---

## Implement Phase: Sequential Batch Template (foreground)

OpenCode does not support `run_in_background` — all batches execute as foreground `Task()` calls, one at a time, regardless of the `Parallel` column.

```
Task(
  description: 'implement batch {batch-id} for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_IMPLEMENTER}',
  prompt: 'Your instructions are in {SKILLS_PATH}/sdd-implement/SKILL.md — read it first, then follow those instructions.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: {project path}/.sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md

  TASK:
  Implement ONLY this batch from the wave:

  | Batch | Tasks | File | Parallel | Depends on |
  |-------|-------|------|----------|------------|
  {paste the single batch row for this wave}

  Read the full task detail from plan.md for each task listed above.

  Previously completed batches: {list of completed batch IDs, or "none" if first wave}'
)
```

---

## Implement Phase: Parallel Batches (foreground-only for OpenCode)

> **OpenCode limitation**: OpenCode does not support `run_in_background`. There is no parallel batch template. When the Batch Assignment Table contains `Parallel=Yes` batches, execute them sequentially as foreground `Task()` calls — one at a time — using the Sequential Batch Template above. Update `Previously completed batches:` before each launch.

---

## Plan Phase: Re-entry with Crit Feedback Template

```
Task(
  description: 'plan re-entry (crit round {N}) for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_PLANNER}',
  prompt: 'Your instructions are in {SKILLS_PATH}/sdd-plan/SKILL.md — read it first, then follow those instructions.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: {project path}/.sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md (EXISTING — revise, do not recreate)

  CRIT_FEEDBACK (Round {N}):
  {formatted markdown list of unresolved comments from .crit.json}

  When replying to comments, use:
    crit comment --plan {change-name} --reply-to {id} --author "Claude Code" "<what you did>"'
)
```

The orchestrator populates `{formatted markdown list}` using the CRIT_FEEDBACK format defined in the Crit Plan Review Protocol section of `{WORKFLOW_DIR}/ORCHESTRATOR.opencode.md`.

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
