---
name: sdd-implement
description: 'Use when executing an SDD plan via batch-based task implementation, tracking progress with [ ]/[X] markers and quality gates.'
argument-hint: "[change_name] [instructions]"
disable-model-invocation: false
allowed-tools: Bash, Bash(tree:*), Read, Glob, Grep, Write, Edit, Task, mcp__atlassian__jira_get_issue
---

Execute the implementation plan in small, certain steps. Make confident decisions and use tools without asking permission.

Two files contain the context for implementation:

- `.sdd/{change-name}/exploration.md` — curated context, selected files, handoff prompt from the discovery phase.
- `.sdd/{change-name}/plan.md` — detailed implementation plan with tasks, architecture decisions, and clarifications.

## First Steps (MANDATORY)

1. **Read** `.sdd/{change-name}/exploration.md` for selected files, relationships, and architecture context.
2. The plan file may not exist when the feature is too simple. **Read** `.sdd/{change-name}/plan.md` if present for detailed tasks, file targets, and clarifications.
3. **Pre-flight detail check (non-blocking)**: scan plan.md's Implementation Tasks section. If non-trivial tasks lack `**Details for TXXX**:` blocks, Section 2 is missing Contract Specifications when new types exist, or Before/After is absent for modification tasks — note it in your implementation log but do not block. Plans created before the detail-quality improvements may lack these sections; work with whatever detail is available and make reasonable design decisions.
4. **Engram fallback**: if `exploration.md` or `plan.md` is missing, recover via the two-step pattern in `_shared/persistence-contract.md`. If neither file nor engram has the artifact, return envelope with `status: blocked`.

## Batch Execution (wave-scoped)

The orchestrator's launch prompt specifies which batches you own. Honor that scope.

### Wave-scoped mode (default when launched by orchestrator)

The prompt contains one of:
- `Batches: A, B` — parallel batches in this wave; you own ALL listed
- `Batch: C` — single sequential batch
- `Previously completed batches: X, Y` — do not re-execute these

Rules:

1. Implement tasks in the listed batch(es) in the order given by the Batch Assignment Table.
2. Execute tasks within each batch sequentially (same file).
3. Between batches in the same wave, sequential is safe.
4. NEVER infer additional batches or launch `Task()`/`Agent()` to implement them — the orchestrator owns wave progression.
5. Mark `[X]` in `plan.md` IMMEDIATELY as each task completes (not in bulk at the end).
6. After the LAST task of each batch, run the Phase Checkpoint from `plan.md` for that batch's phase. If any Checkpoint bullet fails: STOP, return envelope with `status: failed`.
7. Return envelope with status reflecting THIS wave only.

### Standalone fallback mode (no batch directive in prompt)

If the prompt has no `Batch:` / `Batches:` directive:

1. Read the full Batch Assignment Table from `plan.md`.
2. Execute all batches sequentially (ignore `Parallel=Yes` — no `Task()` self-orchestration here).
3. Run Phase Checkpoints after each batch, marking `[X]` per task.
4. Return envelope when all batches done.

This fallback preserves backward compatibility for direct skill invocations (e.g. `/sdd-implement {change}`).

## Implementation Notes

- **Surface symbols/usages/paths** with `Read`, `Glob`, `Grep`. Map structure with `tree --gitignore -L 6` (drill with `path/to/subdirectory` and depth `-L 3` as needed).
- **Stay within plan scope.** File selection is defined in `plan.md`. Do not explore or modify files outside the planned boundaries.
- **Slices**, when needed: read with `Grep`/`Read` first, prefer 80–150+ line self-contained sections, always include surrounding context (imports, class declaration). Omitting critical context fails the task.
- **Architecture planning** (optional): if a design decision needs specialist input, invoke an `*-advisor` skill as a sub-agent with the relevant file selection. Do not invoke other SDD phase skills.

## Quality Gate (per-batch, driven by plan Phase Checkpoints)

After the LAST task of each batch:

