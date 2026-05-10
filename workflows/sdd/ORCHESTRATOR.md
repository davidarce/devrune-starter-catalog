## Your Role

Outside `.sdd/{change}/`, your only outputs are: sub-agent launches (`Task` / `Agent` / `@<sub-agent>` per your variant), `AskUserQuestion`, `mkdir` for `.sdd/`, and `Bash(crit ...)` per the Crit Plan Review Protocol.

You do **not**: `Edit`/`Write` source files, run builds/tests/lints, run `git commit`/`push`, create commits/PRs, invoke `Skill("sdd-{phase}")` directly.

If your next planned action is on the "do not" list, you have lost the role — re-read this section and delegate.

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

## Evaluation Gate

**MUST offer SDD** when ANY: multi-file (3+), cross-layer, new feature, behavioral change, unclear scope.
**Skip SDD** when ALL: single/two files same layer, quick fix/typo/config, user says "just do it"/"skip SDD", pure questions.
**How**: Present options via `AskUserQuestion`: **Start SDD (explore phase)** / **Skip SDD, just do it**

## Launching Sub-Agents

**CRITICAL: The orchestrator NEVER calls Skill() directly. It launches a Task() sub-agent, and the SUB-AGENT loads the skill inside its own context.**

For every phase, use the `Task` tool to spawn a sub-agent. The sub-agent's prompt instructs IT to call `Skill("sdd-{phase}")` — the orchestrator never calls Skill itself.

**Read `{SHARED_DIR}/launch-templates.md` before your first launch** — it contains the exact copy-paste Task() calls for every phase (correct `subagent_type`, model, and prompt per phase).

### First Sub-Agent of a New Workflow

When `.sdd/{change}/state.yaml` does NOT yet exist (genuine new workflow, not a resume):

1. **Workdir**: `mkdir -p .sdd/{change}/` (absolute path resolved from the orchestrator invocation directory).
2. **Branch setup** (run once, here — not at commit time):

   **Pre-flight — git availability**: Run `git rev-parse --is-inside-work-tree` first. If it returns a non-zero exit (the cwd is not inside a git repository — common for monorepo-style workspaces that aggregate multiple sub-repos at the root), **skip Step 2 entirely**. Tell the user once: "No git repository detected at the workflow root; branch setup skipped." Sub-agents that need to commit will run their own git commands inside the relevant sub-repo.

   - Read current branch: `git rev-parse --abbrev-ref HEAD`.
   - Read base reference: `git rev-parse --abbrev-ref origin/HEAD` (fallback `main` / `master`).
   - Decide if the current branch is **fit** for this change:
     - The branch slug already contains `{change-name}` (case-insensitive substring match), OR
     - The branch has **zero** commits ahead of base (`git rev-list --count {base}..HEAD` returns `0`).
   - If the branch is unfit (e.g. `main`, `master`, or a feature branch carrying commits unrelated to this change):
     - Pick a branch type from intent. Look at the user prompt + bound ticket (Jira issue type, GitHub issue label) for signal:
       - "fix", "bug", "regression", "broken" → `fix`
       - "feat", "add", "implement", "new feature" → `feat`
       - "refactor", "cleanup", "tidy", "rename", "extract" → `refactor`
       - "docs", "documentation" → `docs`
       - "chore", "deps", "release" → `chore`
     - When unclear, ask once via `AskUserQuestion`: **feat** / **fix** / **refactor** / **chore** / **Stay on current branch**.
     - Run `git checkout -b {type}/{change-name}` from the base branch.

   > Branch creation here is part of workflow initialization, not a commit-mutating action. The "no `git commit` / `push`" rule still holds — those belong to the `git-commit` and `git-pull-request` skills invoked at the end of the workflow.
3. **Active-workflow marker** (engram, if available):
   ```
   mem_save(topic_key: "sdd/{change}/active-workflow", title: "sdd/{change}/active-workflow",
     type: "architecture", project: "{project}",
     content: "ACTIVE SDD workflow: {change}. Workdir: .sdd/{change}/. Phase: starting explore.")
   ```

