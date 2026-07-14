import {
  defineEntity,
  type EntityManager,
  MikroORM,
  p,
  PostgreSqlDriver,
  RequestContext,
  Routine,
  RowLevelSecurityViolationException,
  type Options,
} from '@mikro-orm/postgresql';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/sqlite';
import { CompiledQuery, type DatabaseConnection } from 'kysely';
import { mockLogger } from '../../helpers.js';

const User = defineEntity({
  name: 'RlsScUser',
  tableName: 'rls_sc_user_tbl',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Tag = defineEntity({
  name: 'RlsScTag',
  tableName: 'rls_sc_tag',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Article = defineEntity({
  name: 'RlsScArticle',
  tableName: 'rls_sc_article',
  rowLevelSecurity: 'force',
  properties: {
    id: p.integer().primary(),
    tenantId: p.integer(),
    title: p.string(),
    tags: () => p.manyToMany(Tag),
  },
  policies: [
    {
      name: 'rls_sc_tenant',
      using: `tenant_id = current_setting('app.tenant_id')::int`,
      check: `tenant_id = current_setting('app.tenant_id')::int`,
    },
  ],
});

// virtual entity reading from the RLS-protected table — exercises the findVirtual execution path
const ArticleView = defineEntity({
  name: 'RlsScArticleView',
  expression: 'select * from "rls_sc_article"',
  properties: {
    id: p.integer(),
    tenantId: p.integer(),
    title: p.string(),
  },
});

// entity with `rls` filters (a multi-arg default-named one and a single-arg custom-`setting` one) for staging tests
const FilterArticle = defineEntity({
  name: 'RlsScFilterArticle',
  tableName: 'rls_sc_filter_article',
  rowLevelSecurity: true,
  properties: {
    id: p.integer().primary(),
    tenantId: p.integer(),
    region: p.string(),
  },
  filters: {
    scByTenant: {
      name: 'scByTenant',
      cond: (args: any) => ({ tenantId: args.tenantId, region: args.region }),
      rls: true,
      default: false,
    },
    scByCustom: {
      name: 'scByCustom',
      cond: (args: any) => ({ tenantId: args.tenant }),
      rls: { setting: 'app.sc_custom' },
      default: false,
    },
  },
});

const dbName = 'mikro_orm_test_rls_session';
const baseOptions: Options = { entities: [User, Article, Tag, ArticleView], dbName, driver: PostgreSqlDriver };

describe('row level security session context', () => {
  let orm: MikroORM;
  let ormConn: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init(baseOptions);
    await orm.schema.refresh();

    const conn = orm.em.getConnection();
    await conn.execute('drop role if exists rls_sc_role');
    await conn.execute('create role rls_sc_role');
    await conn.execute('grant usage on schema public to rls_sc_role');
    await conn.execute('grant select, insert, update, delete on "rls_sc_article" to rls_sc_role');
    await conn.execute('grant select, insert, update, delete on "rls_sc_user_tbl" to rls_sc_role');

    const seedUser = orm.em.fork();
    seedUser.create(User, { id: 1, name: 'u1' });
    await seedUser.flush();

    const seed1 = orm.em.fork({ session: { variables: { 'app.tenant_id': 1 } } });
    seed1.create(Article, { id: 1, tenantId: 1, title: 't1-a' });
    seed1.create(Article, { id: 2, tenantId: 1, title: 't1-b' });
    await seed1.flush();

    const seed2 = orm.em.fork({ session: { variables: { 'app.tenant_id': 2 } } });
    seed2.create(Article, { id: 3, tenantId: 2, title: 't2-a' });
    await seed2.flush();

    ormConn = await MikroORM.init({ ...baseOptions, sessionContext: 'connection' });
  });

  afterAll(async () => {
    await ormConn.close(true);
    await orm.close(true);
  });

  test('fork with session variables wraps queries in a transaction that sets them', async () => {
    const em = orm.em.fork({ session: { variables: { 'app.tenant_id': 5 } } });
    const mock = mockLogger(orm, ['query']);
    await em.find(User, {});

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls[0]).toMatch('begin');
    expect(calls[1]).toMatch('select set_config(?, ?, true)');
    expect(calls[2]).toMatch('from "rls_sc_user_tbl"');
    expect(calls[3]).toMatch('commit');
  });

  test('role is applied via set local role after the session variables', async () => {
    const em = orm.em.fork({ session: { variables: { 'app.tenant_id': 5 }, role: 'rls_sc_role' } });
    const mock = mockLogger(orm, ['query']);
    await em.find(User, {});

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls[0]).toMatch('begin');
    expect(calls[1]).toMatch('select set_config(?, ?, true)');
    expect(calls[2]).toMatch('set local role "rls_sc_role"');
    expect(calls[3]).toMatch('from "rls_sc_user_tbl"');
    expect(calls[4]).toMatch('commit');
  });

  test('a role-only session context emits set local role without set_config', async () => {
    const em = orm.em.fork({ session: { role: 'rls_sc_role' } });
    const mock = mockLogger(orm, ['query']);
    await em.find(User, {});

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls[0]).toMatch('begin');
    expect(calls[1]).toMatch('set local role "rls_sc_role"');
    expect(calls[2]).toMatch('from "rls_sc_user_tbl"');
    expect(calls[3]).toMatch('commit');
    expect(calls.some(q => q.includes('set_config'))).toBe(false);
  });

  test('nested (savepoint) transaction does not re-emit the session context', async () => {
    const em = orm.em.fork({ session: { variables: { 'app.tenant_id': 5 } } });
    const mock = mockLogger(orm, ['query']);

    await em.transactional(async em1 => {
      await em1.transactional(async em2 => {
        await em2.find(User, {});
      });
    });

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls.filter(q => q.includes('set_config')).length).toBe(1);
    expect(calls.some(q => q.includes('savepoint'))).toBe(true);
  });

  test('without session context, reads run outside a transaction (no implicit wrap)', async () => {
    const em = orm.em.fork();
    const mock = mockLogger(orm, ['query']);
    await em.find(User, {});

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatch('from "rls_sc_user_tbl"');
    expect(calls.some(q => q.includes('begin'))).toBe(false);
    expect(calls.some(q => q.includes('set_config'))).toBe(false);
  });

  test('forks inherit the session context, overrides replace it, setSessionContext merges variables', () => {
    const parent = orm.em.fork({ session: { variables: { a: 1 } } });
    expect(parent.fork().getSessionContext()?.variables).toEqual({ a: 1 });
    expect(parent.fork({ session: { variables: { b: 2 } } }).getSessionContext()?.variables).toEqual({ b: 2 });

    const em = orm.em.fork({ session: { variables: { a: 1 } } });
    em.setSessionContext({ variables: { b: 2 } });
    expect(em.getSessionContext()).toEqual({ variables: { a: 1, b: 2 }, role: undefined });

    em.setSessionContext({ role: 'rls_sc_role' });
    expect(em.getSessionContext()).toEqual({ variables: { a: 1, b: 2 }, role: 'rls_sc_role' });

    em.clearSessionContext();
    expect(em.getSessionContext()).toBeUndefined();
  });

  test('a context-resolving fork keeps its session context off the ambient EM', async () => {
    // `useContext: true` forks resolve operations through the request context — the `session`
    // option must still land on the fork itself, not mutate the ambient EM's security state
    let ambient!: EntityManager;
    const fork = await RequestContext.create(orm.em, async () => {
      ambient = RequestContext.getEntityManager() as EntityManager;
      return orm.em.fork({ useContext: true, session: { variables: { 'app.tenant_id': 7 } } });
    });

    expect(ambient.getSessionContext()).toBeUndefined();
    expect(fork.getSessionContext()?.variables).toEqual({ 'app.tenant_id': 7 });
  });

  test('the session context isolates cached rows per tenant', async () => {
    const emA = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 1 } } });
    const a = await emA.find(Article, {}, { cache: 5000 });
    expect(a.map(x => x.tenantId)).toEqual([1, 1]);

    const emB = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 2 } } });
    const b = await emB.find(Article, {}, { cache: 5000 });
    expect(b).toHaveLength(1);
    expect(b[0].tenantId).toBe(2);
  });

  test('a write violating a with-check policy throws RowLevelSecurityViolationException', async () => {
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 1 } } });
    em.create(Article, { id: 99, tenantId: 2, title: 'bad' });

    await expect(em.flush()).rejects.toThrow(RowLevelSecurityViolationException);
  });

  test('em.execute outside a transaction gets the implicit wrap and sees only tenant rows', async () => {
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 1 } } });
    const mock = mockLogger(orm, ['query']);
    const rows = await em.execute('select * from "rls_sc_article" order by "id"');

    expect(rows.map(r => r.tenant_id)).toEqual([1, 1]);
    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls[0]).toMatch('begin');
    expect(calls[1]).toMatch('select set_config(?, ?, true)');
    expect(calls[2]).toMatch('set local role "rls_sc_role"');
    expect(calls[3]).toMatch('select * from "rls_sc_article"');
    expect(calls[4]).toMatch('commit');
  });

  test('Date session variables are serialized to ISO 8601 so timestamptz casts parse', async () => {
    const since = new Date('2025-06-15T10:30:00.000Z');

    // transaction strategy (`set_config` on begin)
    const em = orm.em.fork({ session: { variables: { 'app.since': since } } });
    const [row] = await em.execute(`select current_setting('app.since')::timestamptz as v`);
    expect(new Date(row.v).toISOString()).toBe(since.toISOString());

    // connection strategy (`set_config` on connection acquire)
    const rows = await RequestContext.create(ormConn.em, async () => {
      const emc = RequestContext.getEntityManager() as typeof ormConn.em;
      emc.setSessionContext({ variables: { 'app.since': since } });
      return emc.execute(`select current_setting('app.since')::timestamptz as v`);
    });
    expect(new Date(rows[0].v).toISOString()).toBe(since.toISOString());
  });

  test('em.execute inside em.transactional reuses the outer transaction context', async () => {
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 2 } } });
    const mock = mockLogger(orm, ['query']);

    const rows = await em.transactional(em => em.execute('select * from "rls_sc_article" order by "id"'));

    expect(rows.map(r => r.tenant_id)).toEqual([2]);
    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls.filter(q => q.includes('begin'))).toHaveLength(1);
    expect(calls.filter(q => q.includes('set_config'))).toHaveLength(1);
    expect(calls.filter(q => q.includes('commit'))).toHaveLength(1);
  });

  test('native operations outside a transaction get the implicit wrap', async () => {
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 3 } } });
    const mock = mockLogger(orm, ['query']);

    await em.insert(Article, { id: 30, tenantId: 3, title: 't3-a' });
    await em.insertMany(Article, [{ id: 31, tenantId: 3, title: 't3-b' }]);
    expect(await em.count(Article, {})).toBe(2);
    expect(await em.nativeUpdate(Article, { id: 30 }, { title: 't3-c' })).toBe(1);
    expect(await em.nativeDelete(Article, {})).toBe(2);

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls.filter(q => q.includes('begin'))).toHaveLength(5);
    expect(calls.filter(q => q.includes('set_config'))).toHaveLength(5);
    expect(calls.filter(q => q.includes('commit'))).toHaveLength(5);
  });

  test('em.upsert and its reload query outside a transaction get the implicit wrap', async () => {
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 4 } } });
    await em.upsert(Article, { id: 40, tenantId: 4, title: 't4-a' });

    const mock = mockLogger(orm, ['query']);
    // conflict + ignore yields no returning row, forcing the reload query, wrapped separately
    const a = await em.upsert(Article, { id: 40, tenantId: 4, title: 't4-b' }, { onConflictAction: 'ignore' });
    expect(a.title).toBe('t4-a');

    let calls = mock.mock.calls.map(c => c[0]);
    expect(calls.filter(q => q.includes('begin'))).toHaveLength(2);
    expect(calls.filter(q => q.includes('set_config'))).toHaveLength(2);
    mock.mockClear();

    const [b] = await em.upsertMany(Article, [{ id: 40, tenantId: 4, title: 't4-c' }], {
      onConflictAction: 'ignore',
    });
    expect(b.title).toBe('t4-a');

    calls = mock.mock.calls.map(c => c[0]);
    expect(calls.filter(q => q.includes('begin'))).toHaveLength(2);
    expect(calls.filter(q => q.includes('set_config'))).toHaveLength(2);

    await em.nativeDelete(Article, {});
  });

  test('m2m pivot table loads outside a transaction get the implicit wrap', async () => {
    const seed = orm.em.fork({ session: { variables: { 'app.tenant_id': 1 } } });
    const article = await seed.findOneOrFail(Article, 1);
    article.tags.add(seed.create(Tag, { id: 1, name: 'tag1' }));
    await seed.flush();

    const em = orm.em.fork({ session: { variables: { 'app.tenant_id': 1 } } });
    const a = await em.findOneOrFail(Article, 1);

    const mock = mockLogger(orm, ['query']);
    const tags = await a.tags.matching({});
    expect(tags).toHaveLength(1);

    let calls = mock.mock.calls.map(c => c[0]);
    expect(calls[0]).toMatch('begin');
    expect(calls[1]).toMatch('set_config');
    expect(calls.at(-1)).toMatch('commit');
    mock.mockClear();

    await em.populate(a, ['tags']);
    calls = mock.mock.calls.map(c => c[0]);
    expect(calls[0]).toMatch('begin');
    expect(calls[1]).toMatch('set_config');
    expect(calls.at(-1)).toMatch('commit');
    expect(a.tags[0].name).toBe('tag1');
  });

  test("the 'connection' strategy applies the session context on connection acquire", async () => {
    const mock = mockLogger(ormConn, ['query']);

    const rows = await RequestContext.create(ormConn.em, async () => {
      const em = RequestContext.getEntityManager()!;
      em.setSessionContext({ role: 'rls_sc_role', variables: { 'app.tenant_id': 1 } });
      return em.find(Article, {});
    });

    expect(rows.map(x => x.tenantId)).toEqual([1, 1]);
    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls.some(q => q.includes('set_config($1, $2, false)'))).toBe(true);
    expect(calls.some(q => q.includes('set role "rls_sc_role"'))).toBe(true);
  });

  test("the 'connection' strategy resets variables a new context does not overwrite", async () => {
    // request 1 sets two session-scoped variables on the pooled connection
    await RequestContext.create(ormConn.em, async () => {
      const em = RequestContext.getEntityManager() as EntityManager;
      em.setSessionContext({ variables: { 'app.tenant_id': 1, 'app.extra': 'stale' } });
      return em.execute('select 1');
    });

    // request 2 reuses the connection but only sets one of them — the other must have been reset, not leaked
    const rows = await RequestContext.create(ormConn.em, async () => {
      const em = RequestContext.getEntityManager() as EntityManager;
      em.setSessionContext({ variables: { 'app.tenant_id': 2 } });
      return em.execute(`select current_setting('app.extra', true) as v`);
    });

    expect([null, '']).toContain(rows[0].v);
  });

  test("the 'connection' strategy resets the session state when no context is active", async () => {
    const mock = mockLogger(ormConn, ['query']);
    await ormConn.em.fork().find(User, {});

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls.some(q => q.includes('reset all'))).toBe(true);
    expect(calls.some(q => q.includes('reset role'))).toBe(true);
  });

  test('setSessionContext on the global EntityManager is rejected', () => {
    // a tenant context set on the global EM would be inherited by every later fork
    const prev = orm.config.get('allowGlobalContext');
    orm.config.set('allowGlobalContext', false);

    try {
      expect(() => orm.em.setSessionContext({ variables: { 'app.tenant_id': 1 } })).toThrow(
        /Using global EntityManager instance methods for context specific actions is disallowed/,
      );
    } finally {
      // restore even if the assertion throws, so a failure here can't poison sibling tests
      orm.config.set('allowGlobalContext', prev);
    }
  });

  test('setSessionContext throws on drivers without row level security support', async () => {
    const sqlite = await SqliteMikroORM.init({ entities: [User], dbName: ':memory:' });

    expect(() => sqlite.em.setSessionContext({ variables: { a: 1 } })).toThrow(
      'only supported by the PostgreSQL driver',
    );
    expect(() => sqlite.em.fork({ session: { variables: { a: 1 } } })).toThrow(
      'only supported by the PostgreSQL driver',
    );

    await sqlite.close(true);
  });

  test('a role name containing a dot is quoted as a single identifier', async () => {
    const conn = orm.em.getConnection();
    await conn.execute(`do $$ begin
      if exists (select from pg_roles where rolname = 'rls.sc.dotted') then
        execute 'drop owned by "rls.sc.dotted"';
        execute 'drop role "rls.sc.dotted"';
      end if;
    end $$`);
    await conn.execute(`create role "rls.sc.dotted"`);
    await conn.execute('grant usage on schema public to "rls.sc.dotted"');
    await conn.execute('grant select on "rls_sc_user_tbl" to "rls.sc.dotted"');

    const em = orm.em.fork({ session: { role: 'rls.sc.dotted' } });
    const mock = mockLogger(orm, ['query']);
    const users = await em.find(User, {});
    expect(users).toHaveLength(1);

    const calls = mock.mock.calls.map(c => c[0]);
    // a single dotted identifier, not the schema-qualified `"rls"."sc"."dotted"` that quoteIdentifier would produce
    expect(calls.some(q => q.includes('set local role "rls.sc.dotted"'))).toBe(true);

    await conn.execute('drop owned by "rls.sc.dotted"');
    await conn.execute(`drop role "rls.sc.dotted"`);
  });

  test('virtual entities get the implicit session-context wrap and see only tenant rows', async () => {
    // the role is required for RLS to apply — the default superuser bypasses row level security
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 1 } } });
    const mock = mockLogger(orm, ['query']);
    const rows = await em.find(ArticleView, {});

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.tenantId === 1)).toBe(true);

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls[0]).toMatch('begin');
    expect(calls[1]).toMatch('select set_config(?, ?, true)');
    expect(calls.some(q => q.includes('from "rls_sc_article"'))).toBe(true);
    expect(calls.at(-1)).toMatch('commit');
  });

  test('setSessionContext inside an active transaction throws (transaction strategy)', async () => {
    const em = orm.em.fork();

    await expect(
      em.transactional(async inner => {
        inner.setSessionContext({ variables: { 'app.tenant_id': 1 } });
      }),
    ).rejects.toThrow(/inside an active transaction/);
  });

  test('a fork with session context still works with em.transactional', async () => {
    const em = orm.em.fork({ session: { variables: { 'app.tenant_id': 1 } } });
    const rows = await em.transactional(inner => inner.find(User, {}));
    expect(rows).toHaveLength(1);
  });

  test('em.stream under a session context outside a transaction is not wrapped (transaction strategy)', async () => {
    // stream never opens the implicit session-context transaction, so the DB never receives the variables or role;
    // the owning superuser connection then bypasses RLS and streams every tenant's rows, unscoped by the staged context
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 1 } } });
    const mock = mockLogger(orm, ['query']);

    const rows = [];

    for await (const a of em.stream(Article, {})) {
      rows.push(a);
    }

    // rows from tenant 2 leak through — the tenant scoping was silently skipped
    expect(rows.map(r => r.tenantId).sort()).toEqual([1, 1, 2]);

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls.some(q => q.includes('begin'))).toBe(false);
    expect(calls.some(q => q.includes('set_config'))).toBe(false);
    expect(calls.some(q => q.includes('set local role'))).toBe(false);
  });

  test('wrapping em.stream in em.transactional carries the session context (rows tenant-scoped)', async () => {
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 1 } } });
    const mock = mockLogger(orm, ['query']);

    const rows = await em.transactional(async tem => {
      const out = [];

      for await (const a of tem.stream(Article, {})) {
        out.push(a);
      }

      return out;
    });

    // only tenant 1 rows stream through — begin/set_config/set local role wrap the cursor
    expect(rows.map(r => r.tenantId)).toEqual([1, 1]);

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls[0]).toMatch('begin');
    expect(calls[1]).toMatch('select set_config(?, ?, true)');
    expect(calls[2]).toMatch('set local role "rls_sc_role"');
    expect(calls.at(-1)).toMatch('commit');
  });

  test("the 'connection' strategy silently ignores a fork's session context used outside RequestContext", async () => {
    // a fork used directly (not resolved through RequestContext) is never the ambient EM the compose hook reads,
    // so its variables are staged but never applied — the acquire only issues `reset all`/`reset role`
    const em = ormConn.em.fork({ session: { variables: { 'app.tenant_id': 1 } } });
    const mock = mockLogger(ormConn, ['query']);
    const rows = await em.find(Article, {});

    // the superuser connection with no variable applied bypasses RLS and returns every tenant's rows
    expect(rows.map(r => r.tenantId).sort()).toEqual([1, 1, 2]);

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls.some(q => q.includes('reset all'))).toBe(true);
    expect(calls.some(q => q.includes('reset role'))).toBe(true);
    expect(calls.some(q => q.includes('set_config'))).toBe(false);
  });

  test("a user onReserveConnection hook composes after the ORM statements ('connection' strategy)", async () => {
    // the ORM's session statements must run first; the user hook then runs on the same reserved connection,
    // so its setting survives the ORM's `reset all` (proving the hook is composed after, not before)
    const hookCalls = [];
    const orm2 = await MikroORM.init({
      ...baseOptions,
      sessionContext: 'connection',
      onReserveConnection: async (connection: unknown) => {
        hookCalls.push('reserve');
        await (connection as DatabaseConnection).executeQuery(
          CompiledQuery.raw('select set_config($1, $2, false)', ['app.user_hook', 'ran']),
        );
      },
    });

    try {
      const rows = await RequestContext.create(orm2.em, async () => {
        const em = RequestContext.getEntityManager() as EntityManager;
        em.setSessionContext({ variables: { 'app.tenant_id': 7 } });
        return em.execute(
          `select current_setting('app.tenant_id') as tenant, current_setting('app.user_hook') as hook`,
        );
      });

      // both the ORM's staged variable and the user hook's setting are present on the query's connection
      expect(rows[0].tenant).toBe('7');
      expect(rows[0].hook).toBe('ran');
      expect(hookCalls.length).toBeGreaterThan(0);
    } finally {
      await orm2.close(true);
    }
  });
});

