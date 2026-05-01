import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { Plugin } from "@opencode-ai/plugin";

export const SddCompaction: Plugin = async (_ctx) => {
  return {
    "experimental.session.compacting": async (
      _input: unknown,
      output: { context: { push: (s: string) => void } }
    ) => {
      const sddDir = ".sdd";
      if (!existsSync(sddDir)) return;
      const changes = readdirSync(sddDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .filter((d) => existsSync(join(sddDir, d.name, "state.yaml")));
      if (changes.length === 0) return;
      for (const c of changes) {
        const stateFile = join(sddDir, c.name, "state.yaml");
        const stateContent = readFileSync(stateFile, "utf-8");
        const phaseMatch = stateContent.match(/^current_phase:\s*(.+)$/m);
        const nextMatch = stateContent.match(/^next_step:\s*(.+)$/m);
        const currentPhase = phaseMatch?.[1] ?? "unknown";
        const nextStep = nextMatch?.[1] ?? "check state.yaml";
        output.context.push(`## SDD Workflow Recovery (CRITICAL)
ACTIVE SDD workflow: ${c.name}

## Role Invariant — you orchestrate, you do not implement

Outside .sdd/{change}/, your only outputs are: sub-agent launches via Task(...), AskUserQuestion, mkdir for .sdd/, and Bash(crit ...) per the Crit Plan Review Protocol.

You do NOT: Edit/Write source files, run builds/tests/lints, run git commit/push, create branches/commits/PRs, invoke Skill("sdd-{phase}") directly.

If your next planned action is on the "do not" list, you have lost the role — re-read ORCHESTRATOR.opencode.md and delegate.

## Recovery

Current phase: ${currentPhase}
NEXT: ${nextStep}

You MUST run compaction recovery NOW:
1. Read .sdd/${c.name}/state.yaml for full state
2. Check engram for active-workflow marker (mem_context)
3. Load Skill(sdd-orchestrator) and resume from NEXT directive

Full state.yaml content:
\`\`\`yaml
${stateContent}
\`\`\`
`);
      }
    },
  };
};
