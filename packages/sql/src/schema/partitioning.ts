import type { EntityMetadata, EntityPartitionBy } from '@mikro-orm/core';
import type { TablePartition, TablePartitioning } from '../typings.js';

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const normalizeQuotedIdentifiers = (value: string): string => normalizeWhitespace(value).replaceAll('"', '');

export const normalizePartitionDefinition = (value: string): string =>
  normalizeWhitespace(value).replace(/^(hash|list|range)\b/i, match => match.toLowerCase());

export const normalizePartitionBound = (value: string): string => {
  const normalized = normalizeWhitespace(value);

  if (/^default$/i.test(normalized)) {
    return 'default';
  }

  let ret = /^for values\b/i.test(normalized)
    ? normalized.replace(/^for values\b/i, 'for values')
    : `for values ${normalized}`;

  if (/^for values\s+with\b/i.test(ret)) {
    return ret.replace(/^for values\s+with\b/i, 'for values with');
  }

  if (/^for values\s+in\b/i.test(ret)) {
    return ret.replace(/^for values\s+in\b/i, 'for values in');
  }

  if (/^for values\s+from\b/i.test(ret)) {
    ret = ret.replace(/^for values\s+from\b/i, 'for values from');
    ret = ret.replace(/\s+to\b/i, ' to');
  }

  return ret;
};

const unwrapOuterParentheses = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) {
    return trimmed;
  }

  let depth = 0;

  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === '(') {
      depth++;
    } else if (trimmed[i] === ')') {
      depth--;

      if (depth === 0 && i < trimmed.length - 1) {
        return trimmed;
      }
    }
  }

  return trimmed.slice(1, -1).trim();
};

const splitPartitionName = (name: string): { name: string; schema?: string } => {
  const parts = name.split('.');

  if (parts.length < 2) {
    return { name };
  }

  return {
    schema: parts[0],
    name: parts.slice(1).join('.'),
  };
};

const resolvePartitionKey = (meta: EntityMetadata, key: string): string => {
  const prop = meta.properties[key as keyof typeof meta.properties];

  if (prop?.fieldNames?.length === 1) {
    return prop.fieldNames[0];
  }

  return key.trim();
};

const resolvePartitionExpression = (
  meta: EntityMetadata,
  expression: NonNullable<EntityPartitionBy['expression']>,
): string => {
  if (typeof expression === 'function') {
    return normalizeWhitespace(expression(meta.createSchemaColumnMappingObject()));
  }

  if (typeof expression === 'string') {
    return resolvePartitionKey(meta, expression);
  }

  return expression.map(key => resolvePartitionKey(meta, key)).join(', ');
};

const createPartitionBound = (value: string): string => {
  return normalizePartitionBound(value);
};

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

export const getTablePartitioning = (
  meta: EntityMetadata,
  tableSchema: string | undefined,
): TablePartitioning | undefined => {
  if (!meta.partitionBy) {
    return undefined;
  }

  const definition = normalizePartitionDefinition(
    `${meta.partitionBy.type} (${resolvePartitionExpression(meta, meta.partitionBy.expression)})`,
  );
  const partitions =
    meta.partitionBy.type === 'hash'
      ? createHashPartitions(meta.tableName, tableSchema, meta.partitionBy.partitions)
      : createExplicitPartitions(meta.tableName, tableSchema, meta.partitionBy.partitions);

  return { definition, partitions };
};

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
