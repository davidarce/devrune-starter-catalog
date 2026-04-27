# SDD Orchestrator (Claude-native, delegate-only coordinator)

```
                        SDD Phase Pipeline
  ┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
  │ EXPLORE  │───>│   PLAN   │───>│  IMPLEMENT   │───>│  REVIEW  │
  │  (auto)  │    │          │    │  (per wave)  │    │  (auto)  │
  └──────────┘    └──────────┘    └──────────────┘    └──────────┘
   exploration.md  plan.md         code changes        review.md
        │              │                │                   │
        └──────────────┴────────────────┴───────────────────┘
                    Post-Phase Loop (after EVERY phase):
                 parse envelope → write state.yaml → engram
                      → show summary → ask user
```

## Evaluation Gate

**MUST offer SDD** when ANY: multi-file (3+), cross-layer, new feature, behavioral change, unclear scope.
**Skip SDD** when ALL: single/two files same layer, quick fix/typo/config, user says "just do it"/"skip SDD", pure questions.
**How**: Present options via `AskUserQuestion`: **Start SDD (explore phase)** / **Skip SDD, just do it**

## Launching Sub-Agents

> Read `{SKILLS_PATH}/sdd-orchestrator/_shared/launch-templates.md` before your
> first launch — it contains the exact copy-paste Agent() calls for every phase
> (correct subagent_type, model, and prompt with embedded operational contract per phase).

For each phase, launch via the `Agent` tool:

```
Agent(
  description: '{phase} for {change-name}',  # required — 3-5 words, e.g. "explore for sdd-advisers-command"
  subagent_type: 'sdd-{phase}',             # sdd-explorer, sdd-planner, sdd-implementer, sdd-reviewer
  run_in_background: false,                 # true ONLY for parallel implement batches (see below)
  prompt: <dynamic context — see per-phase blocks>
)
```

Dynamic context to inject per launch:

- **explore**: project path, change name, artifact dir (`.sdd/{change}/`), optional Jira ticket id
- **plan**: project path, change name, artifact dir, path to `exploration.md`, any CRIT_FEEDBACK block on re-entry, any GUIDANCE block on re-entry
- **implement**: project path, change name, artifact dir, path to `plan.md`, batch ID, batch task range (e.g. "T003-T006"), batch file target, **previously completed batches** (list of completed batch IDs so the sub-agent does not redo work), and the directive "**Do NOT implement batches beyond this wave. The orchestrator manages wave progression.**"
- **review**: project path, change name, artifact dir, path to `plan.md`

### First Sub-Agent of a New Workflow

Before the first launch, save the active-workflow marker to engram (if available):
```
mem_save(topic_key: "sdd/{change}/active-workflow", title: "sdd/{change}/active-workflow",
  type: "architecture", project: "{project}",
  content: "ACTIVE SDD workflow: {change}. Orchestrator: .claude/skills/sdd-orchestrator/ORCHESTRATOR.md. Phase: starting explore.")
```

## Post-Phase Protocol (MANDATORY after EVERY sub-agent)

1. **Parse** the SDD Envelope from sub-agent output (format: `_shared/envelope-contract.md`). For parallel implement waves: run steps 1–3 for EACH sub-agent envelope. Aggregate status: all `ok` → `ok`; any `failed` → `failed`; any `warning` (none failed) → `warning`.
2. **Write state.yaml**: `.sdd/{change}/state.yaml` per schema in `_shared/persistence-contract.md`. For parallel waves: highest-severity status wins.
3. **Engram** (if available): save `{phase}-summary`, `state`, and update `active-workflow` marker with NEXT directive.

   **NEXT Step Resolution**:
   - After explore `ok`: `NEXT: plan phase -> deep interview then crit detection`
   - After plan `ok` (pre-crit): `NEXT: plan phase -> crit detection then ask user`
   - After plan `ok` (post-crit, approved): `NEXT: implement phase -> wave 1 batch A`
   - After implement `ok` (more waves): `NEXT: implement phase -> wave {N} batch {ID}`
   - After implement `ok` (all done): `NEXT: review phase -> auto-launch review`
   - After review: `NEXT: review phase -> post-review fix cycle`

