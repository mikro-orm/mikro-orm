import { rm } from 'node:fs/promises';
import {
  DatabaseTable,
  EntitySchema,
  MikroORM,
  type Options,
  SchemaComparator,
  type SqlPolicyDef,
} from '@mikro-orm/postgresql';
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

  test('default policy names keep the collision suffix within the identifier limit', async () => {
    const longTable = `long_${'x'.repeat(70)}`;
    const Long = new EntitySchema({
      name: 'RlsLongName',
      tableName: longTable,
      properties: {
        id: idColumn(),
        val: { type: 'number', name: 'val', fieldName: 'val', columnType: 'int' },
      },
      policies: [{ using: 'val > 0' }, { using: 'val < 100' }],
    });
    const orm = await MikroORM.init({ entities: [Long], dbName: 'mikro_orm_test_rls_long', connect: false } as Options);

    const names = orm.schema
      .getTargetSchema()
      .getTable(longTable)!
      .getPolicies()
      .map(p => p.name);
    // the base name alone exceeds the limit, so the suffix must survive the truncation
    expect(names[0]).toBe(`${longTable}_all_policy`.substring(0, 63));
    expect(names[1]).toBe(`${longTable}_all_policy`.substring(0, 61) + '_2');
    expect(new Set(names).size).toBe(2);

    await orm.close(true);
  });

  test('parsePgRoles tokenizes quoted role names with commas and escaped quotes', async () => {
    const orm = await MikroORM.init({
      entities: [Locked],
      dbName: 'mikro_orm_test_rls_roles',
      connect: false,
    } as Options);
    const helper = orm.em.getPlatform().getSchemaHelper() as any;

    expect(helper.parsePgRoles(['app_reader'])).toEqual(['app_reader']);
    expect(helper.parsePgRoles('{public}')).toEqual(['public']);
    expect(helper.parsePgRoles('{app_reader,app_writer}')).toEqual(['app_reader', 'app_writer']);
    expect(helper.parsePgRoles('{admin,"role, with comma","esc\\"aped"}')).toEqual([
      'admin',
      'role, with comma',
      'esc"aped',
    ]);

    await orm.close(true);
  });

  test('dropping a policy together with the column it references [postgres]', async () => {
    const dbName = 'mikro_orm_test_rls_drop_col';
    const V1 = new EntitySchema({
      name: 'RlsDropCol',
      tableName: 'rls_drop_col',
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
      },
      policies: [{ name: 'p_tenant', using: `tenant_id = current_setting('app.tenant')::uuid` }],
    });
    const orm1 = await MikroORM.init({ entities: [V1], dbName });
    await orm1.schema.refresh();
    await orm1.close();

    // v2 removes both the column and the policy referencing it — postgres refuses to drop a column
    // a policy depends on, so the generated DDL must drop the policy first
    const V2 = new EntitySchema({
      name: 'RlsDropCol',
      tableName: 'rls_drop_col',
      properties: { id: idColumn() },
    });
    const orm2 = await MikroORM.init({ entities: [V2], dbName });
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    await orm2.schema.execute(diff);
    expect(await orm2.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm2.schema.dropDatabase();
    await orm2.close();
  });

  test('changing a policy together with dropping a column it referenced [postgres]', async () => {
    const dbName = 'mikro_orm_test_rls_change_col';
    const V1 = new EntitySchema({
      name: 'RlsChangeCol',
      tableName: 'rls_change_col',
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
        owner: { type: 'string', name: 'owner', fieldName: 'owner', columnType: 'varchar(255)' },
      },
      policies: [{ name: 'p_tenant', using: `tenant_id = current_setting('app.tenant')::uuid and owner <> 'blocked'` }],
    });
    const orm1 = await MikroORM.init({ entities: [V1], dbName });
    await orm1.schema.refresh();
    await orm1.close();

    // v2 drops the column and updates the policy to no longer reference it — the old policy still depends
    // on the column, so it must be dropped before the column and recreated after
    const V2 = new EntitySchema({
      name: 'RlsChangeCol',
      tableName: 'rls_change_col',
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
      },
      policies: [{ name: 'p_tenant', using: `tenant_id = current_setting('app.tenant')::uuid` }],
    });
    const orm2 = await MikroORM.init({ entities: [V2], dbName });
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    await orm2.schema.execute(diff);
    expect(await orm2.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm2.schema.dropDatabase();
    await orm2.close();
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
    // a crashed prior run can leave the role referenced by leftover policies, which block a plain `drop role`
    await orm.em.getConnection().execute(`do $$ begin
      if exists (select from pg_roles where rolname = 'mikro_orm_rls_reader') then
        execute 'drop owned by mikro_orm_rls_reader';
        execute 'drop role mikro_orm_rls_reader';
      end if;
    end $$;`);
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

    // every policy change is applied as drop + create — exercise each changeable attribute
    // change the using expression
    meta.policies[0].using = `tenant_id = current_setting('app.tenant')::uuid and owner <> 'x'`;
    await apply();

    // change a check-only policy's expression
    meta.policies[1].check = `tenant_id = current_setting('app.tenant')::uuid and owner is not null`;
    await apply();

    // change roles to an explicit role, then back to public (default)
    meta.policies[0].roles = ['mikro_orm_rls_reader'];
    await apply();
    meta.policies[0].roles = [];
    await apply();

    // change command
    meta.policies[1].command = 'update';
    await apply();

    // add a using expression to the update policy, then remove it again
    meta.policies[1].using = `owner <> 'blocked'`;
    await apply();
    delete meta.policies[1].using;
    await apply();

    // change type
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

  test('policies with multi-word casts round-trip without drift [postgres]', async () => {
    // postgres deparses `::timestamptz` to `::timestamp with time zone` and `::time` to `::time without time zone`
    // in pg_policies.qual; the comparator must normalize those multi-word casts or the diff churns forever
    const Casts = new EntitySchema({
      name: 'RlsCasts',
      tableName: 'rls_casts',
      properties: {
        id: idColumn(),
        createdAt: { type: 'Date', name: 'createdAt', fieldName: 'created_at', columnType: 'timestamptz' },
        startsAt: { type: 'Date', name: 'startsAt', fieldName: 'starts_at', columnType: 'time' },
      },
      policies: [
        { name: 'casts_since', command: 'select', using: `created_at >= current_setting('app.since')::timestamptz` },
        { name: 'casts_time', command: 'select', using: `starts_at >= current_setting('app.after')::time` },
      ],
    });

    const orm = await MikroORM.init({ entities: [Casts], dbName: `mikro_orm_test_rls_casts` });
    await orm.schema.ensureDatabase();
    await orm.schema.create();

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('a column type change recreates its unchanged policy [postgres]', async () => {
    const dbName = 'mikro_orm_test_rls_type_change';
    const V1 = new EntitySchema({
      name: 'RlsTypeChange',
      tableName: 'rls_type_change',
      properties: {
        id: idColumn(),
        orgId: { type: 'number', name: 'orgId', fieldName: 'org_id', columnType: 'int' },
      },
      // the policy references the column whose type changes, so postgres rejects the alter unless it is dropped first
      policies: [{ name: 'p_org', using: 'org_id > 0' }],
    });
    const orm1 = await MikroORM.init({ entities: [V1], dbName });
    await orm1.schema.refresh();
    await orm1.close();

    // int -> bigint on a policy-referenced column: the unchanged policy must be dropped before + recreated after
    const V2 = new EntitySchema({
      name: 'RlsTypeChange',
      tableName: 'rls_type_change',
      properties: {
        id: idColumn(),
        orgId: { type: 'number', name: 'orgId', fieldName: 'org_id', columnType: 'bigint' },
      },
      policies: [{ name: 'p_org', using: 'org_id > 0' }],
    });
    const orm2 = await MikroORM.init({ entities: [V2], dbName });

    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('drop policy "p_org"');
    expect(diff).toContain('create policy "p_org"');
    // the drop must come before the type alter, the recreate after
    expect(diff.indexOf('drop policy "p_org"')).toBeLessThan(diff.indexOf('alter column'));
    expect(diff.indexOf('alter column')).toBeLessThan(diff.indexOf('create policy "p_org"'));
    await orm2.schema.execute(diff);

    // the policy survives and the schema is stable afterwards
    const policies = await orm2.em.execute<{ policyname: string }[]>(
      `select policyname from pg_policies where tablename = 'rls_type_change'`,
    );
    expect(policies.map(p => p.policyname)).toEqual(['p_org']);
    expect(await orm2.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    // safe mode must still recreate the policy — the recreate is not a destructive removal, and the alter
    // fails without it
    const orm3 = await MikroORM.init({ entities: [V1], dbName });
    const safeDiff = await orm3.schema.getUpdateSchemaSQL({ wrap: false, safe: true });
    expect(safeDiff).toContain('drop policy "p_org"');
    expect(safeDiff).toContain('create policy "p_org"');

    await orm3.close();
    await orm2.schema.dropDatabase();
    await orm2.close();
  });

  test('changing only the setting name inside a policy expression is detected [postgres]', async () => {
    const dbName = 'mikro_orm_test_rls_setting_rename';
    const makeEntity = (setting: string) =>
      new EntitySchema({
        name: 'RlsSettingRename',
        tableName: 'rls_setting_rename',
        properties: {
          id: idColumn(),
          tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
        },
        policies: [{ name: 'p_tenant', using: `tenant_id = current_setting('${setting}')::uuid` }],
      });
    const orm1 = await MikroORM.init({ entities: [makeEntity('app.tenant')], dbName });
    await orm1.schema.refresh();
    await orm1.close();

    // only the dotted string literal changes — the expression normalization must not collapse both
    // literals to the same value (the alias-prefix strip once mangled `'app.tenant'` into `tenant`)
    const orm2 = await MikroORM.init({ entities: [makeEntity('req.tenant')], dbName });
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('drop policy "p_tenant"');
    expect(diff).toContain('create policy "p_tenant"');
    await orm2.schema.execute(diff);
    expect(await orm2.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm2.schema.dropDatabase();
    await orm2.close();
  });

  test('converting a column to generated recreates the policies that depend on it [postgres]', async () => {
    const dbName = 'mikro_orm_test_rls_generated';
    const makeEntity = (generated?: string) =>
      new EntitySchema({
        name: 'RlsGenerated',
        tableName: 'rls_generated',
        properties: {
          id: idColumn(),
          val: { type: 'number', name: 'val', fieldName: 'val', columnType: 'int' },
          total: { type: 'number', name: 'total', fieldName: 'total', columnType: 'int', generated },
        },
        policies: [{ name: 'p_total', using: 'total > 0' }],
      });
    const orm1 = await MikroORM.init({ entities: [makeEntity()], dbName });
    await orm1.schema.refresh();
    await orm1.close();

    // a generated-only change is emitted as a drop + re-add of the column, which the unchanged policy's
    // column dependency blocks just like an in-place type change
    const orm2 = await MikroORM.init({ entities: [makeEntity('(val * 2) stored')], dbName });
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('drop policy "p_total"');
    expect(diff).toContain('create policy "p_total"');
    expect(diff.indexOf('drop policy "p_total"')).toBeLessThan(diff.indexOf('drop column'));
    expect(diff.indexOf('drop column')).toBeLessThan(diff.indexOf('create policy "p_total"'));
    await orm2.schema.execute(diff);

    const policies = await orm2.em.execute<{ policyname: string }[]>(
      `select policyname from pg_policies where tablename = 'rls_generated'`,
    );
    expect(policies.map(p => p.policyname)).toEqual(['p_total']);
    expect(await orm2.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm2.schema.dropDatabase();
    await orm2.close();
  });

  test('a uuid column type change drops its policy before the pre-alter text cast [postgres]', async () => {
    // uuid type changes emit an extra `alter column ... type text` in the pre-alter phase, so the policy
    // drop must land before that phase, not just before the regular alter
    const dbName = 'mikro_orm_test_rls_uuid_change';
    const V1 = new EntitySchema({
      name: 'RlsUuidChange',
      tableName: 'rls_uuid_change',
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
      },
      policies: [{ name: 'p_tenant', using: `tenant_id::text != ''` }],
    });
    const orm1 = await MikroORM.init({ entities: [V1], dbName });
    await orm1.schema.refresh();
    await orm1.close();

    const V2 = new EntitySchema({
      name: 'RlsUuidChange',
      tableName: 'rls_uuid_change',
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'text' },
      },
      policies: [{ name: 'p_tenant', using: `tenant_id::text != ''` }],
    });
    const orm2 = await MikroORM.init({ entities: [V2], dbName });

    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('drop policy "p_tenant"');
    expect(diff).toContain('create policy "p_tenant"');
    expect(diff.indexOf('drop policy "p_tenant"')).toBeLessThan(diff.indexOf('alter column'));
    await orm2.schema.execute(diff);

    const policies = await orm2.em.execute<{ policyname: string }[]>(
      `select policyname from pg_policies where tablename = 'rls_uuid_change'`,
    );
    expect(policies.map(p => p.policyname)).toEqual(['p_tenant']);

    await orm2.schema.dropDatabase();
    await orm2.close();
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

  test('rebuilding a table for a partitioning change restores RLS [postgres]', async () => {
    const dbName = 'mikro_orm_test_rls_partition';
    const makeEntity = (partitionBy?: any) =>
      new EntitySchema({
        name: 'RlsPartition',
        tableName: 'rls_partition',
        partitionBy,
        rowLevelSecurity: 'force',
        properties: {
          id: idColumn(),
          tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
        },
        policies: [{ name: 'rls_partition_sel', using: `tenant_id = current_setting('app.tenant')::uuid` }],
      });

    const orm1 = await MikroORM.init({ entities: [makeEntity()], dbName });
    await orm1.schema.refresh();
    await orm1.close();

    // declaring partitioning rebuilds the table (data-preserving swap); the rebuild must re-emit RLS + policies
    const orm2 = await MikroORM.init({
      entities: [makeEntity({ type: 'hash', expression: ['id'], partitions: 2 })],
      dbName,
    });
    await orm2.schema.execute('drop schema if exists "mikro_orm_partition_swap" cascade');

    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('set schema "mikro_orm_partition_swap"');
    expect(diff).toContain('enable row level security');
    expect(diff).toContain('force row level security');
    expect(diff).toContain('create policy "rls_partition_sel"');
    await orm2.schema.execute(diff);

    // RLS enablement + the policy are restored in the catalog
    const rls = await orm2.em.execute<{ relrowsecurity: boolean; relforcerowsecurity: boolean }[]>(
      `select relrowsecurity, relforcerowsecurity from pg_class where relname = 'rls_partition'`,
    );
    expect(rls[0].relrowsecurity).toBe(true);
    expect(rls[0].relforcerowsecurity).toBe(true);
    const policies = await orm2.em.execute<{ policyname: string }[]>(
      `select policyname from pg_policies where tablename = 'rls_partition'`,
    );
    expect(policies.map(p => p.policyname)).toEqual(['rls_partition_sel']);

    // and the schema is stable afterwards
    expect(await orm2.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm2.schema.dropDatabase();
    await orm2.close();
  });

  test('a partitioning rebuild preserves hand-written policies with `ignorePolicies` [postgres]', async () => {
    const dbName = 'mikro_orm_test_rls_partition_ignore';
    const makeEntity = (partitionBy?: any) =>
      new EntitySchema({
        name: 'RlsPartitionIgnore',
        tableName: 'rls_partition_ignore',
        partitionBy,
        properties: {
          id: idColumn(),
          tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
        },
      });
    const orm1 = await MikroORM.init({ entities: [makeEntity()], dbName, schemaGenerator: { ignorePolicies: true } });
    await orm1.schema.refresh();
    await orm1.em.execute(`alter table "rls_partition_ignore" enable row level security`);
    await orm1.em.execute(
      `create policy "manual_tenant" on "rls_partition_ignore" using (tenant_id = current_setting('app.tenant')::uuid)`,
    );
    await orm1.close();

    // the rebuild recreates the table from metadata, which knows nothing about the hand-written RLS state —
    // `ignorePolicies` promises it is never dropped, so the rebuild must restore it from introspection
    const orm2 = await MikroORM.init({
      entities: [makeEntity({ type: 'hash', expression: ['id'], partitions: 2 })],
      dbName,
      schemaGenerator: { ignorePolicies: true },
    });
    await orm2.schema.execute('drop schema if exists "mikro_orm_partition_swap" cascade');

    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('set schema "mikro_orm_partition_swap"');
    expect(diff).toContain('enable row level security');
    expect(diff).toContain('create policy "manual_tenant"');
    await orm2.schema.execute(diff);

    const rls = await orm2.em.execute<{ relrowsecurity: boolean }[]>(
      `select relrowsecurity from pg_class where relname = 'rls_partition_ignore'`,
    );
    expect(rls[0].relrowsecurity).toBe(true);
    const policies = await orm2.em.execute<{ policyname: string }[]>(
      `select policyname from pg_policies where tablename = 'rls_partition_ignore'`,
    );
    expect(policies.map(p => p.policyname)).toEqual(['manual_tenant']);
    expect(await orm2.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm2.schema.dropDatabase();
    await orm2.close();
  });

  test('safe mode suppresses destructive RLS changes [postgres]', async () => {
    const dbName = 'mikro_orm_test_rls_safe';
    const V1 = new EntitySchema({
      name: 'RlsSafe',
      tableName: 'rls_safe',
      rowLevelSecurity: 'force',
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
      },
      policies: [
        { name: 'keep', using: `tenant_id = current_setting('app.tenant')::uuid` },
        { name: 'changeme', command: 'select', using: `tenant_id = current_setting('app.tenant')::uuid` },
        { name: 'removeme', command: 'insert', check: `tenant_id = current_setting('app.tenant')::uuid` },
      ],
    });
    const orm1 = await MikroORM.init({ entities: [V1], dbName });
    await orm1.schema.refresh();
    await orm1.close();

    // v2 removes `removeme`, changes `changeme`'s expression, and disables + un-forces RLS
    const V2 = new EntitySchema({
      name: 'RlsSafe',
      tableName: 'rls_safe',
      rowLevelSecurity: false,
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
      },
      policies: [
        { name: 'keep', using: `tenant_id = current_setting('app.tenant')::uuid` },
        {
          name: 'changeme',
          command: 'select',
          using: `tenant_id = current_setting('app.tenant')::uuid and tenant_id is not null`,
        },
      ],
    });
    const orm2 = await MikroORM.init({ entities: [V2], dbName });

    // safe mode: a changed policy still drops + recreates, but a merely removed policy and the disable/un-force
    // transitions are all suppressed
    const safeDiff = await orm2.schema.getUpdateSchemaSQL({ wrap: false, safe: true });
    expect(safeDiff).toContain('drop policy "changeme"');
    expect(safeDiff).toContain('create policy "changeme"');
    expect(safeDiff).not.toContain('drop policy "removeme"');
    expect(safeDiff).not.toContain('disable row level security');
    expect(safeDiff).not.toContain('no force row level security');

    // non-safe still emits every destructive change
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('drop policy "removeme"');
    expect(diff).toContain('disable row level security');
    expect(diff).toContain('no force row level security');

    await orm2.schema.dropDatabase();
    await orm2.close();
  });

  test('policies referencing another table survive schema create [postgres]', async () => {
    const dbName = 'mikro_orm_test_rls_cross';
    // `aaa_docs` is created before `zzz_memberships`, but its policy references the latter — emitting the
    // policy inline during createTable would fail with "relation does not exist"; RLS is deferred until every
    // table exists
    const Docs = new EntitySchema({
      name: 'RlsCrossDocs',
      tableName: 'aaa_docs',
      properties: {
        id: idColumn(),
        userId: { type: 'string', name: 'userId', fieldName: 'user_id', columnType: 'uuid' },
      },
      policies: [
        {
          name: 'aaa_docs_sel',
          using: `exists (select 1 from "zzz_memberships" m where m.user_id = current_setting('app.user')::uuid)`,
        },
      ],
    });
    const Memberships = new EntitySchema({
      name: 'RlsMemberships',
      tableName: 'zzz_memberships',
      properties: {
        id: idColumn(),
        userId: { type: 'string', name: 'userId', fieldName: 'user_id', columnType: 'uuid' },
      },
    });

    const orm = await MikroORM.init({ entities: [Docs, Memberships], dbName });
    await orm.schema.ensureDatabase();
    await orm.schema.create();

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('policies with RLS explicitly disabled round-trip [postgres]', async () => {
    const dbName = 'mikro_orm_test_rls_disabled';
    const Staged = new EntitySchema({
      name: 'RlsStaged',
      tableName: 'rls_staged',
      rowLevelSecurity: false,
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
      },
      policies: [{ name: 'staged_sel', using: `tenant_id = current_setting('app.tenant')::uuid` }],
    });
    const orm = await MikroORM.init({ entities: [Staged], dbName });
    await orm.schema.ensureDatabase();
    await orm.schema.create();

    // the policy is created but RLS stays disabled
    const rls = await orm.em.execute<{ relrowsecurity: boolean }[]>(
      `select relrowsecurity from pg_class where relname = 'rls_staged'`,
    );
    expect(rls[0].relrowsecurity).toBe(false);
    const policies = await orm.em.execute<{ policyname: string }[]>(
      `select policyname from pg_policies where tablename = 'rls_staged'`,
    );
    expect(policies.map(p => p.policyname)).toEqual(['staged_sel']);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('duplicate explicit policy names are rejected [postgres]', async () => {
    const Dup = new EntitySchema({
      name: 'RlsDup',
      tableName: 'rls_dup',
      properties: {
        id: idColumn(),
        tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
      },
      policies: [
        { name: 'same', command: 'select', using: `tenant_id = current_setting('app.tenant')::uuid` },
        { name: 'same', command: 'insert', check: `tenant_id = current_setting('app.tenant')::uuid` },
      ],
    });
    const orm = await MikroORM.init({
      entities: [Dup],
      dbName: 'mikro_orm_test_rls_dup',
      connect: false,
    } as Options);

    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).rejects.toThrow(
      `Entity RlsDup declares multiple row level security policies named 'same'. Policy names must be unique per table; rename one of them or omit the name to use an auto-generated one.`,
    );

    await orm.close(true);
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
