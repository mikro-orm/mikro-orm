import { splitCommaSeparatedIdentifiers, type EntityMetadata, type EntityPartitionBy } from '@mikro-orm/core';
import type { TablePartition, TablePartitioning } from '../typings.js';

export { splitCommaSeparatedIdentifiers };

const skipQuotedLiteral = (value: string, start: number): number => {
  let i = start + 1;

  while (i < value.length) {
    if (value[i] === "'") {
      if (value[i + 1] === "'") {
        i += 2;
        continue;
      }

      return i;
    }

    i++;
  }

  // Unterminated literal — point past the end so callers' `slice(start, end + 1)` includes
  // the full remaining tail instead of dropping its last character.
  return value.length;
};

/**
 * Apply `transform` only to segments of `value` that lie outside single-quoted
 * SQL literals, leaving literal content (including escaped `''`) untouched.
 */
const mapOutsideLiterals = (value: string, transform: (segment: string) => string): string => {
  let ret = '';
  let buffer = '';
  let i = 0;

  while (i < value.length) {
    if (value[i] === "'") {
      ret += transform(buffer);
      buffer = '';
      const end = skipQuotedLiteral(value, i);
      ret += value.slice(i, end + 1);
      i = end + 1;
      continue;
    }

    buffer += value[i];
    i++;
  }

  return ret + transform(buffer);
};

const collapseWhitespace = (value: string): string => value.replace(/\s+/g, ' ');

const normalizeWhitespace = (value: string): string => mapOutsideLiterals(value, collapseWhitespace).trim();

const stripDoubleQuotes = (value: string): string => mapOutsideLiterals(value, s => s.replaceAll('"', ''));

const normalizeQuotedIdentifiers = (value: string): string => stripDoubleQuotes(normalizeWhitespace(value));

const findMatchingParenthesis = (value: string, start: number): number => {
  let depth = 0;

  for (let i = start; i < value.length; i++) {
    if (value[i] === "'") {
      i = skipQuotedLiteral(value, i);
      continue;
    }

    if (value[i] === '(') {
      depth++;
      continue;
    }

    if (value[i] === ')') {
      depth--;

      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
};

const normalizePartitionLiterals = (value: string): string =>
  value
    // PG pg_get_expr output often tacks `::text` onto string literals inside expressions; drop it
    // so the catalog shape matches user-provided bounds. This applies symmetrically to both
    // user metadata and catalog reads, so diffing converges. If a user intentionally writes a
    // `::text` cast in a bound literal it will be stripped on both sides as well.
    .replace(/('(?:[^']|'')*')::text\b/gi, '$1')
    // Strip the `00:00:00` time component so catalog round-trips (timestamp[tz] bounds formatted
    // via the session TimeZone) match user metadata that omitted the time part. Only collapse
    // when we can confidently attribute the literal to a timestamp column: either a numeric
    // offset is present (timestamptz catalog output) or an explicit `::timestamp[tz]` cast
    // follows the literal. Bare `'YYYY-MM-DD 00:00:00'` without offset/cast could just as easily
    // be a text/varchar list-partition value, and collapsing it would produce false-negative
    // diffs.
    .replace(/'(\d{4}-\d{2}-\d{2}) 00:00:00[+-]\d{2}(?::\d{2})?'/g, "'$1'")
    .replace(
      /'(\d{4}-\d{2}-\d{2}) 00:00:00'(?=\s*::\s*timestamp(?:tz)?(?:\s+(?:with|without)\s+time\s+zone)?\b)/gi,
      "'$1'",
    );

const unwrapOuterParentheses = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) {
    return trimmed;
  }

  if (findMatchingParenthesis(trimmed, 0) !== trimmed.length - 1) {
    return trimmed;
  }

  return trimmed.slice(1, -1).trim();
};

