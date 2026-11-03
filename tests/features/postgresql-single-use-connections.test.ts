import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';
import type { Pool, PoolClient } from 'pg';

const Probe = defineEntity({
  name: 'Probe',
  properties: {
    id: p.integer().primary(),
  },
});

// mirrors the documented Cloudflare Workers setup, where a connection must never outlive the request that opened it
function createOrm() {
  let pool!: Pool;
  const acquired: PoolClient[] = [];
  const orm = new MikroORM({
    entities: [Probe],
    dbName: 'postgres',
    ensureDatabase: false,
    driverOptions: {
      max: Number.POSITIVE_INFINITY,
      maxUses: 1,
      onPoolCreated: (created: Pool) => {
        pool = created;
        pool.on('acquire', client => acquired.push(client));
      },
    },
  });

  return { orm, acquired, getPool: () => pool };
}

test('the instance opens no connection before the first query', async () => {
  const { orm, getPool } = createOrm();

  try {
    expect(getPool()).toBeUndefined();
    await orm.connect();
    expect(getPool().totalCount).toBe(0);

    await orm.em.fork().execute('select 1');
    expect(getPool().totalCount).toBe(0);
  } finally {
    await orm.close(true);
  }
});

test('concurrent forks never get a connection another fork used', async () => {
  const { orm, acquired, getPool } = createOrm();

  try {
    const request = async () => {
      const em = orm.em.fork();
      await em.execute('select pg_sleep(0.05)');
      await em.execute('select 1');
      // a transaction keeps one connection for all its queries
      return em.transactional(async trx => {
        const [first] = await trx.execute<{ pid: number }[]>('select pg_backend_pid() as pid');
        const [second] = await trx.execute<{ pid: number }[]>('select pg_backend_pid() as pid');
        expect(second.pid).toBe(first.pid);
      });
    };

    await Promise.all([request(), request(), request(), request(), request()]);
    await request();

    // two plain queries and one transaction per request
    expect(acquired).toHaveLength(18);
    expect(new Set(acquired).size).toBe(acquired.length);
    expect(getPool().idleCount).toBe(0);
    expect(getPool().totalCount).toBe(0);
  } finally {
    await orm.close(true);
  }
});
