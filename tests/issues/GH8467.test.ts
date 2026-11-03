import { defineEntity, MikroORM, p, Type } from '@mikro-orm/sqlite';

class PrefixedType extends Type<string, string> {
  override convertToDatabaseValue(value: string): string {
    return `custom:${value}`;
  }

  override convertToJSValue(value: string): string {
    return value.slice(7);
  }

  override getColumnType(): string {
    return 'text';
  }
}

const Tag = defineEntity({
  name: 'Tag',
  properties: {
    id: p.type(PrefixedType).primary(),
  },
});

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    events: () => p.oneToMany(Event).mappedBy('user'),
    tags: () => p.manyToMany(Tag),
  },
});

const Event = defineEntity({
  name: 'Event',
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(User),
    code: p.type(PrefixedType),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [User, Event, Tag], dbName: ':memory:' });
  await orm.schema.create();
  const em = orm.em.fork();
  em.create(User, { id: 1, tags: [em.create(Tag, { id: 'x' })] });
  em.create(User, { id: 2, tags: [em.create(Tag, { id: 'y' })] });
  em.create(Event, { user: 1, code: 'a' });
  em.create(Event, { user: 2, code: 'b' });
  await em.flush();
});

afterAll(() => orm.close(true));

test('collection operators convert custom types in nested filters only once', async () => {
  const em = orm.em.fork();
  const some = await em.find(User, { events: { $some: { code: 'a' } } });
  expect(some.map(u => u.id)).toEqual([1]);

  const none = await em.find(User, { events: { $none: { code: 'a' } } });
  expect(none.map(u => u.id)).toEqual([2]);

  const every = await em.find(User, { events: { $every: { code: 'a' } } });
  expect(every.map(u => u.id)).toEqual([1]);

  const all = await em.find(User, { events: { $all: [{ code: 'a' }] } });
  expect(all.map(u => u.id)).toEqual([1]);
});

test('collection operators convert custom type primary keys only once', async () => {
  const em = orm.em.fork();
  const some = await em.find(User, { tags: { $some: 'x' } });
  expect(some.map(u => u.id)).toEqual([1]);

  const all = await em.find(User, { tags: { $all: ['x'] } });
  expect(all.map(u => u.id)).toEqual([1]);

  const allObjects = await em.find(User, { tags: { $all: [{ id: 'x' }] } });
  expect(allObjects.map(u => u.id)).toEqual([1]);

  const allOperators = await em.find(User, { tags: { $all: [{ id: { $in: ['x'] } }] } });
  expect(allOperators.map(u => u.id)).toEqual([1]);
});

test('collection operators in query builder convert custom types only once', async () => {
  const res = await orm.em
    .fork()
    .createQueryBuilder(User, 'u')
    .where({ events: { $some: { code: 'a' } } })
    .getResult();
  expect(res.map(u => u.id)).toEqual([1]);
});
