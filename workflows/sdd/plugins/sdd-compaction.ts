import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { Plugin } from "@opencode-ai/plugin";

const SDD_DIR = ".sdd";

// Terminal phase / next values per the canonical schema in
// _shared/persistence-contract.md. When a workflow has reached one of
// these, the orchestrator does not need a recovery push on compaction.
const TERMINAL_PHASES = new Set(["done"]);
const TERMINAL_NEXTS = new Set(["done"]);

// SddCompaction pushes a minimal recovery context block per active SDD
// workflow when OpenCode is about to compact the session.
//
// The push is intentionally lean: change-name, path to state.yaml, and
// the canonical phase/next values parsed from that file. The full
// state.yaml is NOT embedded — the orchestrator can Read it on demand.
// All defensive prose (Role Invariant, "do not" lists, "Load Skill
// (sdd-orchestrator)") is omitted because the orchestrator already has
// its full playbook in the agent prompt; re-injecting it on every
// compaction wastes context and re-introduces patterns the catalog
// has since removed (PR-A: drop REGISTRY for primary agents; audit
// PR #66: tool-name corrections; P3: allow workflow-init branch).
export const SddCompaction: Plugin = async (_ctx) => {
  return {
    "experimental.session.compacting": async (
      _input: unknown,
      output: { context: { push: (s: string) => void } }
    ) => {
      if (!existsSync(SDD_DIR)) return;

      const changes = readdirSync(SDD_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .filter((d) => existsSync(join(SDD_DIR, d.name, "state.yaml")));

      for (const c of changes) {
        const stateFile = join(SDD_DIR, c.name, "state.yaml");
        const content = readFileSync(stateFile, "utf-8");

        // Canonical schema (per persistence-contract.md):
        //   phase:         explore | plan | implement | review | done
        //   next:          explore | plan | implement | review | commit | pr | done
        //   phase_status:  ok | warning | failed | blocked
        const phase =
          content.match(/^phase:\s*(\S+)/m)?.[1] ?? "unknown";
        const next =
          content.match(/^next:\s*(\S+)/m)?.[1] ?? "unknown";

        // Skip recovery push for terminal workflows — re-injecting a
        // recovery directive after the workflow is done only invites
        // the orchestrator to re-do completed phases.
        if (TERMINAL_PHASES.has(phase) || TERMINAL_NEXTS.has(next)) continue;

        output.context.push(
`## SDD recovery — workflow \`${c.name}\`

State file: \`${stateFile}\` (phase=${phase}, next=${next}).

Resume from \`next\` directly. Do NOT re-explore, re-plan, or re-do any
completed phase. Read \`${stateFile}\` only if you need more context
than phase + next.

Do NOT produce an orientation sentence ("I'll continue with...", "Voy a
seguir con...", etc.) before resuming — the next tool call IS the
resume. Just call it.`
        );
      }
    },
  };
};
