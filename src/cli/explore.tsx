import React from 'react';
import { render } from 'ink';
import { Explore } from '../ui/explore.js';

export async function exploreCommand(runId: string): Promise<void> {
  const app = render(<Explore runId={runId} />);
  await app.waitUntilExit();
}
