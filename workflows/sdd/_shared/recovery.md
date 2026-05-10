# SDD Recovery and Edge-Case Flows

## Compaction Recovery Protocol

You arrived here because the catalog's Compaction Recovery directive detected an active SDD workflow. The state schema (`{SHARED_DIR}/persistence-contract.md`) defines what state.yaml carries; this section defines how to read it after a compaction and resume.

### Recovery via state.yaml

1. **Primary — read `.sdd/{change}/state.yaml`** (always works, file-based):
   - Parse YAML; the canonical fields are `phase`, `phase_status`, `next` (per `{SHARED_DIR}/persistence-contract.md`).
   - Compute available artifacts from disk: `ls .sdd/{change}/*.md`.
   - If `phase: implement` and `plan.md` exists, count `[X]` vs `[ ]` markers in plan.md to determine batch progress.
   - Resume from the action named in `next` (or the next pending batch within `implement`).

2. **Fallback — engram** (only if state.yaml is missing AND engram is available):
   ```
   Step 1: mem_search(query: "sdd/{change}/state", project: "{project}")
   Step 2: mem_get_observation(id: {id from step 1})
   ```
   NEVER use `mem_search` previews directly — they are truncated.

3. **Last resort**: if no state is recoverable, inform the user: **Restart** / **Abort**.

### Recovery Semantics — Review→Completion Auto-Flow

When `phase: review` and `phase_status: ok`, apply these rules in order:

1. **`awaiting_user_decision == post-review-commit-retry`**: the auto-flow stopped at a commit failure. Resume by surfacing the commit failure ask (**Retry commit / Abort**). Do NOT re-run the commit automatically.
2. **`awaiting_user_decision == post-review-pr-retry`**: `commit_completed` is `true`; the commit already succeeded. Skip the commit step entirely and surface the PR failure ask (**Retry PR / Abort**).
3. **`commit_completed == true` and `awaiting_user_decision` is absent**: commit already done; the auto-flow was interrupted after commit but before PR. Proceed directly to auto-PR (no re-commit).
4. **Neither `commit_completed` nor `awaiting_user_decision` is present**: normal entry — follow the standard auto-commit → auto-PR → COMPLETED path.

**Clearing rules**:
- On Abort at any point: clear `awaiting_user_decision` from state.yaml; write marker `ABORTED`.
- On successful PR: clear `awaiting_user_decision`, `commit_completed`, and `commit_sha`; write marker `COMPLETED`.

## Fail-Fast Error Handling

When an envelope returns `status: failed` or `status: blocked`:

1. Show `executive_summary` and `risks` to the user immediately
2. Present options via `AskUserQuestion`:
   - **Retry this phase** -- re-launch same sub-agent
   - **Abort SDD** -- stop workflow entirely
   - **Skip to next phase** -- proceed despite failure (user assumes risk)
3. **No auto-recovery** -- the orchestrator NEVER retries automatically or attempts fixes itself

## Abort / Complete Cleanup

When a workflow ends (user aborts or completes), clear the active-workflow marker (if engram available):

```
mem_save(
  topic_key: "sdd/{change}/active-workflow",
  type: "architecture", project: "{project}",
  title: "sdd/{change}/active-workflow",
  content: "ABORTED|COMPLETED SDD workflow: {change}. No recovery needed."
)
```

Use `ABORTED` when user chooses abort. Use `COMPLETED` after successful commit or "Done".

## Non-SDD Context Injection

When the orchestrator delegates a **non-SDD task** (general work, not a phase), inject engram context:

1. **Search** (if engram available):
   ```
   mem_search(query: "{topic keywords}", project: "{project}")
   ```
   If relevant results found, include a 2-4 sentence summary under `CONTEXT FROM PREVIOUS SESSIONS:` in the sub-agent prompt.

2. **Include persistence mandate** in the sub-agent prompt:
   ```
   PERSISTENCE (MANDATORY):
   Save important discoveries, decisions, or bug fixes to engram before returning:
     mem_save(title: "...", type: "{decision|bugfix|discovery|pattern}",
              project: "{project}", content: "**What**: ...\n**Why**: ...\n**Where**: ...\n**Learned**: ...")
   ```

3. If engram is NOT available, skip context injection. Launch the sub-agent normally.
