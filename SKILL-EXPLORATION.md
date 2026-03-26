# Skill Catalog Exploration Report

**Date**: 2026-03-26
**Scope**: All 9 skills in `devrune-starter-catalog/skills/`
**Evaluation framework**: Tariq's "Lessons from Building Claude Code — How We Use Skills"

---

## Executive Summary

All 9 skills follow the same pattern: **a single SKILL.md file per directory**. None use the folder structure as a context engineering tool. None have gotchas sections, scripts, hooks, config persistence, memory, or skill composition. The content is high-quality reference material, but it's structured as static knowledge dumps rather than dynamic, adaptive agent tools.

**Biggest opportunity**: Transform these from "markdown files Claude reads" into "folders Claude works with" — adding progressive disclosure, gotchas, scripts, and inter-skill composition.

---

## Skill Inventory

| Skill | Type | Size | Files |
|-------|------|------|-------|
| `git-commit` | Action (CI/CD) | 1.5 KB | SKILL.md only |
| `git-pull-request` | Action (CI/CD) | 1.5 KB | SKILL.md only |
| `architect-adviser` | Advisory (Code Quality) | 3.4 KB | SKILL.md only |
| `unit-test-adviser` | Advisory (Code Quality) | 2.5 KB | SKILL.md only |
| `integration-test-adviser` | Advisory (Code Quality) | 7.3 KB | SKILL.md only |
| `frontend-test-adviser` | Advisory (Code Quality) | 6.3 KB | SKILL.md only |
| `component-adviser` | Advisory (Code Quality) | 6.4 KB | SKILL.md only |
| `api-first-adviser` | Advisory (Code Quality) | 6.7 KB | SKILL.md only |
| `web-accessibility-adviser` | Advisory (Code Quality) | 7.4 KB | SKILL.md only |

---

## Per-Skill Evaluation (10 Criteria)

### 1. git-commit

| # | Criterion | Rating | Notes |
|---|-----------|--------|-------|
| 1 | Description field quality | GOOD | Trigger-oriented: "Automate git commits following Conventional Commits" |
| 2 | Gotchas section | MISSING | No gotchas. Common failures: staging wrong files, scope mismatch, hook failures |
| 3 | Progressive disclosure / Folder | FLAT | Single SKILL.md, no references/ or examples/ |
| 4 | Obvious content | MODERATE | Conventional Commits spec is well-known; the JIRA integration and co-author footer add value |
| 5 | Railroading | LOW | Gives format rules but lets Claude adapt message content |
| 6 | Setup/Config persistence | NONE | No config for default scope, JIRA project, co-author preferences |
| 7 | Scripts & code | NONE | No scripts for pre-commit validation or message linting |
| 8 | On-demand hooks | NONE | Could use PreToolUse to block `--no-verify` or credential commits |
| 9 | Memory/data storage | NONE | No commit history log; each invocation starts fresh |
| 10 | Skill composition | NONE | Doesn't reference git-pull-request or other skills |

**Optimization opportunities**:
- Add `gotchas.md`: common commit message mistakes, when hooks fail and what to do
- Add config.json for persistent preferences (default JIRA project, co-author, scope conventions)
- Add PreToolUse hook to block `--no-verify` and credential file commits
- Store recent commits in a log for consistency across sessions
- Reference `git-pull-request` for post-commit workflow

---

### 2. git-pull-request

| # | Criterion | Rating | Notes |
|---|-----------|--------|-------|
| 1 | Description field quality | GOOD | Clear trigger: "Create pull requests with template selection and platform auto-detection" |
| 2 | Gotchas section | MISSING | No gotchas. Common failures: wrong base branch, missing upstream, force push risks |
| 3 | Progressive disclosure / Folder | FLAT | Single SKILL.md |
| 4 | Obvious content | LOW | Platform detection logic and template format are genuinely useful |
| 5 | Railroading | LOW | Flexible on content, firm on safety rules |
| 6 | Setup/Config persistence | NONE | No config for default base branch, PR template, reviewer lists |
| 7 | Scripts & code | NONE | No scripts for PR template rendering or CI status checking |
| 8 | On-demand hooks | NONE | Could block force-push to main/master |
| 9 | Memory/data storage | NONE | No PR history tracking |
| 10 | Skill composition | NONE | Should compose with git-commit (commits before PR) |

**Optimization opportunities**:
- Add `gotchas.md`: wrong base branch pitfalls, stale branch rebasing, force push dangers
- Add `templates/` folder with PR templates per type (feature, bugfix, hotfix)
- Add config.json for default base branch, reviewers, labels
- Add PreToolUse hook to block force-push to protected branches
- Compose with git-commit for pre-PR commit cleanup

---

### 3. architect-adviser

