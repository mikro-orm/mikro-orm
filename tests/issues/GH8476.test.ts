import { defineEntity, MikroORM, p, TransactionPropagation, type EntityManager } from '@mikro-orm/postgresql';

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    email: p.string().unique(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: 'mikro_orm_test_gh8476',
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.fork().insert(User, { email: 'taken' });
});

afterAll(async () => {
  await orm.close(true);
});

// the caught unique violation aborts the transaction, so PostgreSQL answers the following COMMIT with ROLLBACK
async function insertDuplicateAndCatch(em: EntityManager) {
  em.create(User, { email: 'other' });
  await em.flush();
  em.create(User, { email: 'taken' });
  await em.flush().catch(() => null);
}

test('transactional() rejects when PostgreSQL answers COMMIT with ROLLBACK', async () => {
  const pool = await orm.em.getConnection().getNativeClient();

  await expect(orm.em.fork().transactional(insertDuplicateAndCatch)).rejects.toThrow(
    'COMMIT was answered with ROLLBACK',
  );

  expect(await orm.em.fork().count(User)).toBe(1);
  expect(pool.idleCount).toBe(pool.totalCount);
});

test('commit() rejects when PostgreSQL answers COMMIT with ROLLBACK', async () => {
  const pool = await orm.em.getConnection().getNativeClient();
  const em = orm.em.fork();
  await em.begin();
  await insertDuplicateAndCatch(em);

  await expect(em.commit()).rejects.toThrow('COMMIT was answered with ROLLBACK');
  await em.rollback();

  expect(await orm.em.fork().count(User)).toBe(1);
  expect(pool.idleCount).toBe(pool.totalCount);
});

test('a savepoint rolled back after a failed statement does not fail the outer commit', async () => {
  await orm.em.fork().transactional(async em => {
    em.create(User, { email: 'outer' });
    await em.flush();
    // releasing the savepoint fails loudly, rolling back to it clears the aborted state
    await expect(
      em.transactional(insertDuplicateAndCatch, { propagation: TransactionPropagation.NESTED }),
    ).rejects.toThrow('current transaction is aborted');
  });

  expect(await orm.em.fork().find(User, {}, { fields: ['email'], orderBy: { email: 'asc' } })).toEqual([
    { id: expect.any(Number), email: 'outer' },
    { id: expect.any(Number), email: 'taken' },
  ]);
});
