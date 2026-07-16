import {
  defineEntity,
  LoadStrategy,
  MikroORM,
  p,
  PostgreSqlDriver,
  RequestContext,
  RowLevelSecurityViolationException,
} from '@mikro-orm/postgresql';

// realistic multi-tenant fixture: tenants are uuids, matching the `::uuid` cast in the policies
const TA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const TC = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const TD = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const TF = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

// a `tenant_id = current_setting('app.tenant')::uuid` policy, reused across the tenant-scoped tables
const tenantPolicy = (name: string) => ({
  name,
  using: `tenant_id = current_setting('app.tenant')::uuid`,
  check: `tenant_id = current_setting('app.tenant')::uuid`,
});

const Org = defineEntity({
  name: 'RlsE2eOrg',
  tableName: 'rls_e2e_org',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Author = defineEntity({
  name: 'RlsE2eAuthor',
  tableName: 'rls_e2e_author',
  rowLevelSecurity: true,
  properties: {
    id: p.integer().primary(),
    tenantId: p.uuid(),
    name: p.string(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
  policies: [tenantPolicy('rls_e2e_author_tenant')],
});

const Book = defineEntity({
  name: 'RlsE2eBook',
  tableName: 'rls_e2e_book',
  rowLevelSecurity: true,
  properties: {
    id: p.integer().primary(),
    tenantId: p.uuid(),
    title: p.string(),
    author: () => p.manyToOne(Author),
  },
  policies: [tenantPolicy('rls_e2e_book_tenant')],
});

// per-command policies: rows are selectable and insertable within the tenant, but no update/delete policy exists
const Report = defineEntity({
  name: 'RlsE2eReport',
  tableName: 'rls_e2e_report',
  rowLevelSecurity: true,
  properties: {
    id: p.integer().primary(),
    tenantId: p.uuid(),
    title: p.string(),
  },
  policies: [
    { name: 'rls_e2e_report_select', command: 'select', using: `tenant_id = current_setting('app.tenant')::uuid` },
    { name: 'rls_e2e_report_insert', command: 'insert', check: `tenant_id = current_setting('app.tenant')::uuid` },
  ],
});

// filter-bridge entity: the `rls` filter compiles into a DB policy at schema create time
const Ticket = defineEntity({
  name: 'RlsE2eTicket',
  tableName: 'rls_e2e_ticket',
  rowLevelSecurity: true,
  properties: {
    id: p.integer().primary(),
    tenantId: p.uuid(),
    subject: p.string(),
  },
  filters: {
    byTenant: { name: 'byTenant', cond: (args: any) => ({ tenantId: args.tenant }), rls: true, default: false },
  },
});

const dbName = 'mikro_orm_test_rls_e2e';
const entities = [Org, Author, Book, Report, Ticket];

describe('row level security end-to-end under a non-owner role [postgres]', () => {
  let admin: MikroORM;
  let app: MikroORM;
  let appConn: MikroORM;

  // ids of rows the read-only tests reference; captured after seeding as the owner
  let authorBId: number;

  beforeAll(async () => {
    // admin ORM connects as the default superuser (owns the tables → bypasses non-forced RLS)
    admin = await MikroORM.init({ entities, dbName, driver: PostgreSqlDriver });
    await admin.schema.refresh();

    const conn = admin.em.getConnection();
    // drop any leftovers from a crashed prior run (a role with lingering grants can't be dropped directly)
    await conn.execute(`do $$ begin
      if exists (select from pg_roles where rolname = 'rls_e2e_app') then
        execute 'drop owned by rls_e2e_app';
        execute 'drop role rls_e2e_app';
      end if;
      if exists (select from pg_roles where rolname = 'rls_e2e_restricted') then
        execute 'drop owned by rls_e2e_restricted';
        execute 'drop role rls_e2e_restricted';
      end if;
    end $$;`);

    // realistic app-role grants: a plain login role with CRUD + sequence access, no ownership/superuser
    await conn.execute('create role rls_e2e_app login');
    await conn.execute('grant usage on schema public to rls_e2e_app');
    await conn.execute('grant select, insert, update, delete on all tables in schema public to rls_e2e_app');
    await conn.execute('grant usage on all sequences in schema public to rls_e2e_app');

    // a read-only role reachable via `set role`, to prove session-context role switching really applies
    await conn.execute('create role rls_e2e_restricted');
    await conn.execute('grant usage on schema public to rls_e2e_restricted');
    await conn.execute('grant select on all tables in schema public to rls_e2e_restricted');
    await conn.execute('grant rls_e2e_restricted to rls_e2e_app');

    // seed as the owner (bypasses RLS), so no session variable is needed here
    const seed = admin.em.fork();
    seed.create(Org, { name: 'globex' });

    const authorA1 = seed.create(Author, { tenantId: TA, name: 'a1' });
    seed.create(Author, { tenantId: TA, name: 'a2' });
    const authorB = seed.create(Author, { tenantId: TB, name: 'b1' });

    seed.create(Book, { tenantId: TA, title: 'a-book-1', author: authorA1 });
    seed.create(Book, { tenantId: TA, title: 'a-book-2', author: authorA1 });
    seed.create(Book, { tenantId: TB, title: 'b-book-1', author: authorB });

    seed.create(Report, { tenantId: TA, title: 'report-a' });
    seed.create(Report, { tenantId: TB, title: 'report-b' });

    seed.create(Ticket, { tenantId: TA, subject: 'ticket-a' });
    seed.create(Ticket, { tenantId: TB, subject: 'ticket-b' });
    await seed.flush();
    authorBId = authorB.id;

    // app ORMs connect as the unprivileged role (trust auth → user only, no password)
    app = await MikroORM.init({ entities, dbName, driver: PostgreSqlDriver, user: 'rls_e2e_app' });
    appConn = await MikroORM.init({
      entities,
      dbName,
      driver: PostgreSqlDriver,
      user: 'rls_e2e_app',
      sessionContext: 'connection',
    });
  });

  afterAll(async () => {
    // optional chaining + the guarded drop below keep a beforeAll failure from cascading into teardown errors
    await app?.close(true);
    await appConn?.close(true);

    if (!admin) {
      return;
    }

    // remove the roles' privileges in this db before dropping them, then drop the database as the owner
    const conn = admin.em.getConnection();
    await conn.execute(`do $$ begin
      if exists (select from pg_roles where rolname = 'rls_e2e_app') then
        execute 'drop owned by rls_e2e_app';
        execute 'drop role rls_e2e_app';
      end if;
      if exists (select from pg_roles where rolname = 'rls_e2e_restricted') then
        execute 'drop owned by rls_e2e_restricted';
        execute 'drop role rls_e2e_restricted';
      end if;
    end $$;`);
    await admin.schema.dropDatabase();
    await admin.close();
  });

  test('read isolation: find/count/findOne and populate never leak cross-tenant rows', async () => {
    const em = app.em.fork({ session: { variables: { 'app.tenant': TA } } });

    const authors = await em.find(Author, {});
    expect(authors.map(a => a.tenantId)).toEqual([TA, TA]);

    expect(await em.count(Author, {})).toBe(2);
    // a cross-tenant primary key is invisible, so a direct lookup resolves to null
    expect(await em.findOne(Author, authorBId)).toBeNull();

    // non-RLS table is fully visible regardless of the session tenant
    expect(await em.fork({ session: { variables: { 'app.tenant': TA } } }).count(Org, {})).toBe(1);

    // populate over the m:1 (book → author) stays within the tenant
    const books = await em
      .fork({ session: { variables: { 'app.tenant': TA } } })
      .find(Book, {}, { populate: ['author'] });
    expect(books).toHaveLength(2);
    expect(books.every(b => b.tenantId === TA && b.author.tenantId === TA)).toBe(true);

    // both load strategies for the 1:m (author → books) must also stay tenant-scoped
    for (const strategy of [LoadStrategy.JOINED, LoadStrategy.SELECT_IN]) {
      const withBooks = await app.em
        .fork({ session: { variables: { 'app.tenant': TA } } })
        .find(Author, {}, { populate: ['books'], strategy });
      expect(withBooks).toHaveLength(2);
      expect(withBooks.flatMap(a => a.books.getItems()).every(b => b.tenantId === TA)).toBe(true);
    }
  });

  test('QB and raw execute are enforced at the DB level without any application filter', async () => {
    const em = app.em.fork({ session: { variables: { 'app.tenant': TA } } });

    const viaQb = await em.qb(Author).select('*').getResult();
    expect(viaQb.map(a => a.tenantId)).toEqual([TA, TA]);

    const rows = await em
      .fork({ session: { variables: { 'app.tenant': TA } } })
      .execute('select * from "rls_e2e_author" order by "id"');
    expect(rows.map((r: any) => r.tenant_id)).toEqual([TA, TA]);
  });

  test('write isolation: cross-tenant update/delete affect 0 rows, own-tenant flush works', async () => {
    const em = app.em.fork({ session: { variables: { 'app.tenant': TC } } });

    // an own-tenant entity created via the unit of work persists (uses the granted sequence + passes the check)
    const mine = em.create(Author, { tenantId: TC, name: 'c-owner' });
    await em.flush();

    mine.name = 'c-owner-renamed';
    await em.flush();
    em.clear();
    const reloaded = await em.findOneOrFail(Author, { tenantId: TC });
    expect(reloaded.name).toBe('c-owner-renamed');

    // a cross-tenant row is invisible, so update/delete simply match nothing (no error, 0 rows)
    expect(await em.nativeUpdate(Author, { id: authorBId }, { name: 'hacked' })).toBe(0);
    expect(await em.nativeDelete(Author, { id: authorBId })).toBe(0);
  });

  test('WITH CHECK violation: inserting a foreign-tenant row throws (native and flush paths)', async () => {
    const insertEm = app.em.fork({ session: { variables: { 'app.tenant': TD } } });
    await expect(insertEm.insert(Author, { tenantId: TB, name: 'smuggled' })).rejects.toThrow(
      RowLevelSecurityViolationException,
    );

    const flushEm = app.em.fork({ session: { variables: { 'app.tenant': TD } } });
    flushEm.create(Author, { tenantId: TB, name: 'smuggled' });
    await expect(flushEm.flush()).rejects.toThrow(RowLevelSecurityViolationException);

    // the matching-tenant insert is allowed by the check
    const okEm = app.em.fork({ session: { variables: { 'app.tenant': TD } } });
    await okEm.insert(Author, { tenantId: TD, name: 'legit' });
    expect(await okEm.count(Author, {})).toBe(1);
  });

  test('fail closed: no session context leaves the GUC unset and the query errors', async () => {
    // with no session context the read runs outside a transaction, so `app.tenant` is never set.
    // it fails closed with a driver error rather than returning an empty set: a pristine connection raises
    // 'unrecognized configuration parameter', a pooled one (where the GUC was reset to '') fails the uuid cast
    const em = app.em.fork();
    await expect(em.find(Author, {})).rejects.toThrow(
      /unrecognized configuration parameter|invalid input syntax for type uuid/,
    );
  });

  test('per-command policies: selectable within the tenant, foreign insert throws, update matches nothing', async () => {
    const em = app.em.fork({ session: { variables: { 'app.tenant': TA } } });

    const reports = await em.find(Report, {});
    expect(reports.map(r => r.title)).toEqual(['report-a']);

    // insert policy check rejects a foreign tenant
    await expect(
      app.em.fork({ session: { variables: { 'app.tenant': TA } } }).insert(Report, { tenantId: TB, title: 'x' }),
    ).rejects.toThrow(RowLevelSecurityViolationException);

    // no update policy exists → even own-tenant rows are not visible to UPDATE (0 rows), leaving the seed intact
    const updated = await app.em
      .fork({ session: { variables: { 'app.tenant': TA } } })
      .nativeUpdate(Report, {}, { title: 'renamed' });
    expect(updated).toBe(0);
  });

  test('em.transactional: a multi-op transaction (and a nested savepoint) stays tenant-scoped', async () => {
    const em = app.em.fork({ session: { variables: { 'app.tenant': TF } } });

    const found = await em.transactional(async tem => {
      tem.create(Author, { tenantId: TF, name: 'f-outer' });
      await tem.flush();

      // nested transactional opens a savepoint and must remain scoped to the same tenant
      await tem.transactional(async nested => {
        nested.create(Author, { tenantId: TF, name: 'f-nested' });
        await nested.flush();
      });

      return tem.find(Author, {});
    });

    expect(found.map(a => a.name).sort()).toEqual(['f-nested', 'f-outer']);
    expect(found.every(a => a.tenantId === TF)).toBe(true);
  });

  test('filter bridge e2e: app filter and DB policy both scope, and the policy holds when the filter is off', async () => {
    // filter enabled → app WHERE + DB policy, both scoped by the staged session variable
    const em = app.em.fork();
    em.setFilterParams('byTenant', { tenant: TA });
    const filtered = await em.find(Ticket, {}, { filters: ['byTenant'] });
    expect(filtered.map(t => t.subject)).toEqual(['ticket-a']);

    // raw execute bypasses the application filter; the compiled policy + staged variable still scope it
    const rawEm = app.em.fork();
    rawEm.setFilterParams('byTenant', { tenant: TA });
    const raw = await rawEm.execute('select * from "rls_e2e_ticket" order by "id"');
    expect(raw.map((r: any) => r.tenant_id)).toEqual([TA]);

    // disabling the application filter still yields only tenant rows thanks to the DB policy
    const noFilter = app.em.fork();
    noFilter.setFilterParams('byTenant', { tenant: TA });
    const rows = await noFilter.find(Ticket, {}, { filters: false });
    expect(rows.map(t => t.subject)).toEqual(['ticket-a']);
  });

  test("'connection' strategy: isolation on plain finds with no transactions, no leak across contexts", async () => {
    const a = await RequestContext.create(appConn.em, async () => {
      const em = RequestContext.getEntityManager()!;
      em.setSessionContext({ variables: { 'app.tenant': TA } });
      return em.find(Author, {});
    });
    expect(a.map(x => x.tenantId)).toEqual([TA, TA]);

    // a subsequent request with a different tenant reuses the pool but must not see the previous tenant's rows
    const b = await RequestContext.create(appConn.em, async () => {
      const em = RequestContext.getEntityManager()!;
      em.setSessionContext({ variables: { 'app.tenant': TB } });
      return em.find(Author, {});
    });
    expect(b.map(x => x.tenantId)).toEqual([TB]);
  });

  test('result cache is keyed by session context: tenant A cache is not served to tenant B', async () => {
    const emA = app.em.fork({ session: { variables: { 'app.tenant': TA } } });
    const a = await emA.find(Author, {}, { cache: 5000 });
    expect(a.map(x => x.tenantId)).toEqual([TA, TA]);

    const emB = app.em.fork({ session: { variables: { 'app.tenant': TB } } });
    const b = await emB.find(Author, {}, { cache: 5000 });
    expect(b.map(x => x.tenantId)).toEqual([TB]);

    // the query builder cache path must be keyed by the session context too
    const qbA = await emA.qb(Author).select('*').cache(5000).getResultList();
    expect(qbA.map(x => x.tenantId)).toEqual([TA, TA]);
    const qbB = await emB.qb(Author).select('*').cache(5000).getResultList();
    expect(qbB.map(x => x.tenantId)).toEqual([TB]);
  });

  test('role switching via session context: a read-only role can select but not insert', async () => {
    const em = app.em.fork({ session: { role: 'rls_e2e_restricted', variables: { 'app.tenant': TA } } });

    // `set local role` really applies: the restricted role's select grant + the policy yield tenant rows
    const authors = await em.find(Author, {});
    expect(authors.map(a => a.tenantId)).toEqual([TA, TA]);

    // the restricted role lacks INSERT, so a write is rejected with a privilege error (not an RLS violation)
    const writeEm = app.em.fork({ session: { role: 'rls_e2e_restricted', variables: { 'app.tenant': TA } } });
    const err = await writeEm.insert(Author, { tenantId: TA, name: 'nope' }).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toMatch(/permission denied/);
    // a 42501 privilege error must not fall through to the RLS branch of the exception converter
    expect(err).not.toBeInstanceOf(RowLevelSecurityViolationException);
  });

  test('addFilter rejects an rls filter scoped to an entity with a runtime-registration message', () => {
    // the entity option does not make it declarable at runtime — the message must not call it a global filter
    expect(() => app.em.addFilter({ name: 'scoped', entity: Author, cond: () => ({}), rls: true } as any)).toThrow(
      /cannot be flagged with 'rls' when registered at runtime/,
    );
    expect(() => app.em.addFilter({ name: 'scoped', entity: Author, cond: () => ({}), rls: true } as any)).not.toThrow(
      /global filter/,
    );
  });

  // nested (not sibling) so it runs while the roles created above still exist, before they are dropped;
  // its own database keeps schema.clear (truncate) from disturbing the shared read fixture
  describe('schema.clear keeps policies enforcing', () => {
    const clearDbName = 'mikro_orm_test_rls_e2e_clear';
    let clearAdmin: MikroORM;
    let clearApp: MikroORM;

    beforeAll(async () => {
      clearAdmin = await MikroORM.init({ entities: [Author, Book], dbName: clearDbName, driver: PostgreSqlDriver });
      await clearAdmin.schema.refresh();

      const conn = clearAdmin.em.getConnection();
      await conn.execute('grant usage on schema public to rls_e2e_app');
      await conn.execute('grant select, insert, update, delete on all tables in schema public to rls_e2e_app');
      await conn.execute('grant usage on all sequences in schema public to rls_e2e_app');

      clearApp = await MikroORM.init({
        entities: [Author, Book],
        dbName: clearDbName,
        driver: PostgreSqlDriver,
        user: 'rls_e2e_app',
      });
    });

    afterAll(async () => {
      await clearApp?.close(true);

      if (!clearAdmin) {
        return;
      }

      // release the app role's privileges in this db (the roles themselves are dropped by the parent suite)
      await clearAdmin.em.getConnection().execute('drop owned by rls_e2e_app');
      await clearAdmin.schema.dropDatabase();
      await clearAdmin.close();
    });

    test('truncate leaves the policies in place so the app role stays isolated after reseeding', async () => {
      const seed = clearAdmin.em.fork();
      seed.create(Author, { tenantId: TA, name: 'pre-a' });
      seed.create(Author, { tenantId: TB, name: 'pre-b' });
      await seed.flush();

      await clearAdmin.schema.clear();

      const reseed = clearAdmin.em.fork();
      reseed.create(Author, { tenantId: TA, name: 'post-a' });
      reseed.create(Author, { tenantId: TB, name: 'post-b' });
      await reseed.flush();

      const em = clearApp.em.fork({ session: { variables: { 'app.tenant': TA } } });
      const authors = await em.find(Author, {});
      expect(authors.map(a => a.name)).toEqual(['post-a']);
    });
  });
});
