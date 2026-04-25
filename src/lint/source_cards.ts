/**
 * Shared loader for the corpus of known `[SOURCE_CARD:<id>]` references.
 *
 * The provenance linter validates SOURCE_CARD ids against this list to
 * prevent fabricated citations from passing review. Every CLI path that
 * runs the linter against repo-grounded markdown (lint, doctor, stats,
 * stage8 guidebook assembly) loads the same list via this helper so the
 * rule cannot silently weaken because one entry point forgot to pass it.
 */

import fs from 'node:fs/promises';
import { sourceCardDir } from '../util/paths.js';

/**
 * Returns the set of source-card IDs present in `corpus/source_cards/`.
 * One ID per `<id>.yaml` file. The list is sorted for determinism in
 * downstream UI like the guidebook prompt's "Valid source_card IDs" line.
 */
export async function loadKnownSourceCardIds(): Promise<string[]> {
  const entries = await fs.readdir(sourceCardDir());
  return entries
    .filter((e) => e.endsWith('.yaml'))
    .map((e) => e.replace(/\.yaml$/, ''))
    .sort();
}
