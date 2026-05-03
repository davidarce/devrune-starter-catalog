# File slicing — quality rules

Slices are a budget-constrained alternative to full files in the exploration selection. Use them only when including the full file would push the selection past the token budget; otherwise prefer the full file.

## Each slice MUST include

- A descriptive `description` explaining what the slice contains, why it's relevant, and how it relates to other code. The next model sees only the slice — without context, missing details cause task failures.
  - **Bad**: *"UserAuth methods"*
  - **Good**: *"UserAuth.login() and logout() — session management called by LoginView, creates Token objects"*
- Imports, type declarations, and helper methods needed for the slice to read self-sufficiently.
- Natural boundaries — class/function blocks, not arbitrary line ranges.
- ≥100–200 lines per slice when possible — micro-fragments lose context.

## What to exclude

- Unrelated functionality (e.g. admin functions when the task is about authentication).
- Deprecated code marked for removal.
- Test fixtures or mocks not needed for understanding the production code.

## Process

1. Read the relevant sections with the `Read` tool first to identify natural boundaries.
2. Verify each section directly relates to the task.
3. Check completeness — ensure the slice carries the surrounding context (imports, called methods, types).
4. Write the descriptive `description` (see format above) before adding the slice to the selection.
5. Preview each slice in `exploration.md`'s `### Selected Context:` block before finalising.

If you find yourself slicing more than ~3 files, reconsider whether the budget is actually tight — full files almost always serve the next model better.
