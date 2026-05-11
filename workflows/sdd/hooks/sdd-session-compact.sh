#!/bin/sh
# SDD SessionStart(compact) Hook (Tier 1a — Claude only)
# Fires when Claude resumes after compaction. Stdout becomes visible context.
# Reads the canonical state.yaml schema (phase + next, per persistence-contract.md).
# Skips terminal workflows (phase=done or next=done) — no recovery needed.
# Searches root and one level of subdirectories for .sdd/*/state.yaml.
find . -maxdepth 3 -path '*/.sdd/*/state.yaml' -type f 2>/dev/null | while read -r state_file; do
  change_name="$(basename "$(dirname "$state_file")")"
  phase="$(grep '^phase:' "$state_file" | sed 's/phase: *//' | tr -d ' ')"
  next="$(grep '^next:' "$state_file" | sed 's/next: *//' | tr -d ' ')"
  [ -z "$phase" ] && phase="unknown"
  [ -z "$next" ] && next="unknown"

  case "$phase" in done) continue ;; esac
  case "$next"  in done) continue ;; esac

  cat <<EOF
## SDD recovery — workflow ${change_name}

State file: ${state_file} (phase=${phase}, next=${next}).

Resume from \`next\` directly. Do NOT re-explore, re-plan or re-do
completed phases. Read ${state_file} if you need more context.

Do NOT produce any orientation or "I'll continue with..." sentence
before resuming — the next tool call IS the resume. Just call it.
EOF
done
