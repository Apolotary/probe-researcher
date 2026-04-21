import fs from 'node:fs/promises';
import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { schemaPath } from '../util/paths.js';

// ESM/CJS interop: Ajv ships CJS with default on `.default`; under Node ESM
// the default import may point at the namespace rather than the class.
type AjvCtor = new (opts: object) => {
  compile: (schema: unknown) => ValidateFunction;
};
type AddFormatsFn = (ajv: InstanceType<AjvCtor>) => void;

const AjvClass: AjvCtor =
  ((AjvModule as unknown as { default?: AjvCtor }).default ??
    (AjvModule as unknown as AjvCtor));
const addFormats: AddFormatsFn =
  ((addFormatsModule as unknown as { default?: AddFormatsFn }).default ??
    (addFormatsModule as unknown as AddFormatsFn));

const ajv = new AjvClass({ allErrors: true, strict: false });
addFormats(ajv);

const cache = new Map<string, ValidateFunction>();

async function getValidator(schemaName: string): Promise<ValidateFunction> {
  const cached = cache.get(schemaName);
  if (cached) return cached;
  const raw = await fs.readFile(schemaPath(schemaName), 'utf8');
  const schema = JSON.parse(raw);
  const fn = ajv.compile(schema);
  cache.set(schemaName, fn);
  return fn;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export async function validateAgainst(
  schemaName: string,
  data: unknown,
): Promise<ValidationResult> {
  const fn = await getValidator(schemaName);
  const valid = fn(data) as boolean;
  const errors = valid ? [] : (fn.errors ?? []).map(formatError);
  return { valid, errors };
}

function formatError(e: ErrorObject): string {
  const path = e.instancePath || '(root)';
  return `${path}: ${e.message ?? 'invalid'}`;
}

/**
 * Attempts to extract a JSON value from a model response. Models may wrap
 * output in ```json fences despite instructions, so we strip them tolerantly.
 */
export function parseJsonFromModel(text: string): unknown {
  const stripped = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  return JSON.parse(stripped);
}
