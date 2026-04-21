import fs from 'node:fs/promises';
import path from 'node:path';
import {
  branchCommit,
  readJson,
  runJsonStage,
  writeJson,
  writeText,
} from '../stage_util.js';
import { branchDir, schemaPath } from '../../util/paths.js';

interface Stage4Args {
  runId: string;
  branchId: string;
}

interface PrototypeSpec {
  title: string;
  actors: Array<{ role: string; description: string; count: number }>;
  context: {
    setting: string;
    device: string;
    duration_minutes: number;
    session_structure: string;
  };
  task_flow: Array<{
    step: number;
    participant_action: string;
    system_response: string;
    wizard_decisions: string[];
  }>;
  wizard_controls: Array<{ control_name: string; triggers: string; effect: string }>;
  observable_signals: Array<{ signal: string; capture_method: string; analysis_plan: string }>;
  failure_cases: Array<{ scenario: string; expected_behavior: string; wizard_fallback: string }>;
  materials_needed: string[];
  [k: string]: unknown;
}

export async function runStagePrototype(args: Stage4Args): Promise<void> {
  const bd = branchDir(args.runId, args.branchId);
  const card = await readJson(path.join(bd, 'branch_card.json'));

  const schema = await fs.readFile(schemaPath('prototype_spec'), 'utf8');

  const userMessage =
    `run_id: ${args.runId}\nbranch_id: ${args.branchId}\n\n` +
    `branch_card.json:\n${JSON.stringify(card, null, 2)}\n\n` +
    `Prototype spec JSON schema (use ONLY the enum values shown for role, capture_method):\n${schema}\n\n` +
    `Produce a prototype specification matching this schema exactly. ` +
    `For actors[].role use exactly one of: participant, wizard, observer, facilitator, confederate. ` +
    `For observable_signals[].capture_method use exactly one of: screen_recording, think_aloud_audio, ` +
    `self_report_likert, self_report_open_ended, task_completion_time, error_count, interviewer_notes, ` +
    `eye_tracking, log_events.`;

  const parsed = (await runJsonStage({
    runId: args.runId,
    branchId: args.branchId,
    stage: '4_prototype',
    agentName: 'prototype',
    model: 'sonnet',
    userMessage,
    schemaName: 'prototype_spec',
    maxTokens: 8192,
    temperature: 0.5,
  })) as PrototypeSpec;

  await writeJson(path.join(bd, 'prototype_spec.json'), parsed);
  await writeText(path.join(bd, 'prototype_spec.md'), renderPrototypeSpec(parsed));

  await branchCommit(
    args.runId,
    args.branchId,
    `stage-4 [branch-${args.branchId}]: prototype spec with ${parsed.task_flow.length} task-flow steps`,
  );
}

function renderPrototypeSpec(spec: PrototypeSpec): string {
  const lines: string[] = [];
  lines.push(`# Prototype: ${spec.title}`);
  lines.push('');
  lines.push(`## Context`);
  lines.push('');
  lines.push(`- **Setting:** ${spec.context.setting}`);
  lines.push(`- **Device:** ${spec.context.device}`);
  lines.push(`- **Duration:** ${spec.context.duration_minutes} minutes`);
  lines.push('');
  lines.push(spec.context.session_structure);
  lines.push('');
  lines.push(`## Actors`);
  lines.push('');
  for (const a of spec.actors) {
    lines.push(`- **${a.role}** (${a.count}): ${a.description}`);
  }
  lines.push('');
  lines.push(`## Task flow`);
  lines.push('');
  for (const s of spec.task_flow) {
    lines.push(`### Step ${s.step}`);
    lines.push('');
    lines.push(`- **Participant:** ${s.participant_action}`);
    lines.push(`- **System:** ${s.system_response}`);
    if (s.wizard_decisions.length > 0) {
      lines.push(`- **Wizard decisions:**`);
      for (const d of s.wizard_decisions) lines.push(`  - ${d}`);
    }
    lines.push('');
  }
  lines.push(`## Wizard controls`);
  lines.push('');
  for (const c of spec.wizard_controls) {
    lines.push(`- **${c.control_name}** — triggers: ${c.triggers}. Effect: ${c.effect}`);
  }
  lines.push('');
  lines.push(`## Observable signals`);
  lines.push('');
  for (const s of spec.observable_signals) {
    lines.push(`- **${s.signal}** (${s.capture_method}) — ${s.analysis_plan}`);
  }
  lines.push('');
  lines.push(`## Failure cases`);
  lines.push('');
  for (const f of spec.failure_cases) {
    lines.push(`- **${f.scenario}** — expected: ${f.expected_behavior}. Wizard fallback: ${f.wizard_fallback}`);
  }
  lines.push('');
  lines.push(`## Materials needed`);
  lines.push('');
  for (const m of spec.materials_needed) lines.push(`- ${m}`);
  lines.push('');
  return lines.join('\n');
}
