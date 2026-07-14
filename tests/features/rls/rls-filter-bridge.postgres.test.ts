import { rm } from 'node:fs/promises';
import {
  BigIntType,
  BooleanType,
  DateTimeType,
  DateType,
  DecimalType,
  defineEntity,
  EnumType,
  IntegerType,
  MikroORM,
  p,
  PostgreSqlDriver,
  SmallIntType,
  StringType,
  TextType,
  TimeType,
  TinyIntType,
  UuidType,
  type Options,
} from '@mikro-orm/postgresql';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/sqlite';
import { Migrator } from '@mikro-orm/migrations';
import { mockLogger } from '../../helpers.js';

const T1 = '11111111-1111-1111-1111-111111111111';
const T2 = '22222222-2222-2222-2222-222222222222';

const Tenant = defineEntity({
  name: 'RlsFbTenant',
  tableName: 'rls_fb_tenant',
  properties: {
    id: p.uuid().primary(),
    name: p.string(),
  },
});

// covers every cast case (uuid, int, string-no-cast) plus a m:1 relation FK, and a `setting` override
const Order = defineEntity({
  name: 'RlsFbOrder',
  tableName: 'rls_fb_order',
  rowLevelSecurity: 'force',
  properties: {
    id: p.integer().primary(),
    tenantId: p.uuid(),
    orgId: p.integer(),
    status: p.string(),
    owner: () => p.manyToOne(Tenant).nullable(),
  },
  filters: {
    byTenant: { name: 'byTenant', cond: (args: any) => ({ tenantId: args.tenant }), rls: true, default: false },
    byOrg: { name: 'byOrg', cond: (args: any) => ({ orgId: args.org }), rls: true, default: false },
    byStatus: { name: 'byStatus', cond: (args: any) => ({ status: args.status }), rls: true, default: false },
    byRelation: { name: 'byRelation', cond: (args: any) => ({ owner: args.tenant }), rls: true, default: false },
    // object condition (non-function) with a raw session lookup compiles verbatim
    byObject: { name: 'byObject', cond: { status: 'active' }, rls: true, default: false },
    // single-argument filter with a custom setting name
    byCustom: {
      name: 'byCustom',
      cond: (args: any) => ({ tenantId: args.tenant }),
      rls: { setting: 'app.current_tenant' },
      default: false,
    },
  },
});

describe('rls filter bridge (schema) [postgres]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({ entities: [Tenant, Order], dbName: 'mikro_orm_test_rls_fb_schema' });
  });

  afterAll(() => orm.close(true));

  test('compiles rls filters into policies with the right casts', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });

    expect(sql).toContain(
      `create policy "rls_fb_order_byTenant_policy" on "rls_fb_order" using ("tenant_id" = current_setting('mikro.byTenant.tenant')::uuid)`,
    );
    expect(sql).toContain(
      `create policy "rls_fb_order_byOrg_policy" on "rls_fb_order" using ("org_id" = current_setting('mikro.byOrg.org')::int)`,
    );
    // string columns need no cast — current_setting() already returns text
    expect(sql).toContain(
      `create policy "rls_fb_order_byStatus_policy" on "rls_fb_order" using ("status" = current_setting('mikro.byStatus.status'))`,
    );
    // m:1 relation compares the FK column, cast derived from the referenced PK type
    expect(sql).toContain(
      `create policy "rls_fb_order_byRelation_policy" on "rls_fb_order" using ("owner_id" = current_setting('mikro.byRelation.tenant')::uuid)`,
    );
    // object condition compiles verbatim (no session lookup)
    expect(sql).toContain(`create policy "rls_fb_order_byObject_policy" on "rls_fb_order" using ("status" = 'active')`);
    // custom setting name honored for a single-argument filter
    expect(sql).toContain(
      `create policy "rls_fb_order_byCustom_policy" on "rls_fb_order" using ("tenant_id" = current_setting('app.current_tenant')::uuid)`,
    );
    // an rls filter implies row level security is enabled on the table
    expect(sql).toContain(`alter table "rls_fb_order" enable row level security`);
    expect(sql).toContain(`alter table "rls_fb_order" force row level security`);
  });

  test('the compiled policies flow through the SqlPolicyDef path', () => {
    const table = orm.schema.getTargetSchema().getTable('rls_fb_order')!;
    expect(table.rlsEnabled).toBe(true);
    expect(table.getPolicies().map(p => p.name)).toEqual([
      'rls_fb_order_byTenant_policy',
      'rls_fb_order_byOrg_policy',
      'rls_fb_order_byStatus_policy',
      'rls_fb_order_byRelation_policy',
      'rls_fb_order_byObject_policy',
      'rls_fb_order_byCustom_policy',
    ]);
    expect(table.getPolicies().every(p => p.command === 'all' && p.type === 'permissive')).toBe(true);
  });

  test('the session-variable cast mapping covers each supported column type', () => {
    const platform = orm.em.getPlatform();
    expect(platform.getCurrentSettingCast(new UuidType())).toBe('::uuid');
    expect(platform.getCurrentSettingCast(new BigIntType())).toBe('::bigint');
    expect(platform.getCurrentSettingCast(new IntegerType())).toBe('::int');
    expect(platform.getCurrentSettingCast(new SmallIntType())).toBe('::int');
    expect(platform.getCurrentSettingCast(new TinyIntType())).toBe('::int');
    expect(platform.getCurrentSettingCast(new BooleanType())).toBe('::boolean');
    expect(platform.getCurrentSettingCast(new DateTimeType())).toBe('::timestamptz');
    expect(platform.getCurrentSettingCast(new DateType())).toBe('::date');
    expect(platform.getCurrentSettingCast(new TimeType())).toBe('::time');
    // current_setting() returns text already, so string-compatible types need no cast
    expect(platform.getCurrentSettingCast(new StringType())).toBe('');
    expect(platform.getCurrentSettingCast(new TextType())).toBe('');
    expect(platform.getCurrentSettingCast(new EnumType())).toBe('');
    // anything outside the mapping is uncastable
    expect(platform.getCurrentSettingCast(new DecimalType())).toBeNull();
  });
});

