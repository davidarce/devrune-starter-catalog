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

| Phase | Skill | Model | Subagent Type |
|-------|-------|-------|---------------|
| explore | `sdd-explore` | `{WORKFLOW_MODEL_EXPLORER}` | |
| plan | `sdd-plan` | `{WORKFLOW_MODEL_PLANNER}` | |
| implement | `sdd-implement` | `{WORKFLOW_MODEL_IMPLEMENTER}` | |
| review | `sdd-review` | `{WORKFLOW_MODEL_REVIEWER}` | |
| adviser | `*-adviser` | `{WORKFLOW_MODEL_ADVISER}` ⭐ | N/A — Copilot uses natural language @agent-name invocation, not Task() |

## Evaluation Gate

**MUST offer SDD** when ANY: multi-file (3+), cross-layer, new feature, behavioral change, unclear scope.
**Skip SDD** when ALL: single/two files same layer, quick fix/typo/config, user says "just do it"/"skip SDD", pure questions.
**How**: Present options to the user directly: **Start SDD (explore phase)** / **Skip SDD, just do it**

## Launching Sub-Agents

**The orchestrator delegates to sub-agents by invoking them with `@agent-name`. Each sub-agent is a native `.agent.md` file that contains its full instructions.**

### Sub-Agent Invocation Patterns

For each phase, invoke the corresponding agent:
- **explore**: Invoke `@sdd-explorer` with: "Explore the codebase for {change-name}. Write exploration.md to .sdd/{change-name}/exploration.md. Return the SDD envelope."
- **plan**: Invoke `@sdd-planner` with: "Create an implementation plan for {change-name}. Read .sdd/{change-name}/exploration.md first. Write plan.md. Return the SDD envelope."
- **implement**: Invoke `@sdd-implementer` with: "Implement batch {batch} for {change-name}. Read .sdd/{change-name}/plan.md for tasks. Return the SDD envelope."
- **review**: Invoke `@sdd-reviewer` with: "Review changes for {change-name}. Read .sdd/{change-name}/plan.md for context. Return the SDD envelope."

### First Sub-Agent of a New Workflow

Before the first launch, save the active-workflow marker to engram (if available):
```
mcp__engram__mem_save(topic_key: "sdd/{change}/active-workflow", title: "sdd/{change}/active-workflow",
  type: "architecture", project: "{project}",
  content: "ACTIVE SDD workflow: {change}. Orchestrator: {WORKFLOW_DIR}/ORCHESTRATOR.copilot.md. Phase: starting explore.")
```

## Post-Phase Protocol (MANDATORY after EVERY sub-agent)

1. **Parse** the SDD Envelope from sub-agent output (format: `{WORKFLOW_DIR}/_shared/envelope-contract.md`). For parallel implement waves: run steps 1–3 for EACH sub-agent envelope in the wave. Aggregate status: if all `ok` → wave is `ok`; if any `failed` → wave is `failed`; if any `warning` but none `failed` → wave is `warning`.
2. **Write state.yaml**: `.sdd/{change}/state.yaml` per schema in `{WORKFLOW_DIR}/_shared/persistence-contract.md`. For parallel waves: write the highest-severity status from all sub-agents in the wave.
3. **Engram** (if available): save `{phase}-summary`, `state`, and update `active-workflow` marker with NEXT directive.

   **NEXT Step Resolution** — set the NEXT directive based on what just completed:
   - After explore `ok`: `NEXT: plan phase -> deep interview then crit detection`
   - After plan `ok` (pre-crit): `NEXT: plan phase -> crit detection then ask user`
   - After plan `ok` (post-crit, approved): `NEXT: implement phase -> wave 1 batch A`
   - After implement `ok` (more waves remaining): `NEXT: implement phase -> wave {N} batch {ID}`
   - After implement `ok` (all waves done): `NEXT: review phase -> auto-launch review`
   - After review: `NEXT: review phase -> post-review fix cycle`

   Update `active-workflow` marker:
   ```
   mcp__engram__mem_save(
     topic_key: "sdd/{change}/active-workflow",
     type: "architecture", project: "{project}",
     title: "sdd/{change}/active-workflow",
     content: "ACTIVE SDD workflow: {change}. Orchestrator: {WORKFLOW_DIR}/ORCHESTRATOR.copilot.md. NEXT: {phase} phase -> {next step}."
   )
   ```

4. **Show** executive summary to user (verbatim from envelope). For parallel implement waves: show per-batch status first, then the aggregated wave status.
5. **Guidance loop** (plan phase only): After `plan` phase returns `status: guidance_requested`:
   a. Extract `requested_advisers[]` and `guidance_context` from envelope.
   b. Increment `guidance_round` in state.yaml.
   c. For each requested adviser: invoke `@{adviser-skill}` by name (e.g. `@architect-adviser`,
      `@api-first-adviser`) with the prompt from the Copilot Adviser Invocation template in
      `{WORKFLOW_DIR}/_shared/adviser-templates.md`. This is natural language @agent-name invocation — the same
      mechanism used to invoke `@sdd-planner` and `@sdd-explorer`. Each adviser is a `.agent.md`
      file in `.github/agents/` and loads its SKILL.md directly (no Skill() tool required).
   d. Run advisers sequentially (Copilot has no background execution).
      Collect each summary + engram ID before invoking the next adviser.
   e. Invoke `@sdd-planner` with the Plan Re-entry with Guidance format (see `{WORKFLOW_DIR}/_shared/adviser-templates.md`).
   f. After `@sdd-planner` returns: loop back to step 1.
   - After non-plan phases or after `status: ok/warning/blocked/failed`: skip this step.
