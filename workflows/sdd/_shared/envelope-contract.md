# SDD Envelope Contract

Every SDD skill (explore, plan, implement, review) MUST return the SDD Envelope as its **LAST output**. Nothing may follow the envelope.

## Rules

1. The envelope is the FINAL output of the skill. No text, explanation, or follow-up after it.
2. Skills NEVER invoke other SDD skills. Return the envelope; the orchestrator decides what runs next.
3. Executive Summary must be **decision-grade** -- the orchestrator presents it to the user without reading full artifacts.

## Status Values

| Status | Meaning |
|--------|---------|
| `ok` | Phase completed successfully |
| `warning` | Completed, but with concerns that need attention |
| `guidance_requested` | Plan phase completed; adviser consultation required before finalizing. Orchestrator must launch advisers and re-enter plan with guidance. |
| `blocked` | Cannot proceed -- missing input, unresolved dependency, or ambiguity |
| `failed` | Error during execution |

## Envelope Template

Copy this block and fill it in as the last output of your skill:

```
---

## SDD Envelope

| Field | Value |
|-------|-------|
| **Status** | ok / warning / guidance_requested / blocked / failed |
| **Phase** | explore / plan / implement / review |
| **Change** | {change-name} |
| **Engram Ref** | _(optional)_ observation ID from `mem_save`, or omit if engram not used |
| **Requested Advisers** | _(only when status=guidance_requested)_ comma-separated adviser skill names, e.g. `architect-adviser, api-first-adviser` |
| **Guidance Context** | _(only when status=guidance_requested)_ 1-3 paragraph summary of what advisers should review: key design decisions, tradeoffs, uncertainties |

### Executive Summary
2-4 sentences. What was done, key decisions made, and outcomes. Must be enough for someone to decide whether to proceed without reading the full artifacts.

### Artifacts
| Name | Type | Path |
|------|------|------|
| {artifact name} | {proposal / spec / design / task-list / code / report} | {file path or "engram" or "inline"} |

### Next Recommended
{Next phase command or action, e.g. `/sdd-plan change-name` or `/sdd-apply change-name`}

### Risks
- {Risk description, or "None"}
```

> **When to include Engram Ref:** Include only if you successfully persisted an artifact to engram during this phase. The orchestrator uses this ID for fast recovery.
>
> **When to include Requested Advisers / Guidance Context:** Include only when returning `status: guidance_requested`. The orchestrator reads these fields to launch adviser consultations.
