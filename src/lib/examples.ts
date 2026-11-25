import { schemas, type Field, type Schema } from '../data/schemas';

export interface ExampleOptions {
  /** Include every field that has an example or children, not just the default ones. */
  complete?: boolean;
  /** Optional fields to include in this example (top level only), using their schema example. */
  include?: string[];
  /**
   * Values to use instead of the schema examples. `null` leaves a field out.
   * Keys can be dotted paths into nested objects and arrays, e.g. "payment.payment_methods.0.variant".
   */
  overrides?: Record<string, unknown>;
}

function getSchema(name: string): Schema {
  const schema = (schemas as Record<string, Schema>)[name];
  if (!schema) {
    throw new Error(`Unknown schema "${name}". Add it to src/data/schemas.ts.`);
  }
  return schema;
}

/** `complete` builds a child object with all its example fields (used when it was asked for explicitly). */
function valueFor(field: Field, complete: boolean): unknown {
  if (field.children) {
    const child = buildExample(field.children, { complete });
    return field.type.startsWith('array') ? [child] : child;
  }
  return field.example;
}

/**
 * A field appears in the default example if it's required (requests) or always sent (responses).
 * Optional fields only appear when marked `inDefaultExample`.
 */
function includedByDefault(schema: Schema, field: Field): boolean {
  if (field.children === undefined && field.example === undefined) {
    return false;
  }
  if (field.inDefaultExample) {
    return true;
  }
  return schema.kind === 'request' ? Boolean(field.required) : !field.optional;
}

/**
 * Checks that an override path names documented fields all the way down, e.g.
 * "payment.payment_methods.0.variant": each name must be a field of the schema it's in, and an array
 * field must be followed by an index. Optional fields the default example leaves out are allowed.
 */
function checkPath(schemaName: string, path: string) {
  const segments = path.split('.');
  let current = schemaName;
  let schema = getSchema(current);
  for (let i = 0; i < segments.length; i++) {
    const field = schema.fields.find((candidate) => candidate.name === segments[i]);
    if (!field) {
      throw new Error(
        `Example for "${schemaName}": "${path}" refers to "${segments[i]}", which "${current}" doesn't have.`
      );
    }
    if (i === segments.length - 1) {
      return;
    }
    if (!field.children) {
      throw new Error(`Example for "${schemaName}": "${path}" goes inside "${field.name}", which has no child parameters.`);
    }
    if (field.type.startsWith('array')) {
      i++;
      if (!/^\d+$/.test(segments[i])) {
        throw new Error(`Example for "${schemaName}": "${path}" needs an index after the array "${field.name}".`);
      }
      if (i === segments.length - 1) {
        return;
      }
    }
    current = field.children;
    schema = getSchema(current);
  }
}

/** Sets a dotted path ("payment.payment_methods.0.variant") on a built example. */
function setPath(target: Record<string, unknown>, path: string, value: unknown, schemaName: string) {
  const keys = path.split('.');
  let node: any = target;
  for (const key of keys.slice(0, -1)) {
    if (node?.[key] === undefined || node[key] === null) {
      throw new Error(`Example for "${schemaName}": "${path}" doesn't exist in the built example.`);
    }
    node = node[key];
  }
  const last = keys.at(-1)!;
  if (value === null) {
    delete node[last];
  } else {
    node[last] = value;
  }
}

/**
 * Builds an example object for a schema from the `example` values in src/data/schemas.ts, so
 * example request and webhook bodies always match the documented parameters.
 */
export function buildExample(
  name: string,
  { complete = false, include = [], overrides = {} }: ExampleOptions = {}
) {
  const schema = getSchema(name);
  const example: Record<string, unknown> = {};
  const topLevelOverrides = Object.keys(overrides).filter((key) => !key.includes('.'));

  for (const field of schema.fields) {
    if (topLevelOverrides.includes(field.name)) {
      if (overrides[field.name] !== null) {
        example[field.name] = overrides[field.name];
      }
    } else if (
      include.includes(field.name) ||
      (complete &&
        (field.children !== undefined || field.example !== undefined) &&
        // Conditional fields belong to one variant (e.g. `day` for monthly), so a complete example
        // only shows the variant marked inDefaultExample instead of mixing them.
        (!field.requiredIf || field.inDefaultExample))
    ) {
      example[field.name] = valueFor(field, true);
    } else if (includedByDefault(schema, field)) {
      example[field.name] = valueFor(field, false);
    }
  }

  const unknown = include.filter((key) => !schema.fields.some((field) => field.name === key));
  if (unknown.length > 0) {
    throw new Error(`Example for "${name}" refers to fields it doesn't have: ${unknown.join(', ')}`);
  }
  for (const path of Object.keys(overrides)) {
    checkPath(name, path);
  }

  for (const [path, value] of Object.entries(overrides)) {
    if (path.includes('.')) {
      setPath(example, path, value, name);
    }
  }

  return example;
}

/** Encodes a flat example as an application/x-www-form-urlencoded body. */
export function toFormBody(example: Record<string, unknown>): string {
  return new URLSearchParams(
    Object.entries(example).map(([key, value]) => [key, String(value)])
  ).toString();
}
