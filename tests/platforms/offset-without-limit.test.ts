import { MySqlPlatform } from '@mikro-orm/mysql';
import { MariaDbPlatform } from '@mikro-orm/mariadb';
import { SqlitePlatform } from '@mikro-orm/sqlite';
import { PostgreSqlPlatform } from '@mikro-orm/postgresql';
import { MsSqlPlatform } from '@mikro-orm/mssql';
import { OraclePlatform } from '@mikro-orm/oracledb';

describe('offset without limit', () => {
  test('negative limit is added [sqlite]', () => {
    const platform = new SqlitePlatform();
    const qb = platform.createNativeQueryBuilder().select('*').from('baz').orderBy('id').offset(2);
    expect(qb.compile()).toEqual({ sql: 'select * from `baz` order by id limit -1 offset ?', params: [2] });
  });

  test.each([
    ['mysql', new MySqlPlatform()],
    ['mariadb', new MariaDbPlatform()],
  ])('max limit is added [%s]', (_, platform) => {
    const qb = platform.createNativeQueryBuilder().select('*').from('baz').orderBy('id').offset(2);
    expect(qb.compile()).toEqual({
      sql: 'select * from `baz` order by id limit 18446744073709551615 offset ?',
      params: [2],
    });
  });

  test.each([
    ['sqlite', new SqlitePlatform()],
    ['mysql', new MySqlPlatform()],
    ['mariadb', new MariaDbPlatform()],
  ])('explicit limit is kept [%s]', (_, platform) => {
    const qb = platform.createNativeQueryBuilder().select('*').from('baz').limit(1).offset(2);
    expect(qb.compile()).toEqual({ sql: 'select * from `baz` limit ? offset ?', params: [1, 2] });

    const qb2 = platform.createNativeQueryBuilder().select('*').from('baz').limit(1);
    expect(qb2.compile()).toEqual({ sql: 'select * from `baz` limit ?', params: [1] });

    const qb3 = platform.createNativeQueryBuilder().select('*').from('baz');
    expect(qb3.compile()).toEqual({ sql: 'select * from `baz`', params: [] });
  });

  test('offset alone is valid [postgres]', () => {
    const qb = new PostgreSqlPlatform().createNativeQueryBuilder().select('*').from('baz').orderBy('id').offset(2);
    expect(qb.compile()).toEqual({ sql: 'select * from "baz" order by id offset ?', params: [2] });
  });

  test('offset alone is valid [mssql]', () => {
    const qb = new MsSqlPlatform().createNativeQueryBuilder().select('*').from('baz').orderBy('id').offset(2);
    expect(qb.compile()).toEqual({ sql: 'select * from [baz] order by id offset ? rows', params: [2] });
  });

  test('offset alone is valid [oracle]', () => {
    const qb = new OraclePlatform().createNativeQueryBuilder().select('*').from('baz').orderBy('id').offset(2);
    expect(qb.compile()).toEqual({ sql: 'select * from "baz" order by id offset ? rows', params: [2] });
  });
});
