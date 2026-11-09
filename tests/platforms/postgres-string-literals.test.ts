import { PostgreSqlPlatform } from '@mikro-orm/postgresql';

test('postgres escapes quotes and backslashes in string literals', () => {
  const platform = new PostgreSqlPlatform();
  expect(platform.formatQuery('select ?', [''])).toBe(`select ''`);
  expect(platform.formatQuery('select ?', [`it's 'quoted'`])).toBe(`select 'it''s ''quoted'''`);
  expect(platform.formatQuery('select ?', ['a\\b'])).toBe(`select  E'a\\\\b'`);
  expect(platform.formatQuery('select ?', [`a\\'b`])).toBe(`select  E'a\\\\''b'`);
  expect(platform.formatQuery('select ?', ['$&$1'])).toBe(`select '$&$1'`);
  expect(platform.formatQuery('select ?', ["\\\\''"])).toBe(`select  E'\\\\\\\\'''''`);
});
