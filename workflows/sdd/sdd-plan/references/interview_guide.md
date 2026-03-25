# Deep Interview Guide

This guide defines the methodology for conducting the in-depth interview during the SDD planning phase. The interview runs BEFORE architecture analysis and task breakdown — its output directly informs all subsequent planning steps.

---

## Interview Dimensions

Cover the following dimensions, adapting to the specific feature. Not all dimensions apply to every feature — skip dimensions that are clearly irrelevant based on exploration.md context:

| Dimension | What to Probe |
|-----------|--------------|
| Behavioral contracts | Exact expected behavior in ambiguous scenarios; what happens at boundaries |
| Hidden constraints | Regulatory, compliance, team capability, timeline, budget pressures |
| Tradeoff tensions | Where stated goals conflict (e.g., "fast AND flexible"); force a priority |
| Failure modes | What happens when things go wrong; recovery, degradation, fallback strategies |
| Integration surface | How this feature touches other systems; data flow across boundaries |
| Data lifecycle | Creation, mutation, archival, deletion of data entities; consistency guarantees |
| UX/DX decisions | User-facing or developer-facing experience choices that shape architecture |
| Observability | Logging, monitoring, alerting needs that affect design |
| Evolution path | How this feature is likely to change in 6-12 months; extensibility needs |

---

## Question Generation Rules (Non-Obvious Questions Only)

For each question, verify it passes ALL of these filters before asking:

1. **NOT answerable from exploration.md** — if the answer is already documented, skip it
2. **NOT a restatement of requirements** — never ask "Should we do X?" when X is already stated
3. **EXPOSES a hidden decision** — the answer materially changes architecture, data model, task decomposition, test design, or UX behavior
4. **CHALLENGES assumptions** — probes what happens if an "obvious" assumption is wrong
5. **FORCES prioritization** — when two goals conflict, makes the user choose

### Bad Examples (obvious — do NOT ask these)

- "Should we use the existing database?" (already implied by exploration)
- "Do you want error handling?" (always yes)
- "Should we write tests?" (always yes)
- "Do you want the feature to be performant?" (always yes)
- "Should we follow clean architecture?" (already established in the project)

### Good Examples (non-obvious, insightful)

- "When the order total exceeds the credit limit mid-checkout, should the system hold the partial charge or release it entirely? This affects whether we need a two-phase commit pattern."
- "The exploration mentions both real-time sync and batch processing. If you had to ship with only one, which delivers more value? This determines whether we build the event pipeline or the ETL job first."
- "Current auth uses session tokens but the new API serves mobile clients. Should we migrate to JWT for this endpoint only, or globally? Local migration is faster but creates two auth paths to maintain."
- "The domain model has Order and Payment as separate aggregates. Should a failed payment auto-cancel the order, or leave it in a 'pending payment' state for retry? This determines the saga pattern we need."
- "The exploration shows 3 integration points with external services. If one goes down during peak load, should we queue and retry, degrade gracefully with defaults, or fail the entire operation? Each has different infrastructure implications."

---

## How to Ask Questions

Use `AskUserQuestion` with up to 4 questions per call. Structure each question with:
- Clear, specific question text
- 2-4 mutually exclusive options
- Description for each option explaining implications
- Put your **recommended option first** with "(Recommended)" in the label

```json
{
  "questions": [{
    "question": "How should authentication be handled?",
    "header": "Auth",
    "options": [
      {"label": "JWT tokens (Recommended)", "description": "Stateless, scalable, fits microservices architecture"},
      {"label": "Session-based", "description": "Server-side sessions, simpler but requires session storage"},
      {"label": "OAuth2 delegation", "description": "Delegate to external identity provider"}
    ],
    "multiSelect": false
  }]
}
```

---

## Interview Loop Mechanics

Execute this loop:

```
ROUND = 1
REPEAT:
  a. Review exploration.md context and any prior answers
  b. Identify 3-4 questions targeting uncovered dimensions
  c. Call AskUserQuestion with up to 4 questions
  d. Wait for user answers
  e. Record each answer in plan under ## 4. Clarifications section
     Format: - **[Dimension]**: Q: <question> → A: <answer>
  f. Save the plan file
  g. Update dimensional coverage assessment
  h. ROUND = ROUND + 1

  IF ROUND >= 3 AND all relevant dimensions covered:
    Include as the last question in the next AskUserQuestion call:
    {
      "question": "I've covered the key dimensions. Are there concerns or
       tradeoffs I haven't asked about, or shall we proceed to architecture
       analysis and detailed planning?",
      "header": "Interview",
      "options": [
        {"label": "Proceed to planning", "description": "All major questions
          addressed — move to architecture analysis and task breakdown"},
        {"label": "I have more to discuss", "description": "There are additional
          concerns or context I want to share before planning begins"}
      ],
      "multiSelect": false
    }

    IF user selects "Proceed to planning": EXIT loop
    IF user selects "I have more to discuss": CONTINUE loop with follow-up

  IF ROUND < 3: CONTINUE (minimum 2 full rounds before offering to end)
END REPEAT
```

---

## Recording Clarifications

After each round:
1. Record each answer in the plan under `## 4. Clarifications` section
2. Format: `- **[Dimension]**: Q: <question> → A: <answer>`
3. Update affected sections of the plan immediately (data model, requirements, etc.)
4. Save the plan file after each integration

**IMPORTANT**: Wait for user answers before continuing. Do not proceed with assumptions.