const unwrapAllOuterParentheses = (value: string): string => {
  let current = value.trim();

  while (current.startsWith('(')) {
    const unwrapped = unwrapOuterParentheses(current);

    if (unwrapped === current) {
      break;
    }

    current = unwrapped;
  }

  return current;
};

const normalizePartitionSqlFragment = (value: string): string => {
  const normalized = stripDoubleQuotes(normalizeWhitespace(normalizePartitionLiterals(value)));
  let ret = '';

  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i] === "'") {
      const end = skipQuotedLiteral(normalized, i);
      ret += normalized.slice(i, end + 1);
      i = end;
      continue;
    }

    if (normalized[i] === '(') {
      const end = findMatchingParenthesis(normalized, i);

      if (end === -1) {
        ret += normalized.slice(i);
        break;
      }

      const inner = unwrapAllOuterParentheses(normalizePartitionSqlFragment(normalized.slice(i + 1, end)));
      ret += `(${inner})`;
      i = end;
      continue;
    }

    ret += normalized[i];
  }

  return normalizeWhitespace(unwrapAllOuterParentheses(ret));
};

const unquoteIdentifier = (value: string): string => {
  const trimmed = value.trim();

  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replaceAll('""', '"');
  }

  return trimmed;
};

/**
 * Split a user-supplied partition name into `{ schema, name }`. Supports bare (`child`),
 * schema-qualified (`schema.child`), and quoted (`"my.schema"."child"`) forms. Dots inside
 * double-quoted identifiers are part of the identifier and do not split.
 */
const splitPartitionName = (name: string): { name: string; schema?: string } => {
  let depth = 0;

  for (let i = 0; i < name.length; i++) {
    const ch = name[i];

    if (ch === '"') {
      if (name[i + 1] === '"') {
        i++;
        continue;
      }

      depth = depth === 0 ? 1 : 0;
      continue;
    }

    if (ch === '.' && depth === 0) {
      return {
        schema: unquoteIdentifier(name.slice(0, i)),
        name: unquoteIdentifier(name.slice(i + 1)),
      };
    }
  }

  return { name: unquoteIdentifier(name) };
};

const resolvePartitionKey = (meta: EntityMetadata, key: string, quoteIdentifier: (id: string) => string): string => {
  const trimmed = key.trim().replaceAll('"', '');

  if (!trimmed) {
    throw new Error(`Entity ${meta.className} has invalid partitionBy option: empty partition key`);
  }

  const prop =
    meta.root.properties[trimmed as keyof typeof meta.root.properties] ??
    Object.values(meta.root.properties).find(
      candidate => candidate.fieldNames?.length === 1 && candidate.fieldNames[0] === trimmed,
    );

  if (!prop) {
    throw new Error(`Entity ${meta.className} has invalid partitionBy option: unknown partition key '${key.trim()}'`);
  }

  if (prop.fieldNames?.length !== 1) {
    throw new Error(
      `Entity ${meta.className} has invalid partitionBy option: partition key '${key.trim()}' maps to multiple columns ('${prop.fieldNames?.join("', '")}'); list them explicitly as partition keys`,
    );
  }

  return quoteIdentifier(prop.fieldNames[0]);
};

/**
 * Resolve the partition expression to a SQL fragment. Column-reference forms (array of keys
 * or a clean comma-list of identifiers) are rewritten to the backing `fieldNames` and passed
 * through `quoteIdentifier`. The callback form and the raw-SQL fallback (anything that isn't
 * a clean identifier list, e.g. `date_trunc('day', created_at)`) are emitted verbatim — the
 * user owns identifier quoting inside a raw expression.
 */
const resolvePartitionExpression = (
  meta: EntityMetadata,
  expression: NonNullable<EntityPartitionBy['expression']>,
  quoteIdentifier: (id: string) => string,
): string => {
  if (typeof expression === 'function') {
    return normalizeWhitespace(expression(meta.createSchemaColumnMappingObject()));
  }

  if (Array.isArray(expression)) {
    return (expression as readonly string[]).map(key => resolvePartitionKey(meta, key, quoteIdentifier)).join(', ');
  }

  const trimmed = (expression as string).trim();
  const keys = splitCommaSeparatedIdentifiers(trimmed);

  if (keys) {
    return keys.map(key => resolvePartitionKey(meta, key, quoteIdentifier)).join(', ');
  }

  return trimmed;
};

