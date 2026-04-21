import fs from 'node:fs/promises';
import { runSimulatedInterview } from '../managed_agents/simulated_interview.js';

interface InterviewOptions {
  persona?: string;
  personaFile?: string;
  singleTurn?: boolean;
}

export async function interviewCommand(runId: string, opts: InterviewOptions): Promise<void> {
  let persona: string | undefined = opts.persona;
  if (opts.personaFile) {
    persona = await fs.readFile(opts.personaFile, 'utf8');
  }
  await runSimulatedInterview({ runId, persona, singleTurn: opts.singleTurn ?? false });
}
