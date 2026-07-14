import { rm } from 'node:fs/promises';
import { DatabaseTable, EntitySchema, MikroORM, SchemaComparator, type SqlPolicyDef } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';

function idColumn() {
  return { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' } as const;
}

// entities covering every policy option combination, used for the create-SQL dump (never executed,
// so referenced roles need not exist in the cluster)
const Posts = new EntitySchema({
  name: 'Posts',
  tableName: 'posts',
  properties: {
    id: idColumn(),
    tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
  },
  policies: [
    {
      using: `tenant_id = current_setting('app.tenant')::uuid`,
      check: `tenant_id = current_setting('app.tenant')::uuid`,
    },
  ],
});

const Docs = new EntitySchema({
  name: 'Docs',
  tableName: 'docs',
  properties: {
    id: idColumn(),
    ownerId: { type: 'string', name: 'ownerId', fieldName: 'owner_id', columnType: 'uuid' },
  },
  policies: [
    {
      name: 'docs_read',
      command: 'select',
      type: 'restrictive',
      roles: ['app_reader', 'app_writer'],
      using: `owner_id = current_setting('app.user')::uuid`,
    },
  ],
});

const Audit = new EntitySchema({
  name: 'Audit',
  tableName: 'audit',
  properties: {
    id: idColumn(),
    actor: { type: 'string', name: 'actor', fieldName: 'actor', columnType: 'varchar(255)' },
  },
  policies: [{ name: 'audit_ins', command: 'insert', roles: ['public'], check: `actor = current_user` }],
});

const Secrets = new EntitySchema({
  name: 'Secrets',
  tableName: 'secrets',
  rowLevelSecurity: 'force',
  properties: {
    id: idColumn(),
    tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
  },
  policies: [
    {
      name: 'secrets_upd',
      command: 'update',
      using: `tenant_id = current_setting('app.tenant')::uuid`,
      check: `tenant_id = current_setting('app.tenant')::uuid`,
    },
  ],
});

const Locked = new EntitySchema({
  name: 'Locked',
  tableName: 'locked',
  rowLevelSecurity: true,
  properties: { id: idColumn() },
});

const Multi = new EntitySchema({
  name: 'Multi',
  tableName: 'multi',
  properties: {
    id: idColumn(),
    val: { type: 'number', name: 'val', fieldName: 'val', columnType: 'int' },
  },
  // two unnamed policies with the same command exercise the collision suffix in name defaulting
  policies: [{ using: 'val > 0' }, { using: 'val < 100' }],
});

describe('rls policies [postgres]', () => {
  test('create schema SQL for policies [postgres]', async () => {
    const orm = await MikroORM.init({
      entities: [Posts, Docs, Audit, Secrets, Locked, Multi],
      dbName: `mikro_orm_test_rls_create`,
    });

    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot();

    // deterministic default names + collision suffix
    const schema = orm.schema.getTargetSchema();
    expect(
      schema
        .getTable('posts')!
        .getPolicies()
        .map(p => p.name),
    ).toEqual(['posts_all_policy']);
    expect(
      schema
        .getTable('multi')!
        .getPolicies()
        .map(p => p.name),
    ).toEqual(['multi_all_policy', 'multi_all_policy_2']);
    expect(schema.getTable('locked')!.rlsEnabled).toBe(true);
    expect(schema.getTable('secrets')!.rlsForced).toBe(true);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('policy round-trips against postgres [postgres]', async () => {
    // starts with no RLS; the table is first materialized through the update (diff) path
    const Rls = new EntitySchema({
      name: 'RlsRoundTrip',
      tableName: 'rls_round_trip',
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
        owner: { type: 'string', name: 'owner', fieldName: 'owner', columnType: 'varchar(255)' },
      },
    });

    const orm = await MikroORM.init({ entities: [Rls], dbName: `mikro_orm_test_rls_rt` });
    await orm.schema.ensureDatabase();
    await orm.em.getConnection().execute(`drop role if exists mikro_orm_rls_reader`);
    await orm.em.getConnection().execute(`create role mikro_orm_rls_reader`);

    const meta = orm.getMetadata(Rls);
    const assertStable = async () => {
      const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
      expect(diff).toBe('');
    };

    const apply = async () => {
      const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
      expect(diff).not.toBe('');
      await orm.schema.execute(diff);
      await assertStable();
    };

    // create the (non-RLS) table via the update path
    await apply();

    // enable RLS by adding the first policy (rls disabled -> enabled transition)
    meta.policies.push({ name: 'p_sel', command: 'select', using: `tenant_id = current_setting('app.tenant')::uuid` });
    await apply();

    // add a check-only policy
    meta.policies.push({ name: 'p_ins', command: 'insert', check: `tenant_id = current_setting('app.tenant')::uuid` });
    await apply();

    // change the using expression (alter, using present)
    meta.policies[0].using = `tenant_id = current_setting('app.tenant')::uuid and owner <> 'x'`;
    await apply();

    // change a check-only policy's expression (alter, no using, check present)
    meta.policies[1].check = `tenant_id = current_setting('app.tenant')::uuid and owner is not null`;
    await apply();

    // change roles to an explicit role, then back to public (default)
    meta.policies[0].roles = ['mikro_orm_rls_reader'];
    await apply();
    meta.policies[0].roles = [];
    await apply();

    // change command — postgres cannot alter it, so drop + create
    meta.policies[1].command = 'update';
    await apply();

    // add a using expression to the update policy (alter can add it)
    meta.policies[1].using = `owner <> 'blocked'`;
    await apply();

    // remove it again — `alter policy` cannot unset an expression, so drop + create
    delete meta.policies[1].using;
    await apply();

    // change type — drop + create
    meta.policies[0].type = 'restrictive';
    await apply();

    // remove a policy
    meta.policies = meta.policies.filter(p => p.name !== 'p_ins');
    await apply();

    // enforce for the owner (force)
    meta.rowLevelSecurity = 'force';
    await apply();

    // downgrade back to plain enabled (no force)
    meta.rowLevelSecurity = true;
    await apply();

    // disable entirely (drop remaining policies + disable rls)
    meta.policies = [];
    meta.rowLevelSecurity = false;
    await apply();

    await orm.schema.dropDatabase();
    await orm.em.getConnection().execute(`drop role if exists mikro_orm_rls_reader`);
    await orm.close();
  });

  test('pg-canonicalized expressions round-trip without drift [postgres]', async () => {
    const Expr = new EntitySchema({
      name: 'RlsExpr',
      tableName: 'rls_expr',
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
        orgId: { type: 'number', name: 'orgId', fieldName: 'org_id', columnType: 'int' },
        status: { type: 'string', name: 'status', fieldName: 'status', columnType: 'varchar(20)' },
      },
      policies: [
        // casts, current_setting and an and/or combo
        {
          name: 'expr_sel',
          command: 'select',
          using: `tenant_id = current_setting('app.tenant')::uuid and (status <> 'archived' or org_id > 0)`,
        },
        // `in (...)` — postgres rewrites this to `= any (...)`
        { name: 'expr_ins', command: 'insert', check: `org_id in (1, 2, 3)` },
      ],
    });

    const orm = await MikroORM.init({ entities: [Expr], dbName: `mikro_orm_test_rls_expr` });
    await orm.schema.ensureDatabase();
    await orm.schema.create();

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('multi-schema policy round-trip [postgres]', async () => {
    const Scoped = new EntitySchema({
      name: 'RlsScoped',
      tableName: 'rls_scoped',
      schema: 'rls_ns',
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
      },
      policies: [{ name: 'scoped_sel', command: 'select', using: `tenant_id = current_setting('app.tenant')::uuid` }],
    });

    const orm = await MikroORM.init({ entities: [Scoped], dbName: `mikro_orm_test_rls_ns`, schema: 'rls_ns' });
    await orm.schema.ensureDatabase();
    await orm.em.getConnection().execute('create schema if not exists "rls_ns"');
    await orm.schema.create();

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('snapshot serialization is stable [postgres]', async () => {
    const Plain = new EntitySchema({
      name: 'PlainNoRls',
      tableName: 'plain_no_rls',
      properties: { id: idColumn() },
    });

    const orm = await MikroORM.init({
      entities: [Posts, Docs, Audit, Secrets, Locked, Multi, Plain],
      dbName: `mikro_orm_test_rls_snap`,
    });

    const target = orm.schema.getTargetSchema();
    const platform = orm.em.getPlatform();
    const json = JSON.parse(JSON.stringify(target));
    const comparator = new SchemaComparator(platform);

    // a table without RLS emits no policy/rls keys, keeping non-RLS snapshots byte-for-byte unchanged
    const plainJson = target.getTable('plain_no_rls')!.toJSON();
    expect(plainJson.policies).toBeUndefined();
    expect(plainJson.rlsEnabled).toBeUndefined();
    expect(plainJson.rlsForced).toBeUndefined();

    // serialize → reload → compare produces no policy/rls drift; build policy-only tables on both
    // sides so the comparator sees only the RLS state (columns are checked by other suites)
    for (const table of target.getTables()) {
      const tbl = json.tables.find((t: any) => t.name === table.name && t.schema === table.schema);
      const from = new DatabaseTable(platform, tbl.name, tbl.schema);
      from.setPolicies((tbl.policies ?? []).map((p: SqlPolicyDef) => ({ ...p, roles: p.roles ?? [] })));
      from.rlsEnabled = !!tbl.rlsEnabled;
      from.rlsForced = !!tbl.rlsForced;

      const to = new DatabaseTable(platform, table.name, table.schema);
      to.setPolicies(table.getPolicies());
      to.rlsEnabled = table.rlsEnabled;
      to.rlsForced = table.rlsForced;

      expect(comparator.diffTable(from, to)).toBeFalsy();
    }

    // the exact snapshot shape settled on for migrations
    expect(target.getTable('docs')!.toJSON().policies).toEqual([
      {
        name: 'docs_read',
        command: 'select',
        type: 'restrictive',
        roles: ['app_reader', 'app_writer'],
        using: `owner_id = current_setting('app.user')::uuid`,
      },
    ]);
    const postsJson = target.getTable('posts')!.toJSON();
    expect(postsJson.policies).toEqual([
      {
        name: 'posts_all_policy',
        command: 'all',
        type: 'permissive',
        using: `tenant_id = current_setting('app.tenant')::uuid`,
        check: `tenant_id = current_setting('app.tenant')::uuid`,
      },
    ]);
    expect(postsJson.rlsEnabled).toBe(true);
    expect(target.getTable('secrets')!.toJSON().rlsForced).toBe(true);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('migration snapshot reload produces no drift [postgres]', async () => {
    const path = process.cwd() + '/temp/rls-migrations';
    await rm(path, { recursive: true, force: true });

    const orm = await MikroORM.init({
      entities: [Posts, Docs, Secrets, Locked],
      dbName: `mikro_orm_test_rls_mig`,
      extensions: [Migrator],
      migrations: { path, snapshot: true, emit: 'ts' },
      logger: () => void 0,
    });
    await orm.schema.ensureDatabase();

    // first migration captures the full schema and stores the snapshot (with policies + rls state)
    const first = await orm.migrator.create();
    expect(first.diff.up.join('\n')).toContain('create policy');

    // second migration reloads the snapshot and diffs it against metadata — must be empty
    const second = await orm.migrator.create();
    expect(second.diff.up).toEqual([]);

    await orm.schema.dropDatabase();
    await rm(path, { recursive: true, force: true });
    await orm.close();
  });
});
