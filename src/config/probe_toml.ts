/**
 * Probe TOML config — read/write ~/.config/probe/probe.toml.
 *
 * Schema mirrors the handoff doc: [keys] [models] [budget] [appearance]
 * [behavior]. Both the TUI and the HTML/web companion talk to the same
 * file so the two surfaces stay byte-identical.
 *
 * Key resolution order is enforced here (not at the call site):
 *   1. Process env var (ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY)
 *   2. Stored value from [keys]
 *   3. Empty → "unset"
 *
 * The UI surfaces resolve via `resolveKey()` and render the source label
 * verbatim. We never silently fall through.
 *
 * No third-party TOML library — Probe stays close to its dependencies. We
 * support a strict subset (sections, key=value, strings, booleans,
 * numbers). Hand-edits that go outside this subset will be lost on next
 * save; the UI flags external-edit conflicts via mtime.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type Provider = 'anthropic' | 'openai' | 'google';
export const PROVIDERS: readonly Provider[] = ['anthropic', 'openai', 'google'] as const;

export const ENV_VAR: Record<Provider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai:    'OPENAI_API_KEY',
  google:    'GOOGLE_API_KEY',
};

export type ModelMode = 'sonnet' | 'opus' | 'mixed' | 'custom';

/**
 * Stage IDs the probe ui workflow drives. Each maps to one LLM call
 * (probe_calls.ts). When [models].mode is 'sonnet' / 'opus' / 'mixed',
 * the per-stage values below are ignored and a preset is applied.
 *
 * Mixed = opus for orchestration (brainstorm, methodology, review),
 * sonnet for execution (everything else). Per WWDC-cookbook style.
 */
export type UiStage =
  | 'brainstorm' | 'literature' | 'methodology' | 'plan'
  | 'artifacts'  | 'personas'   | 'findings'    | 'report' | 'review';

export interface ProbeConfig {
  keys: Record<Provider, string>;
  models: {
    /** Quick preset. Overrides the per-stage values below. */
    mode: ModelMode;
    /** Per-stage model IDs. Used when mode = 'custom'. */
    brainstorm:  string;
    literature:  string;
    methodology: string;
    plan:        string;
    artifacts:   string;
    personas:    string;
    findings:    string;
    report:      string;
    review:      string;
    // Legacy alias (kept so older probe.toml files don't break parse).
    evaluation:  string;
  };
  budget: {
    max_per_run:  number;
    warn_at:      number;
    confirm_over: number;
    monthly_cap:  number;
  };
  appearance: {
    font_family: string;
    font_size:   number;
    theme:       'amber-dark' | 'mono-dark' | 'green-crt' | 'paper';
    density:     'compact' | 'comfy' | 'spacious';
    cursor:      'block' | 'bar' | 'underline';
  };
  behavior: {
    editor:         string;
    workdir:        string;
    auto_replay:    boolean;
    confirm_spend:  boolean;
    stream_logs:    boolean;
    send_telemetry: boolean;
  };
}

/** Anthropic model IDs current as of April 2026. */
export const SONNET = 'claude-sonnet-4-6';
export const OPUS   = 'claude-opus-4-7';
export const HAIKU  = 'claude-haiku-4-5-20251001';

/** Stages where deep reasoning matters most (used by 'mixed' preset). */
const ORCHESTRATION_STAGES: ReadonlySet<UiStage> = new Set([
  'brainstorm', 'methodology', 'review',
]);

export const DEFAULT_CONFIG: ProbeConfig = {
  keys: { anthropic: '', openai: '', google: '' },
  models: {
    // Demo default: all sonnet 4.6 (fast + cheap). Switch to 'opus'
    // for best-quality, 'mixed' for opus on orchestration stages.
    mode:        'sonnet',
    brainstorm:  SONNET,
    literature:  SONNET,
    methodology: SONNET,
    plan:        SONNET,
    artifacts:   SONNET,
    personas:    SONNET,
    findings:    SONNET,
    report:      SONNET,
    review:      SONNET,
    evaluation:  SONNET, // legacy alias
  },
  budget: {
    max_per_run:  25.0,
    warn_at:      15.0,
    confirm_over: 5.0,
    monthly_cap:  200.0,
  },
  appearance: {
    font_family: 'JetBrains Mono',
    font_size:   14,
    theme:       'amber-dark',
    density:     'comfy',
    cursor:      'block',
  },
  behavior: {
    editor:         '$EDITOR',
    workdir:        '~/probe',
    auto_replay:    false,
    confirm_spend:  true,
    stream_logs:    true,
    send_telemetry: false,
  },
};

export function configPath(): string {
  return path.join(os.homedir(), '.config', 'probe', 'probe.toml');
}

export function configExists(): boolean {
  try {
    fs.accessSync(configPath(), fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/** Parse a tiny TOML subset. Sections, key=value, strings, ints, floats, bools. */
export function parseToml(text: string): Partial<ProbeConfig> {
  const out: Record<string, Record<string, unknown>> = {};
  let section = '';
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const sectionMatch = /^\[([a-z][a-z0-9_]*)\]$/i.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1];
      out[section] ||= {};
      continue;
    }
    const kvMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/.exec(line);
    if (!kvMatch || !section) continue;
    const [, k, rawV] = kvMatch;
    out[section][k] = parseValue(rawV.trim());
  }
  return out as Partial<ProbeConfig>;
}

function parseValue(raw: string): unknown {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  // Strip wrapping quotes.
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1);
  }
  const n = Number(raw);
  if (!Number.isNaN(n) && raw !== '') return n;
  return raw;
}

