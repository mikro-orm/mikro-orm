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

test('em.merge() does not mutate the options object', () => {
  const options = Object.freeze({ refresh: true });
  orm.em.fork().merge(User, { id: 1, name: 'n' }, options);
  expect(options).toEqual({ refresh: true });
});

test('em.create() does not mutate the options object', () => {
  const options = Object.freeze({ partial: true } as const);
  orm.em.fork().create(User, { name: 'n' }, options);
  expect(options).toEqual({ partial: true });
});

test('em.getReference() does not mutate the options object', () => {
  const options = Object.freeze({ wrapped: false } as const);
  orm.em.getReference(User, 1, options);
  expect(options).toEqual({ wrapped: false });
});

test('em.fork() does not mutate the options object', () => {
  const options = Object.freeze({ useContext: true });
  orm.em.fork(options);
  expect(options).toEqual({ useContext: true });
});

test('em.addFilter() does not mutate the options object', () => {
  const options = Object.freeze({
    name: 'frozen',
    entity: [User],
    cond: {},
  });
  orm.em.fork().addFilter(options);
  expect(options).toEqual({ name: 'frozen', entity: [User], cond: {} });
});
