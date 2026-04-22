import { describe, it, expect } from 'vitest';
import { extractDeepAuditCapture } from '../src/managed_agents/deep_audit.js';

/**
 * The Managed Agent writes deep_audit.md inside its container, which the
 * local CLI cannot directly read — so we ask the agent to repeat the file
 * content inside PROBE_DEEP_AUDIT_CAPTURE markers in the chat stream. These
 * tests pin the extractor against the conversation shapes we expect.
 */
describe('extractDeepAuditCapture', () => {
  it('extracts the content between matching markers', () => {
    const trace = `Running tool calls...
I've written the file. Here it is:
<<PROBE_DEEP_AUDIT_CAPTURE>>
# Deep audit — branch b

## Verified findings

- The AI-disclosure string is 96 chars at 16 words. [TOOL_VERIFIED]

<<END_PROBE_DEEP_AUDIT_CAPTURE>>
Done.`;
    const captured = extractDeepAuditCapture(trace);
    expect(captured).not.toBeNull();
    expect(captured).toContain('# Deep audit — branch b');
    expect(captured).toContain('[TOOL_VERIFIED]');
    expect(captured).not.toContain('Running tool calls');
    expect(captured).not.toContain('Done.');
  });

  it('returns the last block when markers appear twice (prompt rehearsal then real output)', () => {
    const trace = `The protocol says: wrap in <<PROBE_DEEP_AUDIT_CAPTURE>> then content then <<END_PROBE_DEEP_AUDIT_CAPTURE>>.

Now I'll actually write:

<<PROBE_DEEP_AUDIT_CAPTURE>>
Real audit content here.
<<END_PROBE_DEEP_AUDIT_CAPTURE>>`;
    const captured = extractDeepAuditCapture(trace);
    expect(captured).toBe('Real audit content here.');
  });

  it('returns null when the start marker is missing', () => {
    const trace = 'Session rambled and never emitted the markers.';
    expect(extractDeepAuditCapture(trace)).toBeNull();
  });

  it('returns null when the end marker is missing', () => {
    const trace = `<<PROBE_DEEP_AUDIT_CAPTURE>>
Agent started the marker but the session terminated before closing it.`;
    expect(extractDeepAuditCapture(trace)).toBeNull();
  });

  it('strips exactly one leading/trailing newline but preserves internal whitespace', () => {
    const trace = `<<PROBE_DEEP_AUDIT_CAPTURE>>
line1

line3
<<END_PROBE_DEEP_AUDIT_CAPTURE>>`;
    const captured = extractDeepAuditCapture(trace);
    expect(captured).toBe('line1\n\nline3');
  });
});
