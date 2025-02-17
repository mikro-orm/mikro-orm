import { MikroORM } from '@mikro-orm/mongodb';

import { Author, Publisher, PublisherType } from './entities/index.js';
import { initORMMongo } from './bootstrap.js';

let orm: MikroORM;

beforeAll(async () => orm = await initORMMongo(true));
beforeEach(async () => orm.schema.clearDatabase());

afterAll(async () => {
  await orm.close();
});

test('transactions', async () => {
  const god1 = new Author('God1', 'hello@heaven1.god');
  await orm.em.begin({ readPreference: 'secondary' });
  await orm.em.persist(god1).flush();
  await orm.em.rollback();
  const res1 = await orm.em.findOne(Author, { name: 'God1' });
  expect(res1).toBeNull();

  await orm.em.begin();
  const god2 = new Author('God2', 'hello@heaven2.god');
  orm.em.persist(god2);
  await orm.em.commit();
  const res2 = await orm.em.findOne(Author, { name: 'God2' });
  expect(res2).not.toBeNull();

  await orm.em.transactional(async em => {
    const god3 = new Author('God3', 'hello@heaven3.god');
    em.persist(god3);
  });
  const res3 = await orm.em.findOne(Author, { name: 'God3' });
  expect(res3).not.toBeNull();

  const err = new Error('Test');

  try {
    await orm.em.transactional(async em => {
      const god4 = new Author('God4', 'hello@heaven4.god');
      em.persist(god4);
      throw err;
    });
  } catch (e) {
    expect(e).toBe(err);
    const res4 = await orm.em.findOne(Author, { name: 'God4' });
    expect(res4).toBeNull();
  }
});

test('should return mongo driver', async () => {
  const driver = orm.em.getDriver();
  const conn = driver.getConnection();
  const ctx = await conn.begin();
  const first = await driver.nativeInsert<Publisher>(Publisher.name, { name: 'test 123', type: PublisherType.GLOBAL }, { ctx });
  await conn.commit(ctx);
  await driver.nativeUpdate<Publisher>(Publisher.name, first.insertId, { name: 'test 456' });
  await driver.nativeUpdateMany<Publisher>(Publisher.name, [first.insertId], [{ name: 'test 789' }]);

  await conn.transactional(async ctx => {
    await driver.nativeDelete(Publisher.name, first.insertId, { ctx });
  });
});
