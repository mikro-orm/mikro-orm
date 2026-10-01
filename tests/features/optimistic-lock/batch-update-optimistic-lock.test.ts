import {
  defineEntity,
  IsolationLevel,
  MikroORM,
  OptimisticLockError,
  p,
  Utils,
  wrap,
  type AbstractSqlDriver,
  type SqlEntityManager,
} from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';

// A flush that updates two or more rows of one entity goes through the batch path
// (`persistManagedEntitiesBatch`): the versions are checked by a separate SELECT, and the UPDATE
// that follows used to be keyed by primary key only. A write committed by another transaction after
// that SELECT was silently overwritten — the UPDATE reads the latest committed row version, its WHERE
// still matched, and the flush succeeded. The single entity update puts the version into the WHERE
// clause and throws `OptimisticLockError` when no row was affected; the batch must do the same.
// The flush runs under READ COMMITTED (the PostgreSQL default), where the database itself does not
// reject the write: MySQL behaves the same under its default REPEATABLE READ, while MariaDB 11.6+
// rejects it there with ER_CHECKREAD (`innodb_snapshot_isolation`).

const Doc = defineEntity({
  name: 'BatchOccDoc',
  properties: {
    id: p.integer().primary().autoincrement(),
    title: p.string(),
    version: p.integer().version(),
  },
});

const Counter = defineEntity({
  name: 'BatchOccCounter',
  properties: {
    id: p.integer().primary().autoincrement(),
    title: p.string(),
    rev: p.integer().concurrencyCheck(),
  },
});

// a session of the database waiting for a row lock
const options = {
  postgresql: {
    dbName: 'mikro_orm_test_batch_update_occ',
    lockWait: `select count(*) as n from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock'`,
  },
  mysql: {
    dbName: 'mikro_orm_test_batch_update_occ',
    port: 3308,
    lockWait: `select count(*) as n from information_schema.innodb_trx where trx_state = 'LOCK WAIT'`,
  },
  mariadb: {
    dbName: 'mikro_orm_test_batch_update_occ',
    port: 3309,
    lockWait: `select count(*) as n from information_schema.innodb_trx where trx_state = 'LOCK WAIT'`,
  },
};

