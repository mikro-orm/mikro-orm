import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { Author4, BaseEntity5, Book4, BookTag4, FooBar4, FooBaz4, Publisher4, Test4, IdentitySchema } from './entities-schema/index.js';

let orm1: MikroORM<SqliteDriver>;
let orm2: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm1 = await MikroORM.init<SqliteDriver>({
    entities: [Author4, Book4, BookTag4, Publisher4, Test4, BaseEntity5, IdentitySchema],
    dbName: ':memory:',
    driver: SqliteDriver,
    contextName: 'orm1',
  });
  await orm1.getSchemaGenerator().createSchema();
  orm2 = await MikroORM.init<SqliteDriver>({
    entities: [FooBar4, FooBaz4, BaseEntity5],
    dbName: ':memory:',
    driver: SqliteDriver,
    contextName: 'orm2',
  });
  await orm2.getSchemaGenerator().createSchema();
});

test('transaction context respects the `contextName`', async () => {
  await orm1.em.transactional(async () => {
    await orm1.em.persistAndFlush(orm1.em.create(Author4, { name: 'n', email: 'e' }));
    await orm2.em.persistAndFlush(orm2.em.create(FooBar4, { name: 'fb' }));
  });
});

afterAll(async () => {
  await orm1.close(true);
  await orm2.close(true);
});
