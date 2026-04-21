#!/usr/bin/env tsx
/**
 * Build the arXiv paper to PDF without a LaTeX engine.
 *
 * Flow: pandoc converts paper/probe.tex → HTML with citeproc (from
 * paper/references.bib) → PDF via wkhtmltopdf. Style is injected via a
 * header-include file matching the report renderer's print-first CSS
 * (Newsreader serif, Inter sans headings, JetBrains Mono for code).
 *
 * Drop-in replacement for `pdflatex probe.tex` when no LaTeX is
 * available. The output is styled for reading, not for formal
 * submission — use pdflatex on a machine with LaTeX for the
 * camera-ready version.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { projectRoot } from '../src/util/paths.js';
import { palette, brand } from '../src/ui/theme.js';

const pExecFile = promisify(execFile);

const PAPER_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');

body {
  font-family: 'Newsreader', 'Times New Roman', serif;
  font-size: 11pt;
  line-height: 1.5;
  max-width: 6.8in;
  margin: 0.75in auto;
  color: #1a1a1a;
  background: #ffffff;
  padding: 0 0.4in;
}

/* Title, author, date block at top. */
header h1, .title { /* pandoc renders title in <h1 class="title"> */
  font-family: 'Inter', sans-serif;
  font-size: 19pt;
  font-weight: 600;
  text-align: center;
  margin: 0.5em 0 0.3em;
  line-height: 1.2;
  letter-spacing: -0.015em;
}
.author, .date {
  font-family: 'Inter', sans-serif;
  text-align: center;
  color: #555;
  font-size: 10pt;
  margin: 0.2em 0;
}

