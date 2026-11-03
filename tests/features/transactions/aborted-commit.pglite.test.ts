import { PGlite } from '@electric-sql/pglite';
import { defineEntity, MikroORM, p, TransactionPropagation, type EntityManager } from '@mikro-orm/pglite';

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    email: p.string().unique(),
  },
});

// the caught unique violation aborts the transaction, so PostgreSQL answers the following COMMIT with ROLLBACK
async function insertDuplicateAndCatch(em: EntityManager) {
  em.create(User, { email: 'other' });
  await em.flush();
  em.create(User, { email: 'taken' });
  await em.flush().catch(() => null);
}

describe.each([
  ['owned', () => undefined],
  ['user-supplied', () => PGlite.create()],
])('aborted commit with a %s PGlite instance', (_, createPglite) => {
  let orm: MikroORM;
  let pglite: PGlite | undefined;

  beforeAll(async () => {
    pglite = await createPglite();
    orm = await MikroORM.init({ entities: [User], dbName: 'memory://', driverOptions: { pglite } });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
    await orm.em.fork().insert(User, { email: 'taken' });
  });

  afterAll(async () => {
    await orm.close(true);
    await pglite?.close();
  });

  test('transactional() rejects', async () => {
    await expect(orm.em.fork().transactional(insertDuplicateAndCatch)).rejects.toThrow(
      'current transaction is aborted',
    );

    expect(await orm.em.fork().count(User)).toBe(1);
  });

  test('commit() rejects', async () => {
    const em = orm.em.fork();
    await em.begin();
    await insertDuplicateAndCatch(em);

    await expect(em.commit()).rejects.toThrow('current transaction is aborted');
    await em.rollback();

    expect(await orm.em.fork().count(User)).toBe(1);
  });

  test('a savepoint rolled back after a failed statement does not fail the outer commit', async () => {
    await orm.em.fork().transactional(async em => {
      em.create(User, { email: 'outer' });
      await em.flush();
      await expect(
        em.transactional(insertDuplicateAndCatch, { propagation: TransactionPropagation.NESTED }),
      ).rejects.toThrow('current transaction is aborted');
    });

    expect(await orm.em.fork().find(User, {}, { fields: ['email'], orderBy: { email: 'asc' } })).toEqual([
      { id: expect.any(Number), email: 'outer' },
      { id: expect.any(Number), email: 'taken' },
    ]);
  });
});
