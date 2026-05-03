# SDD Launch Templates

<!-- SYNC WITH: launch-templates.claude.md, launch-templates.opencode.md, launch-templates.md
     When editing invocation syntax or template structure, apply equivalent changes to the
     other variant files. The operational contract (persistence, envelope, wave-scope, quality
     gate) lives in each phase's SKILL.md and in _shared/{persistence,envelope}-contract.md —
     not in launch prompts. Launch prompts carry dynamic context only. -->

Launch prompts carry **dynamic context only** — project path, change name, artifact list, batch directive. The full operational contract for each phase lives in the agent's `.agent.md` file (the renderer inlines the SKILL.md body) and in `_shared/persistence-contract.md` + `_shared/envelope-contract.md`. The agent file IS the system prompt; no skill-load directive is needed in the invocation prompt.

## Generic Sub-Agent Invocation

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
- Artifact directory: {project path}/.sdd/{change-name}/ (already created)
- Previous artifacts: {list of {project path}/.sdd/{change-name}/ files to read}

TASK:
{specific task description for this phase}
```

---

## Implement Phase: Sequential Batch Invocation

Copilot does not support background execution — all batches run sequentially in foreground regardless of the `Parallel` column. The orchestrator launches one `@sdd-implementer` invocation at a time and waits for the envelope before proceeding.

Invoke `@sdd-implementer` with this prompt:

```
CONTEXT:
- Project: {project path}
- Change: {change-name}
- Artifact directory: {project path}/.sdd/{change-name}/
- Previous artifacts: exploration.md, plan.md

TASK:
Implement ONLY these batches from this wave:

| Batch | Tasks | File | Parallel | Depends on |
|-------|-------|------|----------|------------|
{paste batch table row(s) for this wave only}

Previously completed batches: {list of completed batch IDs, or "none"}
```

---

## Advisor Invocation

When consulting an advisor (architect, unit-test, integration-test, component, api-first, etc.), invoke `@{advisor-skill}` with this prompt:

```
{advisor context — relevant code snippets, current design, specific question or concern}

Return your response in this exact format:

### Strengths
{what is already well-designed or idiomatic in the current approach}

### Issues Found
{specific problems, anti-patterns, or violations of the relevant design rules}

### Recommendations
{concrete, actionable suggestions — one per bullet}

### Engram Observation ID
{the ID returned by mem_save if you persisted advice to engram; omit this section if engram is unavailable}

Do NOT return an SDD envelope — advisors return the structured advice format above, not an envelope. Persist advice via mem_save if engram is available.
```

> **Copilot note**: Advisor agent files load their own SKILL.md — the orchestrator does not inject the skill. The prompt above provides the question context and return-format contract.

---

## Plan Phase: Re-entry with Crit Feedback

```
CONTEXT:
- Project: {project path}
- Change: {change-name}
- Artifact directory: {project path}/.sdd/{change-name}/
- Previous artifacts: exploration.md, plan.md (EXISTING — revise, do not recreate)

CRIT_FEEDBACK (Round {N}):
{formatted markdown list of unresolved comments from .crit.json}

When replying to comments, use:
  crit comment --plan {change-name} --reply-to {id} --author "Copilot" "<what you did>"
```

The orchestrator populates `{formatted markdown list}` using the CRIT_FEEDBACK format defined in the Crit Plan Review Protocol section of `ORCHESTRATOR.copilot.md`.

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
