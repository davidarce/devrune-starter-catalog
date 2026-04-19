# DevRune Starter Catalog

<p>
  <img src="https://img.shields.io/github/license/davidarce/devrune-starter-catalog?style=flat&color=gray" alt="License">
  <img src="https://img.shields.io/badge/DevRune-native%20catalog-8B5CF6?style=flat" alt="DevRune native catalog">
  <img src="https://img.shields.io/badge/SDD-first%20citizen-00D7FF?style=flat" alt="SDD first citizen">
</p>

> The native content source for [**DevRune**](https://github.com/davidarce/DevRune) — and the home of the **Spec-Driven Development (SDD)** workflow.

This catalog is a curated collection of **skills**, **rules**, **MCP server definitions**, **workflows**, and **developer tools** that DevRune resolves, locks, and materializes into your AI agent workspaces. You point DevRune at it; your agents get the content.

```yaml
# devrune.yaml
packages:
  - source: github:davidarce/devrune-starter-catalog@main
workflows:
  - source: github:davidarce/devrune-starter-catalog@main//workflows/sdd
```

---

## Table of Contents

- [What's inside](#whats-inside)
- [Spec-Driven Development — the flagship workflow](#-spec-driven-development--the-flagship-workflow)
- [Skills](#-skills)
- [Rules](#-rules)
- [MCP Servers](#-mcp-servers)
- [Developer Tools](#-developer-tools)
- [Using this catalog with DevRune](#-using-this-catalog-with-devrune)
- [Catalog contract (build your own)](#-catalog-contract-build-your-own)
- [Contributing](#-contributing)
- [License](#-license)

---

## What's inside

```
devrune-starter-catalog/
├── workflows/
│   └── sdd/             ← the flagship SDD workflow (4 phases, orchestrator, hooks)
├── skills/              ← 11 reusable agent skills (7 advisers + git ops + review/explore)
├── rules/               ← 11 coding-standard rule packs (architecture, API, tech, testing)
├── mcps/                ← 6 MCP server definitions
└── tools/               ← 2 developer CLI tools (Crit, Engram) auto-installed by DevRune
```

Everything here is **just data** (Markdown + YAML). DevRune owns the how; this catalog owns the what.

---

## 🧠 Spec-Driven Development — the flagship workflow

SDD is the reason this catalog exists. It's a disciplined, 4-phase workflow for building software with AI agents that keeps you in control and agents on the rails.

### The 4 phases

```
┌─────────────┐     ┌──────────┐     ┌───────────────┐     ┌─────────────┐
│ ① Explore   │ ──▶ │ ② Plan   │ ──▶ │ ③ Implement   │ ──▶ │ ④ Review    │
│             │     │          │     │   (waves)     │     │             │
│ exploration │     │ plan.md  │     │ code changes  │     │ review.md   │
│    .md      │     │          │     │ [X] markers   │     │             │
└─────────────┘     └──────────┘     └───────────────┘     └─────────────┘
   Sonnet             Opus             Sonnet                 Opus
```

| Phase            | Skill              | Output                               | Notes                                                    |
|------------------|--------------------|--------------------------------------|----------------------------------------------------------|
| **① Explore**    | `sdd-explore`      | `.sdd/{change}/exploration.md`       | Curates relevant files, surfaces ambiguities.            |
| **② Plan**       | `sdd-plan`         | `.sdd/{change}/plan.md`              | Deep interview → task plan with batch table & quality gates. |
| **③ Implement**  | `sdd-implement`    | Code + `[X]` markers in `plan.md`    | Wave-based execution, fail-fast, parallel or sequential. |
| **④ Review**     | `sdd-review`       | `.sdd/{change}/review.md`            | Diffs against plan, flags regressions, commit-or-fix.    |

Orchestration is **delegate-only** — the `sdd-orchestrator` never reads or writes code; it launches each phase as a sub-agent via `Task()` and consumes the envelope the sub-agent returns.

### The Advisor Strategy (guidance loop)

During Plan, the planner can detect it needs specialist input and return a `guidance_requested` envelope. The orchestrator launches the requested advisers **in parallel** (with Opus for depth), collects their recommendations, and re-enters the planner with the guidance integrated.

```
sdd-plan (Sonnet) ─┐
                   ├─ detects gap → guidance_requested
                   ▼
Orchestrator ──── launches advisers (Opus) in parallel
                   │     architect · api-first · unit-test · component · a11y ...
                   ▼
Orchestrator ──── re-enters sdd-plan with adviser recommendations
                   │
                   ▼
sdd-plan ──── status: ok → crit review → implement
```

Advisers return **Strengths / Issues / Recommendations** and persist full guidance to engram when available. **Advisers never execute** — they only advise.

### Compaction recovery — SDD survives context resets

Long sessions get compacted. SDD defends against that with per-agent hooks and a TypeScript plugin, plus file-first state:

| Agent             | Tier | Mechanism                                                          |
|-------------------|:----:|--------------------------------------------------------------------|
| Claude Code       | 1a   | `PreCompact` + `SessionStart(compact)` hooks (JSON, deep-merged)   |
| Factory           | 1b   | `PreCompact` hook                                                  |
| OpenCode          | 2    | TypeScript plugin auto-loaded from `.opencode/plugins/`             |
| Codex / Copilot   | 3    | Catalog-only recovery via `REGISTRY.md`                            |

On compaction, the hook preserves `.sdd/{change}/state.yaml`. On restart, a CRITICAL recovery context is re-injected with the current phase and the `NEXT:` directive — the orchestrator resumes exactly where it left off.

### Inside `workflows/sdd/`

```
workflows/sdd/
├── workflow.yaml              ← declares roles, skills, entrypoint, hooks, permissions
├── ORCHESTRATOR.md            ← delegate-only coordinator (Claude/Codex/Factory)
├── ORCHESTRATOR.copilot.md    ← @agent-name invocation variant
├── ORCHESTRATOR.opencode.md   ← OpenCode native variant
├── REGISTRY.md                ← evaluation gate + delegation rules (HIGHEST PRIORITY)
│
├── sdd-explore/               ← phase skill + exploration_template.md
├── sdd-plan/                  ← phase skill + plan_template.md + interview_guide.md
├── sdd-implement/             ← phase skill (wave execution)
├── sdd-review/                ← phase skill (standalone or SDD-context)
├── sdd-orchestrator/          ← wrapper skill that loads ORCHESTRATOR.md
│
├── _shared/
│   ├── envelope-contract.md   ← the envelope every phase returns
│   ├── launch-templates.md    ← copy-paste Task() templates per phase
│   ├── adviser-templates.md   ← adviser invocation patterns (parallel · sequential · @agent)
│   ├── persistence-contract.md ← .sdd/ (primary) + engram (secondary), state.yaml schema
│   └── recovery.md            ← compaction recovery + fail-fast error handling
│
├── hooks/
│   ├── sdd-hooks-claude.json  ← PreCompact + SessionStart(compact)
│   └── sdd-hooks-factory.json ← PreCompact
│
└── plugins/
    └── sdd-compaction.ts      ← OpenCode TypeScript plugin
```

> 💡 **Trying to understand SDD end-to-end?** Read, in order: [`REGISTRY.md`](workflows/sdd/REGISTRY.md) → [`ORCHESTRATOR.md`](workflows/sdd/ORCHESTRATOR.md) → [`_shared/envelope-contract.md`](workflows/sdd/_shared/envelope-contract.md) → [`_shared/launch-templates.md`](workflows/sdd/_shared/launch-templates.md). That's roughly 800 lines and it gives you the whole model.

---

## 🧰 Skills

Reusable agent skills. Advisers participate in the SDD guidance loop; git/review skills are invoked directly by the user or by SDD's decision rules.

### Advisers

These feed the SDD guidance loop. The planner flags which ones are relevant; the orchestrator launches them in parallel.

| Skill                      | Domain                                                                              |
|----------------------------|-------------------------------------------------------------------------------------|
| `architect-adviser`        | Clean architecture, hexagonal, DDD, ports and adapters.                             |
| `api-first-adviser`        | OpenAPI, REST conventions, error models, versioning.                                |
| `component-adviser`        | React component design — composition, hooks, state management, performance.        |
| `unit-test-adviser`        | Domain unit tests — Given-When-Then, Mother pattern, mocking strategies.            |
| `integration-test-adviser` | Adapter tests — WireMock, external-service simulation, TestContainers.              |
| `frontend-test-adviser`    | React Testing Library, Vitest/Jest, Cypress/Playwright e2e.                         |
| `web-accessibility-adviser`| WCAG 2.1 AA, ARIA, keyboard navigation, screen readers.                             |

### Workflow-direct skills

| Skill                  | Purpose                                                                                 |
|------------------------|-----------------------------------------------------------------------------------------|
| `git-commit`           | Conventional Commits with JIRA ticket integration.                                      |
| `git-pull-request`     | Pull request creation with template selection and platform auto-detection (GitHub/GitLab). |
| `review-pr`            | Fetch PR/MR, analyze with project rules via `sdd-review`, post inline comments.         |
| `arch-flow-explorer`   | Generate interactive HTML visualizations of backend architecture flows.                 |

---

## 📐 Rules

Coding-standard rule packs scoped by category. Advisers reference the rules they own; DevRune can install them per-agent as individual files, a concatenated rules doc, or both (`install.rulesMode`).

| Category       | Rule                          | Scope                                                                  |
|----------------|-------------------------------|------------------------------------------------------------------------|
| **API**        | `api-standards`               | REST naming, validation, error models, versioning, pagination.        |
| **Architecture**| `4-rules-of-simple-design`    | Kent Beck's 4 Rules: passes tests · reveals intention · no duplication · fewest elements. |
|                | `clean-architecture`          | Hexagonal architecture, DDD, layers, dependency inversion.             |
| **Tech**       | `java-spring`                 | Spring Boot conventions — module structure, DI, testing, API patterns. |
|                | `react`                       | React and TypeScript coding standards.                                 |
|                | `microfrontends`              | Host/shell mediator pattern, EventBus, zero breaking changes.         |
|                | `accessibility-standards`     | WCAG 2.2 AA, ARIA patterns, keyboard navigation, semantic HTML.       |
|                | `frontend-testing`            | React Testing Library, Vitest/Jest, Cypress/Playwright e2e.           |
| **Testing**    | `adapter-it-patterns`         | Adapter integration tests with WireMock.                              |
|                | `java-unit-tests`             | Inditex Java unit test standards.                                     |
|                | `mother-pattern`              | Mother builder pattern, test data construction, BDDMockito.           |

---

## 🔌 MCP Servers

Model Context Protocol servers your agents can call. Each file in `mcps/` declares the command, args, permissions, and agent instructions.

| MCP           | What it gives your agent                                              |
|---------------|-----------------------------------------------------------------------|
| `atlassian`   | Jira & Confluence (read issues, search, post comments; OAuth).        |
| `context7`    | Up-to-date library docs (React, Spring, Django, …) fetched at runtime.|
| `engram`      | Persistent memory across sessions — `mem_save`, `mem_search`, `mem_context`. |
| `exa`         | Web and code search.                                                  |
| `playwright`  | Browser automation for testing and scraping.                          |
| `ref`         | Technical documentation search.                                       |

> 🔐 DevRune writes the MCP config into each agent's native format (`.mcp.json`, `opencode.json`, `config.toml`, `mcp.json`). You only declare it once, here.

---

## 🧪 Developer Tools

Optional CLI companions. During `devrune init`, DevRune detects which tools are relevant from your selected MCPs/workflows, checks if they're already on `PATH`, and offers to install the rest via Homebrew.

| Tool      | What it does                                    | Installed when                          |
|-----------|-------------------------------------------------|------------------------------------------|
| `crit`    | Plan review tool for SDD (inline feedback in the browser). | Workflow `sdd` is selected.              |
| `engram`  | Persistent-memory daemon for AI agents.        | MCP `engram` or workflow `sdd` selected. |

---

## 🚀 Using this catalog with DevRune

### Minimal `devrune.yaml`

```yaml
schemaVersion: devrune/v1

agents: [claude, opencode]

packages:
  - source: github:davidarce/devrune-starter-catalog@main
    select:
      skills: [git-commit, architect-adviser, unit-test-adviser]
      rules:  [architecture/clean-architecture, testing/mother-pattern]

mcps:
  - source: github:davidarce/devrune-starter-catalog@main//mcps/engram.yaml

workflows:
  - source: github:davidarce/devrune-starter-catalog@main//workflows/sdd
```

```bash
devrune sync
```

### Or let the TUI pick for you

```bash
devrune init
```

DevRune detects your tech stack and pre-selects the advisers and rules that fit (e.g. a React repo pre-selects `component-adviser`, `frontend-test-adviser`, `web-accessibility-adviser` and the `react` / `frontend-testing` / `accessibility-standards` rules).

---

## 📋 Catalog contract (build your own)

DevRune works with **any catalog** that follows this layout:

```
my-catalog/
├── skills/{skill-name}/SKILL.md          # frontmatter + instructions
├── rules/{category}/{name}-rules.md      # plain markdown rule pack
├── mcps/{name}.yaml                      # MCP server definition
├── workflows/{name}/workflow.yaml        # workflow manifest (see below)
└── tools/{name}.yaml                     # optional dev-tool recipe
```

### SKILL.md (frontmatter + body)

```markdown
---
name: git:commit
description: Automated git commits with Conventional Commits + JIRA integration
allowed-tools: [Bash, Read, Grep]
---

# Skill body (Markdown) — instructions for the agent.
```

### workflow.yaml (for multi-phase workflows)

```yaml
apiVersion: devrune/workflow/v1
metadata:
  name: my-workflow
  displayName: "My Workflow"
  version: "1.0.0"
  workingDir: my-orchestrator
components:
  skills: [phase-one, phase-two, my-orchestrator]
  entrypoint: ORCHESTRATOR.md
  roles:
    - { name: phase-one-runner, kind: subagent, skill: phase-one, model: sonnet }
    - { name: my-orchestrator,  kind: orchestrator }
  registry: REGISTRY.md
  permissions:
    - { agent: claude, patterns: ["Bash(mkdir -p .myworkflow/*)"] }
  hooks:
    agents:
      claude: [{ definition: hooks/my-hooks-claude.json }]
  gitignore: [".myworkflow/"]
```

The full SDD workflow in [`workflows/sdd/`](workflows/sdd/) is the best reference — it exercises every feature (roles, models, decision rules, permissions, hooks, plugins, gitignore).

### Tool recipe

```yaml
# tools/my-tool.yaml
name: my-tool
description: CLI companion for my-workflow
command: brew install my-org/tap/my-tool
binary: my-tool
depends_on:
  workflow: my-workflow
```

---

## 🤝 Contributing

This catalog is **community-curated** — new adviser skills, new rule packs, new MCPs, and corrections are welcome.

- 🐛 Issues and discussions: [github.com/davidarce/devrune-starter-catalog/issues](https://github.com/davidarce/devrune-starter-catalog/issues)
- 🍴 **Fork-friendly by design** — the MIT license and the flat layout are intentional. Use your own fork as your team's source of truth; DevRune doesn't care which catalog it points at.
- ✅ Keep additions **content-only** (Markdown + YAML). Logic belongs in [DevRune](https://github.com/davidarce/DevRune).

---

## 📄 License

MIT — see [LICENSE](LICENSE).

Copyright (c) 2026 David Arce.
