import { renderReportPage } from '../render/report_page.js';

interface ReportPageOptions {
  output?: string;
}

export async function reportPageCommand(
  runId: string,
  opts: ReportPageOptions,
): Promise<void> {
  await renderReportPage({ runId, outputPath: opts.output });
}