| # | Criterion | Rating | Notes |
|---|-----------|--------|-------|
| 1 | Description field quality | GOOD | "Clean architecture patterns: hexagonal, DDD, ports and adapters, layered design" |
| 2 | Gotchas section | MISSING | No gotchas. Would benefit from: "when DDD is overkill", "framework leak signs" |
| 3 | Progressive disclosure / Folder | FLAT | Single SKILL.md. Beck's 4 Rules and DDD patterns could be separate reference files |
| 4 | Obvious content | HIGH | Dependency rule, layer definitions, and clean architecture basics are widely known by Claude. The anti-patterns list and Beck's prioritization add some value |
| 5 | Railroading | MODERATE | Forces Beck's 4 Rules ordering on every review. Some reviews might benefit from different lenses |
| 6 | Setup/Config persistence | NONE | No config for project-specific architecture style or layer naming |
| 7 | Scripts & code | NONE | No scripts for dependency direction analysis or import graph checking |
| 8 | On-demand hooks | NONE | Could validate import direction on file save |
| 9 | Memory/data storage | NONE | No review history or decision log |
| 10 | Skill composition | NONE | Should compose with unit-test-adviser (architecture affects test boundaries) |

**Optimization opportunities**:
- Drastically reduce obvious content (Claude knows clean architecture well)
- Move detailed patterns to `references/ddd-patterns.md` and `references/anti-patterns.md`
- Add `gotchas.md`: when hexagonal is overkill, common DDD misapplications
- Add script for import direction validation (e.g., grep for domain importing infrastructure)
- Store architecture decision records (ADRs) per project
- Reference unit-test-adviser for test boundary guidance

---

### 4. unit-test-adviser

| # | Criterion | Rating | Notes |
|---|-----------|--------|-------|
| 1 | Description field quality | GOOD | "Domain unit test patterns: test structure, mocking strategies, test data builders, Given-When-Then" |
| 2 | Gotchas section | MISSING | Anti-patterns section exists but isn't framed as "gotchas Claude makes" |
| 3 | Progressive disclosure / Folder | FLAT | Single SKILL.md. Mother pattern and mocking examples could be separate references |
| 4 | Obvious content | MODERATE | AAA pattern and basic mocking are well-known; Object Mother pattern and BDD mocking style add value |
| 5 | Railroading | LOW | Gives patterns but doesn't force specific test frameworks |
| 6 | Setup/Config persistence | NONE | No config for test framework, naming convention preferences |
| 7 | Scripts & code | NONE | No reusable test helpers or Mother pattern generators |
| 8 | On-demand hooks | NONE | Could validate test naming conventions |
| 9 | Memory/data storage | NONE | No test review history |
| 10 | Skill composition | NONE | Should compose with integration-test-adviser (boundary between unit/integration) |

**Optimization opportunities**:
- Split Mother pattern into `references/mother-pattern.md` with full examples
- Add `gotchas.md`: Claude's tendency to mock too much, test naming inconsistencies
- Add script templates for test data builders per language
- Compose with integration-test-adviser for test boundary guidance

---

### 5. integration-test-adviser

| # | Criterion | Rating | Notes |
|---|-----------|--------|-------|
| 1 | Description field quality | GOOD | "Integration test patterns — adapter testing, external service mocking, test slicing" |
| 2 | Gotchas section | MISSING | Has anti-patterns but not framed as Claude-specific gotchas |
| 3 | Progressive disclosure / Folder | FLAT | At 7.3 KB, this is the second-largest skill. Would benefit most from splitting |
| 4 | Obvious content | LOW | Test slicing, WireMock patterns, and adapter boundary testing are genuinely specialized |
| 5 | Railroading | LOW | Framework-flexible (Java + TypeScript examples) |
| 6 | Setup/Config persistence | NONE | No config for test infrastructure preferences |
| 7 | Scripts & code | NONE | No WireMock stubs, TestContainers configs, or MSW handlers |
| 8 | On-demand hooks | NONE | Could validate test slice annotations |
| 9 | Memory/data storage | NONE | No review history |
| 10 | Skill composition | NONE | Should compose with unit-test-adviser |

**Optimization opportunities**:
- Split into `references/wiremock-patterns.md`, `references/testcontainers.md`, `references/msw-patterns.md`
- Add `gotchas.md`: shared state leaks, port conflicts, slow teardown
- Add `scripts/` with WireMock stub templates and TestContainers docker-compose snippets
- Compose with unit-test-adviser for test boundary decisions

---

### 6. frontend-test-adviser

