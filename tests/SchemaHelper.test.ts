import { Configuration, Dictionary } from '@mikro-orm/core';
import { SchemaHelper, SqlitePlatform } from '@mikro-orm/sqlite';
import { MySqlPlatform } from '@mikro-orm/mysql';
import { DatabaseTable } from '@mikro-orm/sql';
import type { AbstractSqlConnection, Column, DatabaseSchema, Table } from '@mikro-orm/sqlite';
import {
  ColumnDifference,
  PostgreSqlDriver,
  PostgreSqlPlatform,
  PostgreSqlSchemaHelper,
  TableDifference,
} from '@mikro-orm/postgresql';

class SchemaHelperTest extends SchemaHelper {
  async loadInformationSchema(
    schema: DatabaseSchema,
    connection: AbstractSqlConnection,
    tables: Table[],
    schemas?: string[],
  ): Promise<void> {
    //
  }
}

const uppercasePartitionSql = (value: string): string =>
  value.replace(/\b(for values|hash|list|range|with|in|from|to|default)\b/gi, match => match.toUpperCase());

describe('SchemaHelper', () => {
  test('default schema helpers', async () => {
    const helper = new SchemaHelperTest(new MySqlPlatform());
    expect(helper.getSchemaBeginning('utf8')).toBe('');
    expect(helper.disableForeignKeysSQL()).toBe('');
    expect(helper.enableForeignKeysSQL()).toBe('');
    expect(helper.getSchemaEnd()).toBe('');
    expect(helper.getChangeColumnCommentSQL('a', {} as any)).toBe('');
    expect(() => helper.getListTablesSQL()).toThrow('Not supported by given driver');
    expect(() => helper.getListViewsSQL()).toThrow('Not supported by given driver');
    await expect(helper.loadViews(null!, null!)).rejects.toThrow('Not supported by given driver');
    expect(() => helper.getAlterNativeEnumSQL('table')).toThrow('Not supported by given driver');
    expect(() => helper.getCreateNativeEnumSQL('table', [])).toThrow('Not supported by given driver');
    expect(() => helper.getDropNativeEnumSQL('table')).toThrow('Not supported by given driver');
    expect(() => helper.createMaterializedView('table', undefined, '')).toThrow('Not supported by given driver');
    expect(() => helper.dropMaterializedViewIfExists('table')).toThrow('Not supported by given driver');
    expect(() => helper.refreshMaterializedView('table')).toThrow('Not supported by given driver');
    expect(() => helper.getListMaterializedViewsSQL()).toThrow('Not supported by given driver');
    await expect(helper.loadMaterializedViews({} as any, {} as any)).rejects.toThrow('Not supported by given driver');
  });

  test('base getCreateIndexSQL with advanced options', () => {
    const helper = new SchemaHelperTest(new MySqlPlatform());

    // Test with INCLUDE clause
    const indexWithInclude = helper.getCreateIndexSQL('my_table', {
      keyName: 'my_index',
      columnNames: ['col1'],
      unique: false,
      primary: false,
      constraint: false,
      include: ['col2', 'col3'],
    });
    expect(indexWithInclude).toBe('create index `my_index` on `my_table` (`col1`) include (`col2`, `col3`)');

    // Test with columns array containing sort order, collation, and nulls
    const indexWithColumns = helper.getCreateIndexSQL('my_table', {
      keyName: 'advanced_index',
      columnNames: ['col1', 'col2'],
      unique: true,
      primary: false,
      constraint: false,
      columns: [
        { name: 'col1', sort: 'DESC', nulls: 'LAST' },
        { name: 'col2', collation: 'C', sort: 'ASC' },
      ],
    });
    expect(indexWithColumns).toBe(
      'create unique index `advanced_index` on `my_table` (`col1` DESC nulls LAST, `col2` collate C ASC)',
    );

    // Test fallback to columnNames when no columns array
    const simpleIndex = helper.getCreateIndexSQL('my_table', {
      keyName: 'simple_index',
      columnNames: ['col1', 'col2'],
      unique: false,
      primary: false,
      constraint: false,
    });
    expect(simpleIndex).toBe('create index `simple_index` on `my_table` (`col1`, `col2`)');

    // Test unique constraint (uses ALTER TABLE ADD CONSTRAINT)
    const uniqueConstraint = helper.getCreateIndexSQL('my_table', {
      keyName: 'my_constraint',
      columnNames: ['col1'],
      unique: true,
      primary: false,
      constraint: true,
    });
    expect(uniqueConstraint).toBe('alter table `my_table` add constraint `my_constraint` unique (`col1`)');

    // Test JSON column index (column with dot in name)
    // MySqlPlatform uses json_value with returning clause
    const jsonIndex = helper.getCreateIndexSQL('my_table', {
      keyName: 'json_index',
      columnNames: ['data.nested_field'],
      unique: false,
      primary: false,
      constraint: false,
    });
    expect(jsonIndex).toBe(
      "create index `json_index` on `my_table` ((json_value(`data`, '$.nested_field' returning char(255))))",
    );

    // Test unique JSON column index (uses CREATE INDEX, not ADD CONSTRAINT, as JSON can't have constraints)
    const uniqueJsonIndex = helper.getCreateIndexSQL('my_table', {
      keyName: 'unique_json_index',
      columnNames: ['data.field'],
      unique: true,
      primary: false,
      constraint: true, // ignored for JSON columns
    });
    expect(uniqueJsonIndex).toBe(
      "create unique index `unique_json_index` on `my_table` ((json_value(`data`, '$.field' returning char(255))))",
    );
  });

  test('base mapIndexes merges columns array', async () => {
    const helper = new SchemaHelperTest(new MySqlPlatform());

    const indexes = await (helper as any).mapIndexes([
      {
        keyName: 'multi_col_idx',
        columnNames: ['col1'],
        unique: false,
        primary: false,
        columns: [{ name: 'col1', sort: 'DESC' }],
      },
      {
        keyName: 'multi_col_idx',
        columnNames: ['col2'],
        unique: false,
        primary: false,
        columns: [{ name: 'col2', sort: 'ASC' }],
      },
    ]);

    expect(indexes).toHaveLength(1);
    expect(indexes[0].keyName).toBe('multi_col_idx');
    expect(indexes[0].columnNames).toEqual(['col1', 'col2']);
    expect(indexes[0].columns).toEqual([
      { name: 'col1', sort: 'DESC' },
      { name: 'col2', sort: 'ASC' },
    ]);
  });

  test('mysql schema helper', async () => {
    const helper = new MySqlPlatform().getSchemaHelper()!;
    const from = 'test1';
    const to = { name: 'test_123', nullable: false, type: 'int' } as Column;
    expect(helper.getRenameColumnSQL('table', from, to)).toBe(
      'alter table `table` change `test1` `test_123` int not null',
    );

    const mock = {
      engine: vi.fn(),
      charset: vi.fn(),
      collate: vi.fn(),
    } as any;
    expect(helper.finalizeTable(mock, 'charset', 'collate')).toBe(
      ' default character set charset collate collate engine = InnoDB',
    );
  });

  test('sqlite schema helper', async () => {
    const helper = new SqlitePlatform().getSchemaHelper()!;
    expect(helper.getRenameColumnSQL('table', 'test1', { name: 'test_123' } as Column)).toBe(
      'alter table `table` rename column `test1` to `test_123`',
    );
  });

  test('sqlite schema helper excludes SpatiaLite system views', () => {
    const helper = new SqlitePlatform().getSchemaHelper()!;
    const sql = helper.getListViewsSQL();

    // Should exclude all SpatiaLite system views
    const spatialiteViews = [
      'geometry_columns',
      'spatial_ref_sys',
      'views_geometry_columns',
      'virts_geometry_columns',
      'geom_cols_ref_sys',
      'spatial_ref_sys_aux',
      'vector_layers',
      'vector_layers_auth',
      'vector_layers_field_infos',
      'vector_layers_statistics',
      'ElementaryGeometries',
    ];

    for (const view of spatialiteViews) {
      expect(sql).toContain(`name != '${view}'`);
    }
  });

  describe('sqlite schema helper - ATTACH DATABASE support', () => {
    test('getCreateNamespaceSQL returns empty string', () => {
      const helper = new SqlitePlatform().getSchemaHelper()!;
      expect(helper.getCreateNamespaceSQL('attached_db')).toBe('');
    });

    test('getDropNamespaceSQL returns empty string', () => {
      const helper = new SqlitePlatform().getSchemaHelper()!;
      expect(helper.getDropNamespaceSQL('attached_db')).toBe('');
    });

    test('getCreateIndexSQL handles schema prefix correctly', () => {
      const helper = new SqlitePlatform().getSchemaHelper()!;

      // Without schema prefix (regular table)
      const indexNoSchema = helper.getCreateIndexSQL('my_table', {
        keyName: 'my_index',
        columnNames: ['col1', 'col2'],
        unique: false,
        primary: false,
        constraint: false,
      });
      expect(indexNoSchema).toBe('create index `my_index` on `my_table` (`col1`, `col2`)');

      // With main schema (should not add prefix to index name)
      const indexMainSchema = helper.getCreateIndexSQL('main.my_table', {
        keyName: 'my_index',
        columnNames: ['col1'],
        unique: true,
        primary: false,
        constraint: false,
      });
      expect(indexMainSchema).toBe('create unique index `my_index` on `my_table` (`col1`)');

      // With attached database schema (should prefix the index name)
      const indexAttachedSchema = helper.getCreateIndexSQL('attached_db.my_table', {
        keyName: 'my_index',
        columnNames: ['col1'],
        unique: false,
        primary: false,
        constraint: false,
      });
      expect(indexAttachedSchema).toBe('create index `attached_db`.`my_index` on `my_table` (`col1`)');
    });

    test('getReferencedTableName strips schema prefix', () => {
      const helper = new SqlitePlatform().getSchemaHelper()!;

      // Plain table name
      expect(helper.getReferencedTableName('my_table')).toBe('my_table');

      // Schema-qualified table name should have schema stripped
      expect(helper.getReferencedTableName('main.my_table')).toBe('my_table');
      expect(helper.getReferencedTableName('attached_db.my_table')).toBe('my_table');
    });
  });

  describe('postgresql schema helper', () => {
    test('excludes PostGIS system views', () => {
      const platform = {
        getConfig: () => ({ get: () => ({ ignoreSchema: [] }) }),
        quoteValue: (v: string) => `'${v}'`,
      } as unknown as PostgreSqlPlatform;
      const helper = new PostgreSqlSchemaHelper(platform);
      const sql = helper.getListViewsSQL();

      // Should exclude PostGIS system views
      expect(sql).toContain(`table_name != 'geography_columns'`);
      expect(sql).toContain(`table_name != 'geometry_columns'`);
    });

    test('helper quotes schema name when dropping contraints', () => {
      const helper = new PostgreSqlPlatform().getSchemaHelper()!;
      const fromUuid = { name: 'test_uuid', nullable: false, type: 'uuid' } as Column;
      const toUuid = { name: 'test_uuid', nullable: false, type: 'uuid' } as Column;
      const changedColumns = {
        test_uuid: {
          oldColumnName: 'test_uuid',
          column: toUuid,
          fromColumn: fromUuid,
          changedProperties: new Set(['type']),
        },
      } as Dictionary<ColumnDifference>;

      const tableDifference: TableDifference = {
        name: 'test',
        changedColumns,
      } as TableDifference;

      expect(helper.getPreAlterTable(tableDifference, true)).toEqual([
        `alter table "test" alter column "test_uuid" type text using ("test_uuid"::text)`,
      ]);

      const schemaTableDifference: TableDifference = {
        name: 'my_schema.test',
        changedColumns,
      } as TableDifference;

      expect(helper.getPreAlterTable(schemaTableDifference, true)).toEqual([
        `alter table "my_schema"."test" alter column "test_uuid" type text using ("test_uuid"::text)`,
      ]);
    });

    test('getPreAlterTable tailors message for add/remove/change partitioning transitions', () => {
      const helper = new PostgreSqlPlatform().getSchemaHelper()!;
      const partitioning = { definition: 'hash (type)', partitions: [] } as any;

      expect(() =>
        helper.getPreAlterTable(
          { name: 'evt', changedPartitioning: { from: undefined, to: partitioning } } as TableDifference,
          true,
        ),
      ).toThrow(/Adding partition definitions.*'<none>' -> 'hash \(type\)'/);

      expect(() =>
        helper.getPreAlterTable(
          { name: 'evt', changedPartitioning: { from: partitioning, to: undefined } } as TableDifference,
          true,
        ),
      ).toThrow(/Removing partition definitions.*'hash \(type\)' -> '<none>'/);

      expect(() =>
        helper.getPreAlterTable(
          {
            name: 'evt',
            changedPartitioning: {
              from: partitioning,
              to: { definition: 'hash (type, id)', partitions: [] } as any,
            },
          } as TableDifference,
          true,
        ),
      ).toThrow(/Changing partition definitions.*'hash \(type\)' -> 'hash \(type, id\)'/);
    });

    test('splices partition definitions containing regex-replacement tokens verbatim', () => {
      // `String.prototype.replace` interprets `$$`, `$&`, `$1`..`$9` in the replacement string as
      // back-references, so definitions containing dollar-quoted literals or ampersands must be
      // spliced into the CREATE TABLE statement literally, not via `.replace(/;$/, ...)`.
      const config = new Configuration({ driver: PostgreSqlDriver }, false);
      const platform = config.getPlatform() as PostgreSqlPlatform;
      const helper = platform.getSchemaHelper() as PostgreSqlSchemaHelper;
      const table = new DatabaseTable(platform, 'partitioned_event', 'public');

      table.addColumn({
        name: 'type',
        type: 'varchar(255)',
        mappedType: platform.getMappedType('varchar(255)'),
        nullable: false,
        primary: true,
      } as Column);
      table.setIndexes([
        {
          keyName: 'partitioned_event_pkey',
          columnNames: ['type'],
          composite: false,
          unique: true,
          primary: true,
          constraint: true,
        },
      ]);
      table.setPartitioning({
        definition: 'hash (my_func($$a&b$$, $1))',
        partitions: [{ name: 'partitioned_event_0', bound: 'for values with (modulus 1, remainder 0)' }],
      });

      const sql = helper.createTable(table);

      expect(sql[0]).toContain('partition by hash (my_func($$a&b$$, $1));');
    });

    test('creates partitioned table DDL with child partitions', () => {
      const config = new Configuration({ driver: PostgreSqlDriver }, false);
      const platform = config.getPlatform() as PostgreSqlPlatform;
      const helper = platform.getSchemaHelper() as PostgreSqlSchemaHelper;
      const table = new DatabaseTable(platform, 'partitioned_event', 'public');

      table.addColumn({
        name: 'type',
        type: 'varchar(255)',
        mappedType: platform.getMappedType('varchar(255)'),
        nullable: false,
        primary: true,
      } as Column);
      table.addColumn({
        name: 'id',
        type: 'int',
        mappedType: platform.getMappedType('int'),
        nullable: false,
        primary: true,
      } as Column);
      table.setIndexes([
        {
          keyName: 'partitioned_event_pkey',
          columnNames: ['type', 'id'],
          composite: true,
          unique: true,
          primary: true,
          constraint: true,
        },
      ]);
      table.setPartitioning({
        definition: 'list (type)',
        partitions: [
          { name: 'partitioned_event_apac', bound: "for values in ('apac')" },
          { name: 'partitioned_event_emea', schema: 'archive', bound: "for values in ('emea')" },
        ],
      });

      const sql = helper.createTable(table);

      expect(sql[0]).toContain('create table "partitioned_event"');
      expect(sql[0]).toContain('partition by list (type);');
      expect(sql[1]).toBe(
        `create table "partitioned_event_apac" partition of "partitioned_event" for values in ('apac')`,
      );
      expect(sql[2]).toBe(
        `create table "archive"."partitioned_event_emea" partition of "partitioned_event" for values in ('emea')`,
      );
    });

    test('groups partition metadata returned from pg catalogs', async () => {
      const config = new Configuration({ driver: PostgreSqlDriver }, false);
      const helper = config.getPlatform().getSchemaHelper() as PostgreSqlSchemaHelper;
      const connection = {
        execute: vi.fn().mockResolvedValue([
          {
            schema_name: 'archive',
            table_name: 'event_rollup',
            partition_definition: uppercasePartitionSql('list (tenant_id) '),
            partition_schema_name: undefined,
            partition_name: undefined,
            partition_bound: undefined,
          },
          {
            schema_name: 'public',
            table_name: 'partitioned_event',
            partition_definition: uppercasePartitionSql('hash (type) '),
            partition_schema_name: 'public',
            partition_name: 'partitioned_event_0',
            partition_bound: uppercasePartitionSql(' for values with (modulus 2, remainder 0) '),
          },
          {
            schema_name: 'public',
            table_name: 'partitioned_event',
            partition_definition: uppercasePartitionSql('hash (type) '),
            partition_schema_name: 'public',
            partition_name: 'partitioned_event_1',
            partition_bound: uppercasePartitionSql(' for values with (modulus 2, remainder 1) '),
          },
        ]),
      } as any;

      const partitions = await helper.getPartitions(
        connection,
        new Map([
          ['archive', [{ schema_name: 'archive', table_name: 'event_rollup' } as Table]],
          ['public', [{ schema_name: 'public', table_name: 'partitioned_event' } as Table]],
        ]),
      );

      expect(connection.execute).toHaveBeenCalledTimes(1);
      expect(connection.execute.mock.calls[0][0]).toContain(`('archive'::text, 'event_rollup')`);
      expect(connection.execute.mock.calls[0][0]).toContain(`('public'::text, 'partitioned_event')`);
      expect(partitions).toEqual({
        'archive.event_rollup': {
          definition: 'list (tenant_id)',
          partitions: [],
        },
        'public.partitioned_event': {
          definition: 'hash (type)',
          partitions: [
            {
              name: 'partitioned_event_0',
              schema: 'public',
              bound: 'for values with (modulus 2, remainder 0)',
            },
            {
              name: 'partitioned_event_1',
              schema: 'public',
              bound: 'for values with (modulus 2, remainder 1)',
            },
          ],
        },
      });
    });

    test('restricts undefined table-schema buckets to current_schema()', async () => {
      const config = new Configuration({ driver: PostgreSqlDriver }, false);
      const helper = config.getPlatform().getSchemaHelper() as PostgreSqlSchemaHelper;
      const connection = {
        execute: vi.fn().mockResolvedValue([]),
      } as any;

      const partitions = await helper.getPartitions(
        connection,
        new Map([[undefined, [{ table_name: 'partitioned_event' } as Table]]]),
      );

      expect(partitions).toEqual({});
      expect(connection.execute).toHaveBeenCalledTimes(1);
      const sql = connection.execute.mock.calls[0][0];
      expect(sql).toContain(`(null::text, 'partitioned_event')`);
      expect(sql).toContain('coalesce(targets.schema_name, current_schema())');
      expect(sql).not.toContain('parent_ns.nspname = NULL');
      expect(sql).not.toContain('targets.schema_name is null');
    });

    test('short-circuits when all schema buckets are empty', async () => {
      const config = new Configuration({ driver: PostgreSqlDriver }, false);
      const helper = config.getPlatform().getSchemaHelper() as PostgreSqlSchemaHelper;
      const connection = {
        execute: vi.fn().mockResolvedValue([]),
      } as any;

      const partitions = await helper.getPartitions(connection, new Map([['public', []]]));

      expect(partitions).toEqual({});
      expect(connection.execute).not.toHaveBeenCalled();
    });
  });
});
