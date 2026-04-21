import { renderReviewerPanel } from '../render/reviewer_panel.js';

interface PanelOptions {
  output?: string;
}

export async function panelCommand(
  runId: string,
  branchId: string,
  opts: PanelOptions,
): Promise<void> {
  await renderReviewerPanel({ runId, branchId, outputPath: opts.output });
}
