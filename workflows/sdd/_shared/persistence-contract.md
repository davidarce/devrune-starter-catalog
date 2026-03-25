# Persistence Contract (shared across all SDD skills)

## Mode Resolution

The SDD workflow uses a **2-mode model**. `.sdd/` files are ALWAYS the primary source of truth; engram is complementary and optional.

| Mode | Description | When Used |
|------|-------------|-----------|
| `.sdd/-first` | Write artifacts to `.sdd/{change}/` (always). Complement with engram (if available). | Default for all SDD operations |
| `none` | No persistence. Results returned inline only. | Fallback when `.sdd/` directory cannot be created |

There is NO `openspec`, `hybrid`, or `engram`-only mode. The `.sdd/` directory IS the file-based store.

## Behavior Per Mode

| Mode | Primary Read | Primary Write | Engram Read | Engram Write |
|------|-------------|---------------|-------------|--------------|
| `.sdd/-first` | `.sdd/{change}/*.md` | `.sdd/{change}/*.md` (always) | Fallback if file missing | If available, skip if not |
| `none` | Orchestrator prompt context | Nowhere | Never | Never |

### `.sdd/-first` Details

1. **Write**: Always write artifacts to `.sdd/{change}/` as markdown files (exploration.md, plan.md, etc.)
2. **Engram complement**: If engram tools are available, ALSO save a summary to engram for cross-session recovery
3. **Read**: Read from `.sdd/{change}/` first. If file is missing, try engram fallback (two-step recovery)
4. **Degradation**: If engram is unavailable, the workflow continues normally using `.sdd/` files only

## Who Reads, Who Writes

Sub-agents launch with a fresh context and NO access to the orchestrator's memory or instructions. The orchestrator controls what context they receive.

| Context | Who reads from store | Who writes to store |
|---------|---------------------|---------------------|
| Non-SDD (general task) | **Orchestrator** searches engram, passes summary in prompt | **Sub-agent** saves discoveries/decisions via `mem_save` |
| SDD (phase with dependencies) | **Sub-agent** reads from `.sdd/{change}/` files directly | **Sub-agent** writes its artifact to `.sdd/{change}/` and optionally to engram |
| SDD (phase without dependencies) | Nobody | **Sub-agent** writes its artifact to `.sdd/{change}/` and optionally to engram |

### Why This Split

- **Orchestrator reads for non-SDD**: It already has the engram protocol loaded and knows what context is relevant. Sub-agents doing their own searches waste tokens on potentially irrelevant results.
- **Sub-agents read for SDD**: SDD artifacts can be large (specs, designs, plans). The orchestrator should NOT inline them -- it passes file paths and the sub-agent reads the full content directly.
- **Sub-agents always write**: They have the complete detail at the point of creation. By the time results flow back to the orchestrator, nuance is lost. Persist at the source.

## state.yaml Schema

The orchestrator writes `.sdd/{change}/state.yaml` after each phase transition. This enables recovery after context compaction even without engram.

```yaml
change: {change-name}
current_phase: {phase that just completed}   # explore | plan | implement | review
phases:
  explore: done | pending | in_progress
  plan: done | pending | in_progress
  implement: done | pending | in_progress
  review: done | pending | in_progress
artifacts:
  - .sdd/{change}/exploration.md
  - .sdd/{change}/plan.md
  # ... list all artifact files that exist at this point
last_updated: {ISO 8601 datetime}
```

### Write Rules

- **Always written** after each phase completes (file-based, never fails)
- **Orchestrator is the sole writer** -- sub-agents never modify state.yaml
- The `artifacts` map reflects which `.sdd/{change}/` files exist at that point

### Recovery via state.yaml

When the orchestrator resumes after compaction:

1. Read `.sdd/{change}/state.yaml` to determine `current_phase` (last completed)
2. Check `phases` map to see which phases are `done`, `pending`, or `in_progress`
3. Parse `artifacts` list to know which `.sdd/` files are available
4. Resume from the next `pending` phase in the pipeline

### Optional Engram State Save

If engram is available, the orchestrator ALSO saves state to engram alongside the file:

```
mem_save(
  title: "sdd/{change-name}/state",
  topic_key: "sdd/{change-name}/state",
  type: "architecture",
  project: "{project}",
  content: "{state.yaml content as string}"
)
```

This provides an additional recovery path if `.sdd/` files are lost, but is NEVER required.

### Role Marker for Compaction Recovery

If engram is available, the orchestrator ALSO saves an active-workflow role marker alongside the state:

```
mem_save(
  title: "sdd/{change-name}/active-workflow",
  topic_key: "sdd/{change-name}/active-workflow",
  type: "architecture",
  project: "{project}",
  content: "ACTIVE SDD workflow: {change}. Orchestrator: {path}. Phase: {current_phase}."
)
```

**Purpose**: Compaction recovery trigger. The catalog's Compaction Recovery directive checks `mem_context` for observations matching `sdd/*/active-workflow` to detect active SDD workflows after context compaction.

**Lifecycle**:
- **Saved** when the SDD workflow starts (first sub-agent launch)
- **Upserted** on each phase transition via `topic_key` (always reflects the latest phase)
- **Cleared** on workflow completion or abort (content changes to "COMPLETED" or "ABORTED")

**Content conventions**:
- Starts with `"ACTIVE"` when workflow is in progress -- triggers recovery
- Changes to `"COMPLETED SDD workflow: ..."` or `"ABORTED SDD workflow: ..."` when finished -- does NOT trigger recovery

**Relationship to `state.yaml`**: The role marker answers "was SDD active in this session?" (session-aware via engram). The `state.yaml` file answers "which phase to resume?" (file-based, always available). The marker is the trigger; `state.yaml` is the state source.

**Graceful degradation**: If engram is not available, the marker is not saved and the catalog's recovery directive is naturally inert (no markers to detect via `mem_context`). The `state.yaml`-based recovery in ORCHESTRATOR.md remains as a manual fallback.

## Engram Availability Guard Pattern

All engram operations MUST use the try/skip pattern. Engram may not be installed or configured.

### Detection (once per session)

At session start, the orchestrator attempts:

```
try:  mem_context(project: "{project}")
      -> engram_available = true
catch (tool not found / error):
      -> engram_available = false
```

Cache the result. Do NOT re-check per operation.

### Guard Pattern for Sub-Agents

Sub-agents do not have access to the orchestrator's detection result. They use inline guards:

```
If engram tools are available (mem_save exists as a callable tool):
  mem_save(title: "...", content: "...")
  -> note the observation ID for the envelope
If engram tools are NOT available:
  Skip silently. Do NOT error. Do NOT warn the user.
  -> omit engram_ref from the envelope
```

### Rules

- **NEVER** let engram unavailability block the workflow
- **NEVER** show errors or warnings to the user about missing engram
- **ALWAYS** write `.sdd/` files regardless of engram availability
- **ALWAYS** skip engram operations silently when tools are not available

## Two-Step Recovery (Mandatory for Engram Reads)

When reading artifacts from engram (fallback path), ALWAYS use the two-step pattern:

```
Step 1: Search (returns truncated preview, ~300 chars)
  mem_search(query: "sdd/{change-name}/{artifact-type}", project: "{project}")
  -> Returns observation ID + truncated preview

Step 2: Get full content (REQUIRED -- previews are always truncated)
  mem_get_observation(id: {observation-id from step 1})
  -> Returns complete, untruncated content
```

**NEVER** use `mem_search` results directly as artifact content. The preview is truncated and incomplete.

## Sub-Agent Context Injection

The orchestrator MUST include persistence instructions when launching sub-agents. Sub-agents get a fresh context with no persistence knowledge.

### For SDD Sub-Agents

Include in the launch prompt:

```
PERSISTENCE RULES:
- Primary store: .sdd/{change-name}/ (ALWAYS write here)
- Engram: complementary (save summary if tools available, skip silently if not)
- Reference: persistence-contract.md in _shared/ for full rules
```

### For Non-SDD Sub-Agents

Include in the launch prompt:

```
PERSISTENCE (MANDATORY):
If you make important discoveries, decisions, or fix bugs, you MUST save them
to engram before returning:
  mem_save(title: "{short description}", type: "{decision|bugfix|discovery|pattern}",
           project: "{project}", content: "{What, Why, Where, Learned}")
Do NOT return without saving what you learned.
```

## General Knowledge Persistence Mandate

Sub-agents MUST save significant discoveries to engram before returning, independent of the phase artifact save. This applies to:

- **Architecture decisions** made during the phase
- **Bug fixes** discovered or applied
- **Non-obvious discoveries** about the codebase
- **Patterns established** (naming, structure, convention)

Format:

```
mem_save(
  title: "{Verb + what -- short, searchable}",
  type: "{decision|bugfix|discovery|pattern}",
  project: "{project}",
  content: "**What**: ...\n**Why**: ...\n**Where**: ...\n**Learned**: ..."
)
```

This is separate from and in addition to saving the phase artifact. If engram is unavailable, skip silently.