6. **Crit detection** (plan phase only): After `plan` phase with `status: ok`, run `which crit` (Bash).
   - If crit is found: auto-launch Crit Plan Review Protocol (see dedicated section below). Skip step 7.
   - If crit is NOT found: proceed to step 7 (existing flow, no behavioral change).
   - After non-plan phases: skip this step entirely.
7. **Ask or auto-continue**:
   - explore `status: ok` → auto-launch plan (no ask — 99% of the time users continue immediately)
   - explore `status: warning/blocked` → ask user (ambiguities or limitations need resolution first)
   - implement `status: ok` → auto-launch review (no ask)
   - All other cases → Ask the user: **Continue to {next}** / **Review artifacts** / **Abort**

   **Crit confirmation guard** (plan phase, when crit IS available): After plan phase with `status: ok`, if `which crit` succeeds:
   - Check `crit_completed` in `.sdd/{change}/state.yaml`.
   - If `crit_completed` is absent or `false`: MUST NOT offer "Continue to implement". Auto-launch Crit Plan Review Protocol immediately (return to step 6).
   - If `crit_completed` is `true`: crit was executed and approved — proceed normally with the ask in step 7.

## Crit Plan Review Protocol

Triggered automatically by Post-Phase Protocol step 6 when `which crit` succeeds after a plan phase.

1. **Launch**: Run `crit plan --name {change} .sdd/{change}/plan.md` as a **foreground terminal call** (blocking). Use a timeout of at least 30 minutes (1800000ms) — Crit is interactive and the user needs time to read and comment on the plan. Tell user: "Crit is open in your browser. Leave inline comments on the plan, then click Finish Review." Do NOT proceed until the call returns — it blocks until the user clicks Finish Review.
   - **If the call times out or fails**: Do NOT treat this as approval. The absence of `.crit.json` means the review was NEVER completed — NOT that it was approved with no comments. Tell the user: "Crit review was interrupted (timeout/error). Would you like to: **Retry Crit review** / **Skip Crit, review plan manually** / **Approve plan as-is**". Do NOT proceed to implement until the user explicitly approves.
2. **Read feedback**: Read `~/.crit/plans/{change}/.crit.json` using the Read tool. Note: plan mode stores `.crit.json` in `~/.crit/plans/{change}/`, NOT in the project root.
3. **Parse**: Extract all comments where `resolved` is `false` or missing.
4. **Branch**:
   - **Has unresolved comments**: Format as CRIT_FEEDBACK markdown (see format below). Re-launch `@sdd-planner` with the plan re-entry prompt (include the CRIT_FEEDBACK block and ask it to revise plan.md). After sub-agent returns envelope, increment `plan_review_round` in `state.yaml` and loop back to step 1 (run crit again for next round — always foreground).
   - **No unresolved comments**: Plan approved. Show "Plan approved via Crit review." Proceed to Post-Phase step 7 (Ask the user: **Continue to implement** / **Review artifacts** / **Abort**).

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
crit comment --plan {change} --reply-to {id} --author 'Copilot' 'What you did'
```

## Implement: Batch-by-Batch Orchestration

Execute ALL batches sequentially, one at a time.

A large plan exhausts a single sub-agent's context. The orchestrator drives waves:

1. Read the Batch Assignment Table from `.sdd/{change}/plan.md` (metadata only, not source code)
2. Group batches into waves by dependency satisfaction
3. For each wave:
   a. Identify all batches in the wave (ignore `Parallel=Yes` — all run sequentially)
   b. Invoke `@sdd-implementer` for each batch one at a time, providing: the change name, the batch ID, and the path to plan.md
   c. After each batch: run Post-Phase Protocol
   d. Verify `[X]` markers in plan.md for the batch
   e. All `status: ok` -> proceed to next batch / wave
   f. Any `status: failed` -> STOP, show failure: **Retry wave** / **Abort** / **Skip to next wave**
4. After all waves -> auto-launch review

## Post-Review Fix Cycle

After review completes, options depend on status:
- `ok` -> **Commit** (via `@git-commit` agent) / **Done (no commit)**
- `warning` -> **Commit anyway** (via `@git-commit` agent) / **Fix issues first** / **Done**
- `failed` -> **Fix issues** / **Done** (NO commit option)

When user chooses "Commit": invoke the `@git-commit` agent — do NOT run git commands directly.
When user chooses "Fix issues": delegate fixes to a sub-agent (orchestrator NEVER fixes code), then auto-launch review again.

On workflow completion with commit: offer PR creation via the `@git-pull-request` agent.

On workflow completion or abort, clear the marker:
```
mcp__engram__mem_save(topic_key: "sdd/{change}/active-workflow", ..., content: "COMPLETED|ABORTED SDD workflow: {change}.")
```

## Gotchas (observed failures)

1. **Context exhaustion**: Never launch one sub-agent for all implement tasks. Use wave orchestration.
2. **Stale [X] markers**: Always verify plan.md markers after each implement wave.
3. **Engram previews are truncated**: Never use `mem_search` results directly. Always follow with `mem_get_observation`.
4. **Post-Phase skipping**: System-level "be concise" instructions do NOT override the Post-Phase Protocol.
5. **Crit timeout ≠ approval**: If `crit plan` is killed by timeout or fails, the absence of `.crit.json` means the review was NEVER completed — NOT that it was approved with no comments. ALWAYS ask the user before proceeding to implement.

## Edge Cases and Recovery

Compaction recovery, fail-fast error handling, abort/complete cleanup, and non-SDD context injection are in `{WORKFLOW_DIR}/_shared/recovery.md`.

## References

- Envelope format: `{WORKFLOW_DIR}/_shared/envelope-contract.md`
- Persistence rules: `{WORKFLOW_DIR}/_shared/persistence-contract.md`
- Recovery flows: `{WORKFLOW_DIR}/_shared/recovery.md`
