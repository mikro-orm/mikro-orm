import { defineEntity, type EntityManager, MikroORM, p, Type, wrap } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

class CsvType extends Type<string[], string> {
  convertToDatabaseValue(value: string[]): string {
    return value.join(',');
  }

  convertToJSValue(value: string): string[] {
    return value.split(',');
  }

  getColumnType(): string {
    return 'text';
  }
}

const Address = defineEntity({
  name: 'Address',
  embeddable: true,
  properties: {
    city: p.string(),
    meta: p.json<{ zip: string }>().nullable(),
  },
});

const Publisher = defineEntity({
  name: 'Publisher',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    born: p.datetime().nullable(),
    birthday: p.date().nullable(),
    tags: p.type(CsvType).nullable(),
    data: p.json<{ foo: { bar: number[] } }>().nullable(),
    big: p.bigint().nullable(),
    bin: p.blob().nullable(),
    address: () => p.embedded(Address).nullable(),
    publisher: () => p.manyToOne(Publisher).nullable(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book, Publisher, Address],
    dbName: 'mikro_orm_test_map_snapshot',
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  const em = orm.em.fork();
  const publisher = em.create(Publisher, { id: 1, name: 'p' });
  const author = em.create(Author, {
    id: 1,
    name: 'a',
    born: new Date('2020-01-02T03:04:05.000Z'),
    birthday: '2020-01-02',
    tags: ['x', 'y'],
    data: { foo: { bar: [1, 2] } },
    big: 123n,
    bin: Buffer.from('abc'),
    address: { city: 'c', meta: { zip: '123' } },
    publisher,
  });
  em.create(Book, { id: 1, title: 't', author });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

const loaders = {
  find: (em: EntityManager) => em.findOneOrFail(Author, 1),
  map: async (em: EntityManager) => em.map(Author, (await em.execute('select * from author where id = 1'))[0]),
  qb: async (em: EntityManager) => (await em.createQueryBuilder(Author).where({ id: 1 }).getSingleResult())!,
};

test('em.map() and qb.getResult() take the same snapshot as em.find()', async () => {
  const em = orm.em.fork();
  const found = await loaders.find(orm.em.fork());
  const mapped = await loaders.map(em);
  const fromQb = await loaders.qb(orm.em.fork());

  const expected = wrap(found, true).__originalEntityData;
  expect(wrap(mapped, true).__originalEntityData).toEqual(expected);
  expect(wrap(fromQb, true).__originalEntityData).toEqual(expected);
  expect(mapped.books.isInitialized()).toBe(false);

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test.each(Object.keys(loaders) as (keyof typeof loaders)[])(
  'in-place changes of an entity loaded via %s are flushed',
  async type => {
    const em = orm.em.fork();
    const author = await loaders[type](em);
    author.data!.foo.bar.push(3);
    author.born!.setUTCFullYear(2021);
    author.tags!.push('z');
    author.bin![0] = 120;
    author.address!.meta!.zip = '456';

    const mock = mockLogger(orm);
    await em.flush();
    expect(mock.mock.calls).toHaveLength(3);
    const update = mock.mock.calls[1][0];
    expect(update).toContain(`"born" = '2021-01-02T03:04:05.000Z'`);
    expect(update).toContain(`"tags" = 'x,y,z'`);
    expect(update).toContain(`"data" = '{"foo":{"bar":[1,2,3]}}'`);
    expect(update).toContain(`"bin" = E'\\\\x786263'`);
    expect(update).toContain(`"address_meta" = '{"zip":"456"}'`);

    const reloaded = await orm.em.fork().findOneOrFail(Author, 1);
    expect(reloaded.born!.getUTCFullYear()).toBe(2021);
    expect(reloaded.tags).toEqual(['x', 'y', 'z']);
    expect(reloaded.data).toEqual({ foo: { bar: [1, 2, 3] } });
    expect(reloaded.bin!.toString()).toBe('xbc');
    expect(reloaded.address!.meta).toEqual({ zip: '456' });
  },
);

test('em.merge() of JS-form data and of an already managed entity keeps its behavior', async () => {
  const em = orm.em.fork();
  const merged = em.merge(Author, {
    id: 1,
    name: 'a',
    born: new Date('2020-01-02T03:04:05.000Z'),
    tags: ['x', 'y'],
    data: { foo: { bar: [1, 2] } },
  });
  expect(wrap(merged, true).__originalEntityData).toMatchObject({ tags: 'x,y', data: '{"foo":{"bar":[1,2]}}' });

  const loaded = await em.findOneOrFail(Author, 1);
  expect(loaded).toBe(merged);
  loaded.name = 'changed';
  expect(await loaders.map(em)).toBe(loaded);

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});
