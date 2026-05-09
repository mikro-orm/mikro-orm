import { MikroORM, PostgreSqlDriver } from '@mikro-orm/postgresql';
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
    driver: PostgreSqlDriver,
    dbName: `mikro_orm_test_cancel_${(Math.random() + 1).toString(36).substring(2, 8)}`,
    ensureDatabase: { create: true },
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

test('"cancel query" actually kills a long-running query on the server', async () => {
  const ac = new AbortController();
  setTimeout(() => ac.abort(new Error('user-cancelled')), 100);
  const fork = orm.em.fork({ signal: ac.signal, inflightQueryAbortStrategy: 'cancel query' });

  const start = Date.now();
  await expect(fork.execute('select pg_sleep(30)')).rejects.toThrow('user-cancelled');
  const elapsed = Date.now() - start;

  // pg_cancel_backend should kill the query within a couple of seconds; if we're still running
  // after a few seconds, the cancel didn't actually go through.
  expect(elapsed).toBeLessThan(5000);
});

test('"ignore query" lets the abort throw quickly without waiting for the query', async () => {
  const ac = new AbortController();
  setTimeout(() => ac.abort(new Error('ignored')), 50);
  const fork = orm.em.fork({ signal: ac.signal, inflightQueryAbortStrategy: 'ignore query' });

  const start = Date.now();
  await expect(fork.execute('select pg_sleep(2)')).rejects.toThrow('ignored');
  // returned roughly when signal fired, not after pg_sleep(2)
  expect(Date.now() - start).toBeLessThan(500);
});

test('fork-level "cancel query" cancels every query against the fork', async () => {
  const ac = new AbortController();
  setTimeout(() => ac.abort(new Error('fork-cancel')), 100);
  const fork = orm.em.fork({
    signal: ac.signal,
    inflightQueryAbortStrategy: 'cancel query',
  });

  const start = Date.now();
  await expect(fork.execute('select pg_sleep(30)')).rejects.toThrow('fork-cancel');
  expect(Date.now() - start).toBeLessThan(5000);
});

test('em.transactional with "cancel query" rolls back the partial transaction', async () => {
  const ac = new AbortController();
  setTimeout(() => ac.abort(new Error('tx-cancel')), 200);

  await expect(
    orm.em.transactional(
      async em => {
        await em.execute('insert into cancellation_user (name) values (?)', ['stays-rolled-back']);
        await em.execute('select pg_sleep(30)');
      },
      { signal: ac.signal, inflightQueryAbortStrategy: 'cancel query' },
    ),
  ).rejects.toThrow('tx-cancel');

  const fresh = orm.em.fork();
  await expect(fresh.count(CancellationUser, { name: 'stays-rolled-back' })).resolves.toBe(0);
});