describe('row level security session context — failure and staging edge cases', () => {
  test('a failing session-context application on begin rolls back so the connection is not leaked', async () => {
    // a single pooled connection makes a leak observable: without the rollback the next acquire would deadlock
    const orm = await MikroORM.init({ ...baseOptions, pool: { min: 0, max: 1 } });

    try {
      const em = orm.em.fork({ session: { role: 'rls_sc_missing_role' } });
      const mock = mockLogger(orm, ['query']);

      await expect(em.find(User, {})).rejects.toThrow(/rls_sc_missing_role/);

      const calls = mock.mock.calls.map(c => c[0]);
      expect(calls.some(q => q.includes('begin'))).toBe(true);
      expect(calls.some(q => q.includes('rollback'))).toBe(true);
      expect(calls.some(q => q.includes('commit'))).toBe(false);

      // the connection was released back to the pool — subsequent operations still succeed
      for (let i = 0; i < 3; i++) {
        expect(await orm.em.fork().find(User, {})).toHaveLength(1);
      }
    } finally {
      await orm.close(true);
    }
  });

  test('setSessionContext with the transaction strategy throws when implicitTransactions is disabled', async () => {
    const orm = await MikroORM.init({ ...baseOptions, implicitTransactions: false });

    try {
      expect(() => orm.em.fork().setSessionContext({ variables: { 'app.tenant_id': 1 } })).toThrow(
        /implicitTransactions/,
      );
    } finally {
      await orm.close(true);
    }
  });

  test('setSessionContext with the transaction strategy throws when transactions are disabled', async () => {
    // config level — the UoW flush would run untransacted and silently skip the context
    const orm = await MikroORM.init({ ...baseOptions, disableTransactions: true });

    try {
      expect(() => orm.em.fork().setSessionContext({ variables: { 'app.tenant_id': 1 } })).toThrow(
        /disableTransactions/,
      );
    } finally {
      await orm.close(true);
    }

    // fork level — both the fork option and a later staging attempt must be rejected too
    const orm2 = await MikroORM.init(baseOptions);

    try {
      expect(() => orm2.em.fork({ disableTransactions: true, session: { variables: { 'app.tenant_id': 1 } } })).toThrow(
        /disableTransactions/,
      );
      expect(() =>
        orm2.em.fork({ disableTransactions: true }).setSessionContext({ variables: { 'app.tenant_id': 1 } }),
      ).toThrow(/disableTransactions/);
    } finally {
      await orm2.close(true);
    }
  });

  describe('rls filter staging', () => {
    let orm: MikroORM;

    beforeAll(async () => {
      orm = await MikroORM.init({ ...baseOptions, entities: [User, FilterArticle] });
    });

    afterAll(() => orm.close(true));

    test('re-calling setFilterParams drops variables the new params no longer set (default-named)', () => {
      const em = orm.em.fork();
      em.setFilterParams('scByTenant', { tenantId: 1, region: 'eu' });
      expect(em.getSessionContext()?.variables).toEqual({
        'mikro.scByTenant.tenantId': 1,
        'mikro.scByTenant.region': 'eu',
      });

      em.setFilterParams('scByTenant', { tenantId: 2 });
      expect(em.getSessionContext()?.variables).toEqual({ 'mikro.scByTenant.tenantId': 2 });
    });

    test('re-calling setFilterParams drops the stale custom `setting` and extra default-named variables', () => {
      const em = orm.em.fork();
      em.setFilterParams('scByCustom', { tenant: 'a', extra: 'x' });
      expect(em.getSessionContext()?.variables).toEqual({
        'app.sc_custom': 'a',
        'mikro.scByCustom.extra': 'x',
      });

      em.setFilterParams('scByCustom', { tenant: 'b' });
      expect(em.getSessionContext()?.variables).toEqual({ 'app.sc_custom': 'b' });
    });

    test('re-calling setFilterParams with no args drops the emptied session context entirely', () => {
      const em = orm.em.fork();
      em.setFilterParams('scByTenant', { tenantId: 1 });
      expect(em.getSessionContext()).toBeDefined();

      // an empty-but-truthy context would keep forcing the implicit transaction wrap for nothing
      em.setFilterParams('scByTenant', {});
      expect(em.getSessionContext()).toBeUndefined();

      // a role (or variables staged outside the filter) must survive the prune
      const em2 = orm.em.fork({ session: { role: 'rls_sc_role' } });
      em2.setFilterParams('scByTenant', { tenantId: 1 });
      em2.setFilterParams('scByTenant', {});
      expect(em2.getSessionContext()).toEqual({ variables: {}, role: 'rls_sc_role' });
    });

    test('setFilterParams on an rls filter inside an active transaction throws', async () => {
      const em = orm.em.fork();

      await expect(
        em.transactional(async inner => {
          inner.setFilterParams('scByTenant', { tenantId: 1 });
        }),
      ).rejects.toThrow(/inside an active transaction/);
    });
  });
});

