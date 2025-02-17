import type { AbstractSqlConnection, Column, DatabaseSchema, Table } from '@mikro-orm/sqlite';
import { SchemaHelper, SqlitePlatform } from '@mikro-orm/sqlite';
import { MySqlPlatform } from '@mikro-orm/mysql';
import { ColumnDifference, PostgreSqlPlatform, TableDifference } from '@mikro-orm/postgresql';
import { Dictionary } from '@mikro-orm/core';

class SchemaHelperTest extends SchemaHelper {

  async loadInformationSchema(schema: DatabaseSchema, connection: AbstractSqlConnection, tables: Table[], schemas?: string[]): Promise<void> {
    //
  }

}

describe('SchemaHelper', () => {

  test('default schema helpers', async () => {
    const helper = new SchemaHelperTest(new MySqlPlatform());
    expect(helper.getSchemaBeginning('utf8')).toBe('');
    expect(helper.disableForeignKeysSQL()).toBe('');
    expect(helper.enableForeignKeysSQL()).toBe('');
    expect(helper.getSchemaEnd()).toBe('');
    expect(helper.getChangeColumnCommentSQL('a', {} as any)).toBe('');
    expect(() => helper.getListTablesSQL()).toThrow('Not supported by given driver');
    expect(() => helper.getAlterNativeEnumSQL('table')).toThrow('Not supported by given driver');
    expect(() => helper.getCreateNativeEnumSQL('table', [])).toThrow('Not supported by given driver');
    expect(() => helper.getDropNativeEnumSQL('table')).toThrow('Not supported by given driver');
  });

  test('mysql schema helper', async () => {
    const helper = new MySqlPlatform().getSchemaHelper()!;
    const from = 'test1';
    const to = { name: 'test_123', nullable: false, type: 'int' } as Column;
    expect(helper.getRenameColumnSQL('table', from, to)).toBe('alter table `table` change `test1` `test_123` int not null');

    const mock = {
      engine: vi.fn(),
      charset: vi.fn(),
      collate: vi.fn(),
    } as any;
    expect(helper.finalizeTable(mock, 'charset', 'collate')).toBe(' default character set charset collate collate engine = InnoDB');
  });

  test('sqlite schema helper', async () => {
    const helper = new SqlitePlatform().getSchemaHelper()!;
    expect(helper.getRenameColumnSQL('table', 'test1', { name: 'test_123' } as Column)).toBe('alter table `table` rename column `test1` to `test_123`');
  });

  describe('postgresql schema helper', () => {
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

      expect(helper.getPreAlterTable(tableDifference, true)).toEqual([`alter table "test" alter column "test_uuid" type text using ("test_uuid"::text)`]);

      const schemaTableDifference: TableDifference = {
        name: 'my_schema.test',
        changedColumns,
      } as TableDifference;

      expect(helper.getPreAlterTable(schemaTableDifference, true)).toEqual([`alter table "my_schema"."test" alter column "test_uuid" type text using ("test_uuid"::text)`]);
    });
  });
});
