---
name: arch-flow-explorer
description: Generate interactive HTML visualizations of architecture flows with clickable nodes, pan/zoom, and animated walkthroughs.
metadata:
  version: "1.1"
  scope: [architecture, documentation, learning, exploration]
  trigger: "User wants to understand, visualize, or explore a codebase flow/architecture/system"
  auto_invoke: "Triggers on: 'explícame [feature]', 'muéstrame cómo funciona [X]', 'show me how [X] works', 'explain the [X] flow/pipeline/system', 'visualize [X]', 'diagram [X]', or any request to understand backend interactions, architecture, or flow between components"
allowed-tools: Read, Grep, Glob, Bash(tree:*), AskUserQuestion, Write
---

# Flow Explorer

Generate interactive HTML playgrounds that visualize backend flows as clickable node diagrams. Any developer opens the file and immediately understands the system.

## What You Produce

A **single self-contained HTML file** (no external dependencies) with:
- Interactive node diagram with clickable components
- Detail panel showing tech stack, endpoints, config per component
- Animated connection lines (solid = sync, dashed = async)
- Step-by-step walkthrough mode with Previous / Next / Auto-play
- Prompt output panel with copy button for pasting back into Claude Code
- Dark theme, works offline

## Workflow

### 1. Analyze the flow

**Read the actual source code.** Don't guess. Trace the flow from entry point to final side effects. Look at:
- Route definitions and controllers
- Service layer and business logic
- Database models/schemas (collection names, indexes)
- Event producers and consumers (topic names, consumer groups)
- Config files, docker-compose, infrastructure definitions

### 2. Structure the data

Organize into a `FLOW` object with `components` and `steps` arrays. See [references/data-schema.md](references/data-schema.md) for the full schema and type definitions.

Each component needs: `id`, `label`, `type`, `x`, `y`, `description`, `tech`, `details[]`, `connections[]`

Component types: `entry` (green), `service` (indigo), `database` (amber), `messaging` (pink), `cache` (cyan), `external` (purple), `worker` (orange)

### 3. Build the HTML

Use the template in [assets/template.html](assets/template.html) as your base. Replace the `// [FLOW_DATA_PLACEHOLDER]` comment with your `FLOW` object as `window.FLOW = { ... };`.

**Node positioning strategy (top-to-bottom flow layout):**

The template includes an auto-layout algorithm that arranges nodes hierarchically if x/y are missing. However, **you should always provide explicit x/y coordinates** for better control.

**Recommended layout approach:**
1. **Arrange nodes in a TOP-TO-BOTTOM flow** (entry points at top, downstream components below)
2. **Use consistent vertical spacing:** ~200px between layers
3. **Center nodes horizontally** within their layer for visual balance
4. **Horizontal spacing:** ~220-240px between nodes in the same row

**Example layout:**
```
Layer 0 (y: 30):     [API Gateway] (centered)
Layer 1 (y: 230):    [Service A]  [Service B]  (spread horizontally, centered)
Layer 2 (y: 430):    [Database]   [Cache]      (spread horizontally, centered)
Layer 3 (y: 630):    [Message Queue] (centered)
Layer 4 (y: 830):    [Worker]     (centered)
```

**Positioning tips:**
- Entry points: top center (y: 30-50)
- Services: spread across middle layers (y: 230, 430, ...)
- Data stores (DB, cache): middle-bottom (y: 430-630)
- Messaging/async: bottom middle (y: 630)
- Workers/background: bottom (y: 830+)

**Canvas reference:** The template viewport is effectively infinite, but aim to keep nodes within a ~1200px wide × ~1000px tall area for the initial view.

### 4. Save and open

Save the generated HTML to `./.arch-flow-explorer/` in the project root, using a kebab-case slug of the flow name:

```bash
mkdir -p ./.arch-flow-explorer
# Write the HTML file
open ./.arch-flow-explorer/{flow_name}.html
```

**Naming convention**: derive the filename from the flow title using kebab-case.
- "Order Creation Flow" → `order-creation-flow.html`
- "Contact Sync Pipeline" → `contact-sync-pipeline.html`
- "User Registration" → `user-registration.html`

This way the team accumulates all flow diagrams in one place:
```
project-root/
└── .arch-flow-explorer/
    ├── order-creation-flow.html
    ├── contact-sync-pipeline.html
    └── user-registration.html
```

## Critical Rules

1. **Single HTML file** — All CSS/JS inline. Zero external dependencies.
2. **Read the code** — Use real collection names, topic names, endpoint paths. Generic diagrams are useless.
3. **Always define steps** — The `steps` array drives the walkthrough. Without it, Play Flow won't work.
4. **Max 6-10 components** — Split complex systems into sub-flows.
5. **Prompt must be actionable** — Generated prompts reference specific components and ask for code, not vague questions.
6. **Save to `./.arch-flow-explorer/`** — Always save to project root's `.arch-flow-explorer/` directory and open from there.

## Gotchas

- **No steps array** → walkthrough mode breaks
- **Generic descriptions** → "Handles data" is useless. Write "Persists to `orders` collection with `writeConcern: majority`"
- **Too many nodes** → keep it focused, split into sub-flows if needed
- **Missing async markers** → set `async: true` in steps so connections render as dashed lines
