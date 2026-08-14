import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const User = defineEntity({
  name: 'User',
  properties: () => ({
    id: p.integer().primary().autoincrement(),
    name: p.string(),
  }),
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('em.find() does not mutate the options object', async () => {
  const options = Object.freeze({ filters: false });
  await orm.em.find(User, {}, options);
  expect(options).toEqual({ filters: false });
});

test('em.findOne() does not mutate the options object', async () => {
  const options = Object.freeze({ filters: false });
  await orm.em.findOne(User, { id: 1 }, options);
  expect(options).toEqual({ filters: false });
});

test('em.findAndCount() does not mutate the options object', async () => {
  const options = Object.freeze({ filters: false });
  await orm.em.findAndCount(User, {}, options);
  expect(options).toEqual({ filters: false });
});

test('em.findByCursor() does not mutate the options object', async () => {
  const options = Object.freeze({ first: 1, orderBy: { id: 'asc' } } as const);
  await orm.em.findByCursor(User, options);
  expect(options).toEqual({ first: 1, orderBy: { id: 'asc' } });
});

test('em.count() does not mutate the options object', async () => {
  const options = Object.freeze({ filters: false });
  await orm.em.count(User, {}, options);
  expect(options).toEqual({ filters: false });
});

test('em.stream() does not mutate the options object', async () => {
  const options = Object.freeze({ filters: false });

  for await (const user of orm.em.stream(User, options)) {
    expect(user).toBeDefined();
  }

  expect(options).toEqual({ filters: false });
});
