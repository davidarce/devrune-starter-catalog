---
name: sdd-orchestrator
description: "SDD Orchestrator coordinates SDD (Spec-Driven Development) workflow via sub-agents"
argument-hint: "{change-name}"
metadata:
  version: "1.0"
  scope: [sdd, workflow]
  trigger: "When SDD workflow is triggered via evaluation gate"
  auto_invoke: "User starts SDD workflow, says /sdd-explore, or evaluation gate triggers SDD"
allowed-tools:
  - Read
  - Write
  - Bash(mkdir -p .sdd*)
  - Bash(mkdir -p *.sdd*)
  - Bash(tree:*)
  - Bash(which crit*)
  - Bash(crit plan:*)
  - Bash(crit comment:*)
  - Bash(cd:*)
  - Bash(cat:*)
  - Bash(open:*)
  - Bash(git status:*)
  - Skill(sdd-explore)
  - Skill(sdd-plan)
  - Skill(sdd-implement)
  - Skill(sdd-review)
  - Skill(write-a-prd)
  - Skill(git-commit)
  - Skill(git-pull-request)
  - Task
  - AskUserQuestion
---
