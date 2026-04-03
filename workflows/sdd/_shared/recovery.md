# SDD Recovery and Edge-Case Flows

## Compaction Recovery Protocol

You arrived here because the catalog's Compaction Recovery directive detected an active SDD workflow. You are the SDD orchestrator -- a delegate-only coordinator.

### Recovery Steps

1. **Primary -- Read `.sdd/{change}/state.yaml`** (always works, file-based):
   - Parse YAML to get `current_phase`, `phases` map, and `artifacts` list
   - Schema defined in `{WORKFLOW_DIR}/_shared/persistence-contract.md`

2. **Fallback -- Engram** (only if state.yaml is missing AND engram is available):
   ```
   Step 1: mem_search(query: "sdd/{change}/state", project: "{project}")
   Step 2: mem_get_observation(id: {id from step 1})
   ```
   NEVER use `mem_search` previews directly -- they are truncated.

3. **Resume**: Continue from the next pending phase. Delegate via sub-agents using launch templates in `{WORKFLOW_DIR}/_shared/launch-templates.md`. If no state is recoverable, inform the user: **Restart** / **Abort**.

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