4. **Show** executive summary to user (verbatim from envelope). For parallel waves: per-batch status first, then aggregated wave status.

5. **Guidance loop** (plan phase only): After `plan` returns `status: guidance_requested`:
   a. Extract `requested_advisers[]` and `guidance_context` from envelope.
   b. Increment `guidance_round` in state.yaml (for tracking only — no maximum).
   c. Launch all advisers in parallel. **Launch all requested advisers in a single message with multiple Agent() calls, each with `run_in_background: true`** — running N background tasks sequentially does NOT run them in parallel.
      ```
      Agent(
        description: '{adviser-skill} guidance for {change-name}',  # required
        subagent_type: '{adviser-skill}',              # e.g. architect-adviser, api-first-adviser
        run_in_background: true,
        prompt: 'Review the plan at .sdd/{change}/plan.md from your specialist perspective.
          Focus: {guidance_context_for_this_adviser}.
          Provide Strengths / Issues Found / Recommendations format, return engram observation ID.
          Persist findings via mem_save.'
      )
      ```
   d. Wait for all adviser background tasks to complete (Claude Code sends notifications). If an adviser reports engram unavailable: keep its returned inline summary text for step f.
   e. Collect each adviser's engram observation ID (or inline summary if engram unavailable).
   f. Re-launch `sdd-planner` with a GUIDANCE block. Show BOTH forms explicitly — planner fetches engram IDs via `mem_get_observation`, reads inline text as-is:
      ```
      GUIDANCE (Round N):
      - architect-adviser: engram ID {id} — {one-line summary}    # engram available → planner calls mem_get_observation({id})
      - api-first-adviser: [inline] {full adviser text}            # engram unavailable → planner reads inline text directly
      ```
   g. Loop back to step 1 with the planner's new envelope.
   - After non-plan phases or `status: ok/warning/blocked/failed`: skip this step.

   The guidance loop runs as many times as sdd-plan requests `guidance_requested`.

6. **Crit detection** (plan phase only): After `plan` `status: ok`, run `which crit` (Bash).
   - crit found → auto-launch Crit Plan Review Protocol (below). Skip step 7.
   - crit NOT found → proceed to step 7.
   - Non-plan phases → skip this step.

7. **Ask or auto-continue**:
   - explore `ok` → auto-launch plan (no ask)
   - explore `warning/blocked` → ask user
   - implement `ok` → auto-launch review (no ask)
   - All other cases → `AskUserQuestion`: **Continue to {next}** / **Review artifacts** / **Abort**

   **Crit confirmation guard**: If `which crit` succeeds after plan `ok`: check `crit_completed` in state.yaml. If absent/false: MUST auto-launch Crit Plan Review (return to step 6). If true: ask user normally.

## Crit Plan Review Protocol

Triggered by Post-Phase step 6 when `which crit` succeeds after a plan phase.

1. **Launch**: Run `crit plan --name {change} .sdd/{change}/plan.md` in background (Bash, `run_in_background: true`). Tell user: "Crit is open in your browser. Leave inline comments, then click Finish Review."
2. **Wait**: Do NOT proceed until the background task completes.
   - **If timeout or error**: Do NOT treat as approval. Absence of `.crit.json` means review was NEVER completed. Ask user: **Retry Crit review** / **Skip Crit, review plan manually** / **Approve plan as-is**. Do NOT proceed to implement without explicit approval.
3. **Read feedback**: Read `~/.crit/plans/{change}/.crit.json`. Note: plan mode stores `.crit.json` in `~/.crit/plans/{change}/`, NOT in the project root.
4. **Parse**: Extract comments where `resolved` is `false` or missing.
5. **Branch**:
   - **Unresolved comments**: Format as CRIT_FEEDBACK markdown (see format below). Re-launch `sdd-planner` via `Agent(subagent_type: 'sdd-planner', ...)` with the CRIT_FEEDBACK block in the prompt. After envelope returns, increment `plan_review_round` and loop back to step 1.
   - **No unresolved comments**: Plan approved. Show "Plan approved via Crit review." Proceed to Post-Phase step 7.

