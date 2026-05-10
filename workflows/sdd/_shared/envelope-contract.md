# SDD Envelope Contract

Every SDD skill (explore, plan, implement, review) MUST return the SDD Envelope as its **LAST output**. Nothing may follow the envelope.

## Rules

1. **The envelope is the FINAL output of the skill.** No text, explanation, follow-up, or
   "next steps" message may appear after the envelope. The orchestrator parses the envelope
   verbatim — anything after the closing risk bullet (or after the last field of the envelope
   block) is discarded as drift.
2. **The envelope MUST match the template format below exactly.** Do not invent extra fields,
   re-order the table rows, or wrap the envelope in ASCII boxes / decorative banners. The
   orchestrator parses by field name; deviations break parsing for weaker models.
3. Skills NEVER invoke other SDD skills. Return the envelope; the orchestrator decides what runs next.
4. Executive Summary must be **decision-grade** -- the orchestrator presents it to the user without reading full artifacts.

### Common drift patterns to avoid

| ❌ Drift | ✅ Correct |
|---|---|
| ASCII art frame around the envelope (`┌────┐ ... └────┘`) | Plain markdown table per the template |
| Adding a "## Summary" or "## Conclusion" section AFTER the envelope | Put summary content in `### Executive Summary` |
| Restating the envelope as bullets after the table | Just the table |
| "Listo para siguiente fase: ..." or similar follow-up prose | Put the next action in `### Next Recommended` |
| Extra fields like `Effort` / `Confidence` / `Tags` not in the template | Stick to the template; extra fields break parsing |

## Status Values

| Status | Meaning |
|--------|---------|
| `ok` | Phase completed successfully |
| `warning` | Completed, but with concerns that need attention |
| `guidance_requested` | Plan phase completed; advisor consultation required before finalizing. Orchestrator must launch advisors and re-enter plan with guidance. |
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
| **Requested Advisors** | _(only when status=guidance_requested)_ comma-separated advisor skill names, e.g. `architect-advisor, api-first-advisor` |
| **Guidance Context** | _(only when status=guidance_requested)_ 1-3 paragraph summary of what advisors should review: key design decisions, tradeoffs, uncertainties |

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
> **When to include Requested Advisors / Guidance Context:** Include only when returning `status: guidance_requested`. The orchestrator reads these fields to launch advisor consultations.
