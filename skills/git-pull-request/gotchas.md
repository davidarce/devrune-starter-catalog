# Gotchas — git-pull-request

Common mistakes Claude makes when creating pull requests. Check these before finalizing your output.

## 1. Wrong base branch selection

**Wrong**: Creating a PR against `main` when the team uses `develop` as the integration branch, or targeting `develop` when the hotfix should go directly to `main`.
**Right**: Check the project's branching strategy before creating the PR. Read config.json if available, inspect recent merged PRs, or ask the user which base branch to target.
**Why**: Claude defaults to `main` as the base branch. A PR merged to the wrong base can bypass release gates or introduce unreviewed code into production.

## 2. Force-pushing to protected branches

**Wrong**: Suggesting `git push --force` or `git push --force-with-lease` to `main`, `master`, or `develop` to resolve push conflicts.
**Right**: Never force-push to protected branches. For feature branches, prefer `--force-with-lease` over `--force`. For protected branches, resolve conflicts through merge or rebase locally, then push normally.
**Why**: Force-push to shared branches rewrites history that other developers have already based work on. This causes lost commits and broken local repositories for the entire team.

## 3. Creating a PR from a stale branch without rebasing

**Wrong**: Creating a PR when the feature branch is 50+ commits behind the base branch, without mentioning the divergence or suggesting a rebase.
**Right**: Before creating the PR, check how far behind the branch is. If significantly behind, suggest rebasing onto the latest base branch first to reduce merge conflicts and ensure CI runs against current code.
**Why**: Claude focuses on the PR creation mechanics and ignores branch freshness. Stale PRs often have hidden merge conflicts and pass CI on code that will fail once merged.

## 4. Missing upstream tracking setup

**Wrong**: Running `gh pr create` when the local branch has never been pushed to the remote, causing a confusing error.
**Right**: Before creating the PR, verify the branch is pushed to the remote with `git push -u origin <branch>`. If it hasn't been pushed, push it first.
**Why**: Claude assumes the branch already exists on the remote. The PR creation will fail silently or with a cryptic error if no upstream exists.

## 5. Writing PR descriptions that duplicate the diff

**Wrong**: A PR description that lists every file changed and describes each line modification — essentially restating the diff in prose.
**Right**: The PR description should explain the **why** — what problem is being solved, what approach was chosen and why, what alternatives were considered. Link to the issue/ticket. Let the diff speak for the **what**.
**Why**: Claude's instinct is to be thorough by describing every change. This produces walls of text that reviewers skip entirely, missing the context they actually need.

## 6. Not verifying CI status before suggesting merge

**Wrong**: Suggesting the PR is ready to merge immediately after creation without waiting for CI checks.
**Right**: After creating the PR, note that CI checks need to pass before merging. If the user asks to merge, verify check status with `gh pr checks` first.
**Why**: Claude treats PR creation as the end of the workflow. Merging before CI completes can introduce broken code into the base branch.
