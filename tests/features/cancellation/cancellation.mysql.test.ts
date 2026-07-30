import { MikroORM, MySqlDriver } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class CancellationUser {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [CancellationUser],
    driver: MySqlDriver,
    dbName: `mikro_orm_test_cancel_${(Math.random() + 1).toString(36).substring(2, 8)}`,
    port: 3308,
    ensureDatabase: { create: true },
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('"cancel query" kills a long-running query on the server', async () => {
  const ac = new AbortController();
  setTimeout(() => ac.abort(new Error('user-cancelled')), 100);
  const fork = orm.em.fork({ signal: ac.signal, inflightQueryAbortStrategy: 'cancel query' });

  const start = Date.now();
  await expect(fork.execute('select sleep(30)')).rejects.toThrow('user-cancelled');
  expect(Date.now() - start).toBeLessThan(5000);
});

test('em.transactional with "cancel query" rolls back the partial transaction', async () => {
  const ac = new AbortController();
  setTimeout(() => ac.abort(new Error('tx-cancel')), 200);

  const start = Date.now();
  await expect(
    orm.em.transactional(
      async em => {
        await em.execute('insert into cancellation_user (name) values (?)', ['stays-rolled-back']);
        await em.execute('select sleep(30)');
      },
      { signal: ac.signal, inflightQueryAbortStrategy: 'cancel query' },
    ),
  ).rejects.toThrow('tx-cancel');

  // MySQL has no dedicated control connection in Kysely, so the `kill query` has to go over a
  // pooled one — routing it through the transaction's own connection would deadlock against the
  // query it is cancelling.
  expect(Date.now() - start).toBeLessThan(5000);

  const fresh = orm.em.fork();
  await expect(fresh.count(CancellationUser, { name: 'stays-rolled-back' })).resolves.toBe(0);
});