describe('rls filter bridge (live round-trip) [postgres]', () => {
  test('created policies round-trip against postgres with no drift', async () => {
    const orm = await MikroORM.init({ entities: [Tenant, Order], dbName: 'mikro_orm_test_rls_fb_rt' });
    await orm.schema.refresh();

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('migration snapshot includes the compiled policy and reloads without drift', async () => {
    const path = process.cwd() + '/temp/rls-fb-migrations';
    await rm(path, { recursive: true, force: true });

    const orm = await MikroORM.init({
      entities: [Tenant, Order],
      dbName: 'mikro_orm_test_rls_fb_mig',
      extensions: [Migrator],
      migrations: { path, snapshot: true, emit: 'ts' },
      logger: () => void 0,
    });
    await orm.schema.ensureDatabase();

    const first = await orm.migrator.create();
    expect(first.diff.up.join('\n')).toContain(
      `create policy "rls_fb_order_byTenant_policy" on "rls_fb_order" using ("tenant_id" = current_setting('mikro.byTenant.tenant')::uuid)`,
    );

    const second = await orm.migrator.create();
    expect(second.diff.up).toEqual([]);

    await orm.schema.dropDatabase();
    await rm(path, { recursive: true, force: true });
    await orm.close();
  });
});

describe('rls filter bridge (compile errors) [postgres]', () => {
  const init = (properties: any, filters: any) =>
    MikroORM.init({
      entities: [defineEntity({ name: 'RlsFbErr', tableName: 'rls_fb_err', properties, filters })],
      dbName: 'mikro_orm_test_rls_fb_err',
    });

  test('a custom setting with multiple arguments throws', async () => {
    const orm = await init(
      { id: p.integer().primary(), tenantId: p.uuid(), orgId: p.integer() },
      { f: { name: 'f', cond: (a: any) => ({ tenantId: a.t, orgId: a.o }), rls: { setting: 'x' } } },
    );
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).rejects.toThrow(
      `Filter 'f' sets a custom 'setting' but references multiple arguments (t, o).`,
    );
    await orm.close(true);
  });

  test('a condition that touches the em parameter throws', async () => {
    const orm = await init(
      { id: p.integer().primary(), tenantId: p.uuid() },
      { f: { name: 'f', cond: (a: any, type: any, em: any) => ({ tenantId: em.something }), rls: true } },
    );
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).rejects.toThrow(
      `Filter 'f' cannot be compiled to an RLS policy because its condition depends on runtime state`,
    );
    await orm.close(true);
  });

  test('a condition that coerces the type parameter throws', async () => {
    const orm = await init(
      { id: p.integer().primary(), status: p.string() },
      { f: { name: 'f', cond: (a: any, type: any) => ({ status: `${type}` }), rls: true } },
    );
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).rejects.toThrow(
      `Filter 'f' cannot be compiled to an RLS policy because its condition depends on runtime state`,
    );
    await orm.close(true);
  });

  test('an async condition throws', async () => {
    const orm = await init(
      { id: p.integer().primary(), tenantId: p.uuid() },
      { f: { name: 'f', cond: async (a: any) => ({ tenantId: a.t }), rls: true } },
    );
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).rejects.toThrow(
      `Filter 'f' cannot be compiled to an RLS policy because its condition depends on runtime state`,
    );
    await orm.close(true);
  });

  test('an uncastable column type throws', async () => {
    const orm = await init(
      { id: p.integer().primary(), price: p.decimal() },
      { f: { name: 'f', cond: (a: any) => ({ price: a.p }), rls: true } },
    );
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).rejects.toThrow(
      `Filter 'f' cannot be compiled to an RLS policy because the column type`,
    );
    await orm.close(true);
  });

  test('an argument used outside a direct comparison throws', async () => {
    const orm = await init(
      { id: p.integer().primary(), orgId: p.integer() },
      { f: { name: 'f', cond: (a: any) => ({ orgId: { $in: [a.o] } }), rls: true } },
    );
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).rejects.toThrow(
      `Filter 'f' cannot be compiled to an RLS policy because it references an argument outside of a direct comparison`,
    );
    await orm.close(true);
  });
});