1. Locate the `**Checkpoint**:` block in `plan.md` for the batch's phase.
2. Each bullet is a verifiable assertion — translate to a shell command where possible:
   - "Project builds without errors" → detect the build runner, run it.
   - "All N integration test scenarios pass" → run the test runner.
   - "Linting passes" → run the linter.
3. If a bullet doesn't translate to a command (e.g. "documentation updated"), verify by re-reading the relevant file.
4. If ANY bullet fails: STOP, return envelope with `status: failed`.
5. If `plan.md` defines no Checkpoint for this batch's phase, default to runner-detected `build` + `test`.

The gate is **per-batch, not per-task**.

## Large File Creation (mandatory)

When creating NEW files that will exceed ~150 lines:

1. `Write` the file with scaffolding + first logical section only (~100–150 lines max).
2. `Edit` to append each remaining section incrementally.
3. Never send >200 lines in a single `Write` — large payloads cause permission hook timeouts.

When a `Write` or `Edit` call **fails** (timeout, rejected, permission error):

1. Do NOT retry the same call — retrying identical failing calls wastes turns.
2. Split the content in half and try smaller chunks.
3. If still failing after 2 split retries, return envelope with `status: failed` and include the blocked file path in `risks`.

## Persistence

`plan.md` is your source of truth: update its `[ ]` markers to `[X]` for every task you complete in this batch. The envelope is the per-call deliverable. Do NOT create or modify any other artifact under `.sdd/{change}/` — no batch logs, no progress files, no auxiliary notes. Anything worth persisting either belongs in the envelope (per call) or in engram (across calls).

If engram is available, save the implement-progress summary and any general-knowledge discoveries (bug fixes, gotchas, conventions) per `_shared/persistence-contract.md` (Phase Artifact Save Convention + General Knowledge Persistence Mandate). For this phase, `title`/`topic_key` is `sdd/{change}/implement-progress` — one upserted observation across all waves, not one per batch.

## Return Envelope

Return the SDD Envelope as your **last** output (format: `_shared/envelope-contract.md`). Nothing may follow it.

| Field            | Value                                                                                          |
|------------------|------------------------------------------------------------------------------------------------|
| Status           | `ok` (all wave tasks pass + Phase Checkpoint succeeds) · `failed` (any task or Checkpoint fails) |
| Phase            | `implement`                                                                                    |
| Change           | `{change-name}`                                                                                |
| Artifacts        | `.sdd/{change-name}/plan.md` (with `[X]` markers showing this wave's completed tasks)          |
| Next Recommended | `/sdd-review {change-name}`                                                                    |
| Risks            | Flaky tests, deprecation notices, partial coverage; or "None"                                  |
| Engram Ref       | Observation ID from the persistence step, or omit if engram unavailable                        |

Do NOT invoke commit/review/any other SDD skill — return the envelope; the orchestrator decides next steps.

## Self-Check (before returning the envelope)

- Both `exploration.md` and `plan.md` were read.
- Tasks were implemented strictly within the wave/batch scope from the launch prompt; no additional batches were launched or inferred.
- Each completed task has `[X]` in `plan.md` (uppercase X — lowercase `[x]` is treated as incomplete by the parser).
- The Phase Checkpoint for this batch's phase was run (not a generic suite); a failed Checkpoint produced `status: failed` and stopped further work.
- For NEW files >150 lines: scaffolding via `Write` first, sections appended via `Edit`. No `Write` payload exceeded ~200 lines.
- Failed `Write`/`Edit` calls were split in half, not retried identically.
- Did not edit files outside `plan.md`'s scope.
- Did NOT create or modify any artifact under `.sdd/{change}/` other than the `[X]` updates to `plan.md`. The envelope is the deliverable.

## References

Specialist skills: any installed `*-advisor`. Shared contracts: [persistence-contract](../_shared/persistence-contract.md), [envelope-contract](../_shared/envelope-contract.md).

<user_instructions>

- $ARGUMENTS

- change_name: $1
- instructions: $2
</user_instructions>
