import { MikroORM, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class TerminatedUser {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [TerminatedUser],
    driver: PostgreSqlDriver,
    dbName: `mikro_orm_test_terminated_${(Math.random() + 1).toString(36).substring(2, 8)}`,
    ensureDatabase: { create: true },
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

/**
 * `pg-pool` hands error handling for a checked-out client over to its consumer, so a backend that
 * goes away mid-query used to emit an unhandled `'error'` event and take the whole process down.
 * The run-level unhandled error reporter is what actually guards this — an escaped `'error'` event
 * fails the suite even though every assertion here passes.
 */
test('a backend terminated mid-query rejects that query without crashing the process', async () => {
  const uncaught: unknown[] = [];
  const onUncaught = (e: unknown) => uncaught.push(e);
  process.on('uncaughtException', onUncaught);

  try {
    // the marker and the database filter keep us from terminating a backend of some other test file
    // running concurrently against the same server — several of them also sleep on purpose
    const victim = orm.em.fork().execute(`select pg_sleep(30) /* terminated_connection_probe */`);
    // assert up front so the rejection always has a handler. Attaching one only after the kill below
    // leaves a window where the query can reject unobserved, which vitest reports as an unhandled
    // rejection and a failed run even though every assertion here passes.
    const victimRejected = expect(victim).rejects.toThrow();
    // give the query time to reach the server so it holds a checked-out connection
    await new Promise(resolve => setTimeout(resolve, 300));

    const killer = orm.em.fork();
    const backends = await killer.execute<{ pid: number }[]>(
      `select pid from pg_stat_activity where datname = current_database()
        and query like '%terminated\\_connection\\_probe%' and pid <> pg_backend_pid()`,
    );
    expect(backends).toHaveLength(1);
    await killer.execute(`select pg_terminate_backend(${backends[0].pid})`);

    await victimRejected;

    // the socket only closes after the query rejects, so the 'error' event lands here
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(uncaught).toEqual([]);
  } finally {
    process.off('uncaughtException', onUncaught);
  }
});

test('the pool stays usable after one of its connections was terminated', async () => {
  const em = orm.em.fork();
  em.create(TerminatedUser, { name: 'survivor' });
  await em.flush();

  await expect(orm.em.fork().count(TerminatedUser, { name: 'survivor' })).resolves.toBe(1);
});
