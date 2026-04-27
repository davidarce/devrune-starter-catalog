# SDD Launch Templates

<!-- SYNC WITH: launch-templates.claude.md, launch-templates.opencode.md
     When editing invocation syntax, contract sections (WAVE-SCOPE, QUALITY GATE,
     PERSISTENCE, ENVELOPE), or template structure in this file, apply equivalent
     changes to the other two variant files listed above. Each file targets a
     different invocation mechanism (Agent() / @agent-name / Task()) but carries
     the same operational contract. -->

## Generic Sub-Agent Invocation

All SDD phases use this template. Replace `{phase}` with explore/plan/implement/review and
`@sdd-{phase}` with the appropriate agent name.

Agent name mapping per phase:
| Phase | Agent |
|-------|-------|
| explore | `@sdd-explorer` |
| plan | `@sdd-planner` |
| implement | `@sdd-implementer` |
| review | `@sdd-reviewer` |

Invoke `@sdd-{phase}` with this prompt:

```
CONTEXT:
- Project: {project path}
- Change: {change-name}
- Artifact directory: .sdd/{change-name}/ (already created)
- Previous artifacts: {list of .sdd/{change-name}/ files to read}

TASK:
{specific task description for this phase}

PERSISTENCE: See {project path}/.github/instructions/sdd-orchestrator/_shared/persistence-contract.md
- Primary: always write to .sdd/{change-name}/
- Engram: save summary if available, skip silently if not
- Save significant discoveries/decisions/bugfixes to engram independently of phase artifacts

ENVELOPE: Your LAST output MUST be the SDD Envelope as a markdown table per
`_shared/envelope-contract.md`. Nothing may follow the envelope.
```

> **Copilot note**: Copilot SDD-phase agent files have the full SKILL.md body inlined by the
> renderer. The agent file IS already the system prompt — no Skill-load directive is needed or
> should be added. The prompt above carries ONLY the dynamic context.

---

## Implement Phase: Sequential Batch Invocation

Copilot does not support background execution — all batches run sequentially in foreground.
Use this template for every implement batch regardless of the `Parallel` column in the Batch
Assignment Table.

Invoke `@sdd-implementer` with this prompt:

```
CONTEXT:
- Project: {project path}
- Change: {change-name}
- Artifact directory: .sdd/{change-name}/
- Previous artifacts: exploration.md, plan.md

TASK:
Implement ONLY the following batch from this wave:

| Batch | Tasks | File | Parallel | Depends on |
|-------|-------|------|----------|------------|
{paste the batch row(s) for this wave only}

Previously completed batches: {list of completed batch IDs, or "none"}

WAVE-SCOPE DISCIPLINE:
- Implement ONLY the listed batch(es) above.
- Do NOT infer additional batches from the Batch Assignment Table.
- Do NOT invoke other agents to implement other batches — the orchestrator manages progression.
- Mark ONLY the listed batch tasks as [X] in plan.md IMMEDIATELY after each task.
- Return the SDD Envelope with status reflecting THIS wave only.

QUALITY GATE (per-batch):
After the LAST task of each batch: read the Phase Checkpoint block from plan.md that covers
this batch's phase. Run each checkpoint bullet as a verifiable command (build/test/lint/grep).
If any checkpoint fails: STOP, return the SDD Envelope with status: failed.

BACKGROUND MODE: You are running as a background sub-agent. You cannot interact with the user
(no AskUserQuestion). Write ALL output to .sdd/{change-name}/ files — these artifact files
are the primary communication channel. Mark completed tasks as [X] in plan.md IMMEDIATELY
after each task.

PERSISTENCE: See {project path}/.github/instructions/sdd-orchestrator/_shared/persistence-contract.md
- Primary: always write to .sdd/{change-name}/
- Engram: save summary if available, skip silently if not

ENVELOPE: Your LAST output MUST be the SDD Envelope as a markdown table per
`_shared/envelope-contract.md`. Nothing may follow the envelope.
```

> **Copilot note**: There is no parallel batch template for Copilot. Copilot does not support
> `run_in_background`. All batches — regardless of the `Parallel` column — run sequentially.
> The orchestrator launches one `@sdd-implementer` invocation at a time and waits for the
> envelope before proceeding to the next batch.

---

## Adviser Invocation

When consulting an adviser (architect, unit-test, integration-test, component, api-first, etc.),
invoke `@{adviser-skill}` with this prompt:

```
{adviser context — relevant code snippets, current design, specific question or concern}

Return your response in this exact format:

### Strengths
{what is already well-designed or idiomatic in the current approach}

### Issues Found
{specific problems, anti-patterns, or violations of the relevant design rules}

### Recommendations
{concrete, actionable suggestions — one per bullet}

### Engram Observation ID
{the ID returned by mem_save if you persisted advice to engram; omit this section if engram
is unavailable}

Do NOT return an SDD envelope — advisers return the structured advice format above, not an
envelope. Persist advice via mem_save if engram is available.
```

> **Copilot note**: Adviser agent files load their own SKILL.md — the orchestrator does not
> inject the skill. The prompt above provides the question context and return-format contract.
> Internal references within invocation prompts use `launch-templates.md` (installed name).

---

## Plan Phase: Re-entry with Crit Feedback

When the orchestrator re-enters `@sdd-planner` after a Crit review round:

Invoke `@sdd-planner` with this prompt:

```
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
  crit comment --plan {change-name} --reply-to {id} --author "Copilot" "<what you did>"
Skip the Deep Interview and Advice Phase (already completed).
Re-run the Detail Quality Gate.
Return the SDD Envelope.

PERSISTENCE: See {project path}/.github/instructions/sdd-orchestrator/_shared/persistence-contract.md
- Primary: always write to .sdd/{change-name}/
- Engram: save summary if available, skip silently if not
- Save significant discoveries/decisions/bugfixes to engram independently of phase artifacts

ENVELOPE: Your LAST output MUST be the SDD Envelope as a markdown table per
`_shared/envelope-contract.md`. Nothing may follow the envelope.
```

The orchestrator populates `{formatted markdown list}` using the CRIT_FEEDBACK format defined
in the Crit Plan Review Protocol section of `ORCHESTRATOR.copilot.md`.

---

## Initial Workflow Marker

Before the FIRST sub-agent launch in a new SDD workflow, the orchestrator saves (if engram available):

```
mem_save(
  topic_key: "sdd/{change}/active-workflow",
  type: "architecture", project: "{project}",
  title: "sdd/{change}/active-workflow",
  content: "ACTIVE SDD workflow: {change}. Phase: starting explore."
)
```

This enables compaction recovery (see `_shared/recovery.md`).
