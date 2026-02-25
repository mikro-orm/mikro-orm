import { MikroORM, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { v4 } from 'uuid';
import { Author2, Book2 } from '../../entities-sql/index.js';
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
});
