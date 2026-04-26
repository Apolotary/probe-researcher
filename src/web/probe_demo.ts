/**
 * Demo save/replay support for the Probe UI.
 *
 * Why: a real walkthrough takes 10–20s per LLM call (sonnet 4.6
 * latency × 9 stages = 1.5–3 min minimum), too long for a 3-minute
 * demo video. This module lets the user run a workflow once with the
 * real API, save the resulting state to disk, then replay it
 * deterministically. Stage transitions are paced so each stage is
 * visible and inspectable rather than a flash; cached payloads
 * themselves return effectively instantly under the hood.
 *
 * Storage: JSON files under ~/.config/probe/demos/<slug>.json.
 * Each file holds the full ProbeWorkflowState plus metadata.
 *
 * In-memory: the server keeps a single currentDemo pointer. While
 * set, every /api/probe/<stage> endpoint short-circuits to the
 * saved slice and waits ~replayDelayMs before responding.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { projectRoot } from '../util/paths.js';

interface SavedDemo {
  name: string;
  savedAt: string;        // ISO
  premise: string;
  state: unknown;         // full ProbeWorkflowState — typed loose so
                          // the demo module doesn't tightly couple to
                          // ui_state.ts's evolving shape
}

interface DemoCursor {
  name: string;
  state: SavedDemo['state'];
  delayMs: number;
}

// Two locations are searched. User-saved demos live in ~/.config so
// they survive across versions of the binary. Bundled demos ship with
// the repo so a fresh clone has at least one demo ready to replay
// (judge-friendly: no API key required).
const HOME_DIR    = path.join(os.homedir(), '.config', 'probe', 'demos');
const BUNDLED_DIR = path.join(projectRoot(), 'assets', 'demos');

let active: DemoCursor | null = null;

export function ensureDir(): void {
  fs.mkdirSync(HOME_DIR, { recursive: true });
}

export function slugify(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'untitled';
}

export function saveDemo(name: string, state: { premise?: string }): SavedDemo {
  ensureDir();
  const slug = slugify(name);
  const payload: SavedDemo = {
    name: slug,
    savedAt: new Date().toISOString(),
    premise: state.premise ?? '',
    state,
  };
  const target = path.join(HOME_DIR, `${slug}.json`);
  fs.writeFileSync(target, JSON.stringify(payload, null, 2));
  return payload;
}

function readDemoFile(dir: string, file: string): { name: string; savedAt: string; premise: string } | null {
  try {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const parsed = JSON.parse(raw) as SavedDemo;
    return {
      name: parsed.name ?? file.replace(/\.json$/, ''),
      savedAt: parsed.savedAt ?? '',
      premise: parsed.premise ?? '',
    };
  } catch {
    return null;
  }
}

export function listDemos(): Array<{ name: string; savedAt: string; premise: string; bundled?: boolean }> {
  ensureDir();
  // Build a name → entry map so user-saved demos shadow bundled ones
  // with the same name (the user's edits win).
  const byName = new Map<string, { name: string; savedAt: string; premise: string; bundled?: boolean }>();
  // Bundled first (lowest priority).
  try {
    if (fs.existsSync(BUNDLED_DIR)) {
      for (const f of fs.readdirSync(BUNDLED_DIR).filter((f) => f.endsWith('.json'))) {
        const e = readDemoFile(BUNDLED_DIR, f);
        if (e) byName.set(e.name, { ...e, bundled: true });
      }
    }
  } catch { /* ignore */ }
  // User home overrides.
  try {
    for (const f of fs.readdirSync(HOME_DIR).filter((f) => f.endsWith('.json'))) {
      const e = readDemoFile(HOME_DIR, f);
      if (e) byName.set(e.name, e);
    }
  } catch { /* ignore */ }
  return [...byName.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function loadDemo(name: string): SavedDemo | null {
  ensureDir();
  const slug = slugify(name);
  // Try user home first; fall back to bundled.
  for (const dir of [HOME_DIR, BUNDLED_DIR]) {
    const target = path.join(dir, `${slug}.json`);
    try {
      return JSON.parse(fs.readFileSync(target, 'utf8')) as SavedDemo;
    } catch { /* try next */ }
  }
  return null;
}

export function startReplay(name: string, delayMs = 1500): SavedDemo | null {
  const demo = loadDemo(name);
  if (!demo) return null;
  active = { name: demo.name, state: demo.state, delayMs };
  return demo;
}

export function stopReplay(): void {
  active = null;
}

export function isReplaying(): boolean {
  return active !== null;
}

export function status(): { active: boolean; name?: string; delayMs?: number } {
  if (!active) return { active: false };
  return { active: true, name: active.name, delayMs: active.delayMs };
}

/** Helper used by api endpoints: sleep a beat for visual realism. */
export async function delay(): Promise<void> {
  const cur = active;
  if (!cur) return;
  await new Promise((resolve) => setTimeout(resolve, cur.delayMs));
}

/**
 * Pull a stage's payload out of the cached state. Returns null when
 * there is no active demo or the slice is missing — callers should
 * fall through to live LLM in that case.
 *
 * Slice shapes mirror the existing /api/probe/* endpoint responses
 * so the frontend doesn't need to change.
 */
export function slice(stage: string, args: Record<string, unknown> = {}): unknown | null {
  if (!active) return null;
  const s = active.state as {
    rqs?: Array<{ letter?: string }>;
    literature?: Array<{ letter?: string }>;
    candidates?: unknown;
    plan?: unknown;
    artifacts?: unknown;
    personas?: unknown;
    findings?: unknown;
    paperTitle?: string;
    discussion?: string;
    conclusion?: string;
    reviewSession?: unknown;
    disagreementAudit?: unknown;
    rqBoolean?: Record<string, unknown>;
  };
  switch (stage) {
    case 'brainstorm':
      return s.rqs ? { rqs: s.rqs } : null;
    case 'literature': {
      const rq = (args.rq ?? {}) as { letter?: string };
      const letter = rq.letter;
      const block = s.literature?.find((b) => b.letter === letter);
      return block ? { block } : null;
    }
    case 'methodology':
      return s.candidates ? { candidates: s.candidates } : null;
    case 'plan':
      return s.plan ? { plan: s.plan } : null;
    case 'artifacts':
      return s.artifacts ? { artifacts: s.artifacts } : null;
    case 'personas':
      return s.personas ? { personas: s.personas } : null;
    case 'findings':
      return s.findings ? { findings: s.findings } : null;
    case 'report':
      return (s.paperTitle || s.discussion || s.conclusion) ? {
        titleOptions: s.paperTitle ? [s.paperTitle] : [],
        discussion: s.discussion ?? '',
        conclusion: s.conclusion ?? '',
      } : null;
    case 'review':
      return s.reviewSession ?? null;
    // v2 cached payloads — judges replaying without an API key see the
    // disagreement audit and the boolean RQ composition without falling
    // through to an empty placeholder.
    case 'disagreement-audit':
      return s.disagreementAudit ?? null;
    case 'rq-boolean': {
      // The cached map is keyed by "<lettera>+<letterb>-<op>". For any
      // (a, b, op) the frontend asks for, look up that key first; if
      // missing, fall through to live (or empty payload via served()).
      const op = (args.op ?? '') as string;
      const a = (args.a ?? {}) as { letter?: string };
      const b = (args.b ?? {}) as { letter?: string };
      if (!s.rqBoolean) return null;
      const key = `${a.letter ?? '?'}+${b.letter ?? '?'}-${op}`;
      return s.rqBoolean[key] ?? null;
    }
    default:
      return null;
  }
}
