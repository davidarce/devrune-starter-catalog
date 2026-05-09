# SDD Advisor Templates (OpenCode)

<!-- SYNC WITH: advisor-templates.md (generic), advisor-templates.claude.md, advisor-templates.copilot.md -->
<!-- OpenCode-only file. Installed name strips the .opencode.md suffix to advisor-templates.md. -->

These templates are used by the orchestrator when handling `guidance_requested` envelopes.
See `launch-templates.md` for phase launch templates (explore, plan, implement, review).

> **OpenCode constraint**: `run_in_background` is NOT supported. Advisors run sequentially as
> foreground `Task()` calls — one at a time. There is no parallel template here.

## Sequential Advisor Consultation Template

For each advisor in `requested_advisors[]`, launch a foreground `Task()` and wait for it to return
before launching the next.

> The advisor sub-agent's model is configured in `opencode.json` under
> `agent.{WORKFLOW_SUBAGENT_ADVISOR}.model` — do not pass `model:` in the `Task()` call.

```
Task(
  description: 'advisor consultation ({advisor-skill}) for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_ADVISOR}',
  prompt: 'You are a specialist advisor sub-agent for the {advisor-skill} role.

  Load your skill instructions:
    Read("{SKILLS_PATH}/{advisor-skill}/SKILL.md")

  CONTEXT:
  - Change: {change-name}
  - Project: {project path}

  GUIDANCE CONTEXT FROM PLANNER:
  {guidance_context from envelope}

  PLAN:
  Read the full plan at: .sdd/{change-name}/plan.md
  Focus your analysis on the sections relevant to your domain, but consider the full
  architecture context — cross-section dependencies matter. The guidance_context above
  tells you WHERE to focus; the plan gives you the FULL picture.

  TASK:
  Read the plan file first, then analyse from your specialist domain perspective.
  Provide structured advice in this format:

  ### Strengths
  [What looks good in the current plan]

  ### Issues Found
  [Problems with severity: Critical / Major / Minor. Be specific — reference file paths and section names.]

  ### Recommendations
  [Specific actionable suggestions. Each recommendation should reference a plan task ID or section.]

  PERSISTENCE:
  Save your full advice output to engram (skip silently if engram is unavailable):
    mem_save(
      title: "sdd/{change-name}/guidance/{advisor-skill}",
      type: "architecture",
      project: "{project-name}",
      content: "{your full structured advice output}"
    )

  RETURN FORMAT:
  Return a short summary of your advice (3-5 bullet points) plus the engram observation ID (if saved).
  Format:
  ### Summary
  - ...key points...
  ### Engram ID
  {observation_id or "unavailable"}

  Do NOT produce an SDD Envelope.'
)
```

After every advisor returns, collect its `Summary` and `Engram ID` (or inline summary text when engram
is unavailable) before launching the next advisor.

---

## Plan Phase: Re-entry with Guidance Template

When the orchestrator re-enters `sdd-plan` after collecting all advisor summaries, launch the planner
again with the consolidated guidance block.

```
Task(
  description: 'plan re-entry (guidance round {N}) for {change-name}',
  subagent_type: '{WORKFLOW_SUBAGENT_PLANNER}',
  prompt: 'Your instructions are in {SKILLS_PATH}/sdd-plan/SKILL.md — read it first, then follow those instructions.

  CONTEXT:
  - Project: {project path}
  - Change: {change-name}
  - Artifact directory: .sdd/{change-name}/
  - Previous artifacts: exploration.md, plan.md (EXISTING — revise, do not recreate)

  GUIDANCE (Round {N}):
  Advisor recommendations collected by orchestrator. For each entry below, fetch the full content via
  mem_get_observation(id) when an engram ID is provided, or read the inline text directly otherwise.

  {for each advisor:}
  ### {advisor-skill} (engram ID: {observation_id or "inline"})
  {if inline: paste advisor output directly}
  {if ID: "Fetch via mem_get_observation({observation_id})"}

  TASK:
  Integrate the advisor recommendations into plan.md.
  For each recommendation:
  1. Assess whether it applies (some may not fit scope).
  2. If it applies: update the relevant task, add/modify Detail Block, adjust Before/After, or add a new task.
  3. Document integration in ## Advice Received section.
  Skip the Deep Interview, Team Selection, and Guidance Request steps (already completed).
  Re-run the Detail Quality Gate.'
)
```
