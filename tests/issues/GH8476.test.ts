import {
  defineEntity,
  DriverException,
  EventType,
  MikroORM,
  p,
  TransactionPropagation,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import type { Pool } from 'pg';

const User = defineEntity({
  name: 'Gh8476User',
  tableName: 'gh8476_user',
  properties: {
    id: p.integer().primary().autoincrement(),
    email: p.string().unique(),
  },
});

const Audit = defineEntity({
  name: 'Gh8476Audit',
  tableName: 'gh8476_audit',
  properties: {
    id: p.integer().primary().autoincrement(),
    action: p.string(),
  },
});

const events: EventType[] = [];

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Audit],
    dbName: `mikro_orm_test_gh8476_${(Math.random() + 1).toString(36).substring(2, 8)}`,
    ensureDatabase: { create: true },
    subscribers: [
      {
        beforeTransactionCommit: () => {
          events.push(EventType.beforeTransactionCommit);
        },
        afterTransactionCommit: () => {
          events.push(EventType.afterTransactionCommit);
        },
        beforeTransactionRollback: () => {
          events.push(EventType.beforeTransactionRollback);
        },
        afterTransactionRollback: () => {
          events.push(EventType.afterTransactionRollback);
        },
      },
    ],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

beforeEach(async () => {
  events.length = 0;
  await orm.schema.clear();
  await orm.em.fork().insert(User, { email: 'taken@example.com' });
});

async function expectPoolIdle(): Promise<void> {
  const pool = (await orm.em.getConnection().getNativeClient()) as Pool;
  expect(pool.waitingCount).toBe(0);
  expect(pool.idleCount).toBe(pool.totalCount);
}

// PostgreSQL answers COMMIT with the command tag ROLLBACK (and no error) when the transaction
// was already aborted. The transaction API must reject that outcome. https://github.com/mikro-orm/mikro-orm/issues/8476

test('GH #8476: em.transactional() rejects when a caught statement error aborts the transaction', async () => {
  const result = orm.em.fork().transactional(async em => {
    em.create(Audit, { action: 'signup-attempt' });
    await em.flush();

    try {
      em.create(User, { email: 'taken@example.com' });
      await em.flush();
    } catch (e) {
      expect(e).toBeInstanceOf(UniqueConstraintViolationException);
    }

    return 'committed';
  });

  await expect(result).rejects.toThrow(DriverException);
  await expect(result).rejects.toThrow(/ROLLBACK/);
  expect(events).not.toContain(EventType.afterTransactionCommit);
  expect(await orm.em.fork().count(Audit)).toBe(0);
  await expectPoolIdle();
});

test('GH #8476: em.commit() rejects when a caught statement error aborts the transaction', async () => {
  const em = orm.em.fork();
  await em.begin();
  em.create(Audit, { action: 'signup-attempt' });
  await em.flush();

  try {
    em.create(User, { email: 'taken@example.com' });
    await em.flush();
  } catch (e) {
    expect(e).toBeInstanceOf(UniqueConstraintViolationException);
  }

  const commit = em.commit();
  await expect(commit).rejects.toThrow(DriverException);
  await expect(commit).rejects.toThrow(/ROLLBACK/);
  expect(em.isInTransaction()).toBe(false);
  expect(events).not.toContain(EventType.afterTransactionCommit);
  expect(await orm.em.fork().count(Audit)).toBe(0);
  await expectPoolIdle();
});

test('GH #8476: a nested savepoint rollback does not fail the outer commit', async () => {
  const value = await orm.em.fork().transactional(async em => {
    await expect(
      em.transactional(async inner => {
        inner.create(Audit, { action: 'inner' });
        await inner.flush();
        throw new Error('inner failed');
      }),
    ).rejects.toThrow('inner failed');

    em.create(Audit, { action: 'outer' });
    await em.flush();

    return 'committed';
  });

  expect(value).toBe('committed');
  expect(events).toContain(EventType.afterTransactionCommit);
  expect(await orm.em.fork().find(Audit, {}, { orderBy: { id: 'asc' } })).toMatchObject([{ action: 'outer' }]);
  await expectPoolIdle();
});

