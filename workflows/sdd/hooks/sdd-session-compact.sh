#!/bin/sh
# SDD SessionStart(compact) Hook (Tier 1a — Claude only, v2 active-marker aware).
# Strategy:
#  1. If .sdd/.active exists -> emit recovery for that one workflow only.
#  2. Fallback: scan .sdd/*/state.yaml but require canonical schema
#     (phase: + next: keys). Old-schema files (current_phase:/phases:)
#     are skipped silently as dormant.
#  3. Always skip workflows where phase=done or next=done.

emit_recovery() {
  change_name="$1"
  state_file="$2"
  phase="$3"
  next="$4"
  cat <<EOF
## SDD recovery — workflow ${change_name}

State file: ${state_file} (phase=${phase}, next=${next}).

Resume from \`next\` directly. Do NOT re-explore, re-plan or re-do
completed phases. Read ${state_file} if you need more context.

Do NOT produce any orientation or "I'll continue with..." sentence
before resuming — the next tool call IS the resume. Just call it.
EOF
}

if [ -f .sdd/.active ]; then
  active="$(tr -d '[:space:]' < .sdd/.active)"
  state_file=".sdd/$active/state.yaml"
  if [ -n "$active" ] && [ -f "$state_file" ]; then
    phase="$(grep '^phase:' "$state_file" | sed 's/phase: *//' | tr -d ' ')"
    next="$(grep '^next:'   "$state_file" | sed 's/next: *//'  | tr -d ' ')"
    [ -z "$phase" ] && phase="unknown"
    [ -z "$next" ]  && next="unknown"
    case "$phase" in done) exit 0 ;; esac
    case "$next"  in done) exit 0 ;; esac
    emit_recovery "$active" "$state_file" "$phase" "$next"
  fi
  exit 0
fi

find . -maxdepth 3 -path '*/.sdd/*/state.yaml' -type f 2>/dev/null | while read -r state_file; do
  grep -q '^phase:' "$state_file" || continue
  grep -q '^next:'  "$state_file" || continue
  change_name="$(basename "$(dirname "$state_file")")"
  phase="$(grep '^phase:' "$state_file" | sed 's/phase: *//' | tr -d ' ')"
  next="$(grep '^next:'   "$state_file" | sed 's/next: *//'  | tr -d ' ')"
  case "$phase" in done) continue ;; esac
  case "$next"  in done) continue ;; esac
  emit_recovery "$change_name" "$state_file" "$phase" "$next"
done
