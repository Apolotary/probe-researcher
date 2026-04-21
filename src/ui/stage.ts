/**
 * Stage vocabulary — the agentic verb for each stage. Used by the spinner
 * and the pipeline log. Borrowed from Hermes-agent's rotating-verb pattern.
 */

import { emojis } from './theme.js';

export interface StageDescriptor {
  id: string;
  label: string;
  verb: string;         // present continuous — feeds the spinner
  emoji: string;
}

export const stages: Record<string, StageDescriptor> = {
  '1_premise':         { id: '1_premise',         label: 'premise interrogation',  verb: 'interrogating the premise',  emoji: emojis.premise },
  '2_ideator':         { id: '2_ideator',         label: 'solution ideation',      verb: 'ideating divergent branches', emoji: emojis.ideate },
  '3_literature':      { id: '3_literature',      label: 'literature grounding',   verb: 'grounding in the corpus',    emoji: emojis.literature },
  '4_prototype':       { id: '4_prototype',       label: 'prototype specification',verb: 'specifying the prototype',    emoji: emojis.prototype },
  '5_simulator':       { id: '5_simulator',       label: 'simulated walkthrough',  verb: 'rehearsing the walkthrough', emoji: emojis.simulate },
  '6_audit':           { id: '6_audit',           label: 'capture-risk audit',     verb: 'auditing capture risk',       emoji: emojis.audit },
  '7a_methodologist':  { id: '7a_methodologist',  label: 'methodologist review',   verb: 'attacking the method',        emoji: emojis.review },
  '7b_accessibility':  { id: '7b_accessibility',  label: 'accessibility review',   verb: 'checking paternalism',        emoji: emojis.review },
  '7c_novelty':        { id: '7c_novelty',        label: 'novelty review',         verb: 'hunting prior art',           emoji: emojis.review },
  '7d_meta':           { id: '7d_meta',           label: 'meta-review',            verb: 'preserving disagreement',     emoji: emojis.review },
  '8_guidebook':       { id: '8_guidebook',       label: 'guidebook assembly',     verb: 'synthesizing the guidebook',  emoji: emojis.guidebook },
};

export function describe(stageId: string): StageDescriptor {
  return stages[stageId] ?? { id: stageId, label: stageId, verb: stageId, emoji: '•' };
}