describe.each(Utils.keys(options))('batch update optimistic locking [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;
  const { lockWait, ...config } = options[type];

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Doc, Counter],
      driver: PLATFORMS[type],
      ...config,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));
  afterEach(() => vi.restoreAllMocks());

  /** Runs `write` in its own transaction right before the first UPDATE of the flush, batched or not. */
  function writeBeforeFirstUpdate(write: () => Promise<unknown>) {
    const driver = orm.em.getDriver();
    let fired = false;

    for (const method of ['nativeUpdate', 'nativeUpdateMany'] as const) {
      const original = driver[method].bind(driver) as (...args: unknown[]) => Promise<unknown>;
      vi.spyOn(driver, method).mockImplementation((async (...args: unknown[]) => {
        if (!fired) {
          fired = true;
          await write();
        }

        return original(...args);
      }) as any);
    }
  }

  /** Resolves `true` once some session waits for a row lock, `false` once `pending` settles first. */
  async function whenBlocked(pending: Promise<unknown>): Promise<boolean> {
    let settled = false;
    pending.then(
      () => (settled = true),
      () => (settled = true),
    );

    while (!settled) {
      const [{ n }] = await orm.em.getConnection().execute<{ n: number | string }[]>(lockWait);

      if (+n > 0) {
        return true;
      }

      // InnoDB refreshes `information_schema.innodb_trx` only when it was not read for the last 100 ms
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return false;
  }

  async function seed<T extends typeof Doc | typeof Counter>(entity: T, data: object) {
    const em = orm.em.fork();
    const a = em.create(entity as typeof Doc, { title: 'A0', ...data } as any);
    const b = em.create(entity as typeof Doc, { title: 'B0', ...data } as any);
    await em.flush();

    return [a.id, b.id] as const;
  }

  /** Flushes under READ COMMITTED, resolving to the error it failed with or to `'flushed'`. */
  function flush(em: SqlEntityManager) {
    return em
      .transactional(tx => tx.flush(), { isolationLevel: IsolationLevel.READ_COMMITTED })
      .then(
        () => 'flushed',
        e => e,
      );
  }

  async function rows(entity: typeof Doc | typeof Counter, ids: readonly number[]) {
    const found = await orm.em.fork().find(entity as typeof Doc, [...ids], { orderBy: { id: 1 } });
    return found.map(e => wrap(e).toObject());
  }

  describe.each([true, false])('useBatchUpdates: %s', useBatchUpdates => {
    beforeEach(() => orm.config.set('useBatchUpdates', useBatchUpdates));

    test('version: write committed between the version check and the UPDATE', async () => {
      const [aId, bId] = await seed(Doc, {});
      const em = orm.em.fork();
      const [a, b] = await em.find(Doc, [aId, bId], { orderBy: { id: 1 } });
      a.title = 'A-T1';
      b.title = 'B-T1';

      writeBeforeFirstUpdate(() =>
        orm.em.fork().nativeUpdate(Doc, { id: aId, version: 1 }, { title: 'A-T2', version: 2 }),
      );
      const outcome = await flush(em);

      expect({ outcome, rows: await rows(Doc, [aId, bId]) }).toEqual({
        outcome: expect.any(OptimisticLockError),
        rows: [
          { id: aId, title: 'A-T2', version: 2 },
          { id: bId, title: 'B0', version: 1 },
        ],
      });
      expect((outcome as OptimisticLockError).getEntity()).toBe(a);
    });

    test('version: write committed while the UPDATE waits for its row lock', async () => {
      const [aId, bId] = await seed(Doc, {});
      const em = orm.em.fork();
      const [a, b] = await em.find(Doc, [aId, bId], { orderBy: { id: 1 } });
      a.title = 'A-T1';
      b.title = 'B-T1';

      // another transaction writes A and holds its row lock, the version check does not see it yet
      const holder = orm.em.fork();
      await holder.begin();
      await holder.nativeUpdate(Doc, { id: aId, version: 1 }, { title: 'A-T2', version: 2 });

      // the holder commits once the flush waits for its row lock
      const pending = flush(em);
      const committed = await whenBlocked(pending);
      await holder.commit();
      const outcome = await pending;

      expect({ committed, outcome, rows: await rows(Doc, [aId, bId]) }).toEqual({
        committed: true,
        outcome: expect.any(OptimisticLockError),
        rows: [
          { id: aId, title: 'A-T2', version: 2 },
          { id: bId, title: 'B0', version: 1 },
        ],
      });
      expect((outcome as OptimisticLockError).getEntity()).toBe(a);
    });

    test('version: a reference without a loaded version in the same flush', async () => {
      const [aId, bId] = await seed(Doc, {});
      const em = orm.em.fork();
      const a = await em.findOneOrFail(Doc, aId);
      const b = em.getReference(Doc, bId);
      a.title = 'A-T1';
      b.title = 'B-T1';

      writeBeforeFirstUpdate(() =>
        orm.em.fork().nativeUpdate(Doc, { id: aId, version: 1 }, { title: 'A-T2', version: 2 }),
      );
      const outcome = await flush(em);

      expect(outcome).toBeInstanceOf(OptimisticLockError);
      expect((outcome as OptimisticLockError).getEntity()).toBe(a);
      expect((await rows(Doc, [aId]))[0]).toEqual({ id: aId, title: 'A-T2', version: 2 });
    });

    test('concurrencyCheck: write committed between the check and the UPDATE', async () => {
      const [aId, bId] = await seed(Counter, { rev: 1 });
      const em = orm.em.fork();
      const [a, b] = await em.find(Counter, [aId, bId], { orderBy: { id: 1 } });
      Object.assign(a, { title: 'A-T1', rev: 2 });
      Object.assign(b, { title: 'B-T1', rev: 2 });

      writeBeforeFirstUpdate(() => orm.em.fork().nativeUpdate(Counter, { id: aId, rev: 1 }, { title: 'A-T2', rev: 2 }));
      const outcome = await flush(em);

      expect({ outcome, rows: await rows(Counter, [aId, bId]) }).toEqual({
        outcome: expect.any(OptimisticLockError),
        rows: [
          { id: aId, title: 'A-T2', rev: 2 },
          { id: bId, title: 'B0', rev: 1 },
        ],
      });
      expect((outcome as OptimisticLockError).getEntity()).toBe(a);
    });
  });
});
