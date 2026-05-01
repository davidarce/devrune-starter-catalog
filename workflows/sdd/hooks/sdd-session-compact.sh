#!/bin/sh
# SDD SessionStart(compact) Hook (Tier 1a — Claude only)
# Fires when Claude resumes after compaction. Stdout becomes visible context.
# Searches root and one level of subdirectories for .sdd/*/state.yaml.
find . -maxdepth 3 -path '*/.sdd/*/state.yaml' -type f 2>/dev/null | while read -r state_file; do
  change_name="$(basename "$(dirname "$state_file")")"
  current_phase="$(grep '^current_phase:' "$state_file" | sed 's/current_phase: *//')"
  next_step="$(grep '^next_step:' "$state_file" | sed 's/next_step: *//')"
  [ -z "$current_phase" ] && current_phase="unknown"
  [ -z "$next_step" ] && next_step="check state.yaml for details"

  cat <<EOF
CRITICAL: SDD workflow "${change_name}" was active during compaction. You MUST run compaction recovery NOW.

## Role Invariant — you orchestrate, you do not implement

Outside .sdd/{change}/, your only outputs are: sub-agent launches (Task / Agent / @<sub-agent>), AskUserQuestion, mkdir for .sdd/, and Bash(crit ...) per the Crit Plan Review Protocol.

You do NOT: Edit/Write source files, run builds/tests/lints, run git commit/push, create branches/commits/PRs, invoke Skill("sdd-{phase}") directly.

If your next planned action is on the "do not" list, you have lost the role — re-read ORCHESTRATOR.md and delegate.

## Recovery

State: ${state_file} (current_phase: ${current_phase}, NEXT: ${next_step}).
Check engram for the active-workflow marker (mem_context).
Load Skill(sdd-orchestrator) and resume from the NEXT directive.
EOF
done
