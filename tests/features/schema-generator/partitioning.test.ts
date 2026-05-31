import type { EntityPartitionBy } from '@mikro-orm/core';
import { Configuration, EntitySchema } from '@mikro-orm/core';
import { SourceFile } from '../../../packages/entity-generator/src/SourceFile.js';
import { DatabaseSchema, SchemaComparator, type TablePartitioning } from '@mikro-orm/sql';
import { PostgreSqlDriver, PostgreSqlPlatform } from '@mikro-orm/postgresql';
import { MikroORM as SqliteMikroORM, SqliteDriver } from '@mikro-orm/sqlite';
import {
  diffPartitioning,
  getTablePartitioning,
  normalizePartitionBound,
  normalizePartitionDefinition,
  splitCommaSeparatedIdentifiers,
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
    // metadata declares partitioning the table does not have yet (adding) — still a change
    expect(diffPartitioning(undefined, equivalent, 'public')).toBe(true);
    // DB is partitioned but metadata omits partitionBy — partitioning is left unmanaged (no-op)
    expect(diffPartitioning(from, undefined, 'public')).toBe(false);
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
    expect(normalizePartitionBound("from ('a')")).toBe("for values from ('a')");
    expect(normalizePartitionBound('')).toBe('');
  });

  test('case-folds MINVALUE/MAXVALUE/NULL keywords emitted by pg_get_expr', () => {
    expect(normalizePartitionBound("FROM (MINVALUE) TO ('2026-01-01')")).toBe(
      "for values from (minvalue) to ('2026-01-01')",
    );
    expect(normalizePartitionBound("from ('2025-01-01') TO (MAXVALUE)")).toBe(
      "for values from ('2025-01-01') to (maxvalue)",
    );
    expect(normalizePartitionBound('IN (NULL)')).toBe('for values in (null)');
    // The same keywords in a user-supplied bound should normalize to the same string as PG's
    // uppercase catalog output, so diffPartitioning collapses both sides.
    expect(normalizePartitionBound('from (minvalue) to (maxvalue)')).toBe(
      normalizePartitionBound('FROM (MINVALUE) TO (MAXVALUE)'),
    );
    // Inside string literals the tokens stay untouched.
    expect(normalizePartitionBound("in ('NULL', 'MINVALUE')")).toBe("for values in ('NULL', 'MINVALUE')");
  });

  test('preserves content of single-quoted literals during normalization', () => {
    // Double-quote characters and whitespace inside literals must not be stripped/collapsed.
    expect(normalizePartitionBound(`in ('a"b')`)).toBe(`for values in ('a"b')`);
    expect(normalizePartitionBound("in ('a  b', 'c\td')")).toBe("for values in ('a  b', 'c\td')");
    expect(normalizePartitionDefinition(`list ('x"y')`)).toBe(`list ('x"y')`);
    // `TO` tokens inside quoted literals must not be lowercased while normalizing range bounds.
    expect(normalizePartitionBound("from ('x') TO ('hello TO world')")).toBe(
      "for values from ('x') to ('hello TO world')",
    );
  });

  test('parses partition definitions without whitespace between type and parens', () => {
    expect(normalizePartitionDefinition('HASH(type)')).toBe('hash (type)');
    expect(normalizePartitionDefinition('RANGE(created_at)')).toBe('range (created_at)');
  });

  test('splitCommaSeparatedIdentifiers respects quoted identifiers containing commas', () => {
    expect(splitCommaSeparatedIdentifiers('tenant_id, type')).toEqual(['tenant_id', 'type']);
    expect(splitCommaSeparatedIdentifiers('"type"')).toEqual(['"type"']);
    expect(splitCommaSeparatedIdentifiers('"weird,name", "type"')).toEqual(['"weird,name"', '"type"']);
    expect(splitCommaSeparatedIdentifiers('"a""b", c')).toEqual(['"a""b"', 'c']);
    expect(splitCommaSeparatedIdentifiers("date_trunc('day', created_at)")).toBeNull();
    expect(splitCommaSeparatedIdentifiers('"unterminated, type')).toBeNull();
    expect(splitCommaSeparatedIdentifiers('tenant_id, ')).toBeNull();
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

  test('ignores the quoter for callback partition expressions', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'range',
        expression: columns => `date_trunc('day', ${columns.createdAt})`,
        partitions: [{ values: "from ('2026-01-01') to ('2026-02-01')" }],
      }),
      'public',
      id => `"${id}"`,
    );

    expect(partitioning?.definition).toBe("range (date_trunc('day', created_at))");
  });

  test('parses quoted partition names with embedded "" escape sequences', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'list',
        expression: ['type'],
        partitions: [{ name: '"a""b"."c""d"', values: "in ('x')" }],
      }),
      'public',
    );

    expect(partitioning?.partitions).toEqual([{ name: 'c"d', schema: 'a"b', bound: "for values in ('x')" }]);
  });

  test('quotes partition key identifiers from comma-separated string expressions', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'hash',
        expression: 'tenant, type',
        partitions: 1,
      }),
      'public',
      id => `"${id}"`,
    );

    expect(partitioning?.definition).toBe('hash ("tenant_id", "type")');
  });

  test('resolves partition keys referenced by physical column name', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'hash',
        expression: ['tenant_id'],
        partitions: 1,
      }),
      'public',
    );

    expect(partitioning?.definition).toBe('hash (tenant_id)');
  });

  test('rejects blank partition keys instead of emitting malformed SQL', () => {
    expect(() =>
      getTablePartitioning(
        createPartitionedMeta({
          type: 'hash',
          expression: ['   ', 'type'],
          partitions: 1,
        }),
        'public',
      ),
    ).toThrow('PartitionedEvent has invalid partitionBy option: empty partition key');
  });

  test('rejects partition keys that do not resolve to entity properties', () => {
    expect(() =>
      getTablePartitioning(
        createPartitionedMeta({
          type: 'hash',
          expression: ['unknown_column'],
          partitions: 1,
        }),
        'public',
      ),
    ).toThrow("PartitionedEvent has invalid partitionBy option: unknown partition key 'unknown_column'");
  });

  test('rejects partition keys that map to a composite column', () => {
    const meta = createPartitionedMeta({
      type: 'hash',
      expression: ['tenant'],
      partitions: 1,
    });
    meta.root.properties.tenant.fieldNames = ['tenant_id', 'tenant_shard'];

    expect(() => getTablePartitioning(meta, 'public')).toThrow(
      "PartitionedEvent has invalid partitionBy option: partition key 'tenant' maps to multiple columns ('tenant_id', 'tenant_shard'); list them explicitly as partition keys",
    );
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

  test('normalizes empty and malformed partition definitions without throwing', () => {
    expect(normalizePartitionDefinition('')).toBe('');
    expect(normalizePartitionDefinition('   ')).toBe('');
  });

  test('falls back to the normalized definition when the type keyword cannot be split', () => {
    expect(() => toEntityPartitionBy({ definition: '', partitions: [] })).toThrow(
      "Unsupported partition type '' in definition ''",
    );
  });

  test('throws when catalog definition uses an unsupported partition type', () => {
    expect(() =>
      toEntityPartitionBy({
        definition: 'reference (tenant_id)',
        partitions: [],
      }),
    ).toThrow("Unsupported partition type 'reference' in definition 'reference (tenant_id)'");
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

  test('rejects partitioned tables on unsupported platforms at discovery time', () => {
    const config = new Configuration({ driver: SqliteDriver }, false);
    const platform = config.getPlatform();

    expect(platform.supportsPartitionedTables()).toBe(false);
    expect(() =>
      platform.validateMetadata(
        createPartitionedMeta({
          type: 'hash',
          expression: ['type'],
          partitions: 4,
        }),
      ),
    ).toThrow('Entity PartitionedEvent uses partitionBy, but SqlitePlatform does not support partitioned tables');
  });

  test('surfaces the unsupported-platform error through MikroORM.init metadata discovery', async () => {
    await expect(
      SqliteMikroORM.init({
        driver: SqliteDriver,
        dbName: ':memory:',
        entities: [
          createPartitionedMeta({
            type: 'hash',
            expression: ['type'],
            partitions: 4,
          }).class,
        ],
      }),
    ).rejects.toThrow(
      'Entity PartitionedEvent uses partitionBy, but SqlitePlatform does not support partitioned tables',
    );
  });

  test('normalizes timestamp bounds with non-UTC offsets (session-local midnight)', () => {
    // Catalog round-trip from a non-UTC session returns `YYYY-MM-DD 00:00:00±HH[:MM]`;
    // the normalizer must collapse both UTC and non-UTC offsets so diffing converges.
    expect(normalizePartitionBound("for values from ('2026-01-01 00:00:00-05') to ('2026-02-01 00:00:00+05:30')")).toBe(
      "for values from ('2026-01-01') to ('2026-02-01')",
    );

    expect(normalizePartitionDefinition("range (('2026-01-01 00:00:00-05'::timestamptz))")).toBe(
      "range ('2026-01-01'::timestamptz)",
    );
  });

  test('preserves offset-less midnight literals so text list partitions do not false-negative-diff', () => {
    // Without an explicit numeric offset the value may come from a text/varchar column; stripping
    // the `00:00:00` suffix here would make `'2026-01-01 00:00:00'` compare equal to `'2026-01-01'`
    // and hide genuine bound changes.
    expect(normalizePartitionBound("for values in ('2026-01-01 00:00:00')")).toBe(
      "for values in ('2026-01-01 00:00:00')",
    );
    expect(normalizePartitionBound("for values in ('2026-01-01')")).toBe("for values in ('2026-01-01')");
  });

  test('creates hash partitions with user-supplied names and preserves them on introspection', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'hash',
        expression: ['tenant'],
        partitions: ['events_shard_a', 'events_shard_b', 'archive.events_shard_c'],
      }),
      'public',
    );

    expect(partitioning).toEqual({
      definition: 'hash (tenant_id)',
      partitions: [
        { name: 'events_shard_a', schema: 'public', bound: 'for values with (modulus 3, remainder 0)' },
        { name: 'events_shard_b', schema: 'public', bound: 'for values with (modulus 3, remainder 1)' },
        { name: 'events_shard_c', schema: 'archive', bound: 'for values with (modulus 3, remainder 2)' },
      ],
    });

    // Round-trip: when parent context is passed, non-default hash names survive as an array so
    // re-generating DDL reproduces the same children.
    expect(toEntityPartitionBy(partitioning, 'partitioned_event', 'public')).toEqual({
      type: 'hash',
      expression: 'tenant_id',
      partitions: ['events_shard_a', 'events_shard_b', 'archive.events_shard_c'],
    });
  });

  test('collapses default-named hash partitions back to a count on introspection', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'hash',
        expression: ['tenant'],
        partitions: 3,
      }),
      'public',
    );

    expect(toEntityPartitionBy(partitioning, 'partitioned_event', 'public')).toEqual({
      type: 'hash',
      expression: 'tenant_id',
      partitions: 3,
    });
  });

  test('accepts quoted-identifier partition names with dots inside', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'list',
        expression: ['tenant'],
        partitions: [{ name: '"my.schema"."part_1"', values: "in ('a')" }],
      }),
      'public',
    );

    expect(partitioning?.partitions[0]).toEqual({
      name: 'part_1',
      schema: 'my.schema',
      bound: "for values in ('a')",
    });
  });

  test('strips midnight suffix for timestamp (no-tz) casts', () => {
    // Timestamp-without-tz catalog output does not carry an offset. The normalizer relies on the
    // explicit `::timestamp` cast to recognise the literal as a timestamp value and collapse it.
    expect(
      normalizePartitionBound("from ('2026-01-01 00:00:00'::timestamp) to ('2026-02-01 00:00:00'::timestamp)"),
    ).toBe("for values from ('2026-01-01'::timestamp) to ('2026-02-01'::timestamp)");
    expect(normalizePartitionDefinition("range (('2026-01-01 00:00:00'::timestamp without time zone))")).toBe(
      "range ('2026-01-01'::timestamp without time zone)",
    );
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
          name: 'partitioned_event_0',
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

  test('entity generator quotes custom hash partition names', () => {
    const config = new Configuration({ driver: PostgreSqlDriver }, false);
    const platform = config.getPlatform() as PostgreSqlPlatform;
    const meta = createPartitionedMeta({
      type: 'hash',
      expression: 'tenant_id',
      partitions: ['events_shard_a', 'events_shard_b', 'archive.events_shard_c'],
    });

    const source = new SourceFile(meta, config.getNamingStrategy(), platform, {}) as unknown as {
      getEntityDeclOptions(): Record<string, unknown>;
    };
    const options = source.getEntityDeclOptions();

    expect(options.partitionBy).toEqual({
      type: "'hash'",
      expression: "'tenant_id'",
      partitions: ["'events_shard_a'", "'events_shard_b'", "'archive.events_shard_c'"],
    });
  });

  test('entity generator rejects callback-form partition expressions', () => {
    const config = new Configuration({ driver: PostgreSqlDriver }, false);
    const platform = config.getPlatform() as PostgreSqlPlatform;
    const meta = createPartitionedMeta({
      type: 'range',
      expression: columns => `date_trunc('day', ${columns.createdAt})`,
      partitions: [{ values: "from ('2026-01-01') to ('2026-02-01')" }],
    });

    const source = new SourceFile(meta, config.getNamingStrategy(), platform, {}) as unknown as {
      getEntityDeclOptions(): Record<string, unknown>;
    };

    expect(() => source.getEntityDeclOptions()).toThrow(
      'Cannot emit entity source for PartitionedEvent: partitionBy.expression is a callback.',
    );
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

  test('does not flag partitioning when metadata omits partitionBy (adoption no-op)', () => {
    const config = new Configuration({ driver: PostgreSqlDriver }, false);
    const platform = config.getPlatform() as PostgreSqlPlatform;
    // `from` mimics an existing partitioned table in the DB
    const fromSchema = DatabaseSchema.fromMetadata(
      [createPartitionedMeta({ type: 'hash', expression: ['type'], partitions: 4 })],
      platform as any,
      config,
    );
    // `to` is an entity that maps the same table without declaring partitionBy
    const toSchema = DatabaseSchema.fromMetadata([createPartitionedMeta()], platform as any, config);
    const comparator = new SchemaComparator(platform);
    const diff = comparator.diffTable(
      fromSchema.getTable('partitioned_event')!,
      toSchema.getTable('partitioned_event')!,
    );

    // partitioning must be left untouched — no diff, hence no destructive throw downstream
    expect(diff === false ? undefined : diff.changedPartitioning).toBeUndefined();
  });
});