h1, h2, h3, h4 {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: #0d0d0d;
  line-height: 1.25;
}
h1 { font-size: 16pt; margin: 1.6em 0 0.5em; border-bottom: 0.5pt solid #999; padding-bottom: 0.15em; }
h2 { font-size: 13pt; margin: 1.4em 0 0.4em; }
h3 { font-size: 11.5pt; margin: 1.2em 0 0.3em; }
h4 { font-size: 11pt; margin: 1em 0 0.25em; font-weight: 600; }

/* Abstract. Pandoc wraps the tex abstract in <div class="abstract">. */
.abstract {
  background: #f9f7f2;
  padding: 0.9em 1.1em;
  margin: 1.2em 0;
  border-left: 2.5pt solid #1B365D;
  font-size: 10.5pt;
  line-height: 1.5;
  orphans: 3;
  widows: 3;
}
.abstract::before {
  content: 'Abstract';
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 10pt;
  display: block;
  margin-bottom: 0.4em;
  color: #1B365D;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

p { margin: 0.5em 0; orphans: 3; widows: 3; text-align: justify; hyphens: auto; }

code, tt {
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
  background: #f0ece4;
  padding: 0px 3px;
  border-radius: 2px;
  font-size: 0.88em;
  color: #2d2014;
}
pre {
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
  background: #1a1a1a;
  color: #f5f4ed;
  padding: 0.8em 1em;
  border-radius: 3px;
  overflow-x: auto;
  font-size: 0.82em;
  line-height: 1.45;
  page-break-inside: avoid;
}

blockquote {
  border-left: 2pt solid #1B365D;
  margin: 0.7em 0;
  padding: 0.2em 0.9em;
  color: #333;
  font-style: italic;
  font-size: 10.5pt;
}

table { border-collapse: collapse; width: 100%; margin: 0.8em 0; page-break-inside: avoid; font-size: 10pt; }
th, td { border: 0.4pt solid #999; padding: 5px 9px; text-align: left; vertical-align: top; }
th { background: #f0ece4; font-family: 'Inter', sans-serif; font-weight: 600; color: #1a1a1a; font-size: 9.5pt; }
caption { caption-side: bottom; font-size: 9.5pt; color: #555; padding: 0.3em 0; }

ul, ol { padding-left: 1.5em; }
li { margin: 0.15em 0; }

a { color: #1B365D; text-decoration: none; border-bottom: 0.4pt solid #ccc; }
a:hover { border-bottom: 0.8pt solid #1B365D; }

/* References. Pandoc+citeproc typically outputs a <div id="refs">. */
#refs, .references {
  font-size: 10pt;
  border-top: 0.5pt solid #999;
  margin-top: 2em;
  padding-top: 0.8em;
}
#refs h1, #refs h2, .references h1, .references h2 {
  font-size: 13pt;
}
#refs p, .references p, .csl-entry {
  margin: 0.5em 0;
  padding-left: 1.5em;
  text-indent: -1.5em;
  text-align: left;
  hyphens: manual;
}

/* Figures and listings. */
.figure, figure { margin: 1em 0; text-align: center; page-break-inside: avoid; }
figcaption { font-size: 9.5pt; color: #555; margin-top: 0.3em; font-style: italic; }
`.trim();

async function main(): Promise<void> {
  const root = projectRoot();
  const paperDir = path.join(root, 'paper');
  const texFile = path.join(paperDir, 'probe.tex');
  const bibFile = path.join(paperDir, 'references.bib');
  const outputPdf = path.join(paperDir, 'probe.pdf');
  const outputHtml = path.join(paperDir, 'probe.html');

  console.log(brand.header('📄 build paper'));
  console.log(chalk.hex(palette.dim)(`tex:  ${texFile}`));
  console.log(chalk.hex(palette.dim)(`bib:  ${bibFile}`));
  console.log(chalk.hex(palette.dim)(`out:  ${outputPdf}`));
  console.log('');

  // Write header CSS to a temp file.
  const tmpHeader = path.join(paperDir, '.tmp_paper_header.html');
  await fs.writeFile(tmpHeader, `<style>\n${PAPER_CSS}\n</style>\n`);

  // pandoc resolves \input{...} relative to the working directory; we
  // must run it from paper/ so "sections/abstract.tex" resolves.
  const execOpts = { cwd: paperDir } as const;
  const relTex = 'probe.tex';
  const relBib = 'references.bib';
  const relHeader = path.relative(paperDir, tmpHeader);

  const commonArgs = [
    relTex,
    '--from=latex',
    '--to=html5',
    '--standalone',
    '--citeproc',
    `--bibliography=${relBib}`,
    `--include-in-header=${relHeader}`,
    '--metadata',
    'title=Probe: Rehearsal-Stage Triage for Screen-Based Interactive Research',
    '--metadata',
    'author=Bektur Ryskeldiev',
  ];

  // HTML build (for inspection + backup).
  console.log(chalk.hex(palette.stage)('building HTML...'));
  await pExecFile('pandoc', [...commonArgs, '-o', 'probe.html'], execOpts);
  const htmlStat = await fs.stat(outputHtml);
  console.log(chalk.hex(palette.passed)(`✓ ${outputHtml} (${(htmlStat.size / 1024).toFixed(1)} KB)`));

  // PDF build.
  console.log(chalk.hex(palette.stage)('building PDF...'));
  await pExecFile(
    'pandoc',
    [
      ...commonArgs,
      '--pdf-engine=wkhtmltopdf',
      '--pdf-engine-opt=--enable-local-file-access',
      '--pdf-engine-opt=--page-size',
      '--pdf-engine-opt=Letter',
      '--pdf-engine-opt=--margin-top',
      '--pdf-engine-opt=18mm',
      '--pdf-engine-opt=--margin-bottom',
      '--pdf-engine-opt=18mm',
      '--pdf-engine-opt=--margin-left',
      '--pdf-engine-opt=18mm',
      '--pdf-engine-opt=--margin-right',
      '--pdf-engine-opt=18mm',
      '-o',
      'probe.pdf',
    ],
    execOpts,
  );
  const pdfStat = await fs.stat(outputPdf);
  console.log(chalk.hex(palette.passed)(`✓ ${outputPdf} (${(pdfStat.size / 1024).toFixed(1)} KB)`));

  await fs.unlink(tmpHeader).catch(() => {});

  console.log('');
  console.log(chalk.hex(palette.dim)(
    'Note: this is a reading-optimized PDF built via pandoc+wkhtmltopdf. ' +
    'For camera-ready submission, build with pdflatex on a machine with LaTeX installed.',
  ));
}

main().catch((err) => {
  console.error(chalk.hex(palette.blocked)(`build failed: ${err.message}`));
  process.exit(1);
});