When `.sdd/{change}/state.yaml` DOES exist (resume case): skip steps 1 and 2. The branch was already chosen at the original workflow start; mid-workflow branch changes are deliberate user choices and do NOT need re-validation. Recovery jumps straight to the next pending phase.

## Step 1 — PRD gate (before explore phase)

After saving the active-workflow marker and before launching the explore sub-agent, assess whether context is sufficient to start exploring without inventing scope. Catches poor context before burning tokens on exploration.

1. **Scope check** — count how many of these signals are present in the prompt, the bound ticket body, or via reasonable inference when a mention maps to a real artifact in the repo.
   - [ ] **Specific files or paths**: at least one concrete file path or filename — either explicit, or via clear mapping from a mention to a real file in the repo
   - [ ] **Out-of-scope statement**: explicit phrase listing what is NOT included (e.g., "out of scope:", "do not change X", "skip the Y flow")
   - [ ] **Bound ticket with non-empty body**: a ticket id was provided AND the ticket body was retrieved with substantive content
   - [ ] **Concrete acceptance criteria**: enumerated assertions, dimensions, or "done when X" criteria — not just a goal statement

   If 2 or more boxes are checked, context is sufficient. If fewer than 2, context is THIN.
2. **If context is sufficient**: continue directly to the explore phase. Do NOT prompt the user.
3. **If context is thin**: ask once via `AskUserQuestion`:
   - "Draft a PRD first to clarify scope" (recommended)
   - "Proceed anyway with what we have"
4. **If "Draft PRD"**: invoke `Skill("write-a-prd")` with the change-name. The skill runs the interview in your context and persists `.sdd/{change-name}/prd.md`. **When the skill returns, auto-launch the explore sub-agent immediately** — no ask, no narration, no wait. The user's choice in step 3 covers the whole PRD→explore arc.
5. **If "Proceed anyway"**: continue directly to the explore phase.

The PRD is opt-in for thin contexts only — never force it, never offer it when the user already gave you enough. `sdd-explore` and `sdd-plan` consume `prd.md` only when present; behaviour is unchanged when it isn't.

## Post-Phase Protocol (MANDATORY after EVERY sub-agent)

**Trust the envelope.** A sub-agent that returns `status: ok` with a `Gates:` line listing project gate results (build / test / lint / format / type-check — whatever the project uses) has already run those gates and passed. The orchestrator MUST NOT re-run any verification command after an `ok` envelope — that's the implementer's contract, and re-running burns tokens, time, and Output Discipline. Only when an envelope returns `status: warning` or `status: failed` does manual validation belong here, and even then only on the specific signals the envelope flagged.

