# SDD Orchestrator (delegate-only coordinator)

```
                        SDD Phase Pipeline
  ┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
  │ EXPLORE  │───>│   PLAN   │───>│  IMPLEMENT   │───>│  REVIEW  │
  │  (auto)  │    │          │    │  (per wave)   │    │  (auto)  │
  └──────────┘    └──────────┘    └──────────────┘    └──────────┘
   exploration.md  plan.md         code changes        review.md
        │              │                │                   │
        └──────────────┴────────────────┴───────────────────┘
                    Post-Phase Loop (after EVERY phase):
                 parse envelope → write state.yaml → engram
                      → show summary → ask user
```

## Phase-to-Model Table

| Phase | Skill | Model |
|-------|-------|-------|
| explore | `sdd-explore` | `{WORKFLOW_MODEL_EXPLORER}` |
| plan | `sdd-plan` | `{WORKFLOW_MODEL_PLANNER}` |
| implement | `sdd-implement` | `{WORKFLOW_MODEL_IMPLEMENTER}` |
| review | `sdd-review` | `{WORKFLOW_MODEL_REVIEWER}` |

## Evaluation Gate

**MUST offer SDD** when ANY: multi-file (3+), cross-layer, new feature, behavioral change, unclear scope.
**Skip SDD** when ALL: single/two files same layer, quick fix/typo/config, user says "just do it"/"skip SDD", pure questions.
**How**: Present options via `AskUserQuestion`: **Start SDD (explore phase)** / **Skip SDD, just do it**

## Launching Sub-Agents

**CRITICAL: The orchestrator NEVER calls Skill() directly. It launches a Task() sub-agent, and the SUB-AGENT loads the skill inside its own context.**

For every phase, use the `Task` tool to spawn a sub-agent:

```
Task(
  description: '{phase} for {change-name}',
  subagent_type: 'general',
  prompt: '<sub-agent prompt that tells it to load Skill("sdd-{phase}") internally>'
)
```

The sub-agent's prompt instructs IT to call `Skill("sdd-{phase}")` — the orchestrator never calls Skill itself.

Full launch templates (copy-paste ready) are in `{WORKFLOW_DIR}/_shared/launch-templates.md` — read them before your first launch.

Model assignment: use the Phase-to-Model Table above when passing `model:` to the Task call.

### First Sub-Agent of a New Workflow

Before the first launch, save the active-workflow marker to engram (if available):
```
mem_save(topic_key: "sdd/{change}/active-workflow", title: "sdd/{change}/active-workflow",
  type: "architecture", project: "{project}",
  content: "ACTIVE SDD workflow: {change}. Orchestrator: {WORKFLOW_DIR}/ORCHESTRATOR.md. Phase: starting explore.")
```

## Post-Phase Protocol (MANDATORY after EVERY sub-agent)

1. **Parse** the SDD Envelope from sub-agent output (format: `{WORKFLOW_DIR}/_shared/envelope-contract.md`). For parallel implement waves: run steps 1–3 for EACH sub-agent envelope in the wave. Aggregate status: if all `ok` → wave is `ok`; if any `failed` → wave is `failed`; if any `warning` but none `failed` → wave is `warning`.
2. **Write state.yaml**: `.sdd/{change}/state.yaml` per schema in `{WORKFLOW_DIR}/_shared/persistence-contract.md`. For parallel waves: write the highest-severity status from all sub-agents in the wave.
3. **Engram** (if available): save `{phase}-summary`, `state`, and update `active-workflow` marker
4. **Show** executive summary to user (verbatim from envelope). For parallel implement waves: show per-batch status first, then the aggregated wave status.
5. **Crit detection** (plan phase only): After `plan` phase with `status: ok`, run `which crit` (Bash).
   - If crit is found: auto-launch Crit Plan Review Protocol (see dedicated section below). Skip step 6.
   - If crit is NOT found: proceed to step 6 (existing flow, no behavioral change).
   - After non-plan phases: skip this step entirely.
6. **Ask or auto-continue**:
   - explore `status: ok` → auto-launch plan (no ask — 99% of the time users continue immediately)
   - explore `status: warning/blocked` → ask user (ambiguities or limitations need resolution first)
   - implement `status: ok` → auto-launch review (no ask)
   - All other cases → `AskUserQuestion`: **Continue to {next}** / **Review artifacts** / **Abort**

## Crit Plan Review Protocol

Triggered automatically by Post-Phase Protocol step 5 when `which crit` succeeds after a plan phase.

