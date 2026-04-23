#!/bin/bash
# Extract JIRA ticket ID from a git branch name
# Usage: branch-to-jira.sh [branch-name]
# If no argument provided, reads current branch from git
# Returns: JIRA ID (e.g., "PROJ-123") or empty string if none found
#
# Examples:
#   branch-to-jira.sh "feature/BUYERS-456-add-login"  → BUYERS-456
#   branch-to-jira.sh "hotfix/FIX-12-urgent"          → FIX-12
#   branch-to-jira.sh "main"                          → (empty)

branch="${1:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null)}"

if [ -z "$branch" ]; then
  exit 0
fi

echo "$branch" | grep -oE '[A-Z]+-[0-9]+' | head -1