/** Read config from disk (or return defaults if missing/malformed). */
export function readConfig(): ProbeConfig {
  if (!configExists()) return cloneDefault();
  try {
    const text = fs.readFileSync(configPath(), 'utf8');
    const parsed = parseToml(text);
    return mergeWithDefault(parsed);
  } catch {
    return cloneDefault();
  }
}

function cloneDefault(): ProbeConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as ProbeConfig;
}

function mergeWithDefault(parsed: Partial<ProbeConfig>): ProbeConfig {
  // We mutate a generic record copy, then cast the result back. Each
  // section is an independent struct; the cast is safe because we don't
  // accept keys outside the schema.
  const out = cloneDefault() as unknown as Record<string, Record<string, unknown>>;
  const incoming = parsed as unknown as Record<string, Record<string, unknown>>;
  for (const section of Object.keys(incoming)) {
    if (!incoming[section] || typeof incoming[section] !== 'object') continue;
    if (!out[section]) continue; // ignore unknown sections
    out[section] = { ...out[section], ...incoming[section] };
  }
  return out as unknown as ProbeConfig;
}

/** Serialize config to TOML. */
export function serializeToml(cfg: ProbeConfig): string {
  const lines: string[] = [
    '# probe.toml — managed by `probe config`. Hand-edit at your own risk.',
    '',
    '[keys]',
    `anthropic = ${JSON.stringify(cfg.keys.anthropic)}`,
    `openai    = ${JSON.stringify(cfg.keys.openai)}`,
    `google    = ${JSON.stringify(cfg.keys.google)}`,
    '',
    '[models]',
    ...Object.entries(cfg.models).map(([k, v]) => `${pad(k, 11)} = ${JSON.stringify(v)}`),
    '',
    '[budget]',
    ...Object.entries(cfg.budget).map(([k, v]) => `${pad(k, 12)} = ${v}`),
    '',
    '[appearance]',
    ...Object.entries(cfg.appearance).map(([k, v]) => `${pad(k, 11)} = ${typeof v === 'string' ? JSON.stringify(v) : v}`),
    '',
    '[behavior]',
    ...Object.entries(cfg.behavior).map(([k, v]) => `${pad(k, 14)} = ${typeof v === 'string' ? JSON.stringify(v) : v}`),
    '',
  ];
  return lines.join('\n');
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

/** Atomic write with 0600 perms. */
export function writeConfig(cfg: ProbeConfig): void {
  const target = configPath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp.${process.pid}`;
  fs.writeFileSync(tmp, serializeToml(cfg), { mode: 0o600 });
  fs.renameSync(tmp, target);
  // Re-chmod in case rename preserved a wider mode from an existing file.
  try { fs.chmodSync(target, 0o600); } catch { /* best effort */ }
}

export type KeySource = 'env' | 'config' | 'unset';

export interface ResolvedKey {
  provider: Provider;
  source: KeySource;
  /** Full key value if available; '' if unset. Don't render this directly. */
  value: string;
  /** Masked preview suitable for the UI (e.g. `sk-ant-…7Q4f`). */
  preview: string;
  /** Human-readable source label, e.g. `env · $ANTHROPIC_API_KEY`. */
  sourceLabel: string;
}

export function resolveKey(provider: Provider, cfg: ProbeConfig = readConfig()): ResolvedKey {
  const envName = ENV_VAR[provider];
  const envVal = process.env[envName] ?? '';
  if (envVal) {
    return {
      provider,
      source: 'env',
      value: envVal,
      preview: maskKey(envVal),
      sourceLabel: `env · $${envName}`,
    };
  }
  const stored = cfg.keys[provider] ?? '';
  if (stored) {
    return {
      provider,
      source: 'config',
      value: stored,
      preview: maskKey(stored),
      sourceLabel: 'stored in config',
    };
  }
  return {
    provider,
    source: 'unset',
    value: '',
    preview: '—',
    sourceLabel: `env · $${envName}`,
  };
}

export function maskKey(k: string): string {
  if (!k) return '—';
  // Pull a sensible prefix to keep the source family identifiable
  // (sk-ant- / sk- / etc.) and append the last 4 chars.
  const prefix = k.startsWith('sk-ant-') ? 'sk-ant-' : k.startsWith('sk-') ? 'sk-' : '';
  const tail = k.slice(-4);
  return `${prefix}…${tail}`;
}

/** Compute an at-a-glance "n / m keys ok" for the status line. */
export function keyHealth(cfg: ProbeConfig = readConfig()): { ok: number; total: number } {
  let ok = 0;
  for (const p of PROVIDERS) {
    if (resolveKey(p, cfg).source !== 'unset') ok++;
  }
  return { ok, total: PROVIDERS.length };
}

/**
 * Resolve which model the UI should call for a given workflow stage.
 * Preset modes ('sonnet' / 'opus' / 'mixed') override per-stage values
 * so the user can flip the whole pipeline with a single config edit.
 */
export function modelForStage(stage: UiStage, cfg: ProbeConfig = readConfig()): string {
  const m = cfg.models;
  if (m.mode === 'sonnet') return SONNET;
  if (m.mode === 'opus')   return OPUS;
  if (m.mode === 'mixed')  return ORCHESTRATION_STAGES.has(stage) ? OPUS : SONNET;
  // mode = 'custom' → fall back to per-stage assignments
  switch (stage) {
    case 'brainstorm':  return m.brainstorm  || SONNET;
    case 'literature':  return m.literature  || SONNET;
    case 'methodology': return m.methodology || SONNET;
    case 'plan':        return m.plan        || SONNET;
    case 'artifacts':   return m.artifacts   || SONNET;
    case 'personas':    return m.personas    || SONNET;
    case 'findings':    return m.findings    || SONNET;
    case 'report':      return m.report      || SONNET;
    case 'review':      return m.review      || SONNET;
  }
}
