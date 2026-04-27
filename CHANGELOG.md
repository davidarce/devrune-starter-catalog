# Changelog

All notable changes to the DevRune Starter Catalog will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

`workflows/sdd/workflow.yaml` adds the following permissions to support
the new contract:

- `Bash(git -C:*)` — operate on a nested repo without changing CWD.
- `Bash(gh -R:*)` — GitHub CLI without changing CWD (gh has no `-C`).
- `Bash(pwd)` — read CWD in dynamic context.
- `Bash(find:*)` — scan for nested repos when `known_repos` is empty.

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
