import { MySqlPlatform } from '@mikro-orm/mysql';
import { MariaDbPlatform } from '@mikro-orm/mariadb';
import { SqlitePlatform } from '@mikro-orm/sqlite';
import { PostgreSqlPlatform } from '@mikro-orm/postgresql';
import { MsSqlPlatform } from '@mikro-orm/mssql';
import { OraclePlatform } from '@mikro-orm/oracledb';

describe('quoteIdentifier escapes embedded quote characters', () => {
  test.each([
    ['mysql', new MySqlPlatform()],
    ['mariadb', new MariaDbPlatform()],
    ['sqlite', new SqlitePlatform()],
  ])('backtick dialect [%s]', (_, platform) => {
    expect(platform.quoteIdentifier('table')).toBe('`table`');
    expect(platform.quoteIdentifier('schema.table')).toBe('`schema`.`table`');
    expect(platform.quoteIdentifier('a`b')).toBe('`a``b`');
    expect(platform.quoteIdentifier('a`.b')).toBe('`a```.`b`');
  });

  test.each([
    ['postgres', new PostgreSqlPlatform()],
    ['oracle', new OraclePlatform()],
  ])('double-quote dialect [%s]', (_, platform) => {
    expect(platform.quoteIdentifier('table')).toBe('"table"');
    expect(platform.quoteIdentifier('schema.table')).toBe('"schema"."table"');
    expect(platform.quoteIdentifier('a"b')).toBe('"a""b"');
    expect(platform.quoteIdentifier('a".b')).toBe('"a"""."b"');
  });

  test('bracket dialect [mssql]', () => {
    const platform = new MsSqlPlatform();
    expect(platform.quoteIdentifier('table')).toBe('[table]');
    expect(platform.quoteIdentifier('schema.table')).toBe('[schema].[table]');
    expect(platform.quoteIdentifier('a]b')).toBe('[a]]b]');
    expect(platform.quoteIdentifier('a].b')).toBe('[a]]].[b]');
  });
});
