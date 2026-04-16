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
  echo "CRITICAL: SDD workflow was active during compaction. You MUST run compaction recovery NOW."
  echo "Read ${state_file} and check engram for active-workflow marker."
  echo "Load Skill(sdd-orchestrator) and resume from the NEXT directive in the marker."
  echo "Current phase: ${current_phase}. NEXT: ${next_step}."
done
