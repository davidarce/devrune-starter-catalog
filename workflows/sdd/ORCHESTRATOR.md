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
**How**: Present options via `AskUserQuestion`: **Start with /sdd-explore {topic}** / **Skip SDD, just do it**

## Launching Sub-Agents

Use the Skill tool pattern for all phases:

```
Skill("sdd-{phase}", args: "{change-name}")
```

The generic launch template and implement-specific wave orchestration details are in `{SKILLS_PATH}/_shared/launch-templates.md`.

Model assignment: use the Phase-to-Model Table above when passing `model:` to the Task/Agent call.

### First Sub-Agent of a New Workflow

Before the first launch, save the active-workflow marker to engram (if available):
```
mem_save(topic_key: "sdd/{change}/active-workflow", title: "sdd/{change}/active-workflow",
  type: "architecture", project: "{project}",
  content: "ACTIVE SDD workflow: {change}. Orchestrator: {SKILLS_PATH}/ORCHESTRATOR.md. Phase: starting explore.")
```

## Post-Phase Protocol (MANDATORY after EVERY sub-agent)

1. **Parse** the SDD Envelope from sub-agent output (format: `{SKILLS_PATH}/_shared/envelope-contract.md`)
2. **Write state.yaml**: `.sdd/{change}/state.yaml` per schema in `{SKILLS_PATH}/_shared/persistence-contract.md`
3. **Engram** (if available): save `{phase}-summary`, `state`, and update `active-workflow` marker
4. **Show** executive summary to user (verbatim from envelope)
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
   - **Has unresolved comments**: Format as CRIT_FEEDBACK markdown (see format below). Re-launch `sdd-plan` sub-agent using the Plan Re-entry template from `{SKILLS_PATH}/_shared/launch-templates.md`. After sub-agent returns envelope, increment `plan_review_round` in `state.yaml` and loop back to step 1 (run crit again for next round).
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

A large plan exhausts a single sub-agent's context. The orchestrator drives waves:

1. Read the Batch Assignment Table from `.sdd/{change}/plan.md` (metadata only, not source code)
2. Group batches into waves by dependency satisfaction; `Parallel=Yes` batches run simultaneously
3. Launch one sub-agent per wave (see `{SKILLS_PATH}/_shared/launch-templates.md` for template)
4. After each wave:
   - `status: ok` -> verify `[X]` markers in plan.md, show progress via `AskUserQuestion`, launch next wave
   - `status: failed` -> STOP, show failure: **Retry wave** / **Abort** / **Skip to next wave**
5. After all waves -> auto-launch review

## Post-Review Fix Cycle

After review completes, options depend on status:
- `ok` -> **Commit** / **Done (no commit)**
- `warning` -> **Commit anyway** / **Fix issues first** / **Done**
- `failed` -> **Fix issues** / **Done** (NO commit option)

When user chooses "Fix issues": delegate fixes to a sub-agent (orchestrator NEVER fixes code), then auto-launch review again.

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

Compaction recovery, fail-fast error handling, abort/complete cleanup, and non-SDD context injection are in `{SKILLS_PATH}/_shared/recovery.md`.

## References

- Envelope format: `{SKILLS_PATH}/_shared/envelope-contract.md`
- Persistence rules: `{SKILLS_PATH}/_shared/persistence-contract.md`
- Launch templates: `{SKILLS_PATH}/_shared/launch-templates.md`
- Recovery flows: `{SKILLS_PATH}/_shared/recovery.md`
