/**
 * Forbidden-phrase linter. Probe's own voice (not inside quoted blocks) must
 * never use evidence language. Running this against PROBE_GUIDEBOOK.md
 * guarantees that simulation is not presented as findings.
 *
 * Quoted context (inside `>` blockquotes or surrounded by "...") is allowed
 * to contain these phrases because it represents something being reported,
 * not claimed by Probe.
 */

export const FORBIDDEN_PHRASES: ReadonlyArray<RegExp> = [
  /\busers? preferred\b/i,
  /\busers? said\b/i,
  /\bparticipants? found\b/i,
  /\bparticipants? reported\b/i,
  /\bthe study shows\b/i,
  /\bfindings show\b/i,
  /\b(statistically\s+)?significant(ly)?\b/i,
  /\bvalidated?\b/i,
  /\bproved\b/i,
  /\bdemonstrated that\b/i,
  /\bevidence suggests\b/i,
  /\bdata indicates?\b/i,
];

export interface LintResult {
  passed: boolean;
  violations: string[];
}

export function checkForbiddenPhrases(markdown: string): LintResult {
  const violations: string[] = [];
  const lines = markdown.split(/\r?\n/);

  lines.forEach((line, idx) => {
    // Skip blockquote lines (representing third-party content)
    if (/^\s*>/.test(line)) return;

    // Strip code blocks and inline code
    if (/^```/.test(line)) return;

    // Strip double-quoted regions from the line so quoted speech isn't flagged.
    const stripped = line.replace(/"[^"]*"/g, '""').replace(/"[^"]*"/g, '""');

    for (const re of FORBIDDEN_PHRASES) {
      const m = stripped.match(re);
      if (m) {
        violations.push(`line ${idx + 1}: "${m[0]}" in: ${line.trim().slice(0, 120)}`);
      }
    }
  });

  return { passed: violations.length === 0, violations };
}
