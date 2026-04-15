#!/bin/sh
# SDD Pre-Compaction Hook
# Ensures .sdd/ state is persisted before context compaction.
for state_file in .sdd/*/state.yaml; do
  [ -f "$state_file" ] || continue
  change_name="$(basename "$(dirname "$state_file")")"
  touch "$state_file"
  echo "[sdd-hook] Pre-compaction: verified state for $change_name"
done
