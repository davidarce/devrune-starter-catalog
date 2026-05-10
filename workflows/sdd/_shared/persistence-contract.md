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

`.sdd/{change}/state.yaml` is the orchestrator's persistent state file. The sections below define the schema and the write rules. **For recovery semantics — how to read state.yaml after a compaction, the review→completion auto-flow rules — see `{SHARED_DIR}/recovery.md`.**

### Canonical schema

```yaml
# ─── REQUIRED ──────────────────────────────────────────────────────
change: {change-name}                          # workflow id (matches dir name)
phase: explore | plan | implement | review | done
phase_status: ok | warning | failed | blocked
last_updated: 2026-05-10T17:42:11Z              # ISO 8601 with timezone (UTC preferred)
next: explore | plan | implement | review | commit | pr | done

# ─── OPTIONAL — workspace context ───────────────────────────────────
project: {engram-project-name}                  # used to scope engram saves
branch: {git-branch}                            # only when inside a git repo

# ─── OPTIONAL — engram cross-references (append per phase) ──────────
engram:
  explore_summary: obs-...
  plan_summary: obs-...
  implement_summary: obs-...
  review_summary: obs-...

# ─── OPTIONAL — workflow control flags (append-only as relevant) ───
guidance_round: N                               # plan-phase advisor cycles
plan_review_round: N                            # crit review rounds
crit_completed: true                            # set when crit approves
review_round: N                                 # post-review fix cycles

# ─── OPTIONAL — review→completion auto-flow ────────────────────────
commit_completed: true                          # set after git-commit skill returns ok
commit_sha: "<git-sha>"                         # alongside commit_completed for audit + idempotence
awaiting_user_decision: post-review-commit-retry | post-review-pr-retry
                                                # cleared when the user answers (Retry or Abort)
```

### Explicitly forbidden — do NOT add these fields

| Field | Why forbidden |
|---|---|
| `artifacts:` map | Derivable from `ls .sdd/{change}/*.md` at recovery time. Listing them duplicates the filesystem and forces every transition to mutate state. |
| `batches_completed:` array | The `[X]` markers in `plan.md` are the source of truth for batch progress. Counting them at recovery is cheap. |
| `phases:` map | `phase` plus the natural pipeline order (explore → plan → implement → review) is enough. The map is redundant. |
| `created` / `updated` (date strings) | `last_updated` (ISO 8601) already covers time. Two date fields is noise. |
| `gates:` map (`go_build: pass`, ...) | The sub-agent envelope already conveys gate results; recovery does not need them. |
| `risks:` list | Already in `plan.md` Risks section and in the sub-agent envelope. |
| `notes:` list | Use comments in plan.md or `awaiting_user_decision` for actionable state. |
| `implement:` map (`waves_completed`, `tasks_completed`, `tasks_total`) | All derivable from `[X]` markers in plan.md. |

### Hard Rules

- **Always written** after each phase completes (file-based, never fails).
- **Orchestrator is the sole writer** — sub-agents never modify state.yaml.
- **Append-only optional fields**: when a field becomes relevant (first Crit round, first review fix, etc.), add it. Do NOT pre-create empty fields.

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
  content: "ACTIVE SDD workflow: {change}. Workdir: .sdd/{change}/. Phase: {current_phase}."
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

All engram operations MUST use the try/skip pattern. Engram may not be installed or
configured, and even when it is, the cwd may contain multiple sub-repos that confuse
project resolution.

### Detection (once per session)

At session start, the orchestrator attempts `mem_context()` and classifies the outcome:

```
try:  mem_context()
      -> engram_available = true; engram_project = (whatever engram resolved)

catch error:
  if error is "tool not found" / "unknown tool" / "MCP server not running":
      -> engram_available = false   # genuinely missing

  elif error mentions "ambiguous project" or "multiple git repos":
      -> engram IS installed; cwd just needs disambiguation.
         Recover by calling mem_current_project():
           if it returns a project name:
             -> engram_available = true; engram_project = <name>
                Pass project: engram_project on every later engram call.
                Tell user once: "Engram resolved to project <name>; set
                .engram/config.json at the workflow root to make this explicit."
           else:
             -> engram_available = false

  else:
      -> engram_available = false   # unknown error, fail-safe
```

Cache `engram_available` and `engram_project`. Do NOT re-check per operation.

At most ONE disambiguation retry via `mem_current_project()`. No retry loops.

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

## Phase Artifact Save Convention

When a phase completes, save a structured summary to engram (subject to the Engram Availability Guard). Per-phase parameters:

| Phase | `title` / `topic_key`                  | Content summary                                                       |
|-------|-----------------------------------------|------------------------------------------------------------------------|
| explore   | `sdd/{change}/explore`              | Objective, Architecture, Selected Files (paths + one-liner), Relationships, Ambiguities |
| plan      | `sdd/{change}/plan`                 | Full plan.md content (small enough to fit; otherwise summarize sections) |
| implement | `sdd/{change}/implement-progress`   | Completed tasks (the `[X]` list), final status (ok/failed), files modified |
| review    | `sdd/{change}/review-report`        | Summary, Plan Alignment, Critical Issues, Minor Improvements, final status |

Common arguments:

```
mem_save(
  title: "<from table>",
  topic_key: "<same as title>",
  type: "architecture",
  project: "{project}",
  content: "<phase-specific summary>"
)
```

Note the returned observation ID and include it as `engram_ref` in the SDD envelope. If engram is unavailable, skip silently — do not error.

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