| # | Criterion | Rating | Notes |
|---|-----------|--------|-------|
| 1 | Description field quality | GOOD | "Frontend testing patterns — React Testing Library, Vitest/Jest, Cypress e2e" |
| 2 | Gotchas section | MISSING | No gotchas. Claude commonly misuses fireEvent, uses wrong queries, forgets async |
| 3 | Progressive disclosure / Folder | FLAT | At 6.3 KB, has detailed RTL, Vitest, and Cypress content that could split |
| 4 | Obvious content | MODERATE | RTL query priority is well-documented publicly; the Vitest config and Cypress patterns add more value |
| 5 | Railroading | LOW | Gives patterns but adapts to project setup |
| 6 | Setup/Config persistence | NONE | No config for test framework choice, coverage thresholds |
| 7 | Scripts & code | NONE | No test utility helpers or setup file templates |
| 8 | On-demand hooks | NONE | Could warn when using fireEvent instead of userEvent |
| 9 | Memory/data storage | NONE | No review history |
| 10 | Skill composition | NONE | Should compose with component-adviser and web-accessibility-adviser |

**Optimization opportunities**:
- Add `gotchas.md`: fireEvent vs userEvent mistakes, missing act() warnings, async query misuse
- Split into `references/rtl-queries.md`, `references/vitest-setup.md`, `references/cypress-e2e.md`
- Add `scripts/` with test utility templates (custom render, mock providers)
- Compose with component-adviser (test what you build) and web-accessibility-adviser (test a11y)

---

### 7. component-adviser

| # | Criterion | Rating | Notes |
|---|-----------|--------|-------|
| 1 | Description field quality | GOOD | "React component design patterns — composition, hooks, state management, performance" |
| 2 | Gotchas section | MISSING | No gotchas. Claude commonly over-uses useCallback/useMemo, creates god components |
| 3 | Progressive disclosure / Folder | FLAT | At 6.4 KB, hooks, state management, and performance are distinct topics |
| 4 | Obvious content | HIGH | React composition, hooks basics, and memo patterns are well-known. The specific rules about >2 level drilling and context memoization add value |
| 5 | Railroading | MODERATE | Prescribes specific patterns (e.g., always extract hooks) that may not fit every case |
| 6 | Setup/Config persistence | NONE | No config for component conventions, file structure preferences |
| 7 | Scripts & code | NONE | No component scaffolding templates |
| 8 | On-demand hooks | NONE | Could warn on prop drilling depth |
| 9 | Memory/data storage | NONE | No review history |
| 10 | Skill composition | NONE | Should compose with frontend-test-adviser and web-accessibility-adviser |

**Optimization opportunities**:
- Reduce obvious React knowledge; focus on project-specific conventions
- Add `gotchas.md`: premature memoization, over-abstracting hooks, context overuse
- Split into `references/hooks-patterns.md`, `references/performance.md`, `references/state-management.md`
- Add component template in `templates/` for scaffolding
- Compose with frontend-test-adviser and web-accessibility-adviser

---

### 8. api-first-adviser

| # | Criterion | Rating | Notes |
|---|-----------|--------|-------|
| 1 | Description field quality | GOOD | "API-first design patterns — OpenAPI, REST conventions, error models, versioning" |
| 2 | Gotchas section | MISSING | No gotchas. Common failures: wrong status codes, missing pagination, inconsistent naming |
| 3 | Progressive disclosure / Folder | FLAT | At 6.7 KB, OpenAPI, REST, error models, and versioning are distinct reference topics |
| 4 | Obvious content | HIGH | REST conventions, HTTP methods, and status codes are very well-known. RFC 7807 and versioning strategy add value |
| 5 | Railroading | LOW | Gives conventions but allows project-specific adaptation |
| 6 | Setup/Config persistence | NONE | No config for API naming convention, versioning strategy |
| 7 | Scripts & code | NONE | No OpenAPI spec templates or validation scripts |
| 8 | On-demand hooks | NONE | Could validate API endpoint naming |
| 9 | Memory/data storage | NONE | No API review history |
| 10 | Skill composition | NONE | Should compose with architect-adviser |

**Optimization opportunities**:
- Drastically reduce obvious content (HTTP methods, common status codes)
- Add `gotchas.md`: status code misuse (400 vs 422), pagination edge cases, breaking change detection
- Add `templates/openapi-skeleton.yaml` as a starting point
- Add `references/error-model.md` with RFC 7807 examples
- Add validation script for OpenAPI spec linting
- Compose with architect-adviser for API layer architecture

---

### 9. web-accessibility-adviser

