# SDD Adviser Templates

These templates are used by the orchestrator when handling `guidance_requested` envelopes.
See `launch-templates.md` for phase launch templates (explore, plan, implement, review).

## Adviser Consultation Template

> **Multi-agent compatibility note**: This template is for Claude and Factory agents (Task() + run_in_background supported).
> OpenCode: use the Sequential Adviser Template below (run_in_background: false, one at a time).
> Copilot: use the Copilot Adviser Invocation section below (@agent-name pattern, no Task() tool).
> Codex: same template as Claude/Factory — Task() is supported; run_in_background: false (no background support).

Use this template for each adviser when the orchestrator handles a `guidance_requested` envelope.
Launch all requested advisers in parallel (run_in_background: true).

Task(
  description: 'adviser consultation ({adviser-skill}) for {change-name}',
  subagent_type: 'general-purpose',    // hardcoded — advisers are always general-purpose Task() calls
  model: '{WORKFLOW_MODEL_ADVISER}',
  run_in_background: true,
  prompt: 'You are a specialist adviser sub-agent. Load your skill:

  Skill(skill: "{adviser-skill}", args: "{change-name}")

  If the Skill tool fails, fall back to reading the SKILL.md file directly:
  Read("{SKILLS_PATH}/skills/{adviser-skill}/SKILL.md")
  (e.g. for Codex/Copilot where Skill() is unavailable — reading the file gives the same instructions)
  If neither Skill() nor the file read succeeds, use your built-in domain knowledge for this adviser role.

  CONTEXT:
  - Change: {change-name}
  - Project: {project path}

  GUIDANCE CONTEXT FROM PLANNER:
  {guidance_context from envelope}

  CURRENT PLAN EXCERPT:
  {paste relevant sections from .sdd/{change-name}/plan.md}

  TASK:
  Analyse the plan above from your specialist domain perspective.
  Provide structured advice in this format:

  ### Strengths
  [What looks good in the current plan]

  ### Issues Found
  [Problems with severity: Critical / Major / Minor. Be specific — reference file paths and section names.]

  ### Recommendations
  [Specific actionable suggestions. Each recommendation should reference a plan task ID or section.]

  PERSISTENCE:
  Save your full advice output to engram:
  mem_save(
    title: "sdd/{change-name}/guidance/{adviser-skill}",
    type: "architecture",
    project: "{project-name}",
    content: "{your full structured advice output}"
  )
  If engram is unavailable, skip saving silently.

  RETURN FORMAT:
  Return a short summary of your advice (3-5 bullet points) plus the engram observation ID (if saved).
  Format:
  ### Summary
  - ...key points...
  ### Engram ID
  {observation_id or "unavailable"}

  Do NOT produce an SDD Envelope.'
)

## Sequential Adviser Consultation Template (OpenCode / Codex)

> Use this template instead of the parallel template above when `run_in_background` is NOT supported
> (OpenCode, Codex). Launch advisers one at a time, foreground.

Task(
  description: 'adviser consultation ({adviser-skill}) for {change-name}',
  subagent_type: 'general-purpose',
  model: '{WORKFLOW_MODEL_ADVISER}',
  run_in_background: false,   // OpenCode/Codex: foreground only
  prompt: '...same prompt body as parallel template above...'
)

Run each adviser sequentially. Wait for each to return before launching the next.

## Copilot Adviser Invocation

> Copilot has no Task() tool. Use natural language @agent-name invocations instead — exactly the same
> mechanism the orchestrator uses to invoke `@sdd-planner` and `@sdd-explorer`.
>
> **Why @agent-name (not #runSubagent)**: `#runSubagent` is VS Code-specific and less portable.
> Natural language `@agent-name` invocation is the standard Copilot subagent mechanism and matches
> the existing SDD phase pattern. Each adviser is a `.agent.md` file in `.github/agents/`.
>
> Invoke advisers sequentially (no background execution in Copilot).

Invoke each requested adviser by naming it in your message:
```
@{adviser-skill} You are a specialist adviser. Load your skill by reading:
{SKILLS_PATH}/{adviser-skill}/SKILL.md

GUIDANCE CONTEXT FROM PLANNER:
{guidance_context from envelope}

CURRENT PLAN EXCERPT:
{paste relevant sections from .sdd/{change-name}/plan.md}

Provide advice in Strengths / Issues Found / Recommendations format.
Save to engram if available. Return summary + engram ID.
```
Example invocations: `@architect-adviser`, `@api-first-adviser`, `@unit-test-adviser`, etc.
Each `.agent.md` configures the agent to read its own SKILL.md — no fallback to a generic agent needed.

---

## Plan Phase: Re-entry with Guidance Template

When the orchestrator re-enters `sdd-plan` after collecting adviser guidance:

Task(
  description: 'plan re-entry (guidance round {N}) for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_PLANNER}',
  model: '{WORKFLOW_MODEL_PLANNER}',
  run_in_background: false,
  prompt: 'You are an SDD sub-agent. Your first action MUST be to try loading your phase instructions via the Skill tool:

  Skill(skill: "sdd-plan", args: "{change-name}")

  If the Skill tool fails, fall back to reading {project path}/{SKILLS_PATH}/sdd-plan/SKILL.md directly.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md (EXISTING — revise, do not recreate)

  GUIDANCE (Round {N}):
  Adviser recommendations collected by orchestrator. For each entry below, fetch full content via
  mem_get_observation(id) if an ID is provided, or read the inline text directly if no ID.

  {for each adviser:}
  ### {adviser-skill} (engram ID: {observation_id or "inline"})
  {if inline: paste adviser output directly}
  {if ID: "Fetch via mem_get_observation({observation_id})"}

  TASK:
  Integrate the adviser recommendations into plan.md.
  For each recommendation:
  1. Assess whether it applies (some may not fit scope)
  2. If it applies: update the relevant task, add/modify Detail Block, adjust Before/After, or add a new task
  3. Document integration in ## Advice Received section
  Skip the Deep Interview, Team Selection, and Guidance Request steps (already completed).
  Re-run the Detail Quality Gate.
  Return the SDD Envelope with status: ok (or warning if recommendations could not be fully integrated).

  PERSISTENCE: See {project path}/{WORKFLOW_DIR}/_shared/persistence-contract.md

  IMPORTANT: Your LAST output MUST be the SDD Envelope per _shared/envelope-contract.md.'
)
