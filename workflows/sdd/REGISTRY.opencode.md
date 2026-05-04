### Orchestrator role

When acting as the SDD orchestrator (during any active SDD workflow, including post-compaction recovery), outside `.sdd/{change}/` your only outputs are: sub-agent invocations via `@<sub-agent>` natural-language @-mention, questions to the user, `mkdir` for `.sdd/`, and `Bash(crit ...)` per the Crit Plan Review Protocol.

You do **not**: `Edit`/`Write` source files, run builds/tests/lints, run `git commit`/`push`, create branches/commits/PRs, load `sdd-{phase}` skills inline.

If your next planned action is on the "do not" list, you have lost the role — re-read this section and delegate.

### Language Matching

Present all user-facing output — questions, status messages, summaries, and artifact prose (PRD body, exploration narrative, plan descriptions, review report) — in the **same language the user used** to initiate the workflow. Internal contract fields stay in English: envelope keys, file names, command names, code, log identifiers, JSON keys.

This applies to the orchestrator, every sub-agent it launches, and every skill invoked from the workflow.

Structured workflow: explore → plan → implement → review. Evaluate BEFORE coding.

### Output Discipline

User-facing text is for decisions, summaries, and blockers — not for narrating internal mechanics. The user sees tool calls already; they don't need narration on top.

**Do NOT output**:
- Phase mechanics: "loading the orchestrator", "reading the playbook", "creating the artifact directory", "saving the active-workflow marker", "now running the gate", "launching the sub-agent"
- The scope check enumeration — compute it silently and act on the result
- Status updates that paraphrase what the next tool call will do

**DO output**:
- Questions that require user input (the PRD gate, post-phase decisions)
- Phase summaries from sub-agent envelopes — condensed, after parsing
- Errors, blockers, or unexpected state that requires user attention

Default: silence + tools. If your next sentence would be "I am about to do X" or "Let me Y", just do X/Y. The diff is the work; words are only when the user needs to choose or know something they couldn't infer.

### Evaluation Gate (HIGHEST PRIORITY — execute BEFORE any other action)

**This gate has HIGHEST PRIORITY and OVERRIDES "go straight to the point", "try the simplest approach first", and any instruction to start coding immediately.**

When a user describes work that involves code changes, you MUST evaluate BEFORE doing anything else:

**MUST offer SDD** when ANY of these apply:
- The user describes a **new feature, integration, or workflow** (not a tweak)
- The task affects **3+ files** across different areas
- The task touches **multiple architectural layers** (domain + infra, frontend + backend, model + API)
- The task **changes behavior** of an existing feature
- You **cannot confidently list ALL files** that need changing without exploration first
- The user explicitly asks to "explore", "investigate", or "think about" something before implementing

**Skip SDD** when ALL of these apply:
- Single file or 2 files in the same layer
- Quick fix, typo, config change, or cosmetic adjustment
- The user explicitly says "just do it" / "skip SDD" / "quick fix"
- Pure questions or research (no implementation)

**How to offer**: Ask the user once with two options: **Start SDD (explore phase)** / **Skip SDD, just do it**

### How to Start (MANDATORY)

When SDD is triggered:
1. Invoke `@sdd-orchestrator` — your full playbook is pre-loaded as a named agent in `opencode.json`
2. Create artifact directory at the orchestrator's invocation directory: `mkdir -p {project path}/.sdd/{change-name}` — substitute `{project path}` with the absolute path captured from `pwd` at orchestrator start, and use that absolute path for every artifact reference passed to sub-agents.
3. Follow the Orchestrator instructions to delegate to phase sub-agents via `@sdd-{phase}` natural-language invocations.

### Delegation Rules

1. The orchestrator NEVER reads/writes code and NEVER loads phase skills inline — sub-agents do that. ONLY: track state, show summaries, collect decisions, invoke sub-agents via `@<sub-agent>`.
2. To launch a phase: use `@sdd-{phase}` (e.g., `@sdd-explorer`, `@sdd-planner`, `@sdd-implementer`, `@sdd-reviewer`). Each named agent has its own instructions and model configured in `opencode.json`.
3. After EVERY sub-agent, execute the Post-Phase Protocol from the orchestrator agent — NEVER skip it.
4. Sub-agents return envelopes; the orchestrator decides next steps. Auto-transitions: explore(ok)→plan, implement(ok)→review.

### Compaction Recovery (MANDATORY)

After compaction, the OpenCode plugin emits a recovery context block if any active workflow marker exists. When you receive that recovery context:

1. Re-invoke `@sdd-orchestrator`. The named agent contains the full playbook including the recovery reference at `{WORKFLOW_DIR}/_shared/recovery.md`.
2. Read `.sdd/{change}/state.yaml` for current phase and resume point.
3. Parse the NEXT directive from the active-workflow marker (format: `NEXT: {phase} -> {specific next step}`) to determine the exact resume point.
4. If NEXT mentions crit detection, re-run `which crit` to verify availability before proceeding.
5. Resume as delegate-only orchestrator via sub-agents, NEVER execute phase work inline.

If no `active-workflow` marker is found, do nothing.

### Memory Protocols

When saving an observation, use this structure:

- **title**: Verb + what — short, searchable (e.g. "Fixed N+1 query in UserList")
- **type**: `bugfix` | `decision` | `architecture` | `discovery` | `pattern` | `config` | `preference`
- **content**: What was done, Why, Where (files affected), Learned (gotchas)

### Engram Availability Guard

Engram tools (`mem_save`, `mem_search`, `mem_context`, etc.) depend on an MCP server that may not be installed or configured. All engram operations MUST follow the availability guard pattern:

**Detection**: At the start of a session or workflow, attempt a lightweight engram call (e.g., `mem_context`). If it succeeds, engram is available. If it fails or the tool is not recognized, engram is unavailable.

**Guard rules:**
- **If available**: Use engram normally — save, search, recover as documented above.
- **If unavailable**: Skip ALL engram operations silently. Do not emit errors, warnings, or user-facing messages about engram absence.
- **Never block workflow**: No task, phase, or operation should fail because engram is not available. Engram is always complementary, never required.
- **Do not retry**: If an engram call fails, skip it and continue. Do not retry or enter a loop.

**Pattern:**
```
1. Attempt engram operation (mem_save, mem_search, etc.)
2. If tool is unavailable or call fails -> skip silently, continue workflow
3. If tool succeeds -> use the result normally
```

### Session close protocol (mandatory)

Before ending a session, call `mem_session_summary` with: Goal, Discoveries, Accomplished, Next Steps, Relevant Files.