| # | Criterion | Rating | Notes |
|---|-----------|--------|-------|
| 1 | Description field quality | GOOD | "Web accessibility patterns — WCAG 2.1 AA, ARIA, keyboard navigation, screen readers" |
| 2 | Gotchas section | MISSING | No gotchas. Claude commonly misuses ARIA roles, forgets focus management, breaks tab order |
| 3 | Progressive disclosure / Folder | FLAT | At 7.4 KB, this is the largest skill. WCAG criteria, ARIA, keyboard, and patterns should split |
| 4 | Obvious content | MODERATE | WCAG criteria numbers are useful reference; ARIA role details and keyboard patterns are specialized enough to keep |
| 5 | Railroading | LOW | Provides standards but doesn't force specific implementation approaches |
| 6 | Setup/Config persistence | NONE | No config for WCAG level target, audit scope |
| 7 | Scripts & code | NONE | No axe-core setup scripts or a11y testing utilities |
| 8 | On-demand hooks | NONE | Could flag missing alt text or aria attributes |
| 9 | Memory/data storage | NONE | No audit history or issue tracking |
| 10 | Skill composition | NONE | Should compose with component-adviser and frontend-test-adviser |

**Optimization opportunities**:
- Split into `references/wcag-criteria.md`, `references/aria-roles.md`, `references/keyboard-patterns.md`
- Add `gotchas.md`: ARIA misuse, focus trap mistakes, contrast ratio miscalculations
- Add `scripts/` with axe-core test setup or contrast checker utility
- Add `templates/a11y-audit-report.md` for structured audit output
- Compose with component-adviser and frontend-test-adviser

---

## Cross-Cutting Findings

### Pattern: Every skill has the same structural weakness

| Criterion | Skills with gap | Severity |
|-----------|----------------|----------|
| Gotchas section | 9/9 missing | HIGH — This is the "highest-signal content" per Tariq |
| Progressive disclosure | 9/9 flat (single file) | HIGH — All skills load full content upfront |
| Scripts & code | 9/9 missing | MEDIUM — Especially impactful for git-* and testing skills |
| Memory/data storage | 9/9 missing | MEDIUM — No learning across invocations |
| Skill composition | 9/9 missing | MEDIUM — Natural pairings exist but aren't declared |
| On-demand hooks | 9/9 missing | LOW-MEDIUM — Safety hooks would add value to git-* skills |
| Setup/Config persistence | 9/9 missing | LOW — Advisory skills need this less than action skills |
| Obvious content | 5/9 have significant obvious content | MEDIUM — architect, component, api-first are worst |

### Natural Skill Composition Map

```
git-commit ←→ git-pull-request          (commit → PR workflow)
architect-adviser → unit-test-adviser    (architecture informs test boundaries)
unit-test-adviser ←→ integration-test-adviser  (test type boundary)
component-adviser → frontend-test-adviser      (build → test)
component-adviser → web-accessibility-adviser  (build → a11y check)
frontend-test-adviser → web-accessibility-adviser  (test → a11y assertions)
api-first-adviser → architect-adviser    (API layer → architecture)
```

### Content that should be removed (Claude already knows)

| Skill | Content to reduce |
|-------|-------------------|
| architect-adviser | Basic dependency rule explanation, layer definitions |
| component-adviser | React composition basics, useState/useEffect fundamentals |
| api-first-adviser | HTTP method definitions, common status code meanings |
| unit-test-adviser | AAA pattern explanation |
| frontend-test-adviser | Basic RTL query priority (well-documented publicly) |

### Content that should be amplified (pushes Claude beyond defaults)

| Skill | High-value content |
|-------|-------------------|
| git-commit | JIRA scope integration, co-author footer |
| architect-adviser | Beck's 4 Rules prioritization, anti-pattern list |
| integration-test-adviser | Test slicing, adapter boundary testing |
| unit-test-adviser | Object Mother pattern, BDD mocking style |
| web-accessibility-adviser | Keyboard pattern specifics, focus management |
| api-first-adviser | RFC 7807 details, versioning with Sunset headers |

---

## Recommended Optimization Priority

Based on impact and effort:

| Priority | Skill(s) | Action | Impact |
|----------|----------|--------|--------|
| 1 | ALL | Add gotchas.md to every skill | HIGH — Highest-signal content missing everywhere |
| 2 | Large skills (integration-test, web-a11y, frontend-test, component, api-first) | Split into references/ for progressive disclosure | HIGH — Reduces upfront context load |
| 3 | git-commit, git-pull-request | Add on-demand hooks (block --no-verify, force-push) | HIGH — Safety value |
| 4 | architect, component, api-first | Remove obvious content | MEDIUM — Focuses Claude on novel guidance |
| 5 | git-commit, git-pull-request | Add config.json persistence | MEDIUM — Personalization |
| 6 | ALL | Declare skill composition references | MEDIUM — Enables workflow chaining |
| 7 | integration-test, frontend-test | Add scripts/ with test utilities | MEDIUM — Code composition |
| 8 | git-commit | Add memory/execution log | LOW-MEDIUM — Consistency across sessions |
| 9 | api-first | Add OpenAPI template | LOW — Scaffolding value |
| 10 | ALL | Add execution history storage | LOW — Long-term value |
