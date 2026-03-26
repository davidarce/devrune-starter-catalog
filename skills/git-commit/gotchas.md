# Gotchas — git-commit

Common mistakes Claude makes when creating git commits. Check these before finalizing your output.

## 1. Scope mismatch between commit type and actual changes

**Wrong**: Using `feat` for a commit that only refactors internal implementation without changing behavior.
**Right**: Match the Conventional Commit type to the actual nature of the change — `refactor` for restructuring, `fix` for bug corrections, `feat` only for new user-facing functionality.
**Why**: Claude defaults to `feat` too aggressively. A refactored service class is not a feature. Scope mismatch makes changelogs unreliable and misleads reviewers.

## 2. Staging files that contain secrets or credentials

**Wrong**: Running `git add .` or `git add -A` when the working directory contains `.env`, `credentials.json`, `*.pem`, or similar sensitive files.
**Right**: Stage files explicitly by name. Before staging, check for sensitive patterns: `.env*`, `*secret*`, `*credential*`, `*.key`, `*.pem`, `*token*`. Warn the user if any match.
**Why**: Claude tends to stage everything for convenience. A single accidental credential commit to a public repo is a security incident.

## 3. Attempting to bypass pre-commit hooks with --no-verify

**Wrong**: Suggesting `--no-verify` when a pre-commit hook fails, treating it as a convenience shortcut.
**Right**: Diagnose why the hook failed (lint errors, type check failures, test failures) and fix the underlying issue. Only use `--no-verify` if the user explicitly requests it and understands the consequences.
**Why**: Hooks exist to enforce quality gates. Bypassing them silently defeats CI/CD safeguards and creates commits that will fail in pipeline.

## 4. Writing overly broad commit scopes

**Wrong**: `feat(app): add order processing` when only the payment adapter was changed.
**Right**: `feat(payment): add Stripe charge adapter` — scope should match the module or area actually modified.
**Why**: Claude tends to choose vague, high-level scopes like `app`, `core`, or `system`. Precise scopes make `git log --grep` useful and help reviewers understand blast radius at a glance.

## 5. Including unrelated changes in a single commit

**Wrong**: Committing a bug fix, a formatting change, and a new feature together because they were all staged.
**Right**: Review `git diff --staged` and split unrelated changes into separate commits. One logical change per commit.
**Why**: Claude tries to be helpful by committing everything at once. Mixed commits are hard to revert, hard to cherry-pick, and make blame history useless.

## 6. Omitting the JIRA ticket reference when one is required

**Wrong**: `fix(auth): handle expired token refresh` with no ticket reference when the project uses JIRA integration.
**Right**: `fix(auth): handle expired token refresh [PROJ-456]` — include the ticket ID in the format the project expects (footer, subject line, or scope).
**Why**: Claude forgets to ask about or include JIRA references unless explicitly prompted. Missing ticket links break traceability between commits and project management.
