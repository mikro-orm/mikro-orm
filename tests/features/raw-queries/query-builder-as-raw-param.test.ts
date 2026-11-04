import { EntitySchema, MikroORM, raw, sql } from '@mikro-orm/sqlite';

const User = new EntitySchema<{ id: number; age: number }>({
  name: 'User',
  properties: {
    id: { type: 'number', primary: true },
    age: { type: 'number' },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ dbName: ':memory:', entities: [User] });
  await orm.schema.create();
  await orm.em.insertMany(User, [
    { id: 1, age: 20 },
    { id: 2, age: 30 },
  ]);
});

afterAll(() => orm.close(true));

describe('QueryBuilder passed as a raw fragment parameter', () => {
  const subQuery = 'select `k`.`id` from `user` as `k` where `k`.`age` > 25';

  test('sql tag embeds it as a sub-query', async () => {
    const em = orm.em.fork();
    const keep = em
      .createQueryBuilder(User, 'k')
      .select('k.id')
      .where({ age: { $gt: 25 } });
    const qb = em
      .createQueryBuilder(User)
      .select('id')
      .where(sql`id not in (${keep})`);

    expect(qb.getFormattedQuery()).toBe(`select \`u0\`.\`id\` from \`user\` as \`u0\` where (id not in (${subQuery}))`);
    expect((await qb.getResultList()).map(u => u.id)).toEqual([1]);
  });

  test('raw() embeds it with positional and named parameters', () => {
    const em = orm.em.fork();
    const keep = em
      .createQueryBuilder(User, 'k')
      .select('k.id')
      .where({ age: { $gt: 25 } });
    const qb1 = em
      .createQueryBuilder(User)
      .select('id')
      .where(raw('id in (?)', [keep]));
    const qb2 = em.createQueryBuilder(User).select('id').where(raw('id in (:keep)', { keep }));
    const expected = `select \`u0\`.\`id\` from \`user\` as \`u0\` where (id in (${subQuery}))`;

    expect(qb1.getFormattedQuery()).toBe(expected);
    expect(qb2.getFormattedQuery()).toBe(expected);
  });

  test('qb.where() with parameters embeds it', async () => {
    const em = orm.em.fork();
    const keep = em
      .createQueryBuilder(User, 'k')
      .select('k.id')
      .where({ age: { $gt: 25 } });
    const res = await em.createQueryBuilder(User).select('id').where('id in (?)', [keep]).getResultList();

    expect(res.map(u => u.id)).toEqual([2]);
  });
});
