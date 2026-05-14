#!/bin/sh
# SDD Pre-Compaction Hook (v2 — active-marker aware)
# Strategy:
#  1. If .sdd/.active exists -> touch only that workflow's state.yaml
#     (single source of truth maintained by the orchestrator).
#  2. Fallback: scan .sdd/*/state.yaml but require canonical schema
#     (phase: + next: keys). Old-schema files (current_phase:/phases:)
#     are skipped silently as dormant.
#  3. Always skip workflows where phase=done or next=done.

if [ -f .sdd/.active ]; then
  active="$(tr -d '[:space:]' < .sdd/.active)"
  if [ -n "$active" ] && [ -f ".sdd/$active/state.yaml" ]; then
    touch ".sdd/$active/state.yaml"
    echo "[sdd-hook] Pre-compaction: verified state for $active (active marker)"
  fi
  exit 0
fi

find . -maxdepth 3 -path '*/.sdd/*/state.yaml' -type f 2>/dev/null | while read -r state_file; do
  grep -q '^phase:' "$state_file" || continue
  grep -q '^next:'  "$state_file" || continue
  phase="$(grep '^phase:' "$state_file" | sed 's/phase: *//' | tr -d ' ')"
  next="$(grep '^next:'   "$state_file" | sed 's/next: *//'  | tr -d ' ')"
  case "$phase" in done) continue ;; esac
  case "$next"  in done) continue ;; esac
  change_name="$(basename "$(dirname "$state_file")")"
  touch "$state_file"
  echo "[sdd-hook] Pre-compaction: verified state for $change_name"
done
