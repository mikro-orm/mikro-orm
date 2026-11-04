import { MikroORM, defineEntity, p, raw } from '@mikro-orm/sqlite';

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    score: p.bigint(),
    name: p.string(),
    age: p.integer(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Author], dbName: ':memory:' });
  await orm.schema.create();
  orm.em.create(Author, { name: 'Jon', age: 20, score: 1n });
  orm.em.create(Author, { name: 'Kim', age: 30, score: 2n });
  orm.em.create(Author, { name: 'Kate', age: 40, score: 3n });
  await orm.em.flush();
});

beforeEach(() => orm.config.getResultCacheAdapter().clear());
afterAll(() => orm.close(true));

test('bigint raw params get their own cache entries', async () => {
  const find = (score: bigint) =>
    orm.em.fork().find(Author, { [raw('score + 0')]: raw('?', [score]) }, { cache: true });
  const r1 = await find(1n);
  const r2 = await find(2n);
  expect(r1.map(a => a.name)).toEqual(['Jon']);
  expect(r2.map(a => a.name)).toEqual(['Kim']);
});

test('sub-query values get their own cache entries', async () => {
  const sub = (age: number) =>
    orm.em
      .createQueryBuilder(Author)
      .select('id')
      .where({ age: { $gt: age } });
  const r1 = await orm.em.fork().find(Author, { id: { $in: sub(15) } }, { cache: true, orderBy: { id: 1 } });
  const r2 = await orm.em.fork().find(Author, { id: { $in: sub(35) } }, { cache: true, orderBy: { id: 1 } });
  expect(r1.map(a => a.name)).toEqual(['Jon', 'Kim', 'Kate']);
  expect(r2.map(a => a.name)).toEqual(['Kate']);
});
