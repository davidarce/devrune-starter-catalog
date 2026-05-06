# Changelog

All notable changes to the DevRune Starter Catalog will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0](https://github.com/davidarce/devrune-starter-catalog/compare/v0.6.0...v0.7.0) (2026-05-06)


### Features

* **sdd:** tighten adviser coverage, review-ok auto-flow ([#49](https://github.com/davidarce/devrune-starter-catalog/issues/49)) ([#51](https://github.com/davidarce/devrune-starter-catalog/issues/51)) ([d62aeda](https://github.com/davidarce/devrune-starter-catalog/commit/d62aeda854144f95a132d69469935b3118a01311))

## [0.6.0](https://github.com/davidarce/devrune-starter-catalog/compare/v0.5.0...v0.6.0) (2026-05-05)


### Features

* **sdd:** include write-a-prd as workflow dependency ([#47](https://github.com/davidarce/devrune-starter-catalog/issues/47)) ([b57cf03](https://github.com/davidarce/devrune-starter-catalog/commit/b57cf03961854584c1596fd5437269e75b28dd9c))

## [0.5.0](https://github.com/davidarce/devrune-starter-catalog/compare/v0.4.3...v0.5.0) (2026-05-05)


### Features

* **sdd:** PRD gate before exploration when scope is unclear ([#43](https://github.com/davidarce/devrune-starter-catalog/issues/43)) ([572298c](https://github.com/davidarce/devrune-starter-catalog/commit/572298c6e2fea33214128bd05183893ddda08224))

## [0.4.3](https://github.com/davidarce/devrune-starter-catalog/compare/v0.4.2...v0.4.3) (2026-05-03)


### Code Refactoring

* **sdd:** cleanup — drop !-mkdir at skill load, move file-slicing to references/ (M7+M8) ([#40](https://github.com/davidarce/devrune-starter-catalog/issues/40)) ([8a0752b](https://github.com/davidarce/devrune-starter-catalog/commit/8a0752b447c2fcc1580afdc87e74b0f79cdf1e3a))

## [0.4.2](https://github.com/davidarce/devrune-starter-catalog/compare/v0.4.1...v0.4.2) (2026-05-03)


### Code Refactoring

* **sdd:** slim launch templates — keep dynamic context only (M5) ([#38](https://github.com/davidarce/devrune-starter-catalog/issues/38)) ([367f881](https://github.com/davidarce/devrune-starter-catalog/commit/367f881c5edbd12f4b0ced23fff7193efe41e539))

## [0.4.1](https://github.com/davidarce/devrune-starter-catalog/compare/v0.4.0...v0.4.1) (2026-05-03)


### Code Refactoring

* **sdd:** slim phase SKILL.md files (M3+M4+M6) ([#36](https://github.com/davidarce/devrune-starter-catalog/issues/36)) ([23ade84](https://github.com/davidarce/devrune-starter-catalog/commit/23ade844b131f12de18459b763d51d002421c7c6))

## [0.4.0](https://github.com/davidarce/devrune-starter-catalog/compare/v0.3.1...v0.4.0) (2026-05-01)


### Features

* **sdd:** hard role invariant for the orchestrator + post-compaction re-assertion (M1+M2) ([#34](https://github.com/davidarce/devrune-starter-catalog/issues/34)) ([c5d94c9](https://github.com/davidarce/devrune-starter-catalog/commit/c5d94c9c5878001e843babc64b6d29c511071907))

## [0.3.1](https://github.com/davidarce/devrune-starter-catalog/compare/v0.3.0...v0.3.1) (2026-05-01)


### Bug Fixes

* **sdd:** anchor artifact paths to {project path} and cite SKILL.md via {SKILLS_PATH} ([#31](https://github.com/davidarce/devrune-starter-catalog/issues/31)) ([587580b](https://github.com/davidarce/devrune-starter-catalog/commit/587580bb340df01f96685f2d6194af40b138f2b4)), closes [#29](https://github.com/davidarce/devrune-starter-catalog/issues/29)

## [0.3.0](https://github.com/davidarce/devrune-starter-catalog/compare/v0.2.21...v0.3.0) (2026-05-01)


### Features

* **sdd:** auto-launch implement after Crit plan approval ([#23](https://github.com/davidarce/devrune-starter-catalog/issues/23)) ([9c59a88](https://github.com/davidarce/devrune-starter-catalog/commit/9c59a88c90e9306d0954f464c1adc4ce5cfc3a5e)), closes [#22](https://github.com/davidarce/devrune-starter-catalog/issues/22)

## [0.2.18] — 2026-04-27

### Added — Workspace-aware skills contract

Skills `git-commit`, `git-pull-request`, and `sdd-review` now work
identically in (a) a git repository directly, (b) a workspace with one
nested repo, and (c) a workspace with multiple nested repos. Each skill
has a new `## Step 0: Resolve Target Repository` section that resolves
the target repo via a priority chain (explicit user argument →
`workspace.default_target` from config → single known repo → user
prompt → directory scan), then uses `git -C <target_path>` (and
`gh -R <owner>/<repo>` for GitHub) for every subsequent command.

**Schema**

A new `workspace` block is added to each skill's `config.json`:

```json
{
  "workspace": {
    "mode": "auto",
    "default_target": "",
    "known_repos": []
  }
}
```

- `mode`: `"auto"` (default), `"single-repo"`, or `"multi-repo"`.
- `default_target`: path or name of the repo to target without
  prompting.
- `known_repos`: discovered or learned repos as
  `[{name, path}]` entries.

**Configuration write-back (opt-in)**

Skills may propose updates to their own `config.json` (via the `Write`
tool) when they discover repos in a workspace, detect `pr_platform`
from a remote URL, observe a recurring JIRA prefix, or the user asks to
"always" target a specific repo. Write-back is **always opt-in**: the
skill asks via `AskUserQuestion` before persisting, never overwrites a
non-empty value silently, and only modifies its own `config.json`.

**Workflow permissions**

`workflows/sdd/workflow.yaml` updates the SDD permissions list:

- Workspace mode: `Bash(git -C:*)`, `Bash(gh -R:*)`, `Bash(pwd)`, `Bash(find:*)` — needed for the Step 0 algorithm.
- Crit plan-review: replaced the narrow `Bash(crit plan:*)` and `Bash(crit comment:*)` with the blanket `Bash(crit:*)`, which also covers `crit status`, `crit fetch`, `crit share`, `crit config`, `crit --help`. Added `Read(//Users/*/.crit/**)` for reading `~/.crit/plans/<change>/.crit.json` and `Edit(.sdd/*/state.yaml)` for the orchestrator's phase-state updates. Together these silence the repeated prompts seen during plan reviews.

**New files**

- `skills/git-commit/config.json`
- `skills/git-pull-request/config.json`
- `workflows/sdd/sdd-review/config.json`

### Fixed — `git rev-parse --abbrev-ref origin/HEAD` breaks skill load

`workflows/sdd/sdd-review/SKILL.md` had a `Dynamic Context` line that
ran `git rev-parse --abbrev-ref origin/HEAD 2>/dev/null` without a
fallback. When the working directory is not a git repository (or when
`origin/HEAD` is unset, common after `git clone --depth` or after
`gh repo clone`), `git` exits non-zero and `2>/dev/null` only silences
stderr — the non-zero exit code makes Claude Code abort the skill load
with `Shell command failed for pattern...`. Added `|| echo "__NO_GIT__"`
so the command always exits 0 with an observable sentinel that the
skill body can branch on.

### Changed — Adopt Claude-native SDD layout (sdd-cloud-native-variant)

The starter catalog now ships a Claude-native variant of the SDD
orchestrator that drops the per-launch `Skill()` boilerplate and inlines
the implement-phase wave mechanics and adviser invocation snippet
directly:

- `workflows/sdd/ORCHESTRATOR.claude.md` (new)
- `workflows/sdd/REGISTRY.claude.md` (new) — variant marker that
  signals to the renderer to prefer this layout for Claude installs.
- `workflows/sdd/_shared/launch-templates.claude.md` (new)
- `workflows/sdd/_shared/launch-templates.copilot.md` (new)
- `workflows/sdd/_shared/launch-templates.opencode.md` (new)

The non-`.claude` variants remain in the source tree for Codex/Factory
installs. DevRune's claude renderer (`v0.1.29`+) strips the variant
suffix at install time and prefers `.claude.md` files when present.

### Changed — Rename `*-adviser/` directories to `*-advisor/`

User-facing skill names use American English `-advisor` suffix to match
DevRune's `v0.1.29` rename. Affected skills:

- `api-first-adviser/` → `api-first-advisor/`
- `architect-adviser/` → `architect-advisor/`
- `component-adviser/` → `component-advisor/`
- `frontend-test-adviser/` → `frontend-test-advisor/`
- `integration-test-adviser/` → `integration-test-advisor/`
- `unit-test-adviser/` → `unit-test-advisor/`
- `web-accessibility-adviser/` → `web-accessibility-advisor/`

`SKILL.md` frontmatter `name:` fields and any cross-references in
gotchas / references are updated accordingly. Users upgrading need to
re-run `devrune install` with `v0.1.29`+ to pick up the renamed
directories.

[0.2.18]: https://github.com/davidarce/devrune-starter-catalog/releases/tag/v0.2.18
