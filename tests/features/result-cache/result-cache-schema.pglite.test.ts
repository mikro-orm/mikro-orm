import { defineEntity, MikroORM, p, wrap } from '@mikro-orm/pglite';
import { mockLogger } from '../../helpers.js';

const Author = defineEntity({
  name: 'CachedAuthor',
  schema: '*',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Book = defineEntity({
  name: 'CachedBook',
  schema: '*',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: p.manyToOne(Author),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Author, Book], dbName: 'memory://' });

  for (const schema of ['public', 'tenant']) {
    await orm.schema.create({ schema });
    await orm.em.insert(Author, { id: 1, name: `${schema} author` }, { schema });
    await orm.em.insert(Book, { id: 1, title: `${schema} book`, author: 1 }, { schema });
  }
});

beforeEach(async () => {
  await orm.config.getResultCacheAdapter().clear();

  for (const schema of ['public', 'tenant']) {
    await orm.em.nativeUpdate(Book, 1, { title: `${schema} book` }, { schema });
  }
});

afterAll(() => orm.close(true));

describe.each(['find', 'findOne'] as const)('%s', method => {
  test.each(['query', 'fork'] as const)('cache preserves the schema supplied through the %s', async source => {
    const em = orm.em.fork({ schema: source === 'fork' ? 'tenant' : undefined });
    const options = {
      schema: source === 'query' ? 'tenant' : undefined,
      cache: 60_000,
      populate: ['author'] as const,
    };
    const read = async () =>
      method === 'find' ? (await em.find(Book, { id: 1 }, options))[0] : em.findOneOrFail(Book, { id: 1 }, options);
    const first = await read();
    expect(wrap(first).getSchema()).toBe('tenant');
    em.clear();

    const log = mockLogger(orm, ['query']);
    const cached = await read();
    expect(log).not.toHaveBeenCalled();
    expect(wrap(cached).getSchema()).toBe('tenant');
    expect(wrap(cached.author).getSchema()).toBe('tenant');
    expect(cached.author.name).toBe('tenant author');
  });

  test('a cache hit keeps entities with equal primary keys in different schemas separate', async () => {
    const em = orm.em.fork();
    const options = { schema: 'tenant', cache: 60_000 };
    const read = async () =>
      method === 'find' ? (await em.find(Book, { id: 1 }, options))[0] : em.findOneOrFail(Book, { id: 1 }, options);
    await read();
    em.clear();

    const publicBook = await em.findOneOrFail(Book, 1, { schema: 'public' });
    const tenantBook = await read();
    expect(tenantBook).not.toBe(publicBook);
    expect(publicBook.title).toBe('public book');
    expect(tenantBook.title).toBe('tenant book');
  });
});

test('flushing a cached entity updates only its original schema', async () => {
  const em = orm.em.fork();
  await em.find(Book, { id: 1 }, { schema: 'tenant', cache: 60_000 });
  em.clear();
  const [book] = await em.find(Book, { id: 1 }, { schema: 'tenant', cache: 60_000 });
  book.title = 'changed';
  await em.flush();

  const fresh = em.fork();
  expect((await fresh.findOneOrFail(Book, 1, { schema: 'public' })).title).toBe('public book');
  expect((await fresh.findOneOrFail(Book, 1, { schema: 'tenant' })).title).toBe('changed');
});
