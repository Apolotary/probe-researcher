import { runSymposium } from '../managed_agents/symposium.js';

export async function symposiumCommand(runIds: string[]): Promise<void> {
  if (runIds.length < 2) {
    console.error('symposium requires at least 2 run ids');
    process.exitCode = 1;
    return;
  }
  await runSymposium({ runIds });
}