const createPartitionDefinition = (type: EntityPartitionBy['type'], expression: string): string =>
  `${type.toLowerCase()} (${normalizeWhitespace(expression)})`;

/** @internal */
export function normalizePartitionDefinition(value: string): string {
  const normalized = normalizeWhitespace(value);
  const match = /^(\w+)\s*(.*)$/.exec(normalized);
  const rawType = match ? match[1] : normalized;
  const type = rawType.toLowerCase();
  const expression = match ? match[2].trim() : '';

  if (!expression) {
    return type;
  }

  if (!expression.startsWith('(')) {
    return `${type} ${normalizePartitionSqlFragment(expression)}`;
  }

  return `${type} (${normalizePartitionSqlFragment(unwrapAllOuterParentheses(expression))})`;
}

const PARTITION_BOUND_KEYWORDS = /\b(for values|with|in|from|to|minvalue|maxvalue|null)\b/gi;

/** @internal */
export function normalizePartitionBound(value: string): string {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return '';
  }

  if (/^default$/i.test(normalized)) {
    return 'default';
  }

  // Prepend `for values` if the caller passed a bare `with/in/from … to …` clause, then lowercase
  // PG bound keywords outside quoted literals (so `FROM (MINVALUE) TO ('hello TO world')` becomes
  // `from (minvalue) to ('hello TO world')` with the inner TO inside the literal preserved).
  // PG's `pg_get_expr` emits `MINVALUE`/`MAXVALUE`/`NULL` in uppercase, so case-folding them here
  // prevents a perpetual diff against user-supplied lowercase bounds.
  const prefixed = /^for values\b/i.test(normalized) ? normalized : `for values ${normalized}`;
  const lowered = mapOutsideLiterals(prefixed, segment =>
    segment.replace(PARTITION_BOUND_KEYWORDS, match => match.toLowerCase()),
  );

  return normalizePartitionSqlFragment(lowered);
}

const createPartitionBound = (value: string): string => normalizePartitionBound(value);

const createHashPartitions = (
  tableName: string,
  tableSchema: string | undefined,
  partitions: number | readonly string[],
): TablePartition[] => {
  const count = typeof partitions === 'number' ? partitions : partitions.length;

  return Array.from({ length: count }, (_, remainder) => {
    const bound = normalizePartitionBound(`with (modulus ${count}, remainder ${remainder})`);

    if (typeof partitions === 'number') {
      return { name: `${tableName}_${remainder}`, schema: tableSchema, bound };
    }

    const { name, schema } = splitPartitionName(partitions[remainder]);
    return { name, schema: schema ?? tableSchema, bound };
  });
};

const createExplicitPartitions = (
  tableName: string,
  tableSchema: string | undefined,
  partitions: Exclude<EntityPartitionBy, { type: 'hash' }>['partitions'],
): TablePartition[] =>
  partitions.map((partition, index) => {
    const resolvedName = partition.name ?? `${tableName}_${index}`;
    const { name, schema } = splitPartitionName(resolvedName);

    return {
      name,
      schema: schema ?? tableSchema,
      bound: createPartitionBound(partition.values),
    };
  });

/** @internal */
export const getTablePartitioning = (
  meta: EntityMetadata,
  tableSchema: string | undefined,
  quoteIdentifier: (id: string) => string = id => id,
): TablePartitioning | undefined => {
  if (!meta.partitionBy) {
    return undefined;
  }

  const definition = createPartitionDefinition(
    meta.partitionBy.type,
    resolvePartitionExpression(meta, meta.partitionBy.expression, quoteIdentifier),
  );
  const partitions =
    meta.partitionBy.type === 'hash'
      ? createHashPartitions(meta.tableName, tableSchema, meta.partitionBy.partitions)
      : createExplicitPartitions(meta.tableName, tableSchema, meta.partitionBy.partitions);

  return { definition, partitions };
};

