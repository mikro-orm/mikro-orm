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
    .replace(/'(\d{4}-\d{2}-\d{2}) 00:00:00(?:[+-]\d{2}(?::\d{2})?)?'/g, "'$1'");

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
    return key.trim();
  }

  const prop =
    meta.properties[trimmed as keyof typeof meta.properties] ??
    Object.values(meta.properties).find(
      candidate => candidate.fieldNames?.length === 1 && candidate.fieldNames[0] === trimmed,
    );
  const fieldName = prop?.fieldNames?.length === 1 ? prop.fieldNames[0] : trimmed;

  return quoteIdentifier(fieldName);
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
  const [rawType, ...rest] = normalized.split(' ');
  const type = rawType.toLowerCase();
  const expression = rest.join(' ').trim();

  if (!expression) {
    return type;
  }

  if (!expression.startsWith('(')) {
    return `${type} ${normalizePartitionSqlFragment(expression)}`;
  }

  return `${type} (${normalizePartitionSqlFragment(unwrapAllOuterParentheses(expression))})`;
}

/** @internal */
export function normalizePartitionBound(value: string): string {
  const normalized = normalizeWhitespace(normalizePartitionLiterals(value));

  if (/^default$/i.test(normalized)) {
    return 'default';
  }

  let ret = /^for values\b/i.test(normalized)
    ? normalized.replace(/^for values\b/i, 'for values')
    : `for values ${normalized}`;

  if (/^for values\s+with\b/i.test(ret)) {
    ret = ret.replace(/^for values\s+with\b/i, 'for values with');
  } else if (/^for values\s+in\b/i.test(ret)) {
    ret = ret.replace(/^for values\s+in\b/i, 'for values in');
  } else if (/^for values\s+from\b/i.test(ret)) {
    ret = ret.replace(/^for values\s+from\b/i, 'for values from');
    ret = ret.replace(/\s+to\b/i, ' to');
  }

  return normalizePartitionSqlFragment(ret);
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
  const [rawType, ...rest] = normalizeWhitespace(normalizedDefinition).split(' ');
  const type = rawType.toLowerCase() as EntityPartitionBy['type'];
  const expression = unwrapOuterParentheses(rest.join(' '));

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
