import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { initORMSqlite } from '../bootstrap';

const { Author3, Book3, BookTag3, Publisher3, Test3, BaseEntity4 } = require('../entities-js/index');

let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await initORMSqlite();
  await orm.schema.ensureDatabase();
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('if multiple forks are created in parallel, an entity can be removed in one fork without being re-persisted in another', async () => {
  const entity = new Author3.entity('test author', 'test@test.com');
  await orm.em.persistAndFlush(entity);

  const fork1 = orm.em.fork({ clear: false });
  const fork2 = orm.em.fork({ clear: false });

  fork1.remove(entity);
  await fork1.flush();

  const countAfterDelete = await orm.em.count(Author3.entity, { id: entity.id });
  expect(countAfterDelete).toBe(0);

  const anotherEntity = new Publisher3.entity('test publisher');
  await fork2.persistAndFlush(anotherEntity);

  const countAfterSecondFlush = await orm.em.count(Author3.entity, { id: entity.id });
  expect(countAfterSecondFlush).toBe(0);
});


test('if multiple transactional calls are being made in parallel, an entity can be removed in one callback without being re-persisted in another', async () => {
  const entity = new Author3.entity('test author', 'test@test.com');
  await orm.em.persistAndFlush(entity);

  const tx1 = orm.em.transactional(async em => {
    em.remove(entity);
    await em.flush();

    const countAfterDelete = await orm.em.count(Author3.entity, {
      id: entity.id,
    });
    expect(countAfterDelete).toBe(0);
  });
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const tx2 = orm.em.transactional(() => {});

  await Promise.all([tx1, tx2]);

  const countAfterAll = await orm.em.count(Author3.entity, {
    id: entity.id,
  });
  expect(countAfterAll).toBe(0);
});
