import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

const softDelete = { softDelete: { name: 'softDelete', cond: { deletedAt: null }, default: true } };

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    deletedAt: p.datetime().nullable(),
    manager: () => p.manyToOne(User).nullable(),
  },
  filters: softDelete,
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    deletedAt: p.datetime().nullable(),
  },
  filters: softDelete,
});

const OverrideFirst = defineEntity({
  name: 'OverrideFirst',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    createdBy: () => p.manyToOne(User).filters({ softDelete: false }),
    author: () => p.manyToOne(Author),
  },
});

const OverrideLast = defineEntity({
  name: 'OverrideLast',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
    createdBy: () => p.manyToOne(User).filters({ softDelete: false }),
  },
});

describe.each([OverrideFirst, OverrideLast])('relation `filters` override scope ($meta.className)', Book => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [User, Author, OverrideFirst, OverrideLast], dbName: ':memory:' });
    await orm.schema.refresh();
    const boss = orm.em.create(User, { name: 'boss', deletedAt: new Date() });
    const alice = orm.em.create(User, { name: 'alice', manager: boss });
    const alive = orm.em.create(Author, { name: 'alive' });
    const dead = orm.em.create(Author, { name: 'dead', deletedAt: new Date() });
    orm.em.create(Book, { title: 'b1', createdBy: alice, author: alive });
    orm.em.create(Book, { title: 'b2', createdBy: alice, author: dead });
    await orm.em.flush();
  });

  beforeEach(() => orm.em.clear());
  afterAll(() => orm.close(true));

  test('does not apply to sibling relations', async () => {
    const books = await orm.em.find(Book, {});
    expect(books.map(b => b.title)).toEqual(['b1']);
  });

  test('does not apply to sibling relations joined via where condition', async () => {
    const books = await orm.em.find(Book, { createdBy: { name: 'alice' }, author: { name: 'dead' } });
    expect(books).toHaveLength(0);
  });

  test('applies to nested relations joined via where condition', async () => {
    const books = await orm.em.find(Book, { createdBy: { manager: { name: 'boss' } } });
    expect(books.map(b => b.title)).toEqual(['b1']);
  });

  test.each(['joined', 'select-in'] as const)('applies to nested relations when populating (%s)', async strategy => {
    const [book] = await orm.em.find(Book, {}, { populate: ['createdBy.manager'], strategy });
    expect(book.createdBy.manager?.name).toBe('boss');
  });

  test('does not auto-join nested relations of the populated relation', async () => {
    const mock = mockLogger(orm, ['query']);
    await orm.em.find(Book, {}, { populate: ['createdBy'], strategy: 'joined' });
    expect(mock.mock.calls[0][0].match(/join `user`/g)).toHaveLength(1);
  });
});
