#!/bin/sh
# SDD SessionStart(compact) Hook (Tier 1a — Claude only)
# Fires when Claude resumes after compaction. Stdout becomes visible context.
for state_file in .sdd/*/state.yaml; do
  [ -f "$state_file" ] || continue
  change_name="$(basename "$(dirname "$state_file")")"
  current_phase="$(grep '^current_phase:' "$state_file" | sed 's/current_phase: *//')"
  next_step="$(grep '^next_step:' "$state_file" | sed 's/next_step: *//')"
  [ -z "$current_phase" ] && current_phase="unknown"
  [ -z "$next_step" ] && next_step="check state.yaml for details"
  echo "CRITICAL: SDD workflow was active during compaction. You MUST run compaction recovery NOW."
  echo "Read .sdd/${change_name}/state.yaml and check engram for active-workflow marker."
  echo "Load Skill(sdd-orchestrator) and resume from the NEXT directive in the marker."
  echo "Current phase: ${current_phase}. NEXT: ${next_step}."
done
