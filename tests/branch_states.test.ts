import { describe, it, expect } from 'vitest';
import { populateBranchStates, type BranchState } from '../src/orchestrator/per_branch.js';

/**
 * Focused unit test for the helper introduced for Fix 5 (Preserve branch
 * state when quitting `run --step` after Stage 2).
 *
 * Full integration coverage of the step-quit path is hard without mocking
 * `pauseBetweenStages` and the entire stage chain; the original bug,
 * however, comes from a state-map initialization timing issue, which is
 * what this helper now controls. Pinning the helper's invariants here
 * prevents the regression even if integration coverage stays absent.
 */
describe('populateBranchStates', () => {
  it('adds an in_progress entry for every branch id when states is empty', () => {
    const states = new Map<string, BranchState>();
    populateBranchStates(states, ['a', 'b', 'c']);
    expect(Array.from(states.keys()).sort()).toEqual(['a', 'b', 'c']);
    for (const id of ['a', 'b', 'c']) {
      expect(states.get(id)?.status).toBe('in_progress');
      expect(states.get(id)?.branchId).toBe(id);
    }
  });

  it('preserves existing branch states untouched (does not overwrite blocked/failed)', () => {
    // Critical invariant: if Stage 6 has already moved a branch to `blocked`,
    // a later defensive call to populateBranchStates must not silently reset
    // it to `in_progress`. The user-quit path calls this both after Stage 2
    // and on the skip path before Stage 3, so idempotence matters.
    const states = new Map<string, BranchState>([
      ['a', { branchId: 'a', status: 'blocked', stage: '6_audit', reason: 'capture-risk' }],
      ['b', { branchId: 'b', status: 'failed', stage: '5_simulator', reason: 'api error' }],
    ]);
    populateBranchStates(states, ['a', 'b', 'c']);
    expect(states.get('a')?.status).toBe('blocked');
    expect(states.get('a')?.reason).toBe('capture-risk');
    expect(states.get('b')?.status).toBe('failed');
    expect(states.get('b')?.reason).toBe('api error');
    expect(states.get('c')?.status).toBe('in_progress');
  });

  it('is safe to call repeatedly with the same ids (idempotent)', () => {
    const states = new Map<string, BranchState>();
    populateBranchStates(states, ['a', 'b']);
    const aRef = states.get('a');
    populateBranchStates(states, ['a', 'b']);
    // Second call should not replace the existing entry; reference identity
    // would change if it did. This guarantees no surprising state churn.
    expect(states.get('a')).toBe(aRef);
    expect(states.size).toBe(2);
  });

  it('returns the same map it was passed (caller keeps the reference)', () => {
    const states = new Map<string, BranchState>();
    const result = populateBranchStates(states, ['a']);
    expect(result).toBe(states);
  });

  it('writes the run_summary shape that userQuit consumes after Stage 2', () => {
    // This mirrors what the pipeline's userQuit path does: serialize the
    // values of `states` into run_summary.json. After populateBranchStates
    // runs at the Stage 2 pause, that serialization must list a, b, c.
    const states = new Map<string, BranchState>();
    populateBranchStates(states, ['a', 'b', 'c']);
    const serialized = Array.from(states.values());
    expect(serialized).toHaveLength(3);
    expect(serialized.every((s) => s.status === 'in_progress')).toBe(true);
    expect(serialized.map((s) => s.branchId).sort()).toEqual(['a', 'b', 'c']);
  });
});
