---
name: write-a-prd
description: 'Generate a Product Requirements Document via interactive interview. Writes a markdown PRD that captures intent, user stories, and out-of-scope. Use when the brief is vague, when no ticket is bound, or when SDD invokes it from its PRD gate.'
metadata:
  version: "1.0"
  scope: [planning, intent]
  trigger: "User requests a PRD, brief is vague, or SDD orchestrator invokes via the PRD gate"
  auto_invoke: 'Invoke by INTENT not literal phrase. EN: "draft a PRD", "write a PRD", "clarify requirements". ES: "haz un PRD", "redacta los requisitos". Auto-invoked from SDD when scope is thin.'
allowed-tools:
  - Read
  - Glob
  - Grep
  - AskUserQuestion
  - Write
  - Edit
argument-hint: "[change-name]"
---

Generate a PRD that captures the user's intent before any code or codebase exploration commits to a direction. The PRD is the WHAT and WHY (user perspective). It explicitly avoids file paths, code snippets, module sketches, and implementation/testing details — those belong to the planning phase, not here.

## Steps

1. **Ask for context if missing.** If the user hasn't given a detailed problem description, ask once: *"Describe the problem and any solution ideas you have."*
2. **Verify cheaply.** Use `Glob`/`Grep` to confirm assertions only when needed. Do NOT preemptively explore the whole repo — that's the explore phase's job.
3. **Interview** using these rules:
   - **Batch independent questions; serialize dependent ones.** When two or more open questions are orthogonal — the answer to one does not change the framing or the option set of the others (e.g. "where should backups live?" + "how to label them in the menu?" + "rotation policy?") — group them in a single `AskUserQuestion` call (up to 4 questions per call, each with its own options). When the answer to question N reframes question N+1, ask N first and let the answer drive the follow-up. Default heuristic: if you can pre-write all option lists right now without seeing prior answers, the questions are independent and should be batched.
   - **For each question, propose your recommended answer.** The user confirms, rejects, or proposes a different one.
   - **If the answer lives in the codebase, explore instead of asking.**
4. **Bound the interview** with three checkpoints:
   - **Vague-answer pushback (once per branch).** When the user's reply is non-committal — anything that doesn't actually clarify the question, regardless of phrasing — give one honest pushback: *"If you don't have a clear answer here, I won't either — the feature will end up vaguely implemented. Should we think through a reasonable answer together, or should I mark this as an Ambiguity and start anyway, knowing we'll have to come back?"* If still no real answer, mark that branch as an Ambiguity in `Further Notes` and move to the next branch.
   - **Periodic stop offer (every ~3 rounds).** *"There are still N open questions, but what's resolved is enough to start. Continue or go?"*
   - **Stop on signal.** When the user gives a stop signal (any phrasing of "we're good" / "go" / "done"), close the interview.
5. **Write the PRD** to `{change-name}/prd.md` under the SDD artifact directory if invoked from SDD (i.e. `.sdd/{change-name}/prd.md`); otherwise to `prd.md` in the current directory. Create parent directories as needed. Use the template below.

## PRD template

```markdown
## Problem Statement

[The problem from the user's perspective — what they're trying to do and why it's painful or missing today.]

## Solution

[The solution from the user's perspective — what changes for them when this lands.]

## User Stories

A long, numbered list. Each story:

`As <actor>, I want <feature>, so that <benefit>.`

Cover all aspects of the feature, including edge cases surfaced during the interview.

## Out of Scope

[What is explicitly excluded — important to surface false expectations.]

## Further Notes

[Open ambiguities (with the branch they apply to), references to bound ticket / GitHub issue if any, decisions deferred to implementation.]
```

Do NOT include file paths, code snippets, module sketches, or implementation/testing decisions in the PRD. Those belong to `plan.md`. The PRD captures intent, not execution.

## Self-Check (before returning)

- The PRD file exists at the expected path.
- Problem and Solution are written from the user's perspective (not technical).
- User Stories cover the feature surface, including edge cases the interview surfaced.
- No file paths, code snippets, module sketches, or testing details in the document.
- Ambiguities the user could not resolve are listed in Further Notes (not silently dropped).
- Did NOT submit external issues or call external services.
