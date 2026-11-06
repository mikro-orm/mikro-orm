import { defineEntity, helper, p, serialize, SerializationContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

const Publisher = defineEntity({
  name: 'Publisher',
  properties: {
    id: p.integer().primary(),
    authors: () => p.oneToMany(Author).mappedBy('publisher'),
  },
});

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    publisher: () => p.manyToOne(Publisher),
  },
});

const COUNT = 100;
let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Publisher, Author],
  });
  await orm.schema.create();

  const publisher = orm.em.create(Publisher, {});

  for (let i = 0; i < COUNT; i++) {
    orm.em.create(Author, { name: `a${i}`, publisher });
  }

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('serializing rows that share a relation does not walk the whole graph per row (GH #8616)', async () => {
  const em = orm.em.fork();
  // each author reaches every other author through `publisher.authors`
  await em.find(Publisher, {}, { populate: ['authors'] });
  const authors = await em.find(Author, {});
  const register = vi.spyOn(SerializationContext.prototype as any, 'register');

  const dtos = serialize(authors);
  expect(dtos).toHaveLength(COUNT);
  expect(dtos[0]).toEqual({ id: 1, name: 'a0', publisher: 1 });
  // root + direct relation per row, not the whole connected graph
  expect(register.mock.calls.length).toBeLessThanOrEqual(COUNT * 2);

  register.mockClear();
  const json = JSON.parse(JSON.stringify(authors));
  expect(json[0]).toEqual({ id: 1, name: 'a0', publisher: 1 });
  expect(register.mock.calls.length).toBeLessThanOrEqual(COUNT * 2);

  register.mockClear();
  const populated = serialize(authors, { populate: ['publisher.authors'] });
  expect(populated[0].publisher.authors).toHaveLength(COUNT);
  expect(populated[0].publisher.authors[1]).toEqual({ id: 2, name: 'a1', publisher: 1 });
  // about two registrations per serialized entity, proportional to the output and not to rows times the graph
  expect(register.mock.calls.length).toBeLessThanOrEqual(COUNT * (COUNT + 1) * 2);
  // no context leaks out of a finished serialization
  expect(helper(authors[0]).__serializationContext.root).toBeUndefined();
  expect(helper(authors[0].publisher).__serializationContext.root).toBeUndefined();
});
