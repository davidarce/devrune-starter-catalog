import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { Plugin } from "@opencode-ai/plugin";

const SDD_DIR = ".sdd";
const ACTIVE_MARKER = join(SDD_DIR, ".active");

// Terminal phase / next values per the canonical schema in
// _shared/persistence-contract.md. When a workflow has reached one of
// these, the orchestrator does not need a recovery push on compaction.
const TERMINAL_PHASES = new Set(["done"]);
const TERMINAL_NEXTS = new Set(["done"]);

type Output = { context: { push: (s: string) => void } };

// readStateMeta returns canonical phase/next values from a state.yaml
// only if BOTH keys are present. Old-schema files (current_phase: /
// phases:) return null and are treated as dormant by the caller.
function readStateMeta(stateFile: string): { phase: string; next: string } | null {
  const content = readFileSync(stateFile, "utf-8");
  // Canonical schema (per persistence-contract.md):
  //   phase:         explore | plan | implement | review | done
  //   next:          explore | plan | implement | review | commit | pr | done
  //   phase_status:  ok | warning | failed | blocked
  const phaseMatch = content.match(/^phase:\s*(\S+)/m);
  const nextMatch = content.match(/^next:\s*(\S+)/m);
  if (!phaseMatch || !nextMatch) return null;
  return { phase: phaseMatch[1], next: nextMatch[1] };
}

function emit(out: Output, name: string, stateFile: string, phase: string, next: string) {
  out.context.push(
`## SDD recovery — workflow \`${name}\`

State file: \`${stateFile}\` (phase=${phase}, next=${next}).

Resume from \`next\` directly. Do NOT re-explore, re-plan, or re-do any
completed phase. Read \`${stateFile}\` only if you need more context
than phase + next.`
  );
}

// SddCompaction pushes a minimal recovery context block for the active
// SDD workflow when OpenCode is about to compact the session.
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
//
// Strategy (v2 — active-marker aware):
//  1. If .sdd/.active exists -> emit recovery only for that workflow.
//  2. Fallback: scan .sdd/*/state.yaml but require canonical schema.
//     Old-schema files (current_phase:/phases:) are skipped silently.
//  3. Always skip workflows where phase=done or next=done.
export const SddCompaction: Plugin = async (_ctx) => {
  return {
    "experimental.session.compacting": async (_input: unknown, output: Output) => {
      if (!existsSync(SDD_DIR)) return;

      if (existsSync(ACTIVE_MARKER)) {
        const active = readFileSync(ACTIVE_MARKER, "utf-8").trim();
        if (!active) return;
        const stateFile = join(SDD_DIR, active, "state.yaml");
        if (!existsSync(stateFile)) return;
        const meta = readStateMeta(stateFile);
        if (!meta) return;
        if (TERMINAL_PHASES.has(meta.phase) || TERMINAL_NEXTS.has(meta.next)) return;
        emit(output, active, stateFile, meta.phase, meta.next);
        return;
      }

      const changes = readdirSync(SDD_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name !== "archives")
        .filter((d) => existsSync(join(SDD_DIR, d.name, "state.yaml")));

      for (const c of changes) {
        const stateFile = join(SDD_DIR, c.name, "state.yaml");
        const meta = readStateMeta(stateFile);
        if (!meta) continue;
        // Skip recovery push for terminal workflows — re-injecting a
        // recovery directive after the workflow is done only invites
        // the orchestrator to re-do completed phases.
        if (TERMINAL_PHASES.has(meta.phase) || TERMINAL_NEXTS.has(meta.next)) continue;
        emit(output, c.name, stateFile, meta.phase, meta.next);
      }
    },
  };
};
