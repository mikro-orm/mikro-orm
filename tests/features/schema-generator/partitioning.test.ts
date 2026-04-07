import type { EntityPartitionBy } from '@mikro-orm/core';
import { Configuration, EntitySchema } from '@mikro-orm/core';
import { DatabaseSchema, type TablePartitioning } from '@mikro-orm/sql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import {
  diffPartitioning,
  getTablePartitioning,
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
      definition: 'HASH (tenant_id, type)',
      partitions: [
        { name: 'partitioned_event_0', schema: 'public', bound: 'FOR VALUES WITH (modulus 3, remainder 0)' },
        { name: 'partitioned_event_1', schema: 'public', bound: 'FOR VALUES WITH (modulus 3, remainder 1)' },
        { name: 'partitioned_event_2', schema: 'public', bound: 'FOR VALUES WITH (modulus 3, remainder 2)' },
      ],
    });
  });

  test('builds explicit partitions from callbacks and raw bounds', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'range',
        expression: columns => ` date_trunc('day', ${columns.createdAt}) `,
        partitions: [
          { values: " FROM ('2026-01-01') TO ('2026-02-01') " },
          { name: 'archive.partitioned_event_default', values: ' DEFAULT ' },
          { name: 'audit.partitioned_event_q1', values: "for values IN ('q1')" },
        ],
      }),
      'public',
    );

    expect(partitioning).toEqual({
      definition: "RANGE (date_trunc('day', created_at))",
      partitions: [
        {
          name: 'partitioned_event_0',
          schema: 'public',
          bound: "FOR VALUES FROM ('2026-01-01') TO ('2026-02-01')",
        },
        {
          name: 'partitioned_event_default',
          schema: 'archive',
          bound: 'DEFAULT',
        },
        {
          name: 'partitioned_event_q1',
          schema: 'audit',
          bound: "FOR VALUES IN ('q1')",
        },
      ],
    });
  });

  test('keeps raw SQL partition expressions when they do not match entity properties', () => {
    const partitioning = getTablePartitioning(
      createPartitionedMeta({
        type: 'list',
        expression: " date_trunc('month', created_at) ",
        partitions: [{ values: "IN ('2026-01-01')" }],
      }),
      undefined,
    );

    expect(partitioning).toEqual({
      definition: "LIST (date_trunc('month', created_at))",
      partitions: [{ name: 'partitioned_event_0', schema: undefined, bound: "FOR VALUES IN ('2026-01-01')" }],
    });
  });

  test('diffs partitioning after normalizing identifiers, schemas, and order', () => {
    const from: TablePartitioning = {
      definition: 'HASH ("tenant_id", "type")',
      partitions: [
        { name: 'partitioned_event_0', schema: 'public', bound: 'FOR VALUES WITH (modulus 2, remainder 0)' },
        { name: 'partitioned_event_1', schema: 'public', bound: 'FOR VALUES WITH (modulus 2, remainder 1)' },
      ],
    };
    const equivalent: TablePartitioning = {
      definition: 'HASH (tenant_id, type)',
      partitions: [
        { name: 'partitioned_event_1', bound: 'FOR VALUES WITH (modulus 2, remainder 1)' },
        { name: 'partitioned_event_0', bound: 'FOR VALUES WITH (modulus 2, remainder 0)' },
      ],
    };

    expect(diffPartitioning(undefined, undefined, 'public')).toBe(false);
    expect(diffPartitioning(from, undefined, 'public')).toBe(true);
    expect(diffPartitioning(from, equivalent, 'public')).toBe(false);
    expect(diffPartitioning(from, { ...equivalent, definition: 'LIST (tenant_id, type)' }, 'public')).toBe(true);
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

  test('converts partitioning definitions back to entity metadata', () => {
    expect(toEntityPartitionBy(undefined)).toBeUndefined();

    expect(
      toEntityPartitionBy({
        definition: 'HASH (tenant_id, type)',
        partitions: [
          { name: 'partitioned_event_0', bound: 'FOR VALUES WITH (modulus 2, remainder 0)' },
          { name: 'partitioned_event_1', bound: 'FOR VALUES WITH (modulus 2, remainder 1)' },
        ],
      }),
    ).toEqual({
      type: 'hash',
      expression: 'tenant_id, type',
      partitions: 2,
    });

    expect(
      toEntityPartitionBy({
        definition: "RANGE ((date_trunc('day', created_at))::date)",
        partitions: [
          {
            name: 'partitioned_event_0',
            schema: 'public',
            bound: "FOR VALUES FROM ('2026-01-01') TO ('2026-02-01')",
          },
          {
            name: 'partitioned_event_default',
            bound: 'DEFAULT',
          },
        ],
      }),
    ).toEqual({
      type: 'range',
      expression: "(date_trunc('day', created_at))::date",
      partitions: [
        {
          name: 'public.partitioned_event_0',
          values: "FROM ('2026-01-01') TO ('2026-02-01')",
        },
        {
          name: 'partitioned_event_default',
          values: 'DEFAULT',
        },
      ],
    });
  });

  test('preserves expressions that are not wrapped by a single outer parenthesis pair', () => {
    expect(
      toEntityPartitionBy({
        definition: 'HASH tenant_id',
        partitions: [{ name: 'partitioned_event_0', bound: 'FOR VALUES WITH (modulus 1, remainder 0)' }],
      }),
    ).toEqual({
      type: 'hash',
      expression: 'tenant_id',
      partitions: 1,
    });

    expect(
      toEntityPartitionBy({
        definition: 'LIST (tenant_id) || (type)',
        partitions: [{ name: 'partitioned_event_0', bound: "FOR VALUES IN ('tenant-a')" }],
      }),
    ).toEqual({
      type: 'list',
      expression: '(tenant_id) || (type)',
      partitions: [{ name: 'partitioned_event_0', values: "IN ('tenant-a')" }],
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
});
