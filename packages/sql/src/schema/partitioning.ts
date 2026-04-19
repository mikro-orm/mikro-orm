import type { EntityMetadata, EntityPartitionBy } from '@mikro-orm/core';
import type { TablePartition, TablePartitioning } from '../typings.js';

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

  return value.length - 1;
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
    .replace(/('(?:[^']|'')*')::text\b/gi, '$1')
    // Strip the `00:00:00±HH[:MM]` time-with-offset suffix so catalog round-trips (timestamptz
    // bounds formatted via the session TimeZone) match user metadata that omitted the time part.
    // The numeric offset is required here so we don't collapse midnight-looking text values (e.g.
    // `'2026-01-01 00:00:00'` stored in a text/varchar list partition), which would otherwise
    // produce false-negative diffs.
    .replace(/'(\d{4}-\d{2}-\d{2}) 00:00:00[+-]\d{2}(?::\d{2})?'/g, "'$1'");

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

const splitPartitionName = (name: string): { name: string; schema?: string } => {
  const firstDot = name.indexOf('.');

  if (firstDot === -1) {
    return { name };
  }

  return {
    schema: name.slice(0, firstDot),
    name: name.slice(firstDot + 1),
  };
};

const COMMA_SEPARATED_IDENTIFIERS = /^[\w".]+(?:\s*,\s*[\w".]+)*$/;

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

  if (prop?.fieldNames?.length !== 1) {
    throw new Error(`Entity ${meta.className} has invalid partitionBy option: unknown partition key '${key.trim()}'`);
  }

  return quoteIdentifier(prop.fieldNames[0]);
};

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

  if (COMMA_SEPARATED_IDENTIFIERS.test(trimmed)) {
    return trimmed
      .split(',')
      .map(key => resolvePartitionKey(meta, key, quoteIdentifier))
      .join(', ');
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

const PARTITION_BOUND_KEYWORDS = /\b(for values|with|in|from|to)\b/gi;

/** @internal */
export function normalizePartitionBound(value: string): string {
  const normalized = normalizeWhitespace(normalizePartitionLiterals(value));

  if (!normalized) {
    return '';
  }

  if (/^default$/i.test(normalized)) {
    return 'default';
  }

  // Prepend `for values` if the caller passed a bare `with/in/from … to …` clause, then lowercase
  // PG bound keywords outside quoted literals (so `FROM ('x') TO ('hello TO world')` becomes
  // `from ('x') to ('hello TO world')` with the inner TO inside the literal preserved).
  const prefixed = /^for values\b/i.test(normalized) ? normalized : `for values ${normalized}`;
  const lowered = mapOutsideLiterals(prefixed, segment =>
    segment.replace(PARTITION_BOUND_KEYWORDS, match => match.toLowerCase()),
  );

  return normalizePartitionSqlFragment(lowered);
}

const createPartitionBound = (value: string): string => normalizePartitionBound(value);

const createHashPartitions = (tableName: string, tableSchema: string | undefined, count: number): TablePartition[] =>
  Array.from({ length: count }, (_, remainder) => ({
    name: `${tableName}_${remainder}`,
    schema: tableSchema,
    bound: normalizePartitionBound(`with (modulus ${count}, remainder ${remainder})`),
  }));

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
export const toEntityPartitionBy = (partitioning: TablePartitioning | undefined): EntityPartitionBy | undefined => {
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

  if (type === 'hash') {
    return {
      type,
      expression,
      partitions: normalizedPartitions.length,
    };
  }

  return {
    type,
    expression,
    partitions: normalizedPartitions.map(partition => ({
      name: partition.schema ? `${partition.schema}.${partition.name}` : partition.name,
      values: partition.bound === 'default' ? 'default' : partition.bound.replace(/^for values\s+/i, ''),
    })),
  };
};
