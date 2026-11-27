import { defineEntity, MikroORM, p, raw, sql } from '@mikro-orm/sqlite';
import { MikroORM as PostgreSqlMikroORM } from '@mikro-orm/postgresql';

const Phone = defineEntity({
  name: 'Phone',
  embeddable: true,
  properties: {
    type: p.string().nullable(),
  },
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    age: p.integer().nullable(),
    phones: () => p.embedded(Phone).array().nullable(),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ dbName: ':memory:', entities: [Author, Book, Phone] });
  await orm.schema.create();
  const a1 = orm.em.create(Author, { name: 'a1', age: 30, phones: [{ type: 'home' }] });
  const a2 = orm.em.create(Author, { name: 'a2', age: null, phones: [{ type: null }] });
  orm.em.create(Author, { name: 'a3', age: 40, phones: [{ type: 'work' }] });
  orm.em.create(Book, { title: 'b1', author: a1 });
  orm.em.create(Book, { title: 'b2', author: a2 });
  orm.em.create(Book, { title: 'b3', author: null });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

const names = async (where: any) =>
  (await orm.em.fork().find(Author, where, { orderBy: { id: 'asc' } })).map(a => a.name);
const titles = async (where: any) =>
  (await orm.em.fork().find(Book, where, { orderBy: { id: 'asc' } })).map(b => b.title);
const query = (where: any) => orm.em.fork().createQueryBuilder(Author).where(where).getQuery();

test('$in with null matches null rows', async () => {
  expect(await names({ age: { $in: [30, null] } })).toEqual(['a1', 'a2']);
  expect(await names({ age: [30, null] })).toEqual(['a1', 'a2']);
  expect(await names({ age: { $in: [null] } })).toEqual(['a2']);
  expect(await names({ $not: { age: { $in: [30, null] } } })).toEqual(['a3']);
  expect(await names({ age: { $in: [30, null] }, name: { $ne: 'a1' } })).toEqual(['a2']);
  expect(query({ age: { $in: [30, null] } })).toMatch('where (`a0`.`age` in (?) or `a0`.`age` is null)');
  expect(query({ age: { $in: [null] } })).toMatch('where `a0`.`age` is null');
});

test('$nin with null skips null rows', async () => {
  expect(await names({ age: { $nin: [30, null] } })).toEqual(['a3']);
  expect(await names({ age: { $nin: [null] } })).toEqual(['a1', 'a3']);
  expect(await names({ $not: { age: { $nin: [30, null] } } })).toEqual(['a1', 'a2']);
  expect(await names({ $or: [{ age: { $nin: [30, null] } }, { name: 'a2' }] })).toEqual(['a2', 'a3']);
  expect(query({ age: { $nin: [30, null] } })).toMatch('where `a0`.`age` not in (?) and `a0`.`age` is not null');
  expect(query({ age: { $nin: [null] } })).toMatch('where `a0`.`age` is not null');
});

test('$in and $nin with null on a foreign key', async () => {
  expect(await titles({ author: { $in: [1, null] } })).toEqual(['b1', 'b3']);
  expect(await titles({ author: { $nin: [1, null] } })).toEqual(['b2']);
});

test('$in and $nin with null on a raw key', async () => {
  expect(await names({ [raw('age + 1')]: { $in: [31, null] } })).toEqual(['a1', 'a2']);
  expect(await names({ [raw('age + 1')]: { $nin: [31, null] } })).toEqual(['a3']);
});

test('$in and $nin with null on a sub-query', async () => {
  const em = orm.em.fork();
  const lastBook = em
    .createQueryBuilder(Book, 'b')
    .select(raw('max(b.id)'))
    .where({ author: sql.ref('a.id') })
    .getNativeQuery();
  const find = async (where: any) => {
    const qb = em.createQueryBuilder(Author, 'a').select('a.name').withSubQuery(lastBook, 'a.lastBook');
    const res = await qb.where(where).orderBy({ id: 'asc' }).execute();
    return res.map((a: any) => a.name);
  };

  expect(await find({ 'a.lastBook': { $in: [1, null] } })).toEqual(['a1', 'a3']);
  expect(await find({ 'a.lastBook': { $nin: [1, null] } })).toEqual(['a2']);
});

test('$in and $nin with null in embedded array queries', async () => {
  expect(await names({ phones: { type: { $in: ['home', null] } } })).toEqual(['a1', 'a2']);
  expect(await names({ phones: { type: { $in: [null] } } })).toEqual(['a2']);
  expect(await names({ phones: { type: { $nin: ['home', null] } } })).toEqual(['a3']);
  expect(await names({ phones: { type: { $nin: [null] } } })).toEqual(['a1', 'a3']);
  expect(await names({ phones: { $not: { type: { $nin: ['home', null] } } } })).toEqual(['a1', 'a2']);
});

test('$in and $nin with null first on a json property', async () => {
  const Item = defineEntity({
    name: 'Item',
    properties: {
      id: p.integer().primary(),
      name: p.string(),
      meta: p.json<{ n: number | null }>(),
    },
  });
  const pg = await PostgreSqlMikroORM.init({ dbName: 'mikro_orm_test_gh_8828', entities: [Item] });
  await pg.schema.refresh();
  pg.em.create(Item, { name: 'i1', meta: { n: 1 } });
  pg.em.create(Item, { name: 'i2', meta: { n: null } });
  pg.em.create(Item, { name: 'i3', meta: { n: 3 } });
  await pg.em.flush();

  const items = async (where: any) =>
    (await pg.em.fork().find(Item, where, { orderBy: { id: 'asc' } })).map(i => i.name);

  try {
    expect(await items({ meta: { n: { $in: [null, 1] } } })).toEqual(['i1', 'i2']);
    expect(await items({ meta: { n: { $nin: [null, 1] } } })).toEqual(['i3']);
    expect(await items({ meta: { n: { $in: [null] } } })).toEqual(['i2']);
    expect(await items({ meta: { n: { $nin: [null] } } })).toEqual(['i1', 'i3']);
  } finally {
    await pg.schema.drop({ dropDb: true });
    await pg.close(true);
  }
});
