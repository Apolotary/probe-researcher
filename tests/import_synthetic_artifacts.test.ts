import { describe, it, expect } from 'vitest';
import {
  buildImportedPremiseCard,
  buildImportedBranchCard,
  buildImportedPrototypeSpec,
} from '../src/cli/import_paper.js';
import { validateAgainst } from '../src/schema/validate.js';

/**
 * The previous implementation of `probe import` wrote synthetic Stage 1/2/4
 * artifacts that did not validate against `schemas/*.schema.json`. The CLI
 * told users to continue with `probe run --skip 1,2,3,4,5 …`, which then
 * choked on shape mismatches downstream. These tests pin the contract:
 * every synthetic artifact validates against its canonical schema before
 * import returns success.
 */
describe('probe import synthetic stage artifacts', () => {
  // A minimal, schema-valid imported manifest that the builders consume.
  // We only populate fields the builders read; the manifest itself is exercised
  // by classifier tests, not by the per-artifact schema tests below.
  const makeManifest = (overrides: Record<string, unknown> = {}): Parameters<typeof buildImportedPremiseCard>[1] => ({
    stage: '0_import',
    schema_version: '1.0.0',
    run_id: 'import_2026_04_25_test',
    source_file: '/tmp/imported_paper.md',
    source_format: 'markdown',
    source_word_count: 1234,
    sections: [
      {
        id: 'sec_premise',
        bucket: 'premise',
        heading: 'Premise',
        content: 'This paper investigates AI-disclosure timing in screen-reader news consumption.',
        start_line: 1,
        end_line: 5,
      },
      {
        id: 'sec_method',
        bucket: 'method',
        heading: 'Method',
        content: 'Wizard-of-Oz study with 12 BLV participants navigating prototype news pages with three disclosure conditions.',
        start_line: 10,
        end_line: 30,
      },
      {
        id: 'sec_proto',
        bucket: 'prototype',
        heading: 'Prototype',
        content: 'ARIA-live banner injected via WoZ; researcher controls timing relative to screen-reader heading announcements.',
        start_line: 35,
        end_line: 60,
      },
      {
        id: 'sec_lim',
        bucket: 'limitations',
        heading: 'Limitations',
        content: 'Sample limited to English-speaking BLV participants in one geographic region; ngrok tunnel could drop mid-trial.',
        start_line: 100,
        end_line: 110,
      },
    ],
    inferred_premise_text:
      'Does the timing of an AI-authorship disclosure (early vs late vs human-framed) shift BLV screen-reader users\' credibility ratings of news articles they navigate via heading mode?',
    inferred_method_summary:
      'Within-subjects Latin-square WoZ study; three disclosure conditions; 60-minute sessions; signals include heading navigation traces, think-aloud, and a 7-item credibility scale.',
    contains_real_user_data: false,
    provenance: {
      classifier_model: 'claude-sonnet-4-6',
      classifier_run_at: '2026-04-25T12:00:00.000Z',
    },
    ...overrides,
  });

  describe('buildImportedPremiseCard', () => {
    it('emits a premise card that validates against premise_card.schema.json', async () => {
      const manifest = makeManifest();
      const card = buildImportedPremiseCard('import_2026_04_25_test', manifest);
      const result = await validateAgainst('premise_card', card);
      if (!result.valid) {
        // Surface the AJV errors directly — debugging schema mismatches is
        // the whole reason this test exists.
        throw new Error(`schema validation failed:\n${result.errors.join('\n')}`);
      }
      expect(result.valid).toBe(true);
    });

    it('uses the schema-required provenance shape', () => {
      const manifest = makeManifest();
      const card = buildImportedPremiseCard('import_2026_04_25_test', manifest) as Record<string, unknown>;
      expect(card.provenance).toEqual({
        raw_premise: 'RESEARCHER_INPUT',
        analysis: 'AGENT_INFERENCE',
      });
    });

    it('does not emit legacy fields that violate additionalProperties:false', () => {
      const manifest = makeManifest();
      const card = buildImportedPremiseCard('import_2026_04_25_test', manifest) as Record<string, unknown>;
      // The previous synthetic builder set `original_premise` and
      // `sharpened_alternatives`; both are rejected by the schema's
      // additionalProperties:false rule.
      expect(card).not.toHaveProperty('original_premise');
      expect(card).not.toHaveProperty('sharpened_alternatives');
    });
  });

  describe('buildImportedBranchCard', () => {
    it('emits a branch card that validates against branch_card.schema.json', async () => {
      const manifest = makeManifest();
      const card = buildImportedBranchCard('import_2026_04_25_test', manifest);
      const result = await validateAgainst('branch_card', card);
      if (!result.valid) {
        throw new Error(`schema validation failed:\n${result.errors.join('\n')}`);
      }
      expect(result.valid).toBe(true);
    });

    it('uses an enum value for human_system_relationship, not free text', async () => {
      // Regression: the previous builder put a sentence into this field; the
      // schema requires one of six enum values.
      const manifest = makeManifest();
      const card = buildImportedBranchCard('import_2026_04_25_test', manifest) as Record<string, unknown>;
      expect([
        'system_augments_human',
        'system_replaces_human',
        'human_scaffolds_system',
        'adversarial_check',
        'peer_collaboration',
        'infrastructural_support',
      ]).toContain(card.human_system_relationship);
    });

    it('uses an enum value for method_family, not free text', async () => {
      const manifest = makeManifest();
      const card = buildImportedBranchCard('import_2026_04_25_test', manifest) as Record<string, unknown>;
      expect(['formative', 'generative', 'evaluative', 'longitudinal']).toContain(card.method_family);
    });
  });

  describe('buildImportedPrototypeSpec', () => {
    it('emits a prototype spec that validates against prototype_spec.schema.json', async () => {
      const manifest = makeManifest();
      const spec = buildImportedPrototypeSpec('import_2026_04_25_test', manifest);
      const result = await validateAgainst('prototype_spec', spec);
      if (!result.valid) {
        throw new Error(`schema validation failed:\n${result.errors.join('\n')}`);
      }
      expect(result.valid).toBe(true);
    });

    it('still validates when the manifest has no prototype/method/limitations buckets', async () => {
      // Worst case: paper has only a premise. The builder must still produce
      // a schema-valid spec (with placeholder values pointing at the source).
      const manifest = makeManifest({
        sections: [
          {
            id: 'sec_premise',
            bucket: 'premise',
            heading: 'Premise',
            content: 'Single section.',
            start_line: 1,
            end_line: 5,
          },
        ],
      });
      const spec = buildImportedPrototypeSpec('import_2026_04_25_test', manifest);
      const result = await validateAgainst('prototype_spec', spec);
      if (!result.valid) {
        throw new Error(`schema validation failed:\n${result.errors.join('\n')}`);
      }
      expect(result.valid).toBe(true);
    });

    it('uses enum values for observable_signals.capture_method', async () => {
      const manifest = makeManifest();
      const spec = buildImportedPrototypeSpec('import_2026_04_25_test', manifest) as {
        observable_signals: Array<{ capture_method: string }>;
      };
      const allowed = [
        'screen_recording',
        'think_aloud_audio',
        'self_report_likert',
        'self_report_open_ended',
        'task_completion_time',
        'error_count',
        'interviewer_notes',
        'eye_tracking',
        'log_events',
      ];
      for (const sig of spec.observable_signals) {
        expect(allowed).toContain(sig.capture_method);
      }
    });
  });
});
