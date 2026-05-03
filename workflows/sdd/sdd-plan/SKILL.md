---
name: sdd-plan
description: 'Use when creating an SDD implementation plan from exploration.md, with deep interview, task breakdown, and batch assignments.'
argument-hint: "[change_name] [instructions]"
disable-model-invocation: false
allowed-tools: Bash, Bash(tree:*), Read, Glob, Grep, Write, Edit, AskUserQuestion, Skill, Task, mcp__atlassian__jira_get_issue, Bash(crit:*)
---

Create the implementation plan for the next phase. The plan file is your entire world: the implementer (a different model with no memory of this session) depends entirely on `plan.md` for design decisions. Do not implement.

## Re-entry Paths (check BEFORE the main flow)

- **Crit Re-entry**: if the launch prompt contains a `CRIT_FEEDBACK:` block → follow Crit Feedback Re-entry below.
- **Guidance Re-entry**: if the launch prompt contains a `GUIDANCE:` block → jump to step 8 (Guidance Integration).
- **Neither block** → proceed with the main flow from step 1.

### Crit Feedback Re-entry

1. Read the existing `.sdd/{change}/plan.md` (do NOT start from scratch).
2. For each unresolved comment in the `CRIT_FEEDBACK:` block:
   a. Locate the referenced section/lines in plan.md.
   b. Revise the plan to address the feedback.
   c. Reply: `crit comment --plan {change} --reply-to {id} --author 'Claude Code' '<what was changed>'` (`Bash(crit:*)` is allowed).
3. Skip the Deep Interview (already completed in the initial pass).
4. Re-evaluate Team Selection — if crit feedback introduces concerns that warrant specialist review, update `## Team Selection`.
5. Re-run the Detail Quality Gate.
6. Return `status: guidance_requested` if step 4 added new advisors; otherwise `status: ok`.

## Main Flow

1. **Read exploration context** from `.sdd/{change-name}/exploration.md`.

   If `exploration.md` is missing or incomplete, recover via the two-step pattern in `_shared/persistence-contract.md`. If neither file nor engram has it, return envelope with `status: blocked`.

2. **Create plan file** `.sdd/{change-name}/plan.md` from [templates/plan_template.md](templates/plan_template.md). Do not omit any section.

3. **Deep Interview Phase** (MANDATORY)

   Complexity check: if `exploration.md` describes a change touching ≤3 files with no cross-layer impact, skip the Deep Interview and proceed to step 4. Document `Interview skipped — simple change (≤3 files, single layer)` in `## 4. Clarifications`.

   Otherwise, conduct an in-depth interview before architecture analysis. Follow the methodology in [references/interview_guide.md](references/interview_guide.md): 10 dimensions to explore, 5 question filters, iterative loop with minimum 2 rounds.

   Key rules:
   - Every question must EXPOSE a hidden decision, CHALLENGE assumptions, or FORCE prioritization — never ask obvious questions.
   - Use `AskUserQuestion` (up to 4 questions per call, 2-4 options each, recommended option first).
   - Record each answer in `## 4. Clarifications` as: `- **[Dimension]**: Q: <question> → A: <answer>`.
   - Do NOT proceed to step 4 until the interview loop has completed.

4. **Analyze the requested changes** and break them into clear, actionable steps.

5. **Team Selection** (record only — do NOT invoke advisors yet)

   <!-- ADVISOR_TABLE_PLACEHOLDER -->

   If no advisor skills are listed above, skip steps 5 and 7 and proceed to step 6.

   Process:
   1. Identify which architectural layers are affected.
   2. Select relevant advisors from the table.
   3. Document selections in `## Team Selection` with reasoning.

   Do NOT invoke `Task()`/`Skill()` for advisors here — that's the orchestrator's job.

6. **Implementation plan** — files to modify, code sections, new functions/methods/classes, dependencies, data structures, interfaces, configuration changes.

   **Task format (CRITICAL — machine-parsed by sdd-implement)**:

   `- [ ] TXXX [TAGS]? Description — file_path`

   - `[ ]` = incomplete (space inside), `[X]` = complete (uppercase X only — `[x]` is treated as incomplete).
   - `TXXX` = T + 3-digit zero-padded number (T001, T002, …), sequential across ALL phases.
   - `[TAGS]` optional, e.g. `[US1]`.
   - Each task MUST reference its target file path after an em-dash (—, not hyphen `-`).
   - See [templates/plan_template.md](templates/plan_template.md) for the full spec with examples.

   The format is NOT optional — `sdd-implement` parses these markers to track progress, resume across sessions, and execute in batch order.

   **Batch Assignment Table** (MANDATORY)

   After all tasks are defined, include a Batch Assignment Table — the **single source of truth** for parallelism and execution order. Parallelism is NEVER defined inline in tasks.

   ```
   | Batch | Tasks | File | Parallel | Depends on |
   |-------|-------|------|----------|------------|
   | A | T001-T003 | src/User.java | Yes | — |
   | B | T004-T005 | src/Order.java | Yes | — |
   | C | T006 | src/Service.java | No | A, B |
   ```

   - Group by target file: tasks on the same file belong to the same batch (sequential within the batch).
   - Batches on different files with no cross-dependencies can run in parallel (`Parallel=Yes`).
   - If all batches are sequential, the table still documents execution order.

   **Detail Quality Gate** (self-check before step 7)

   Before requesting guidance, verify:

   1. **Task Detail Blocks** — every non-trivial task has a `**Details for TXXX**:` block with signatures, types, or schema. Trivial tasks (rename, import-only, config toggle) may omit it.
   2. **Contract Specifications** — if the plan introduces new types/interfaces/schemas, Section 2 has a populated "Contract Specifications" with exact signatures.
   3. **Before/After Analysis** — modification tasks show current → proposed state in Section 2's "Before/After Analysis".
   4. **Testable Checkpoints** — every phase Checkpoint lists specific verifiable criteria.

   If any check fails, fill the missing detail before continuing.