/** @internal */
export const diffPartitioning = (
  from: TablePartitioning | undefined,
  to: TablePartitioning | undefined,
  defaultSchema: string | undefined,
): boolean => {
  if (!from && !to) {
    return false;
  }

  if (!from || !to) {
    return true;
  }

  if (
    normalizeQuotedIdentifiers(normalizePartitionDefinition(from.definition)) !==
    normalizeQuotedIdentifiers(normalizePartitionDefinition(to.definition))
  ) {
    return true;
  }

  if (from.partitions.length !== to.partitions.length) {
    return true;
  }

  const normalizeSchema = (schema?: string) => (schema && schema !== defaultSchema ? schema : '');
  const serializePartition = (partition: TablePartition) =>
    `${normalizeSchema(partition.schema)}.${partition.name}:${normalizeQuotedIdentifiers(normalizePartitionBound(partition.bound))}`;

  const fromPartitions = from.partitions.map(serializePartition).sort();
  const toPartitions = to.partitions.map(serializePartition).sort();

  return fromPartitions.some((partition, index) => partition !== toPartitions[index]);
};

const SUPPORTED_PARTITION_TYPES = ['hash', 'list', 'range'] as const;

const isSupportedPartitionType = (value: string): value is EntityPartitionBy['type'] =>
  (SUPPORTED_PARTITION_TYPES as readonly string[]).includes(value);

/** @internal */
export const toEntityPartitionBy = (
  partitioning: TablePartitioning | undefined,
  parentTableName?: string,
  parentSchema?: string,
): EntityPartitionBy | undefined => {
  if (!partitioning) {
    return undefined;
  }

  const normalizedDefinition = normalizePartitionDefinition(partitioning.definition);
  const normalizedPartitions = partitioning.partitions.map(partition => ({
    ...partition,
    bound: normalizePartitionBound(partition.bound),
  }));
  // Split the leading type keyword off of the definition without using `split(' ')`, which would
  // shatter quoted literals containing spaces. Match a bareword prefix followed by whitespace.
  const [, rawType = normalizedDefinition, rawExpression = ''] =
    /^(\S+)(?:\s+([\s\S]*))?$/.exec(normalizeWhitespace(normalizedDefinition)) ?? [];
  const type = rawType.toLowerCase();

  if (!isSupportedPartitionType(type)) {
    throw new Error(`Unsupported partition type '${rawType}' in definition '${partitioning.definition}'`);
  }

  const expression = unwrapOuterParentheses(rawExpression);
  const qualify = (partition: TablePartition) =>
    partition.schema && partition.schema !== parentSchema ? `${partition.schema}.${partition.name}` : partition.name;

  if (type === 'hash') {
    // Collapse to a bare count when catalog names follow the default
    // `${parentTableName}_${remainder}` pattern and live in the parent's schema, or when we have
    // no parent context to compare against (backwards-compatible behavior for callers that pass
    // just the `TablePartitioning`). Otherwise preserve the explicit name array so the next DDL
    // generation reproduces the same children.
    const usesDefaultShape =
      parentTableName == null ||
      normalizedPartitions.every(
        (p, i) => p.name === `${parentTableName}_${i}` && (!p.schema || p.schema === parentSchema),
      );

    return {
      type,
      expression,
      partitions: usesDefaultShape ? normalizedPartitions.length : normalizedPartitions.map(qualify),
    };
  }

  return {
    type,
    expression,
    partitions: normalizedPartitions.map(partition => ({
      name: qualify(partition),
      values: partition.bound === 'default' ? 'default' : partition.bound.replace(/^for values\s+/i, ''),
    })),
  };
};