test('GH #8476: a joined REQUIRED callback that catches an error fails the outer commit', async () => {
  const result = orm.em.fork().transactional(async em => {
    em.create(Audit, { action: 'outer' });
    await em.flush();
    await em.transactional(
      async inner => {
        try {
          inner.create(User, { email: 'taken@example.com' });
          await inner.flush();
        } catch (e) {
          expect(e).toBeInstanceOf(UniqueConstraintViolationException);
        }
      },
      { propagation: TransactionPropagation.REQUIRED },
    );

    return 'committed';
  });

  await expect(result).rejects.toThrow(DriverException);
  await expect(result).rejects.toThrow(/ROLLBACK/);
  expect(events).not.toContain(EventType.afterTransactionCommit);
  expect(await orm.em.fork().count(Audit)).toBe(0);
  await expectPoolIdle();
});

test('GH #8476: connection.commit() rejects when COMMIT is answered with ROLLBACK', async () => {
  const connection = orm.em.getConnection();
  const trx = await connection.begin();

  try {
    await connection.execute(`insert into gh8476_audit (action) values (?)`, ['kept'], 'run', trx);
    // raw connection.execute() does not convert driver errors
    await expect(
      connection.execute(`insert into gh8476_user (email) values (?)`, ['taken@example.com'], 'run', trx),
    ).rejects.toMatchObject({ code: '23505' });

    const commit = connection.commit(trx);
    await expect(commit).rejects.toThrow(DriverException);
    await expect(commit).rejects.toThrow(/ROLLBACK/);
  } finally {
    // a failed assertion before commit would otherwise leave the checked-out client holding the database
    await connection.rollback(trx).catch(() => undefined);
  }

  expect(await orm.em.fork().count(Audit)).toBe(0);
  await expectPoolIdle();
});

test('GH #8476: a pg query config COMMIT is rejected when its command tag is ROLLBACK', async () => {
  const pool = (await orm.em.getConnection().getNativeClient()) as Pool;
  const client = await pool.connect();

  try {
    await expect(client.query({ text: 'select 1' })).resolves.toMatchObject({ command: 'SELECT' });
    await client.query('begin');
    await client.query(`insert into gh8476_audit (action) values ($1)`, ['native']);
    await expect(
      client.query(`insert into gh8476_user (email) values ($1)`, ['taken@example.com']),
    ).rejects.toMatchObject({
      code: '23505',
    });
    await expect(client.query({ text: 'commit' })).rejects.toThrow(/ROLLBACK/);
  } finally {
    await client.query('rollback').catch(() => undefined);
    client.release();
  }

  expect(await orm.em.fork().count(Audit)).toBe(0);
  await expectPoolIdle();
});

test('commit rethrows errors that are not an implicit server rollback', async () => {
  const em = orm.em.fork({ freshEventManager: true });
  em.getEventManager().registerSubscriber({
    beforeTransactionCommit() {
      throw new Error('veto commit');
    },
  });
  await em.begin();
  em.create(Audit, { action: 'veto' });

  try {
    await expect(em.commit()).rejects.toThrow('veto commit');
    expect(em.isInTransaction()).toBe(true);
  } finally {
    if (em.isInTransaction()) {
      await em.rollback();
    }
  }

  expect(await orm.em.fork().count(Audit, { action: 'veto' })).toBe(0);
  await expectPoolIdle();
});

test('an explicit rollback of an aborted transaction still resolves', async () => {
  const em = orm.em.fork();
  await em.begin();
  em.create(Audit, { action: 'nope' });
  await em.flush();

  try {
    em.create(User, { email: 'taken@example.com' });
    await em.flush();
  } catch (e) {
    expect(e).toBeInstanceOf(UniqueConstraintViolationException);
  }

  await em.rollback();
  expect(em.isInTransaction()).toBe(false);
  expect(events).not.toContain(EventType.afterTransactionCommit);
  expect(events).toContain(EventType.afterTransactionRollback);
  expect(await orm.em.fork().count(Audit)).toBe(0);
  await expectPoolIdle();
});

test('a commit with no prior error still resolves and keeps the row', async () => {
  const value = await orm.em.fork().transactional(async em => {
    em.create(Audit, { action: 'ok' });
    return 'committed';
  });

  expect(value).toBe('committed');
  expect(events).toContain(EventType.afterTransactionCommit);
  expect(await orm.em.fork().count(Audit, { action: 'ok' })).toBe(1);
});
