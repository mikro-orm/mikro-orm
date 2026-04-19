import type { EntityPartitionBy } from '@mikro-orm/core';
import { Configuration, EntitySchema } from '@mikro-orm/core';
import { SourceFile } from '../../../packages/entity-generator/src/SourceFile.js';
import { DatabaseSchema, SchemaComparator, type TablePartitioning } from '@mikro-orm/sql';
import { PostgreSqlDriver, PostgreSqlPlatform } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import {
  diffPartitioning,
  getTablePartitioning,
  normalizePartitionBound,
  normalizePartitionDefinition,
  toEntityPartitionBy,
} from '../../../packages/sql/src/schema/partitioning.js';

const createPartitionedMeta = (partitionBy?: EntityPartitionBy<any>) =>
  new EntitySchema({
    name: 'PartitionedEvent',
    tableName: 'partitioned_event',
    partitionBy,
    properties: {
      id: {
        type: 'number',
        primary: true,
        fieldName: 'id',
        columnType: 'int',
      },
      type: {
        type: 'string',
        primary: true,
        fieldName: 'type',
        columnType: 'varchar(255)',
      },
      tenant: {
        type: 'string',
        fieldName: 'tenant_id',
        columnType: 'varchar(255)',
      },
      createdAt: {
        type: 'Date',
        fieldName: 'created_at',
        columnType: 'timestamptz',
      },
    },
  }).init().meta;

const uppercasePartitionSql = (value: string): string =>
  value.replace(/\b(for values|hash|list|range|with|in|from|to|default)\b/gi, match => match.toUpperCase());