describe('rls filter bridge (platform gating)', () => {
  test('an rls filter on a driver without row level security is rejected at discovery', async () => {
    await expect(
      SqliteMikroORM.init({
        entities: [
          defineEntity({
            name: 'RlsFbSqlite',
            tableName: 'rls_fb_sqlite',
            properties: { id: p.integer().primary(), tenantId: p.string() },
            filters: { byTenant: { name: 'byTenant', cond: (a: any) => ({ tenantId: a.t }), rls: true } },
          }),
        ],
        dbName: ':memory:',
      }),
    ).rejects.toThrow(`Filter 'byTenant' on entity RlsFbSqlite is flagged with 'rls'`);
  });

  test('a global (config) filter flagged with rls is rejected', async () => {
    await expect(
      MikroORM.init({
        entities: [Tenant],
        dbName: 'mikro_orm_test_rls_fb_global',
        driver: PostgreSqlDriver,
        filters: { global: { cond: (a: any) => ({ id: a.t }), rls: true } as any },
      }),
    ).rejects.toThrow(`Filter 'global' is a global filter and cannot be flagged with 'rls'`);
  });

  test('a global filter registered via addFilter with rls is rejected', async () => {
    const orm = await MikroORM.init({ entities: [Tenant], dbName: 'mikro_orm_test_rls_fb_addfilter' });
    expect(() => orm.em.addFilter({ name: 'g', cond: (a: any) => ({ id: a.t }), rls: true } as any)).toThrow(
      `Filter 'g' is a global filter and cannot be flagged with 'rls'`,
    );
    await orm.close(true);
  });

  test('setFilterParams on a non-rls filter (config, em, or unknown) stages no session context', async () => {
    const orm = await MikroORM.init({
      entities: [Tenant],
      dbName: 'mikro_orm_test_rls_fb_nonrls',
      driver: PostgreSqlDriver,
      filters: { config: { cond: () => ({}) } },
    });
    const em = orm.em.fork();
    em.addFilter({ name: 'registered', cond: () => ({}) });

    em.setFilterParams('config', { x: 1 });
    em.setFilterParams('registered', { x: 1 });
    em.setFilterParams('unknown', { x: 1 });

    expect(em.getSessionContext()).toBeUndefined();
    await orm.close(true);
  });
});

// single-policy entity keeps the runtime scenario free of unset-GUC cross-policy evaluation
const RtOrder = defineEntity({
  name: 'RlsFbRtOrder',
  tableName: 'rls_fb_rt_order',
  rowLevelSecurity: 'force',
  properties: {
    id: p.integer().primary(),
    tenantId: p.uuid(),
    title: p.string(),
  },
  filters: {
    byTenant: { name: 'byTenant', cond: (args: any) => ({ tenantId: args.tenant }), rls: true, default: false },
  },
});

