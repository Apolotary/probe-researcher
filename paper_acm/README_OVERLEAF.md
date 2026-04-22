# Probe — ACM sigconf paper source (for Overleaf)

Double-column ACM `sigconf` LaTeX version of the Probe paper. Content is
identical to the single-column arXiv version at `../paper/`; the difference
is format only.

## How to upload to Overleaf

1. Go to [Overleaf](https://www.overleaf.com).
2. *New Project* → *Upload Project*.
3. Drop the zip (or tar.gz) file that accompanies this directory.
4. Overleaf extracts and opens the project.
5. Ensure the main document is set to `probe.tex` (Menu → Settings → Main document).
6. Set the compiler to **pdfLaTeX** (default in Overleaf). **LaTeX+dvips is not supported** because acmart uses modern packages.
7. Click *Recompile*. The first compile runs BibTeX automatically and may take a few moments.

## What's inside

```
paper_acm/
├── probe.tex              — main document, \documentclass[sigconf, nonacm]{acmart}
├── references.bib         — 33 verified bibliography entries
├── sections/
│   ├── abstract.tex       — sits before \maketitle (ACM convention)
│   ├── introduction.tex
│   ├── related_work.tex
│   ├── system.tex         — contains the two figure* and the routing table*
│   ├── demo_case_study.tex
│   ├── evaluation.tex
│   ├── discussion.tex
│   ├── limitations.tex
│   └── conclusion.tex
└── figures/
    ├── pipeline.svg       — 8-stage pipeline DAG with branch flow
    └── audit_finding.svg  — concrete capture-risk finding card
```

## Notes on the format

- **Non-ACM mode.** `\documentclass[sigconf, nonacm]{acmart}` suppresses the
  copyright block and the ACM Reference Format footer. This version is
  intended for arXiv / hackathon submission, not as a venue-ready ACM paper.
- **Bibliography style.** `ACM-Reference-Format` (bundled with acmart).
  Uses `\citestyle{acmauthoryear}` for author-year cites in text.
- **SVG figures.** Included via `\usepackage{svg}`, which converts on-the-fly
  using Inkscape at build time. Overleaf ships with Inkscape and the `svg`
  package; no extra configuration should be needed.
- **Figure placement.** Both figures are `figure*` (full-width, spanning
  both columns), and the routing table is `table*` for the same reason —
  the narrow sigconf columns would otherwise overflow.

## If SVG conversion fails on Overleaf

If the `svg` package fails (unusual, but if Inkscape has been disabled):

1. Open each `figures/*.svg` on a local machine.
2. Export each as PDF (e.g. using Inkscape: *File → Export → PDF*).
3. Save the PDFs alongside the SVGs as `pipeline.pdf` and `audit_finding.pdf`.
4. In `sections/system.tex`, replace `\includesvg[width=\linewidth]{figures/pipeline}` with `\includegraphics[width=\linewidth]{figures/pipeline.pdf}` and the same for `audit_finding`.
5. At the top of `probe.tex`, remove `\usepackage{svg}` and add `\usepackage{graphicx}` (acmart usually loads graphicx already).

## If compilation fails with `Package acmart Error`

The acmart class is bundled with Overleaf by default, so this should not
happen. If it does: *Menu → Settings → TeX Live version* → select the
latest.

## License for reuse

Paper text authored by Bektur Ryskeldiev; source files are licensed for
fair-use review in the context of the Cerebral Valley Opus 4.7 hackathon.
For reuse outside that context, contact the author.
