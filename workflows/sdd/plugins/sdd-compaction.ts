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
