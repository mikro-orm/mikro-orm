import { defineEntity, MikroORM, p, RequestContext, RowLevelSecurityViolationException } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

const Entry = defineEntity({
  name: 'ExecuteReplicaEntry',
  rowLevelSecurity: 'force',
  properties: {
    id: p.integer().primary(),
    tenantId: p.integer(),
    label: p.string(),
  },
  policies: [
    {
      name: 'execute_replica_tenant',
      using: `tenant_id = nullif(current_setting('app.tenant_id', true), '')::int`,
      check: `tenant_id = nullif(current_setting('app.tenant_id', true), '')::int`,
    },
  ],
});

const dbName = 'mikro_orm_test_execute_replicas';
const role = 'rls_execute_replica_role';

describe.each(['transaction', 'connection'] as const)('raw execute replica routing (%s)', sessionContext => {
  let orm: MikroORM;
  const scoped = <T>(tenantId: number | undefined, work: () => Promise<T>) =>
    RequestContext.create(
      orm.em.fork({ session: { role, variables: tenantId === undefined ? {} : { 'app.tenant_id': tenantId } } }),
      work,
    );

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Entry],
      dbName,
      sessionContext,
      replicas: [{ name: 'execute-read-1' }, { name: 'execute-read-2' }],
      pool: { min: 1, max: 2 },
    });
    await orm.schema.refresh();
    await orm.em.execute(`create role ${role} nosuperuser nobypassrls`);
    await orm.em.execute(`grant ${role} to current_user`);
    await orm.em.execute(`grant usage on schema public to ${role}`);
    await orm.em.execute(`grant select, insert, update, delete on execute_replica_entry to ${role}`);
    await scoped(1, () => orm.em.insert(Entry, { id: 1, tenantId: 1, label: 'one' }));
    await scoped(2, () => orm.em.insert(Entry, { id: 2, tenantId: 2, label: 'two' }));
  });

  afterAll(async () => {
    await orm.em.execute(`drop owned by ${role}`);
    await orm.em.execute(`drop role ${role}`);
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('legacy and options-bag calls still default to the writer', async () => {
    const log = mockLogger(orm, ['query']);
    await scoped(1, async () => {
      expect(await orm.em.execute('select id from execute_replica_entry')).toEqual([{ id: 1 }]);
      expect(await orm.em.execute('select id from execute_replica_entry', [], { method: 'get' })).toEqual({ id: 1 });
    });
    expect(
      log.mock.calls
        .filter(([sql]) => sql.includes('select id from'))
        .every(([sql]) => sql.includes('via write connection')),
    ).toBe(true);
  });

  test('explicit replica reads apply RLS on the selected connection', async () => {
    const log = mockLogger(orm, ['query']);
    await scoped(1, async () => {
      expect(
        await orm.em.execute('select id from execute_replica_entry where label = ?', ['one'], {
          method: 'get',
          connectionType: 'read',
        }),
      ).toEqual({ id: 1 });
    });
    const calls = log.mock.calls.map(([sql]) => sql);
    expect(calls.find(sql => sql.includes('select id from'))).toMatch(/via read connection 'execute-read-[12]'/);
    if (sessionContext === 'transaction') {
      const routed = calls.filter(sql => /begin|set_config|set local role|select id from|commit/.test(sql));
      expect(routed).toHaveLength(5);
      expect(new Set(routed.map(sql => sql.match(/via read connection '(execute-read-[12])'/)?.[1])).size).toBe(1);
      expect(routed.every(sql => /via read connection 'execute-read-[12]'/.test(sql))).toBe(true);
    }
  });

  test('an active transaction wins over a read request and sees uncommitted writes', async () => {
    const log = mockLogger(orm, ['query']);
    await expect(
      scoped(1, () =>
        orm.em.transactional(async em => {
          await em.nativeUpdate(Entry, 1, { label: 'pending' });
          expect(
            await em.execute('select label from execute_replica_entry', [], {
              method: 'get',
              connectionType: 'read',
            }),
          ).toEqual({ label: 'pending' });
          throw new Error('rollback');
        }),
      ),
    ).rejects.toThrow('rollback');
    expect(log.mock.calls.find(([sql]) => sql.includes('select label from'))?.[0]).toContain('via write connection');
    await scoped(1, async () => {
      expect(await orm.em.execute('select label from execute_replica_entry', [], { connectionType: 'read' })).toEqual([
        { label: 'one' },
      ]);
    });
  });

  test('a read without session context uses a replica without an implicit transaction', async () => {
    const log = mockLogger(orm, ['query']);
    expect(await orm.em.execute('select 1 as unscoped', [], { connectionType: 'read' })).toEqual([{ unscoped: 1 }]);
    expect(log.mock.calls.some(([sql]) => sql.includes('begin'))).toBe(false);
    expect(log.mock.calls.find(([sql]) => sql.includes('select 1 as unscoped'))?.[0]).toMatch(
      /via read connection 'execute-read-[12]'/,
    );
  });

  test('concurrent replica reads do not mix tenants', async () => {
    await Promise.all(
      Array.from({ length: 12 }, (_, index) => {
        const tenantId = (index % 2) + 1;
        return scoped(tenantId, async () => {
          expect(await orm.em.execute('select id from execute_replica_entry', [], { connectionType: 'read' })).toEqual([
            { id: tenantId },
          ]);
        });
      }),
    );
  });

  test('reused replicas deny reads when tenant context is missing', async () => {
    await scoped(undefined, async () => {
      expect(await orm.em.execute('select id from execute_replica_entry', [], { connectionType: 'read' })).toEqual([]);
    });
  });

  test('replica execution preserves mapped RLS errors', async () => {
    // Replica pools share the test server; PostgreSQL still enforces WITH CHECK under the restricted role.
    await expect(
      scoped(1, () =>
        orm.em.execute('insert into execute_replica_entry (id, tenant_id, label) values (3, 2, ?)', ['forbidden'], {
          connectionType: 'read',
          method: 'run',
        }),
      ),
    ).rejects.toBeInstanceOf(RowLevelSecurityViolationException);
  });

  test('replica execution preserves cancellation options', async () => {
    const controller = new AbortController();
    controller.abort(new Error('replica cancelled'));
    await expect(
      scoped(1, () =>
        orm.em.execute('select id from execute_replica_entry', [], {
          connectionType: 'read',
          signal: controller.signal,
        }),
      ),
    ).rejects.toThrow('replica cancelled');
  });

  test('an explicit read falls back to the writer when no replica is configured', async () => {
    const single = await MikroORM.init({ entities: [Entry], dbName, sessionContext });
    try {
      const log = mockLogger(single, ['query']);
      await RequestContext.create(
        single.em.fork({ session: { role, variables: { 'app.tenant_id': 1 } } }),
        async () => {
          expect(
            await single.em.execute('select id from execute_replica_entry', [], { connectionType: 'read' }),
          ).toEqual([{ id: 1 }]);
        },
      );
      expect(log.mock.calls.find(([sql]) => sql.includes('select id from'))?.[0]).not.toContain('via read connection');
    } finally {
      await single.close(true);
    }
  });
});
