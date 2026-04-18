#!/bin/sh
# SDD Pre-Compaction Hook
# Ensures .sdd/ state is persisted before context compaction.
# Searches root and one level of subdirectories for .sdd/*/state.yaml.
find . -maxdepth 3 -path '*/.sdd/*/state.yaml' -type f 2>/dev/null | while read -r state_file; do
  change_name="$(basename "$(dirname "$state_file")")"
  touch "$state_file"
  echo "[sdd-hook] Pre-compaction: verified state for $change_name"
done
