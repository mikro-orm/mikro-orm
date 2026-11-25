import { raw } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ dbName: ':memory:', discovery: { warnWhenNoEntities: false } });
});

afterAll(() => orm.close(true));

describe('negative parameter directly after a minus', () => {
  test.each([
    ['number', [-1]],
    ['bigint', [-1n]],
    ['array starting with a negative number', [[-1]]],
    ['nested raw fragment', [raw('?', [-1])]],
  ])('%s is subtracted instead of starting a line comment', async (_, params) => {
    const sql = 'select 1 as ok where 2 = 2-? and 1 = 0';
    expect(orm.em.getPlatform().formatQuery(sql, params)).toBe('select 1 as ok where 2 = 2- -1 and 1 = 0');
    await expect(orm.em.execute(sql, params)).resolves.toEqual([]);
  });

  test('named parameter is subtracted instead of starting a line comment', async () => {
    await expect(orm.em.execute('select 1 as ok where 2 = 2-:value and 1 = 0', { value: -1 })).resolves.toEqual([]);
  });

  test('raw fragment ending with a minus before its placeholder', async () => {
    const res = await orm.em.execute('select 1 as ok where 2 = ? and 1 = 0', [raw('2-?', [-1])]);
    expect(res).toEqual([]);
  });

  test('negative infinity does not start a line comment', () => {
    expect(orm.em.getPlatform().formatQuery('select 2-? as x', [-Infinity])).toBe('select 2- -Infinity as x');
  });

  test('other values keep their formatting', () => {
    const platform = orm.em.getPlatform();
    expect(platform.formatQuery('select 2-? as a, ? as b, 2 - ? as c', [1, -1, -1])).toBe(
      'select 2-1 as a, -1 as b, 2 - -1 as c',
    );
    expect(platform.formatQuery('?', [-1])).toBe('-1');
  });
});