1. **Launch**: Run `crit plan --name {change} .sdd/{change}/plan.md` in background (Bash, `run_in_background: true`). Tell user: "Crit is open in your browser. Leave inline comments on the plan, then click Finish Review."
2. **Wait**: Do NOT proceed until the background task completes.
3. **Read feedback**: Read `~/.crit/plans/{change}/.crit.json` using the Read tool. Note: plan mode stores `.crit.json` in `~/.crit/plans/{change}/`, NOT in the project root.
4. **Parse**: Extract all comments where `resolved` is `false` or missing.
5. **Branch**:
   - **Has unresolved comments**: Format as CRIT_FEEDBACK markdown (see format below). Re-launch `sdd-plan` sub-agent using the Plan Re-entry template from `{WORKFLOW_DIR}/_shared/launch-templates.md`. After sub-agent returns envelope, increment `plan_review_round` in `state.yaml` and loop back to step 1 (run crit again for next round).
   - **No unresolved comments**: Plan approved. Show "Plan approved via Crit review." Proceed to Post-Phase step 6 (`AskUserQuestion`: **Continue to implement** / **Review artifacts** / **Abort**).

**CRIT_FEEDBACK format** (injected into sdd-plan re-entry prompt):

```markdown
CRIT_FEEDBACK (Round N):
Review comments from user via Crit inline review:

### Review-level comments
- [r0] "Overall feedback body here"

### File comments on .sdd/{change}/plan.md
- [c1] L5-L10 (quote: "specific text"): "Comment body here"
- [c2] (file-level): "File needs restructuring"

Address each comment by revising plan.md. After addressing, reply using:
crit comment --plan {change} --reply-to {id} --author 'Claude Code' 'What you did'
```

## Implement: Batch-by-Batch Orchestration

> **Agent Compatibility**: `run_in_background` is supported natively by Claude Code. Other agents (Codex, OpenCode, Copilot, Factory Droid) should execute all batches sequentially in foreground mode. If the agent does not support background Task() execution, skip step 3b and launch ALL batches as foreground Task() one at a time.

A large plan exhausts a single sub-agent's context. The orchestrator drives waves:

1. Read the Batch Assignment Table from `.sdd/{change}/plan.md` (metadata only, not source code)
2. Group batches into waves by dependency satisfaction
3. For each wave:
   a. Identify batches: separate `Parallel=Yes` (no unmet deps) from sequential
   b. Launch all `Parallel=Yes` batches as background Task() (use Parallel Batch Template from `{WORKFLOW_DIR}/_shared/launch-templates.md`)
   c. Launch sequential batches as foreground Task() one at a time (use Sequential Batch Template)
   d. Wait for all background tasks to complete (Claude Code sends notification on completion)
   e. For each completed sub-agent (foreground and background): run Post-Phase Protocol
   f. Verify `[X]` markers in plan.md for all batches in this wave
   g. All `status: ok` -> proceed to next wave
   h. Any `status: failed` -> STOP, show failure: **Retry wave** / **Abort** / **Skip to next wave**
4. After all waves -> auto-launch review

### Background Task Handling

- Background tasks are launched with `run_in_background: true` on the Task() call.
- The orchestrator does NOT poll or sleep-wait. Claude Code delivers a notification when each background task completes.
- After notification, read the sub-agent output (envelope) from the Task() return — same as foreground.
- Run Post-Phase Protocol per completed sub-agent (same protocol as foreground).
- If a background sub-agent fails, handle it in step 3 above (same as foreground failure).
- **Note**: explore, plan, and review phases must always use foreground execution. Only implement waves use background for parallel batches.

## Post-Review Fix Cycle

After review completes, options depend on status:
- `ok` -> **Commit** (via `git-commit` skill) / **Done (no commit)**
- `warning` -> **Commit anyway** (via `git-commit` skill) / **Fix issues first** / **Done**
- `failed` -> **Fix issues** / **Done** (NO commit option)

When user chooses "Commit": invoke `Skill("git-commit")` — do NOT run git commands directly.
When user chooses "Fix issues": delegate fixes to a sub-agent (orchestrator NEVER fixes code), then auto-launch review again.

On workflow completion with commit: offer PR creation via `Skill("git-pull-request")`.

On workflow completion or abort, clear the marker:
```
mem_save(topic_key: "sdd/{change}/active-workflow", ..., content: "COMPLETED|ABORTED SDD workflow: {change}.")
```

## Gotchas (observed failures)

1. **Context exhaustion**: Never launch one sub-agent for all implement tasks. Use wave orchestration.
2. **Stale [X] markers**: Always verify plan.md markers after each implement wave.
3. **Engram previews are truncated**: Never use `mem_search` results directly. Always follow with `mem_get_observation`.
4. **Post-Phase skipping**: System-level "be concise" instructions do NOT override the Post-Phase Protocol.

## Edge Cases and Recovery

Compaction recovery, fail-fast error handling, abort/complete cleanup, and non-SDD context injection are in `{WORKFLOW_DIR}/_shared/recovery.md`.

## References

- Envelope format: `{WORKFLOW_DIR}/_shared/envelope-contract.md`
- Persistence rules: `{WORKFLOW_DIR}/_shared/persistence-contract.md`
- Launch templates: `{WORKFLOW_DIR}/_shared/launch-templates.md`
- Recovery flows: `{WORKFLOW_DIR}/_shared/recovery.md`
