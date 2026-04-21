import { renderReport } from '../render/report.js';

interface RenderOptions {
  format?: 'pdf' | 'html' | 'md' | 'auto';
  output?: string;
}

export async function renderCommand(runId: string, opts: RenderOptions): Promise<void> {
  const format = opts.format ?? 'auto';
  await renderReport({ runId, format, outputPath: opts.output });
}
