/**
 * Forbidden-phrase linter. Probe's own voice (not attributed to a source)
 * must never use evidence language. Running this against PROBE_GUIDEBOOK.md
 * guarantees that simulation is not presented as findings.
 *
 * Allowed contexts (phrases permitted inside these):
 *   - `>` blockquotes — representing third-party content
 *   - `"..."` double-quoted regions — direct quotation
 *   - `[SOURCE_CARD:id]`-tagged lines — the paragraph attributes a finding
 *     to a specific source card, so evidence verbs ("demonstrated that",
 *     "users preferred") are reporting what the source claims, not what
 *     Probe claims
 */

export const FORBIDDEN_PHRASES: ReadonlyArray<RegExp> = [
  /\busers? preferred\b/i,
  /\busers? said\b/i,
  /\bparticipants? found\b/i,
  /\bparticipants? reported\b/i,
  /\bthe study shows\b/i,
  /\bfindings show\b/i,
  // "significant" in the statistical sense. We specifically allow the
  // bare word when it means "substantial" or "important" in ordinary
  // English (e.g., "significant overlap", "significant concern"), and
  // only fire on usages that clearly imply statistical significance.
  /\bstatistically\s+significant(ly)?\b/i,
  /\bsignificantly\s+(different|higher|lower|more|less|greater|better|worse|fewer|slower|faster|correlated|associated|predicted|varied|increased|decreased|reduced|improved)\b/i,
  /\bsignificant\s+(effect|difference|result|finding|correlation|association|p[-\s]?value|impact on)\b/i,
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
    // Skip blockquote lines (representing third-party content).
    if (/^\s*>/.test(line)) return;

    // Skip fenced code-block markers.
    if (/^```/.test(line)) return;

    // Skip lines that attribute a finding to a source card. Such a line
    // carries the provenance claim that the surrounding assertion comes
    // from the card, not from Probe's own voice. Forbidden phrases are
    // legitimate here because they describe what the source reports.
    if (/\[SOURCE_CARD:[a-z0-9_-]+\]/.test(line)) return;

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
