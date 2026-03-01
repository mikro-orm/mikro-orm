import { MikroORM, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { v4 } from 'uuid';
import { Author2, Book2, Car2 } from '../../entities-sql/index.js';
import { initORMMySql } from '../../bootstrap.js';
import { mockLogger } from '../../helpers.js';

describe('QueryBuilder - unionWhere', () => {
  let orm: MikroORM<MySqlDriver>;
  let seq = 0;

  const uniqueEmail = () => `union-test-${++seq}-${Date.now()}@test.com`;

  beforeAll(async () => {
    orm = await initORMMySql(
      'mysql',
      {
        namingStrategy: class NS extends UnderscoreNamingStrategy {
          override aliasName(entityName: string, index: number): string {
            return 'e' + index;
          }
        },
      },
      true,
    );
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  beforeEach(() => {
    orm.em.clear();
  });

  test('unionWhere generates UNION ALL subquery in WHERE', async () => {
    const email = uniqueEmail();
    const author = await orm.em.insert(Author2, { name: 'uw-test-1', email });
    await orm.em.insert(Book2, { uuid: v4(), title: 'b1', author, price: 50 });
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const results = await orm.em.find(Author2, {}, {
      unionWhere: [
        { name: 'uw-test-1' },
        { email },
      ],
    });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('uw-test-1');

    const findSql = mock.mock.calls[0][0] as string;
    expect(findSql).toMatch(/`e0`\.`id` in/);
    expect(findSql).toMatch(/union all/);
  });

  test('unionWhere with relation conditions auto-joins', async () => {
    const email = uniqueEmail();
    const author = await orm.em.insert(Author2, { name: 'uw-rel-test', email });
    await orm.em.insert(Book2, { uuid: v4(), title: 'uw-target-book', author, price: 50 });
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const results = await orm.em.find(Author2, {}, {
      unionWhere: [
        { name: 'uw-rel-test' },
        { books: { title: 'uw-target-book' } },
      ],
    });

    expect(results).toHaveLength(1);

    const findSql = mock.mock.calls[0][0] as string;
    expect(findSql).toMatch(/union all/);
    expect(findSql).toMatch(/`e0`\.`id` in/);
  });

  test('unionWhere with union strategy uses UNION instead of UNION ALL', async () => {
    const email = uniqueEmail();
    await orm.em.insert(Author2, { name: 'uw-union-strat', email });
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    await orm.em.find(Author2, {}, {
      unionWhere: [
        { name: 'uw-union-strat' },
        { email },
      ],
      unionWhereStrategy: 'union',
    });

    const findSql = mock.mock.calls[0][0] as string;
    expect(findSql).toMatch(/ union \(/);
    expect(findSql).not.toMatch(/union all/);
  });

  test('unionWhere composes with limit, offset, and orderBy', async () => {
    for (let i = 0; i < 5; i++) {
      await orm.em.insert(Author2, { name: `uw-page-${String(i).padStart(2, '0')}`, email: uniqueEmail() });
    }
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const results = await orm.em.find(Author2, {}, {
      unionWhere: [
        { name: { $like: 'uw-page-%' } },
        { name: { $like: 'uw-page-0%' } },
      ],
      orderBy: { name: 'ASC' },
      limit: 2,
      offset: 1,
    });

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('uw-page-01');
    expect(results[1].name).toBe('uw-page-02');

    const findSql = mock.mock.calls[0][0] as string;
    expect(findSql).toMatch(/union all/);
    expect(findSql).toMatch(/order by/i);
    expect(findSql).toMatch(/limit/i);
    expect(findSql).toMatch(/offset/i);
  });

  test('findAndCount with unionWhere applies to both queries', async () => {
    for (let i = 0; i < 3; i++) {
      await orm.em.insert(Author2, { name: `uw-fac-${i}`, email: uniqueEmail() });
    }
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const [results, count] = await orm.em.findAndCount(Author2, {}, {
      unionWhere: [
        { name: { $like: 'uw-fac-%' } },
        { name: { $like: 'uw-fac-0' } },
      ],
    });

    expect(results).toHaveLength(3);
    expect(count).toBe(3);

    const queries = mock.mock.calls.map((c: any) => c[0] as string);
    const findQuery = queries.find((s: string) => s.includes('select `e0`'));
    const countQuery = queries.find((s: string) => s.includes('count('));

    expect(findQuery).toMatch(/union all/);
    expect(countQuery).toMatch(/union all/);
  });

  test('unionWhere is a no-op when empty', async () => {
    await orm.em.insert(Author2, { name: 'uw-noop', email: uniqueEmail() });
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    await orm.em.find(Author2, { name: 'uw-noop' }, {
      unionWhere: [],
    });

    const findSql = mock.mock.calls[0][0] as string;
    expect(findSql).not.toMatch(/union/);
  });

  test('findOne with unionWhere', async () => {
    const email = uniqueEmail();
    await orm.em.insert(Author2, { name: 'uw-findone', email });
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const result = await orm.em.findOne(Author2, { name: 'uw-findone' }, {
      unionWhere: [
        { name: 'uw-findone' },
        { email },
      ],
    });

    expect(result).not.toBeNull();
    expect(result!.name).toBe('uw-findone');

    const findSql = mock.mock.calls[0][0] as string;
    expect(findSql).toMatch(/`e0`\.`id` in/);
    expect(findSql).toMatch(/union all/);
  });

  test('unionWhere with relation branch produces join inside union subquery', async () => {
    const email = uniqueEmail();
    const author = await orm.em.insert(Author2, { name: 'uw-join-check', email });
    await orm.em.insert(Book2, { uuid: v4(), title: 'uw-join-book', author, price: 50 });
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    await orm.em.find(Author2, {}, {
      unionWhere: [
        { name: 'uw-join-check' },
        { books: { title: 'uw-join-book' } },
      ],
    });

    const findSql = mock.mock.calls[0][0] as string;
    // The relation branch should contain a join to the books table inside the union subquery
    expect(findSql).toMatch(/union all \(select `e0`\.`id` from `author2` as `e0`/);
    expect(findSql).toMatch(/join `book2`/);
  });

  test('unionWhere preserves main where conditions', async () => {
    await orm.em.insert(Author2, { name: 'uw-keep-included', email: uniqueEmail(), termsAccepted: true });
    await orm.em.insert(Author2, { name: 'uw-keep-excluded', email: uniqueEmail(), termsAccepted: false });
    orm.em.clear();

    const results = await orm.em.find(Author2, { termsAccepted: true }, {
      unionWhere: [
        { name: 'uw-keep-included' },
        { name: 'uw-keep-excluded' },
      ],
    });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('uw-keep-included');
  });

  test('unionWhere with composite PK selects all PK columns', async () => {
    await orm.em.insert(Car2, { name: 'uw-car-a', year: 2020, price: 10000 });
    await orm.em.insert(Car2, { name: 'uw-car-b', year: 2021, price: 20000 });
    await orm.em.insert(Car2, { name: 'uw-car-c', year: 2022, price: 30000 });
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const results = await orm.em.find(Car2, {}, {
      unionWhere: [
        { name: 'uw-car-a' },
        { year: 2021 },
      ],
    });

    expect(results).toHaveLength(2);

    const findSql = mock.mock.calls[0][0] as string;
    expect(findSql).toMatch(/union all/);
    // composite PK: both name and year should be selected in the union subquery
    expect(findSql).toMatch(/`e0`\.`name`/);
    expect(findSql).toMatch(/`e0`\.`year`/);
  });

  test('unionWhere applies default filters inside union branches', async () => {
    const email = uniqueEmail();
    const author = await orm.em.insert(Author2, { name: 'uw-filter-test', email });
    await orm.em.insert(Book2, { uuid: v4(), title: 'uw-filter-book-a', author, price: 50 });
    await orm.em.insert(Book2, { uuid: v4(), title: 'uw-filter-book-b', author, price: 60 });
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    // Book2 has a default `hasAuthor` filter (author != null)
    const results = await orm.em.find(Book2, {}, {
      unionWhere: [
        { title: 'uw-filter-book-a' },
        { title: 'uw-filter-book-b' },
      ],
    });

    expect(results).toHaveLength(2);

    const findSql = mock.mock.calls[0][0] as string;
    expect(findSql).toMatch(/union all/);
    // The hasAuthor filter should be applied inside the union subquery
    expect(findSql).toMatch(/`author_id` is not null/);
  });

  test('findOneOrFail with unionWhere', async () => {
    const email = uniqueEmail();
    await orm.em.insert(Author2, { name: 'uw-foof', email });
    orm.em.clear();

    const result = await orm.em.findOneOrFail(Author2, { name: 'uw-foof' }, {
      unionWhere: [
        { name: 'uw-foof' },
        { email },
      ],
    });

    expect(result.name).toBe('uw-foof');

    // should throw when no match
    await expect(orm.em.findOneOrFail(Author2, { name: 'uw-nonexistent' }, {
      unionWhere: [
        { name: 'uw-nonexistent' },
      ],
    })).rejects.toThrow(/Author2 not found/);
  });

  test('nativeUpdate with unionWhere', async () => {
    const email1 = uniqueEmail();
    const email2 = uniqueEmail();
    await orm.em.insert(Author2, { name: 'uw-upd-1', email: email1 });
    await orm.em.insert(Author2, { name: 'uw-upd-2', email: email2 });
    await orm.em.insert(Author2, { name: 'uw-upd-3', email: uniqueEmail() });
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const affected = await orm.em.nativeUpdate(Author2, {}, { name: 'uw-updated' }, {
      unionWhere: [
        { name: 'uw-upd-1' },
        { email: email2 },
      ],
    });

    expect(affected).toBe(2);

    const updateSql = mock.mock.calls[0][0] as string;
    expect(updateSql).toMatch(/update/i);
    expect(updateSql).toMatch(/`id` in/);
    expect(updateSql).toMatch(/union all/);

    // uw-upd-3 should not be updated
    const remaining = await orm.em.findOne(Author2, { name: 'uw-upd-3' });
    expect(remaining).not.toBeNull();
  });

  test('nativeDelete with unionWhere', async () => {
    const email1 = uniqueEmail();
    const email2 = uniqueEmail();
    await orm.em.insert(Author2, { name: 'uw-del-1', email: email1 });
    await orm.em.insert(Author2, { name: 'uw-del-2', email: email2 });
    await orm.em.insert(Author2, { name: 'uw-del-3', email: uniqueEmail() });
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);

    const affected = await orm.em.nativeDelete(Author2, {}, {
      unionWhere: [
        { name: 'uw-del-1' },
        { email: email2 },
      ],
    });

    expect(affected).toBe(2);

    const deleteSql = mock.mock.calls[0][0] as string;
    expect(deleteSql).toMatch(/delete/i);
    expect(deleteSql).toMatch(/`id` in/);
    expect(deleteSql).toMatch(/union all/);

    // uw-del-3 should still exist
    const remaining = await orm.em.findOne(Author2, { name: 'uw-del-3' });
    expect(remaining).not.toBeNull();
  });

});
