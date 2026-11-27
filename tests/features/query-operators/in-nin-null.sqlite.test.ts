import { defineEntity, MikroORM, p, raw, sql } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

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

test('$in with null matches rows where the column is null', async () => {
  const mock = mockLogger(orm, ['query']);
  expect(await names({ age: { $in: [30, null] } })).toEqual(['a1', 'a2']);
  expect(mock.mock.calls[0][0]).toMatch('where (`a0`.`age` in (?) or `a0`.`age` is null)');
  expect(await names({ age: [30, null] })).toEqual(['a1', 'a2']);
  expect(await names({ age: { $in: [null] } })).toEqual(['a2']);
  expect(mock.mock.calls[2][0]).toMatch('where `a0`.`age` is null');
  expect(await orm.em.fork().count(Author, { age: { $in: [30, null] } })).toBe(2);
});

test('$nin with null skips rows where the column is null', async () => {
  const mock = mockLogger(orm, ['query']);
  expect(await names({ age: { $nin: [30, null] } })).toEqual(['a3']);
  expect(mock.mock.calls[0][0]).toMatch('where (`a0`.`age` not in (?) and `a0`.`age` is not null)');
  expect(await names({ age: { $nin: [null] } })).toEqual(['a1', 'a3']);
  expect(mock.mock.calls[1][0]).toMatch('where `a0`.`age` is not null');
});

test('lists without null are unchanged', async () => {
  expect(await names({ age: { $in: [30, 40] } })).toEqual(['a1', 'a3']);
  expect(await names({ age: { $nin: [30] } })).toEqual(['a3']);
  expect(await names({ age: { $in: [] } })).toEqual([]);
  expect(await names({ age: { $nin: [] } })).toEqual(['a1', 'a2', 'a3']);
});

test('$in and $nin with null on a foreign key', async () => {
  const a1 = await orm.em.fork().findOneOrFail(Author, { name: 'a1' });
  expect(await titles({ author: { $in: [a1.id, null] } })).toEqual(['b1', 'b3']);
  expect(await titles({ author: { $nin: [a1.id, null] } })).toEqual(['b2']);
});

test('$in and $nin with null combined with other conditions', async () => {
  expect(await names({ age: { $in: [30, null] }, name: { $ne: 'a1' } })).toEqual(['a2']);
  expect(await names({ $or: [{ age: { $in: [null] } }, { name: 'a3' }] })).toEqual(['a2', 'a3']);
  expect(await names({ age: { $nin: [30, null], $lt: 50 } })).toEqual(['a3']);
  expect(await names({ $not: { age: { $nin: [30, null] } } })).toEqual(['a1', 'a2']);
  expect(await names({ $not: { age: { $in: [30, null] } } })).toEqual(['a3']);
});

test('row value lists are left to the tuple handling', async () => {
  const qb = orm.em
    .fork()
    .createQueryBuilder(Author)
    .where({ [raw('(id, age)')]: { $in: [[1, 30], null] } } as any);
  expect(qb.getQuery()).not.toMatch('is null');
});

test('$in and $nin with null in embedded array queries', async () => {
  expect(await names({ phones: { type: { $in: ['home', null] } } })).toEqual(['a1', 'a2']);
  expect(await names({ phones: { type: { $in: [null] } } })).toEqual(['a2']);
  expect(await names({ phones: { type: { $nin: ['home', null] } } })).toEqual(['a3']);
  expect(await names({ phones: { type: { $nin: [null] } } })).toEqual(['a1', 'a3']);
  expect(await names({ phones: { $not: { type: { $nin: ['home', null] } } } })).toEqual(['a1', 'a2']);
});

test('$in and $nin with null on a sub-query', async () => {
  const em = orm.em.fork();
  const lastBook = em
    .createQueryBuilder(Book, 'b')
    .select(raw('max(b.id)'))
    .where({ author: sql.ref('a.id') })
    .getNativeQuery();
  const lastBookId = (await em.findOneOrFail(Book, { title: 'b1' })).id;
  const query = (where: any) =>
    em
      .createQueryBuilder(Author, 'a')
      .select('a.name')
      .withSubQuery(lastBook, 'a.lastBook')
      .where(where)
      .orderBy({ id: 'asc' });

  const qb = query({ 'a.lastBook': { $in: [lastBookId, null] } });
  const sub = '(select max(b.id) from `book` as `b` where `b`.`author_id` = `a`.`id`)';
  expect(qb.getQuery()).toMatch(`where (${sub} in (?) or ${sub} is null)`);
  expect(query({ 'a.lastBook': { $nin: [lastBookId, null] } }).getQuery()).toMatch(
    `where (${sub} not in (?) and ${sub} is not null)`,
  );
  expect(query({ 'a.lastBook': { $in: [null] } }).getQuery()).toMatch(`where ${sub} is null`);
  expect((await qb.execute()).map((a: any) => a.name)).toEqual(['a1', 'a3']);
  expect((await query({ 'a.lastBook': { $nin: [lastBookId, null] } }).execute()).map((a: any) => a.name)).toEqual([
    'a2',
  ]);
  expect((await query({ 'a.lastBook': { $in: [null] } }).execute()).map((a: any) => a.name)).toEqual(['a3']);
});