7. **Guidance Request**

   Rule: if Team Selection (step 5) chose any advisors → return `status: guidance_requested`. This is the ONLY condition.

   In the envelope:
   - `requested_advisors`: comma-separated list of all advisor skill names from step 5.
   - `guidance_context`: 1-2 sentences per advisor naming what they should focus on (reference task IDs or section names from the plan).

   Do NOT request guidance when re-entered with a `GUIDANCE:` block (skip to step 8) or when step 5 selected zero advisors.

8. **Guidance Integration Re-entry** (triggered by `GUIDANCE:` block in launch prompt)

   1. Read existing `plan.md` (do NOT recreate).
   2. For each advisor entry in the `GUIDANCE:` block:
      - If the entry has an `engram ID` → call `mem_get_observation(id)` for full advice.
      - If inline text → read directly.
      - Assess each recommendation: relevant to scope? affects task quality?
      - Integrate applicable recommendations: update task Detail Blocks, add tasks if a critical gap was identified, revise Before/After Analysis, update Section 2 Contract Specifications.
   3. Update `## Advice Received`: document what was integrated and what was skipped (with rationale).
   4. Re-run the Detail Quality Gate.
   5. Return `status: ok` (or `warning` if recommendations could not be fully integrated).

   Skip Deep Interview / Team Selection / Guidance Request — already done. NEVER return `status: guidance_requested` from a guidance re-entry (would loop infinitely).

## For each change

- Describe the exact location in the code where changes are needed.
- Explain the logic and reasoning behind each modification.
- Provide example signatures, parameters, and return types.
- Note any potential side effects or impacts on other parts of the codebase.
- Highlight critical architectural decisions that need to be made.

## How to write the plan file

Use one `Edit` call per section to replace `[PENDING]` with actual content. Do NOT write the entire plan in one `Write`/`Edit` — large payloads cause timeouts.

```
old_string: "## 1. Overview\n[PENDING]"
new_string: "## 1. Overview\n\n[Your actual content here]"
```

Sections to fill (max 50 lines each):
1. Overview
2. Architecture (with Contract Specifications + Before/After when applicable)
3. Implementation Tasks (with Batch Assignment Table)
4. Clarifications (populated during Deep Interview)
5. Risks & Considerations

Then update Status to `✅ Complete`.

Include short code snippets to illustrate patterns, signatures, or structures — but do NOT implement full solutions. Include a Testing section identifying which unit and integration tests are needed (specify what should be tested and why; don't write the test code).

## Persistence

Save the plan artifact and any general-knowledge discoveries (architecture decisions, conventions) per `_shared/persistence-contract.md` (Phase Artifact Save Convention + General Knowledge Persistence Mandate). For this phase, `title`/`topic_key` is `sdd/{change}/plan`.

## Return Envelope

Return the SDD Envelope as your **last** output (format: `_shared/envelope-contract.md`). Nothing may follow it.

| Field            | Value                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------|
| Status           | `ok` (plan complete, all sections filled, interview done) · `guidance_requested` (advisor consultation needed; include `requested_advisors` + `guidance_context` fields) |
| Phase            | `plan`                                                                                                       |
| Change           | `{change-name}`                                                                                              |
| Artifacts        | `.sdd/{change-name}/plan.md`                                                                                 |
| Next Recommended | `/sdd-implement {change-name}`                                                                               |
| Risks            | Carry forward any risks from the plan's Risks & Considerations section                                       |
| Engram Ref       | Observation ID from the persistence step, or omit if engram unavailable                                      |

Do NOT invoke `sdd-implement` or any other SDD skill — return the envelope; the orchestrator decides next steps.

## Self-Check (before returning the envelope)

- `exploration.md` was read; the plan extends/refines it instead of duplicating.
- All template sections are filled — no `[PENDING]` placeholders remain. Status is `✅ Complete`.
- Deep Interview ran (or was explicitly skipped with the `≤3 files` rationale recorded in `## 4. Clarifications`); responses use the `[Dimension]` format.
- Every task uses the strict `- [ ] TXXX Description — file_path` format with uppercase `[X]` semantics.
- Every non-trivial task has a `**Details for TXXX**:` block. Section 2 has populated Contract Specifications when new types/interfaces/schemas exist; Before/After Analysis when modifying existing code.
- Every phase Checkpoint lists specific verifiable criteria — not "story complete".
- The Batch Assignment Table is the single source of truth for parallelism (no inline `[P]` markers in tasks). Parallel batches declare cross-dependencies via `Depends on:`.
- File was written incrementally via `Edit` per section — no >50-line single calls.
- If Team Selection chose advisors, the envelope is `status: guidance_requested` (unless this is a guidance re-entry).
- Did not invoke `sdd-implement` or any SDD phase skill; did not write code outside `.sdd/{change-name}/`.

## References

Specialist skills for planning advice: see the table in step 5 above. Shared contracts: [persistence-contract](../_shared/persistence-contract.md), [envelope-contract](../_shared/envelope-contract.md). Methodology: [interview_guide.md](references/interview_guide.md).

<user_instructions>

- $ARGUMENTS

- change_name: $1
- instructions: $2
</user_instructions>
