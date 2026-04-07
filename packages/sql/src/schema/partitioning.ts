import type { EntityMetadata, EntityPartitionBy } from '@mikro-orm/core';
import type { TablePartition, TablePartitioning } from '../typings.js';

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const normalizeQuotedIdentifiers = (value: string): string => normalizeWhitespace(value).replaceAll('"', '');

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
  const normalized = normalizeWhitespace(value);

  if (normalized.toUpperCase() === 'DEFAULT') {
    return 'DEFAULT';
  }

  if (/^for values\b/i.test(normalized)) {
    return normalized.replace(/^for values/i, 'FOR VALUES');
  }

  return `FOR VALUES ${normalized}`;
};

const createHashPartitions = (tableName: string, tableSchema: string | undefined, count: number): TablePartition[] =>
  Array.from({ length: count }, (_, remainder) => ({
    name: `${tableName}_${remainder}`,
    schema: tableSchema,
    bound: `FOR VALUES WITH (modulus ${count}, remainder ${remainder})`,
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

  const definition = `${meta.partitionBy.type.toUpperCase()} (${resolvePartitionExpression(meta, meta.partitionBy.expression)})`;
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

  if (normalizeQuotedIdentifiers(from.definition) !== normalizeQuotedIdentifiers(to.definition)) {
    return true;
  }

  if (from.partitions.length !== to.partitions.length) {
    return true;
  }

  const normalizeSchema = (schema?: string) => (schema && schema !== defaultSchema ? schema : '');
  const serializePartition = (partition: TablePartition) =>
    `${normalizeSchema(partition.schema)}.${partition.name}:${normalizeQuotedIdentifiers(partition.bound)}`;

  const fromPartitions = from.partitions.map(serializePartition).sort();
  const toPartitions = to.partitions.map(serializePartition).sort();

  return fromPartitions.some((partition, index) => partition !== toPartitions[index]);
};

export const toEntityPartitionBy = (partitioning: TablePartitioning | undefined): EntityPartitionBy | undefined => {
  if (!partitioning) {
    return undefined;
  }

  const [rawType, ...rest] = normalizeWhitespace(partitioning.definition).split(' ');
  const type = rawType.toLowerCase() as EntityPartitionBy['type'];
  const expression = unwrapOuterParentheses(rest.join(' '));

  if (type === 'hash') {
    return {
      type,
      expression,
      partitions: partitioning.partitions.length,
    };
  }

  return {
    type,
    expression,
    partitions: partitioning.partitions.map(partition => ({
      name: partition.schema ? `${partition.schema}.${partition.name}` : partition.name,
      values: partition.bound === 'DEFAULT' ? 'DEFAULT' : partition.bound.replace(/^FOR VALUES\s+/i, ''),
    })),
  };
};
