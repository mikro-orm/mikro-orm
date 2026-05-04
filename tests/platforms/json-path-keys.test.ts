import { MySqlPlatform } from '@mikro-orm/mysql';
import { MariaDbPlatform } from '@mikro-orm/mariadb';
import { SqlitePlatform } from '@mikro-orm/sqlite';
import { PostgreSqlPlatform } from '@mikro-orm/postgresql';
import { MsSqlPlatform } from '@mikro-orm/mssql';
import { OraclePlatform } from '@mikro-orm/oracledb';

describe('quoteJsonKey escapes JSON path specials', () => {
  test.each([
    ['mysql', new MySqlPlatform()],
    ['mariadb', new MariaDbPlatform()],
    ['sqlite', new SqlitePlatform()],
    ['mssql', new MsSqlPlatform()],
    ['oracle', new OraclePlatform()],
  ])('[%s]', (_, platform) => {
    expect(platform.quoteJsonKey('foo')).toBe('foo');
    expect(platform.quoteJsonKey('foo_bar1')).toBe('foo_bar1');
    expect(platform.quoteJsonKey('with space')).toBe('"with space"');
    expect(platform.quoteJsonKey("with'quote")).toBe(`"with'quote"`);
    expect(platform.quoteJsonKey('with"dq')).toBe('"with\\"dq"');
    expect(platform.quoteJsonKey('with\\bs')).toBe('"with\\\\bs"');
  });
});

describe('quoteValue escapes embedded single quotes per dialect', () => {
  const evil = "x') OR 1=1 -- ";

  test('mysql / mariadb (backslash escape)', () => {
    expect(new MySqlPlatform().quoteValue(evil)).toBe(`'x\\') OR 1=1 -- '`);
    expect(new MariaDbPlatform().quoteValue(evil)).toBe(`'x\\') OR 1=1 -- '`);
  });

  test('sqlite / mssql / oracle / postgres (doubled-quote escape)', () => {
    expect(new SqlitePlatform().quoteValue(evil)).toBe(`'x'') OR 1=1 -- '`);
    expect(new MsSqlPlatform().quoteValue(evil)).toBe(`'x'') OR 1=1 -- '`);
    expect(new OraclePlatform().quoteValue(evil)).toBe(`'x'') OR 1=1 -- '`);
    expect(new PostgreSqlPlatform().quoteValue(evil)).toBe(`'x'') OR 1=1 -- '`);
  });
});

describe('getSearchJsonPropertyKey embeds attacker keys via quoteValue', () => {
  const evil = "x') OR 1=1 -- ";

  test('mysql', () => {
    const sql = (new MySqlPlatform().getSearchJsonPropertyKey(['meta', evil], 'string', false) as { sql: string }).sql;
    expect(sql).toBe("json_extract(`meta`, '$.\\\"x\\') OR 1=1 -- \\\"')");
  });

  test('mariadb', () => {
    const sql = (new MariaDbPlatform().getSearchJsonPropertyKey(['meta', evil], 'string', false) as { sql: string })
      .sql;
    expect(sql).toBe("json_extract(`meta`, '$.\\\"x\\') OR 1=1 -- \\\"')");
  });

  test('sqlite', () => {
    const sql = (new SqlitePlatform().getSearchJsonPropertyKey(['meta', evil], 'string', false) as { sql: string }).sql;
    expect(sql).toBe(`json_extract(\`meta\`, '$."x'') OR 1=1 -- "')`);
  });

  test('mssql', () => {
    const sql = (new MsSqlPlatform().getSearchJsonPropertyKey(['meta', evil], 'string', false) as { sql: string }).sql;
    expect(sql).toBe(`json_value([meta], '$."x'') OR 1=1 -- "')`);
  });

  test('oracle', () => {
    const sql = (
      new OraclePlatform().getSearchJsonPropertyKey(['meta', evil], 'string', false) as unknown as { sql: string }
    ).sql;
    expect(sql).toBe(`json_value("meta", '$."x'') OR 1=1 -- "')`);
  });
});