describe('rls filter bridge (runtime) [postgres]', () => {
  let orm: MikroORM;
  const baseOptions: Options = {
    entities: [RtOrder],
    dbName: 'mikro_orm_test_rls_fb_runtime',
    driver: PostgreSqlDriver,
  };

  beforeAll(async () => {
    orm = await MikroORM.init(baseOptions);
    await orm.schema.refresh();

    // a non-owner, non-superuser role is required to observe the policy — superusers/owners bypass RLS even under force
    const conn = orm.em.getConnection();
    await conn.execute('drop role if exists rls_fb_role');
    await conn.execute('create role rls_fb_role');
    await conn.execute('grant usage on schema public to rls_fb_role');
    await conn.execute('grant select, insert, update, delete on "rls_fb_rt_order" to rls_fb_role');

    // seed as the superuser owner (bypasses RLS), so no session variable is needed here
    const seed = orm.em.fork();
    seed.create(RtOrder, { id: 1, tenantId: T1, title: 't1-a' });
    seed.create(RtOrder, { id: 2, tenantId: T1, title: 't1-b' });
    seed.create(RtOrder, { id: 3, tenantId: T2, title: 't2-a' });
    await seed.flush();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.em.getConnection().execute('drop role if exists rls_fb_role');
    await orm.close();
  });

  test('setFilterParams stages the matching session variable', () => {
    const em = orm.em.fork();
    em.setFilterParams('byTenant', { tenant: T1 });

    expect(em.getFilterParams('byTenant')).toEqual({ tenant: T1 });
    expect(em.getSessionContext()?.variables).toEqual({ 'mikro.byTenant.tenant': T1 });
  });

  test('a fork after setFilterParams carries both filter params and session variables', () => {
    const em = orm.em.fork();
    em.setFilterParams('byTenant', { tenant: T1 });

    const child = em.fork();
    expect(child.getFilterParams('byTenant')).toEqual({ tenant: T1 });
    expect(child.getSessionContext()?.variables).toEqual({ 'mikro.byTenant.tenant': T1 });
  });

  test('a custom setting name is used verbatim when staging a single-argument filter', async () => {
    // separate orm keeps the custom-setting filter off the runtime table (one policy per table for reads)
    const CustomOrder = defineEntity({
      name: 'RlsFbCustomOrder',
      tableName: 'rls_fb_custom_order',
      properties: { id: p.integer().primary(), tenantId: p.uuid() },
      filters: {
        byTenant: {
          name: 'byTenant',
          cond: (args: any) => ({ tenantId: args.tenant }),
          rls: { setting: 'app.current_tenant' },
          default: false,
        },
      },
    });
    const custom = await MikroORM.init({
      entities: [CustomOrder],
      dbName: 'mikro_orm_test_rls_fb_custom',
      driver: PostgreSqlDriver,
    });

    const em = custom.em.fork();
    em.setFilterParams('byTenant', { tenant: T1 });
    expect(em.getSessionContext()?.variables).toEqual({ 'app.current_tenant': T1 });

    await custom.close(true);
  });

  test('the app-level WHERE filters rows when the filter is enabled', async () => {
    const em = orm.em.fork();
    em.setFilterParams('byTenant', { tenant: T1 });

    const mock = mockLogger(orm, ['query']);
    const rows = await em.find(RtOrder, {}, { filters: ['byTenant'] });

    expect(rows.map(r => r.id).sort()).toEqual([1, 2]);
    // the enabled filter adds the tenant predicate to the query (the value is bound as a parameter)
    const select = mock.mock.calls.map(c => c[0]).find(q => q.includes('from "rls_fb_rt_order"'))!;
    expect(select).toMatch(/where "r0"\."tenant_id" = \?/);
  });

  test('the DB-level policy filters a raw query that bypasses the app filter', async () => {
    const em = orm.em.fork();
    em.setFilterParams('byTenant', { tenant: T2 });
    // switch to a non-superuser role so the policy is enforced (test infrastructure, not part of the bridge)
    em.setSessionContext({ role: 'rls_fb_role' });

    // raw execute bypasses application filters; only the policy + the session variable staged by setFilterParams apply
    const rows = await em.execute('select * from "rls_fb_rt_order" order by "id"');
    expect(rows.map(r => r.tenant_id)).toEqual([T2]);
  });

  test('the staged session context isolates cached rows per tenant', async () => {
    const emA = orm.em.fork();
    emA.setFilterParams('byTenant', { tenant: T1 });
    emA.setSessionContext({ role: 'rls_fb_role' });
    const a = await emA.find(RtOrder, {}, { cache: 5000 });
    expect(a.map(x => x.tenantId)).toEqual([T1, T1]);

    const emB = orm.em.fork();
    emB.setFilterParams('byTenant', { tenant: T2 });
    emB.setSessionContext({ role: 'rls_fb_role' });
    const b = await emB.find(RtOrder, {}, { cache: 5000 });
    expect(b.map(x => x.tenantId)).toEqual([T2]);
  });
});
