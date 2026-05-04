import { MySqlPlatform } from '@mikro-orm/mysql';
import { MariaDbPlatform } from '@mikro-orm/mariadb';
import { SqlitePlatform } from '@mikro-orm/sqlite';
import { PostgreSqlPlatform } from '@mikro-orm/postgresql';
import { MsSqlPlatform } from '@mikro-orm/mssql';

describe('quoteValue escapes embedded single quotes per dialect', () => {
  const evil = "x') OR 1=1 -- ";

  test('mysql / mariadb (backslash escape)', () => {
    expect(new MySqlPlatform().quoteValue(evil)).toBe(`'x\\') OR 1=1 -- '`);
    expect(new MariaDbPlatform().quoteValue(evil)).toBe(`'x\\') OR 1=1 -- '`);
  });

  test('sqlite / mssql / postgres (doubled-quote escape)', () => {
    expect(new SqlitePlatform().quoteValue(evil)).toBe(`'x'') OR 1=1 -- '`);
    expect(new MsSqlPlatform().quoteValue(evil)).toBe(`'x'') OR 1=1 -- '`);
    expect(new PostgreSqlPlatform().quoteValue(evil)).toBe(`'x'') OR 1=1 -- '`);
  });
});

describe('getSearchJsonPropertyKey embeds attacker keys via quoteValue', () => {
  const evil = "x') OR 1=1 -- ";

  test('mysql', () => {
    const sql = (new MySqlPlatform().getSearchJsonPropertyKey(['meta', evil], 'string', false) as unknown as { sql: string }).sql;
    expect(sql).toBe('json_extract(`meta`, \'$.\\"x\\\') OR 1=1 -- \\"\')');
  });

  test('mariadb', () => {
    const sql = (new MariaDbPlatform().getSearchJsonPropertyKey(['meta', evil], 'string', false) as unknown as { sql: string }).sql;
    expect(sql).toBe('json_extract(`meta`, \'$.\\"x\\\') OR 1=1 -- \\"\')');
  });

  test('sqlite', () => {
    const sql = (new SqlitePlatform().getSearchJsonPropertyKey(['meta', evil], 'string', false) as unknown as { sql: string }).sql;
    expect(sql).toBe(`json_extract(\`meta\`, '$."x'') OR 1=1 -- "')`);
  });

  test('mssql', () => {
    const sql = (new MsSqlPlatform().getSearchJsonPropertyKey(['meta', evil], 'string', false) as unknown as { sql: string }).sql;
    expect(sql).toBe(`json_value([meta], '$."x'') OR 1=1 -- "')`);
  });
});