describe('partitioning helpers', () => {
  test('builds hash partitioning from property arrays', () => {
    expect(getTablePartitioning(createPartitionedMeta(), 'public')).toBeUndefined();

    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'hash',
        expression: ['tenant', 'type'],
        partitions: 3,
      }),
      'public',
    );

    expect(partitioning).toEqual({
      definition: 'hash (tenant_id, type)',
      partitions: [
        { name: 'partitioned_event_0', schema: 'public', bound: 'for values with (modulus 3, remainder 0)' },
        { name: 'partitioned_event_1', schema: 'public', bound: 'for values with (modulus 3, remainder 1)' },
        { name: 'partitioned_event_2', schema: 'public', bound: 'for values with (modulus 3, remainder 2)' },
      ],
    });
  });

  test('builds explicit partitions from callbacks and raw bounds', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'range',
        expression: columns => ` date_trunc('day', ${columns.createdAt}) `,
        partitions: [
          { values: " from ('2026-01-01') to ('2026-02-01') " },
          { name: 'archive.partitioned_event_default', values: ' default ' },
          { name: 'audit.partitioned_event_q1', values: "for values in ('q1')" },
          { name: 'a.b.c', values: "for values in ('q2')" },
        ],
      }),
      'public',
    );

    expect(partitioning).toEqual({
      definition: "range (date_trunc('day', created_at))",
      partitions: [
        {
          name: 'partitioned_event_0',
          schema: 'public',
          bound: "for values from ('2026-01-01') to ('2026-02-01')",
        },
        {
          name: 'partitioned_event_default',
          schema: 'archive',
          bound: 'default',
        },
        {
          name: 'partitioned_event_q1',
          schema: 'audit',
          bound: "for values in ('q1')",
        },
        {
          name: 'b.c',
          schema: 'a',
          bound: "for values in ('q2')",
        },
      ],
    });
  });

  test('preserves wrapped complex partition expressions in generated table definitions', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'range',
        expression: columns => `((${columns.createdAt} at time zone 'UTC')::date)`,
        partitions: [{ values: "from ('2026-01-01') to ('2026-02-01')" }],
      }),
      'public',
    );

    expect(partitioning).toEqual({
      definition: "range (((created_at at time zone 'UTC')::date))",
      partitions: [
        {
          name: 'partitioned_event_0',
          schema: 'public',
          bound: "for values from ('2026-01-01') to ('2026-02-01')",
        },
      ],
    });
  });

  test('keeps raw SQL partition expressions when they do not match entity properties', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'list',
        expression: " date_trunc('month', created_at) ",
        partitions: [{ values: "in ('2026-01-01')" }],
      }),
      undefined,
    );

    expect(partitioning).toEqual({
      definition: "list (date_trunc('month', created_at))",
      partitions: [{ name: 'partitioned_event_0', schema: undefined, bound: "for values in ('2026-01-01')" }],
    });
  });

  test('diffs partitioning after normalizing identifiers, schemas, order, and sql keyword casing', () => {
    const from: TablePartitioning = {
      definition: uppercasePartitionSql('hash ("tenant_id", "type")'),
      partitions: [
        {
          name: 'partitioned_event_0',
          schema: 'public',
          bound: uppercasePartitionSql('for values with (modulus 2, remainder 0)'),
        },
        {
          name: 'partitioned_event_1',
          schema: 'public',
          bound: uppercasePartitionSql('for values with (modulus 2, remainder 1)'),
        },
      ],
    };
    const equivalent: TablePartitioning = {
      definition: uppercasePartitionSql('hash (tenant_id, type)'),
      partitions: [
        { name: 'partitioned_event_1', bound: uppercasePartitionSql('for values with (modulus 2, remainder 1)') },
        { name: 'partitioned_event_0', bound: uppercasePartitionSql('for values with (modulus 2, remainder 0)') },
      ],
    };

    expect(diffPartitioning(undefined, undefined, 'public')).toBe(false);
    expect(diffPartitioning(from, undefined, 'public')).toBe(true);
    expect(diffPartitioning(from, equivalent, 'public')).toBe(false);
    expect(diffPartitioning(from, { ...equivalent, definition: 'list (tenant_id, type)' }, 'public')).toBe(true);
    expect(diffPartitioning(from, { ...equivalent, partitions: equivalent.partitions.slice(0, 1) }, 'public')).toBe(
      true,
    );
    expect(
      diffPartitioning(
        from,
        {
          ...equivalent,
          partitions: [{ ...equivalent.partitions[0], schema: 'archive' }, equivalent.partitions[1]],
        },
        'public',
      ),
    ).toBe(true);
  });

  test('normalizes postgres canonical range expressions and timestamptz bounds', () => {
    const from: TablePartitioning = {
      definition: "range (((created_at at time zone 'UTC')::date))",
      partitions: [
        {
          name: 'partitioned_event_0',
          schema: 'public',
          bound: "for values from ('2026-01-01') to ('2026-02-01')",
        },
      ],
    };
    const introspected: TablePartitioning = {
      definition: "range ((((created_at at time zone 'UTC'::text))::date))",
      partitions: [
        {
          name: 'partitioned_event_0',
          schema: 'public',
          bound: "for values from ('2026-01-01 00:00:00+00') to ('2026-02-01 00:00:00+00')",
        },
      ],
    };

    expect(diffPartitioning(from, introspected, 'public')).toBe(false);
    expect(toEntityPartitionBy(introspected)).toEqual({
      type: 'range',
      expression: "(created_at at time zone 'UTC')::date",
      partitions: [
        {
          name: 'public.partitioned_event_0',
          values: "from ('2026-01-01') to ('2026-02-01')",
        },
      ],
    });
  });

  test('normalizes malformed partition sql fragments defensively', () => {
    expect(normalizePartitionDefinition('hash'.toUpperCase())).toBe('hash');
    expect(normalizePartitionBound("in ('O''Reilly')")).toBe("for values in ('O''Reilly')");
    expect(normalizePartitionBound('with (modulus 2')).toBe('for values with (modulus 2');
    expect(normalizePartitionBound("in ('unterminated")).toBe("for values in ('unterminated");
  });

  test('preserves content of single-quoted literals during normalization', () => {
    // Double-quote characters and whitespace inside literals must not be stripped/collapsed.
    expect(normalizePartitionBound(`in ('a"b')`)).toBe(`for values in ('a"b')`);
    expect(normalizePartitionBound("in ('a  b', 'c\td')")).toBe("for values in ('a  b', 'c\td')");
    expect(normalizePartitionDefinition(`list ('x"y')`)).toBe(`list ('x"y')`);
  });

  test('maps comma-separated string expressions to field names', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'hash',
        expression: 'tenant, type',
        partitions: 2,
      }),
      'public',
    );

    expect(partitioning?.definition).toBe('hash (tenant_id, type)');
  });

  test('quotes partition key identifiers when a quoter is provided', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'hash',
        expression: ['tenant', 'type'],
        partitions: 1,
      }),
      'public',
      id => `"${id}"`,
    );

    expect(partitioning?.definition).toBe('hash ("tenant_id", "type")');
  });

  test('converts catalog-style partitioning definitions back to lowercase entity metadata', () => {
    expect(toEntityPartitionBy(undefined)).toBeUndefined();

    expect(
      toEntityPartitionBy({
        definition: uppercasePartitionSql('hash (tenant_id, type)'),
        partitions: [
          { name: 'partitioned_event_0', bound: uppercasePartitionSql('for values with (modulus 2, remainder 0)') },
          { name: 'partitioned_event_1', bound: uppercasePartitionSql('for values with (modulus 2, remainder 1)') },
        ],
      }),
    ).toEqual({
      type: 'hash',
      expression: 'tenant_id, type',
      partitions: 2,
    });

    expect(
      toEntityPartitionBy({
        definition: uppercasePartitionSql("range ((date_trunc('day', created_at))::date)"),
        partitions: [
          {
            name: 'partitioned_event_0',
            schema: 'public',
            bound: uppercasePartitionSql("for values from ('2026-01-01') to ('2026-02-01')"),
          },
          {
            name: 'partitioned_event_default',
            bound: uppercasePartitionSql('default'),
          },
        ],
      }),
    ).toEqual({
      type: 'range',
      expression: "(date_trunc('day', created_at))::date",
      partitions: [
        {
          name: 'public.partitioned_event_0',
          values: "from ('2026-01-01') to ('2026-02-01')",
        },
        {
          name: 'partitioned_event_default',
          values: 'default',
        },
      ],
    });
  });

  test('preserves expressions that are not wrapped by a single outer parenthesis pair', () => {
    expect(
      toEntityPartitionBy({
        definition: 'hash tenant_id',
        partitions: [{ name: 'partitioned_event_0', bound: 'for values with (modulus 1, remainder 0)' }],
      }),
    ).toEqual({
      type: 'hash',
      expression: 'tenant_id',
      partitions: 1,
    });

    expect(
      toEntityPartitionBy({
        definition: 'list (tenant_id) || (type)',
        partitions: [{ name: 'partitioned_event_0', bound: "for values in ('tenant-a')" }],
      }),
    ).toEqual({
      type: 'list',
      expression: '(tenant_id) || (type)',
      partitions: [{ name: 'partitioned_event_0', values: "in ('tenant-a')" }],
    });
  });

  test('rejects partitioned tables on unsupported platforms', () => {
    const config = new Configuration({ driver: SqliteDriver }, false);
    const driver = new SqliteDriver(config);

    expect(driver.getPlatform().supportsPartitionedTables()).toBe(false);
    expect(() =>
      DatabaseSchema.fromMetadata(
        [
          createPartitionedMeta({
            type: 'hash',
            expression: ['type'],
            partitions: 4,
          }),
        ],
        driver.getPlatform() as any,
        config,
      ),
    ).toThrow('Entity PartitionedEvent uses partitionBy, but SqlitePlatform does not support partitioned tables');
  });

  test('round-trips partitioning through sql schema metadata', () => {
    const config = new Configuration({ driver: PostgreSqlDriver }, false);
    const platform = config.getPlatform() as PostgreSqlPlatform;
    const meta = createPartitionedMeta({
      type: 'range',
      expression: ['createdAt'],
      partitions: [
        { values: "from ('2026-01-01') to ('2026-02-01')" },
        { name: 'archive.partitioned_event_default', values: 'default' },
      ],
    });

    expect(platform.supportsPartitionedTables()).toBe(true);

    const schema = DatabaseSchema.fromMetadata([meta], platform as any, config);
    const table = schema.getTable('partitioned_event')!;

    expect(table.getPartitioning()).toEqual({
      definition: 'range ("created_at")',
      partitions: [
        {
          name: 'partitioned_event_0',
          schema: 'public',
          bound: "for values from ('2026-01-01') to ('2026-02-01')",
        },
        {
          name: 'partitioned_event_default',
          schema: 'archive',
          bound: 'default',
        },
      ],
    });
    expect(
      table.getEntityDeclaration(config.getNamingStrategy(), platform.getSchemaHelper() as any, 'smart').partitionBy,
    ).toEqual({
      type: 'range',
      expression: 'created_at',
      partitions: [
        {
          name: 'public.partitioned_event_0',
          values: "from ('2026-01-01') to ('2026-02-01')",
        },
        {
          name: 'archive.partitioned_event_default',
          values: 'default',
        },
      ],
    });
  });

  test('entity generator emits partitionBy entity option', () => {
    const config = new Configuration({ driver: PostgreSqlDriver }, false);
    const platform = config.getPlatform() as PostgreSqlPlatform;
    const meta = createPartitionedMeta({
      type: 'range',
      expression: 'createdAt',
      partitions: [
        { values: "from ('2026-01-01') to ('2026-02-01')" },
        { name: 'archive.partitioned_event_default', values: 'default' },
      ],
    });

    const source = new SourceFile(meta, config.getNamingStrategy(), platform, {}) as unknown as {
      getEntityDeclOptions(): Record<string, unknown>;
    };
    const options = source.getEntityDeclOptions();

    expect(options.partitionBy).toEqual({
      type: "'range'",
      expression: "'createdAt'",
      partitions: [
        { values: "'from (\\'2026-01-01\\') to (\\'2026-02-01\\')'" },
        { name: "'archive.partitioned_event_default'", values: "'default'" },
      ],
    });
  });

  test('entity generator emits hash partition count', () => {
    const config = new Configuration({ driver: PostgreSqlDriver }, false);
    const platform = config.getPlatform() as PostgreSqlPlatform;
    const meta = createPartitionedMeta({
      type: 'hash',
      expression: ['tenant', 'type'],
      partitions: 4,
    });

    const source = new SourceFile(meta, config.getNamingStrategy(), platform, {}) as unknown as {
      getEntityDeclOptions(): Record<string, unknown>;
    };
    const options = source.getEntityDeclOptions();

    expect(options.partitionBy).toEqual({
      type: "'hash'",
      expression: ["'tenant'", "'type'"],
      partitions: 4,
    });
  });

  test('surfaces partitioning changes through the schema comparator', () => {
    const config = new Configuration({ driver: PostgreSqlDriver }, false);
    const platform = config.getPlatform() as PostgreSqlPlatform;
    const fromSchema = DatabaseSchema.fromMetadata(
      [
        createPartitionedMeta({
          type: 'hash',
          expression: ['type'],
          partitions: 2,
        }),
      ],
      platform as any,
      config,
    );
    const toSchema = DatabaseSchema.fromMetadata(
      [
        createPartitionedMeta({
          type: 'hash',
          expression: ['type'],
          partitions: 4,
        }),
      ],
      platform as any,
      config,
    );
    const comparator = new SchemaComparator(platform);
    const diff = comparator.diffTable(
      fromSchema.getTable('partitioned_event')!,
      toSchema.getTable('partitioned_event')!,
    );

    expect(diff).not.toBe(false);
    expect((diff as Exclude<typeof diff, false>).changedPartitioning).toEqual({
      from: fromSchema.getTable('partitioned_event')!.getPartitioning(),
      to: toSchema.getTable('partitioned_event')!.getPartitioning(),
    });
  });
});