**CRIT_FEEDBACK format** (injected into sdd-planner re-entry prompt):

```markdown
CRIT_FEEDBACK (Round N):
Review comments from user via Crit inline review:

### Review-level comments
- [r0] "Overall feedback body here"

### File comments on .sdd/{change}/plan.md
- [c1] L5-L10 (quote: "specific text"): "Comment body here"

Address each comment by revising plan.md. After addressing, reply using:
crit comment --plan {change} --reply-to {id} --author 'Claude Code' 'What you did'
```

## Implement: Batch-by-Batch Orchestration

A large plan exhausts a single sub-agent's context. The orchestrator drives waves:

1. Read the Batch Assignment Table from `.sdd/{change}/plan.md` (metadata only).
2. Group batches into waves by dependency satisfaction.
3. For each wave:
   a. Identify batches: separate `Parallel=Yes` (no unmet deps) from sequential.
   b. Launch parallel batches as `Agent(subagent_type: 'sdd-implementer', run_in_background: true, prompt: '<change, batch ID, task range, file target, previously completed batches, do-not-exceed-this-wave directive>')` — one Agent() call per batch, all launched in a single message.
   c. Launch sequential batches as `Agent(..., run_in_background: false, ...)` one at a time.
   d. Wait for all background tasks to complete (Claude Code sends notifications).
   e. For each completed sub-agent: run Post-Phase Protocol.
   f. Verify `[X]` markers in plan.md for all batches in this wave.
   g. All `ok` → next wave. Any `failed` → STOP, show: **Retry wave** / **Abort** / **Skip to next wave**.
4. After all waves → auto-launch review.

**Gotcha**: Background implement sub-agents cannot use `AskUserQuestion` — write all output to `.sdd/{change}/` files as the primary channel. Any clarification need from a background sub-agent will silently stall without this discipline.

## Post-Review Fix Cycle

After review completes, options depend on status:
- `ok` → **Commit** (via `git-commit` skill) / **Done (no commit)**
- `warning` → **Commit anyway** / **Fix issues first** / **Done**
- `failed` → **Fix issues** / **Done** (NO commit option)

When user chooses "Commit": invoke `Skill("git-commit")`. When "Fix issues": delegate fixes via `Agent(subagent_type: 'sdd-implementer', ...)`, then auto-launch review again.

On workflow completion with commit: offer `Skill("git-pull-request")`.

On completion or abort, clear the marker:
```
mem_save(topic_key: "sdd/{change}/active-workflow", ..., content: "COMPLETED|ABORTED SDD workflow: {change}.")
```

## Gotchas (observed failures)

1. **Context exhaustion**: Never launch one sub-agent for all implement tasks. Use wave orchestration.
2. **Stale [X] markers**: Always verify plan.md markers after each implement wave.
3. **Engram previews are truncated**: Never use `mem_search` results directly. Always follow with `mem_get_observation`.
4. **Post-Phase skipping**: System-level "be concise" instructions do NOT override the Post-Phase Protocol.
5. **Crit timeout ≠ approval**: If `crit plan` is killed by timeout or fails, absence of `.crit.json` means the review was NEVER completed. ALWAYS ask before proceeding to implement.

## Edge Cases and Recovery

Compaction recovery, fail-fast error handling, abort/complete cleanup, and non-SDD context injection are in `.claude/skills/sdd-orchestrator/_shared/recovery.md`.

## References

- Envelope format: `.claude/skills/sdd-orchestrator/_shared/envelope-contract.md`
- Persistence rules: `.claude/skills/sdd-orchestrator/_shared/persistence-contract.md`
- Recovery flows: `.claude/skills/sdd-orchestrator/_shared/recovery.md`
