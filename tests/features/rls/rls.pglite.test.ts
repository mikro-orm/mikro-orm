import { defineEntity, MikroORM, p, RowLevelSecurityViolationException } from '@mikro-orm/pglite';
import { mockLogger } from '../../helpers.js';

// the recommended way to test a PostgreSQL app with RLS without a server — everything the
// postgresql driver enforces must behave identically on pglite
const Tag = defineEntity({
  name: 'PgliteRlsTag',
  tableName: 'pglite_rls_tag',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Article = defineEntity({
  name: 'PgliteRlsArticle',
  tableName: 'pglite_rls_article',
  properties: {
    id: p.integer().primary(),
    tenantId: p.integer(),
    title: p.string(),
    tags: () => p.manyToMany(Tag),
  },
  policies: [
    {
      name: 'pglite_tenant',
      using: `tenant_id = current_setting('app.tenant')::int`,
      check: `tenant_id = current_setting('app.tenant')::int`,
    },
  ],
});

describe('rls end-to-end [pglite]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [Article, Tag], dbName: 'memory://' });
    await orm.schema.refresh();

    // pglite connects as a superuser, which bypasses RLS like on real pg — enforcement needs a plain role
    const conn = orm.em.getConnection();
    await conn.execute('create role pglite_app login');
    await conn.execute('grant select, insert, update, delete on "pglite_rls_article" to pglite_app');

    const seed1 = orm.em.fork({ session: { variables: { 'app.tenant': 1 } } });
    seed1.create(Article, { id: 1, tenantId: 1, title: 'a' });
    seed1.create(Article, { id: 2, tenantId: 1, title: 'b' });
    await seed1.flush();
    const seed2 = orm.em.fork({ session: { variables: { 'app.tenant': 2 } } });
    seed2.create(Article, { id: 3, tenantId: 2, title: 'c' });
    await seed2.flush();
  });

  afterAll(() => orm.close(true));

  test('session context + role enforce tenant isolation on reads', async () => {
    const em1 = orm.em.fork({ session: { role: 'pglite_app', variables: { 'app.tenant': 1 } } });
    expect((await em1.find(Article, {})).map(r => r.tenantId)).toEqual([1, 1]);

    const em2 = orm.em.fork({ session: { role: 'pglite_app', variables: { 'app.tenant': 2 } } });
    expect(await em2.count(Article, {})).toBe(1);
  });

  test('a cross-tenant write violates the with-check policy with the typed exception', async () => {
    const em = orm.em.fork({ session: { role: 'pglite_app', variables: { 'app.tenant': 1 } } });
    em.create(Article, { id: 99, tenantId: 2, title: 'bad' });

    await expect(em.flush()).rejects.toThrow(RowLevelSecurityViolationException);
  });

  test('m2m matching inside a transaction joins the ambient transaction', async () => {
    const seed = orm.em.fork({ session: { variables: { 'app.tenant': 1 } } });
    const article = await seed.findOneOrFail(Article, 1);
    article.tags.add(seed.create(Tag, { id: 1, name: 'tag1' }));
    await seed.flush();

    const em = orm.em.fork({ session: { variables: { 'app.tenant': 1 } } });
    const mock = mockLogger(orm, ['query']);

    // pglite is effectively single-connection — a second implicit transaction around the pivot
    // load would deadlock here instead of reusing the one already carrying the session context
    await em.transactional(async em2 => {
      const a = await em2.findOneOrFail(Article, 1);
      const tags = await a.tags.matching({});
      expect(tags).toHaveLength(1);
    });

    const calls = mock.mock.calls.map(c => c[0]);
    expect(calls.filter(q => q.includes('begin'))).toHaveLength(1);
    expect(calls.filter(q => q.includes('set_config'))).toHaveLength(1);
  });
});