describe('row level security session context — remaining native paths', () => {
  const TenantCount = new Routine({
    name: 'rls_sc_tenant_count',
    type: 'function',
    params: {},
    returns: { runtimeType: 'number', columnType: 'int' },
    body: 'select count(*)::int from rls_sc_article',
  });

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ ...baseOptions, routines: [TenantCount] });
    await orm.schema.update();
    // the clone path draws a fresh pk from the serial sequence, which the seed's explicit ids never advanced
    await orm.em.execute('grant usage on all sequences in schema public to rls_sc_role');
    await orm.em.execute(`select setval('rls_sc_article_id_seq', 1000)`);
  });

  afterAll(async () => {
    await orm.em.execute('drop function if exists rls_sc_tenant_count');
    await orm.close(true);
  });

  test('em.clone gets the implicit session-context wrap', async () => {
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 1 } } });
    const mock = mockLogger(orm, ['query']);
    const cloned = await em.clone(Article, { id: 1 }, { title: 'cloned' });

    expect(cloned.tenantId).toBe(1);
    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls[0]).toMatch('begin');
    expect(calls[1]).toMatch('select set_config(?, ?, true)');
    expect(calls[2]).toMatch('set local role "rls_sc_role"');

    await orm.em.fork().nativeDelete(Article, { title: 'cloned' });
  });

  test('entity-instance em.insert and em.insertMany get the implicit wrap', async () => {
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 1 } } });
    const mock = mockLogger(orm, ['query']);

    const one = em.create(Article, { id: 201, tenantId: 1, title: 'inst-1' }, { persist: false });
    await em.insert(one);

    const two = em.create(Article, { id: 202, tenantId: 1, title: 'inst-2' }, { persist: false });
    const three = em.create(Article, { id: 203, tenantId: 1, title: 'inst-3' }, { persist: false });
    await em.insertMany([two, three]);

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls.filter(q => q.includes('set_config')).length).toBe(2);
    expect(calls.filter(q => q.includes('begin')).length).toBe(2);

    // the with-check policy accepted the writes because the session variables were applied
    expect(await em.count(Article, { id: { $gte: 201 } })).toBe(3);

    await orm.em.fork().nativeDelete(Article, { id: { $gte: 201 } });
  });

  test('em.callRoutine gets the implicit wrap and sees only tenant rows', async () => {
    const em = orm.em.fork({ session: { role: 'rls_sc_role', variables: { 'app.tenant_id': 1 } } });
    const mock = mockLogger(orm, ['query']);
    const count = await em.callRoutine(TenantCount, {});

    expect(count).toBe(2);
    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls[0]).toMatch('begin');
    expect(calls[1]).toMatch('select set_config(?, ?, true)');
    expect(calls[2]).toMatch('set local role "rls_sc_role"');
  });

  test('clearSessionContext inside an active transaction throws, context-less clearing does not', async () => {
    const em = orm.em.fork({ session: { variables: { 'app.tenant_id': 1 } } });

    await expect(
      em.transactional(async inner => {
        inner.clearSessionContext();
      }),
    ).rejects.toThrow(/inside an active transaction/);

    // clearing a fork that never staged anything is a no-op even inside a transaction
    await orm.em.fork().transactional(async inner => {
      inner.clearSessionContext();
      await inner.find(User, {});
    });
  });
});
