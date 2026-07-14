import {
  defineEntity,
  MikroORM,
  p,
  PostgreSqlDriver,
  RequestContext,
  RowLevelSecurityViolationException,
  type Options,
} from '@mikro-orm/postgresql';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/sqlite';
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

const dbName = 'mikro_orm_test_rls_session';
const baseOptions: Options = { entities: [User, Article, Tag], dbName, driver: PostgreSqlDriver };

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

  test("the 'connection' strategy resets the session state when no context is active", async () => {
    const mock = mockLogger(ormConn, ['query']);
    await ormConn.em.fork().find(User, {});

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls.some(q => q.includes('reset all'))).toBe(true);
    expect(calls.some(q => q.includes('reset role'))).toBe(true);
  });

  test('setSessionContext on the global EntityManager is rejected', () => {
    // a tenant context set on the global EM would be inherited by every later fork
    orm.config.set('allowGlobalContext', false);
    expect(() => orm.em.setSessionContext({ variables: { 'app.tenant_id': 1 } })).toThrow(
      /Using global EntityManager instance methods for context specific actions is disallowed/,
    );
    orm.config.set('allowGlobalContext', true);
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
});
