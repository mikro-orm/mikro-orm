import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Author = defineEntity({
  name: 'Author',
  properties: { id: p.integer().primary() },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: p.manyToOne(Author),
    editor: p.manyToOne(Author),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Author, Book], dbName: ':memory:' });
  await orm.schema.create();
  await orm.em.insertMany(Author, [{ id: 1 }, { id: 2 }, { id: 3 }]);
});

beforeEach(async () => {
  await orm.em.nativeDelete(Book, {});
  await orm.em.insertMany(Book, [
    { id: 1, title: 'allowed', author: 1, editor: 1 },
    { id: 2, title: 'forbidden', author: 1, editor: 2 },
    { id: 3, title: 'allowed', author: 3, editor: 2 },
  ]);
});

afterAll(() => orm.close(true));

test.each(['$and', '$or'] as const)('lifting %s preserves an existing group at the root', async operator => {
  const root =
    operator === '$or' ? [{ title: 'allowed' }, { title: 'also allowed' }] : [{ title: 'allowed' }, { id: { $gt: 0 } }];
  const author = operator === '$or' ? [{ id: 1 }, { id: 2 }] : [{ id: { $gte: 1 } }, { id: { $lte: 2 } }];
  const where = {
    [operator]: root,
    author: { [operator]: author },
  };

  const original = structuredClone(where);
  const books = await orm.em.fork().find(Book, where);
  expect(books.map(book => book.id)).toEqual([1]);
  expect(where).toEqual(original);
});

test.each(['$and', '$or'] as const)('lifting %s from two relations preserves both groups', async operator => {
  const author = operator === '$or' ? [{ id: 1 }, { id: 2 }] : [{ id: { $gte: 1 } }, { id: { $lte: 2 } }];
  const editor = operator === '$or' ? [{ id: 2 }, { id: 3 }] : [{ id: { $gte: 2 } }, { id: { $lte: 3 } }];
  const books = await orm.em.fork().find(Book, {
    author: { [operator]: author },
    editor: { [operator]: editor },
  });

  expect(books.map(book => book.id)).toEqual([2]);
});

test('lifting a disjunction preserves an existing conjunction and scalar condition', async () => {
  const books = await orm.em.fork().find(Book, {
    $or: [{ title: 'allowed' }, { title: 'also allowed' }],
    $and: [{ id: { $ne: 3 } }],
    id: { $gt: 0 },
    author: { $or: [{ id: 1 }, { id: 2 }] },
  });

  expect(books.map(book => book.id)).toEqual([1]);
});

test.each(['nativeUpdate', 'nativeDelete'] as const)('%s preserves every filter group', async method => {
  const em = orm.em.fork();
  const where = {
    $or: [{ title: 'allowed' }, { title: 'also allowed' }],
    author: { $or: [{ id: 1 }, { id: 2 }] },
  };
  const affected =
    method === 'nativeUpdate'
      ? await em.nativeUpdate(Book, where, { title: 'updated' })
      : await em.nativeDelete(Book, where);

  expect(affected).toBe(1);
  expect((await em.findOneOrFail(Book, 2)).title).toBe('forbidden');
});
