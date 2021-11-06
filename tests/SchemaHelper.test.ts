import type { Column } from '@mikro-orm/sqlite';
import { SchemaHelper, SqlitePlatform } from '@mikro-orm/sqlite';
import { MySqlPlatform } from '@mikro-orm/mysql';

class SchemaHelperTest extends SchemaHelper { }

describe('SchemaHelper', () => {

  test('default schema helpers', async () => {
    const helper = new SchemaHelperTest(new MySqlPlatform());
    expect(helper.getSchemaBeginning('utf8')).toBe('');
    expect(helper.getSchemaEnd()).toBe('');
    expect(helper.getChangeColumnCommentSQL('a', {} as any)).toBe('');
    expect(() => helper.getListTablesSQL()).toThrowError('Not supported by given driver');
    expect(() => helper.getForeignKeysSQL('table')).toThrowError('Not supported by given driver');
    await expect(helper.getColumns({} as any, 'table')).rejects.toThrowError('Not supported by given driver');
    await expect(helper.getIndexes({} as any, 'table')).rejects.toThrowError('Not supported by given driver');
  });

  test('mysql schema helper', async () => {
    const helper = new MySqlPlatform().getSchemaHelper()!;
    const from = 'test1';
    const to = { name: 'test_123', nullable: false, type: 'int' } as Column;
    expect(helper.getRenameColumnSQL('table', from, to)).toBe('alter table `table` change `test1` `test_123` int not null');

    const mock = {
      engine: jest.fn(),
      charset: jest.fn(),
      collate: jest.fn(),
    } as any;
    helper.finalizeTable(mock, 'charset', 'collate');
    expect(mock.engine).toBeCalledWith('InnoDB');
    expect(mock.charset).toBeCalledWith('charset');
    expect(mock.collate).toBeCalledWith('collate');
  });

  test('sqlite schema helper', async () => {
    const helper = new SqlitePlatform().getSchemaHelper()!;
    expect(helper.getRenameColumnSQL('table', 'test1', { name: 'test_123' } as Column)).toBe('alter table `table` rename column `test1` to `test_123`');
  });

});