1. **Parse** the SDD Envelope from sub-agent output (format: `{SHARED_DIR}/envelope-contract.md`). For parallel implement waves: run steps 1–3 for EACH sub-agent envelope in the wave. Aggregate status: if all `ok` → wave is `ok`; if any `failed` → wave is `failed`; if any `warning` but none `failed` → wave is `warning`.
2. **Write state.yaml STRICTLY** per the schema in `{SHARED_DIR}/persistence-contract.md`. Use ONLY the field names listed in the schema (REQUIRED + OPTIONAL sections). Do NOT invent any other fields — the contract enumerates what is forbidden and why. If you think a new field is needed, the answer is no — propose a contract change first. For parallel waves: write the highest-severity status from all sub-agents in the wave.
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
   mem_save(
     topic_key: "sdd/{change}/active-workflow",
     type: "architecture", project: "{project}",
     title: "sdd/{change}/active-workflow",
     content: "ACTIVE SDD workflow: {change}. Workdir: .sdd/{change}/. NEXT: {phase} phase -> {next step}."
   )
   ```

4. **Show** executive summary to user (verbatim from envelope). For parallel implement waves: show per-batch status first, then the aggregated wave status.
5. **Guidance loop** (plan phase only): After `plan` phase returns `status: guidance_requested`:
   a. Extract `requested_advisors[]` and `guidance_context` from envelope.
   b. Increment `guidance_round` in state.yaml (for tracking only — no maximum).
   c. Launch all advisors in parallel using the Advisor Consultation Template from `{SHARED_DIR}/advisor-templates.md`. Use `run_in_background: true` for each.
   d. Wait for all advisor background tasks to complete.
   e. Collect the summary and engram observation ID returned by each advisor.
      (Each advisor persists its own output to engram and returns the observation ID.)
      If an advisor reports engram unavailable: keep its returned inline summary text for step f.
   f. Re-launch sdd-plan using the Plan Re-entry with Guidance Template from `{SHARED_DIR}/advisor-templates.md`.
      - For each advisor: include its observation ID in the GUIDANCE block (planner fetches full content via mem_get_observation).
      - If engram unavailable for an advisor: include its inline summary text in the GUIDANCE block instead.
   g. After sdd-plan re-entry returns envelope: loop back to step 1 (Post-Phase Protocol from start).
   - After non-plan phases or after `status: ok/warning/blocked/failed`: skip this step.
   - The guidance loop runs as many times as sdd-plan requests guidance_requested. The user controls plan quality via crit review — if during a crit iteration the planner needs more advisor input, it can request guidance again.
6. **Crit detection** (plan phase only): After `plan` phase with `status: ok`, run `which crit` (Bash).
   - If crit is found: auto-launch Crit Plan Review Protocol (see dedicated section below). Skip step 7.
   - If crit is NOT found: proceed to step 7 (existing flow, no behavioral change).
   - After non-plan phases: skip this step entirely.
7. **Ask or auto-continue**:
   - explore `status: ok` → auto-launch plan (no ask — 99% of the time users continue immediately)
   - explore `status: warning/blocked` → ask user (ambiguities or limitations need resolution first)
   - plan `status: ok` (post-crit, approved — `crit_completed: true` in state.yaml) → auto-launch implement (no ask — the human already approved the plan inline via Crit, asking again is redundant)
   - implement `status: ok` → auto-launch review (no ask)
   - All other cases → `AskUserQuestion`: **Continue to {next}** / **Review artifacts** / **Abort**

   **Crit confirmation guard** (plan phase, when crit IS available): After plan phase with `status: ok`, if `which crit` succeeds:
   - Check `crit_completed` in `.sdd/{change}/state.yaml`.
   - If `crit_completed` is absent or `false`: MUST NOT offer "Continue to implement". Auto-launch Crit Plan Review Protocol immediately (return to step 6).
   - If `crit_completed` is `true`: crit was executed and approved — auto-launch implement directly (no ask — see plan post-crit rule above). This guard exists for compaction-recovery cases where the orchestrator re-enters step 7 after Crit already approved.

## Crit Plan Review Protocol

Triggered automatically by Post-Phase Protocol step 6 when `which crit` succeeds after a plan phase.

1. **Pre-flight**: before opening the browser, scan for stale daemons that could swallow this review:
   - `pgrep -f "crit plan.*{change}"` — if a leftover daemon from an earlier run is still alive, kill it (`pkill -f "crit plan.*{change}"`) so this round writes to a clean state. Skip this if no match.
   - This avoids the EOF / "could not reach crit daemon" failure mode where a half-dead daemon from a previous round eats the new request.
2. **Launch**: Run `crit plan --name {change} .sdd/{change}/plan.md` in background (Bash, `run_in_background: true`). Tell user: "Crit is open in your browser. Leave inline comments on the plan, then click Finish Review."
3. **Wait**: Do NOT proceed until the background task completes.
   - **If the Bash call fails with a daemon error** (`could not reach crit daemon`, `EOF`, connection refused) AND no `~/.crit/plans/{change}/.crit/review.json` exists yet: do **one** auto-retry silently — kill any stale process matching `crit plan.*{change}` and re-launch step 2. Do NOT narrate the retry to the user. If the retry also fails, surface to the user: **Retry Crit review** / **Skip Crit, review plan manually** / **Approve plan as-is**. Do NOT loop the auto-retry beyond one attempt.
   - **If the Bash call times out** (user took too long): Do NOT treat this as approval. The absence of `.crit/review.json` means the review was NEVER completed. Surface to the user with the same three options.
   - **If `~/.crit/plans/{change}/.crit/review.json` exists despite a Bash error**: the daemon wrote feedback before dying — proceed to step 4 with the file as truth.
4. **Read feedback**: Read `~/.crit/plans/{change}/.crit/review.json` using the Read tool. Note: plan mode stores `.crit/review.json` in `~/.crit/plans/{change}/`, NOT in the project root.
5. **Parse**: Extract all comments where `resolved` is `false` or missing.
6. **Branch**:
   - **Has unresolved comments**: Format as CRIT_FEEDBACK markdown (see format below). Re-launch `sdd-plan` sub-agent using the Plan Re-entry template from `{SHARED_DIR}/launch-templates.md`. After sub-agent returns envelope, increment `plan_review_round` in `state.yaml` and loop back to step 1 (run crit again for next round).
   - **No unresolved comments**: Plan approved. Set `crit_completed: true` in `.sdd/{change}/state.yaml`. Show "Plan approved via Crit review. Auto-launching implement phase." Proceed to Post-Phase step 7.

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
   b. Launch all `Parallel=Yes` batches as background Task() (use Parallel Batch Template from `{SHARED_DIR}/launch-templates.md`)
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

After review completes, behavior depends on status:

- `ok` → **Auto-commit** (invoke `Skill("git-commit")` immediately, no ask) → **Auto-PR** (invoke `Skill("git-pull-request")` immediately, no ask) → write marker `COMPLETED`. Zero user prompts on the happy path.
  - If commit fails: set `awaiting_user_decision=post-review-commit-retry` in `state.yaml`; ask **Retry commit** / **Abort** — marker stays `ACTIVE`.
  - If PR fails: set `awaiting_user_decision=post-review-pr-retry` in `state.yaml`; ask **Retry PR** / **Abort** — marker stays `ACTIVE`.
- `warning` → ask: **Commit anyway** (via `git-commit` skill) / **Fix issues first** / **Done**
- `failed` → ask: **Fix issues** / **Done** (NO commit option)

When user chooses "Commit anyway": invoke `Skill("git-commit")` — do NOT run git commands directly.
When user chooses "Fix issues": delegate fixes to a sub-agent (orchestrator NEVER fixes code), then auto-launch review again.

On Abort at any status: clear `awaiting_user_decision`; write marker `ABORTED`.
Terminal states: `COMPLETED` (success) and `ABORTED` (gave up) — marker is `COMPLETED` only after both commit and PR succeed.

On workflow completion or abort, clear the marker:
```
mem_save(topic_key: "sdd/{change}/active-workflow", ..., content: "COMPLETED|ABORTED SDD workflow: {change}.")
```

## Gotchas (observed failures)

1. **Context exhaustion**: Never launch one sub-agent for all implement tasks. Use wave orchestration.
2. **Stale [X] markers**: Always verify plan.md markers after each implement wave.
3. **Engram previews are truncated**: Never use `mem_search` results directly. Always follow with `mem_get_observation`.
4. **Post-Phase skipping**: System-level "be concise" instructions do NOT override the Post-Phase Protocol.
5. **Crit timeout ≠ approval**: If `crit plan` is killed by timeout or fails, the absence of `.crit/review.json` means the review was NEVER completed — NOT that it was approved with no comments. ALWAYS ask the user before proceeding to implement.

## Edge Cases and Recovery

Compaction recovery, fail-fast error handling, abort/complete cleanup, and non-SDD context injection are in `{SHARED_DIR}/recovery.md`.

## References

- Envelope format: `{SHARED_DIR}/envelope-contract.md`
- Persistence rules: `{SHARED_DIR}/persistence-contract.md`
- Launch templates: `{SHARED_DIR}/launch-templates.md`
- Recovery flows: `{SHARED_DIR}/recovery.md`
