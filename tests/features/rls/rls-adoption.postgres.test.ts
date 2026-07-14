import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';

// databases that adopted RLS by hand before the ORM managed it (GH #6137/#6413) must be able to upgrade
// without the schema generator proposing to drop their policies
const Book = defineEntity({
  name: 'RlsAdoptionBook',
  tableName: 'rls_adoption_book',
  properties: {
    id: p.integer().primary(),
    tenantId: p.uuid(),
  },
});

const ManagedBook = defineEntity({
  name: 'RlsAdoptionManagedBook',
  tableName: 'rls_adoption_book',
  properties: {
    id: p.integer().primary(),
    tenantId: p.uuid(),
  },
  policies: [{ name: 'declared_tenant', using: `tenant_id = current_setting('app.tenant')::uuid` }],
});

const dbName = 'mikro_orm_test_rls_adoption';

async function createHandWrittenRls(orm: MikroORM) {
  await orm.em.execute(`alter table "rls_adoption_book" enable row level security`);
  await orm.em.execute(
    `create policy "manual_tenant" on "rls_adoption_book" using (tenant_id = current_setting('app.tenant')::uuid)`,
  );
}

describe('adopting the ORM on a database with hand-written RLS [postgres]', () => {
  test('by default, unmanaged policies are dropped by the diff (documented behavior)', async () => {
    const orm = await MikroORM.init({ entities: [Book], dbName });
    await orm.schema.refresh();
    await createHandWrittenRls(orm);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain(`drop policy "manual_tenant" on "rls_adoption_book"`);
    expect(diff).toContain(`alter table "rls_adoption_book" disable row level security`);

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('with `ignorePolicies`, hand-written policies and RLS state are left untouched', async () => {
    const orm = await MikroORM.init({ entities: [Book], dbName, schemaGenerator: { ignorePolicies: true } });
    await orm.schema.refresh();
    await createHandWrittenRls(orm);

    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('with `ignorePolicies`, declared policies are still created next to hand-written ones', async () => {
    const orm = await MikroORM.init({ entities: [Book], dbName, schemaGenerator: { ignorePolicies: true } });
    await orm.schema.refresh();
    await createHandWrittenRls(orm);

    const managed = await MikroORM.init({
      entities: [ManagedBook],
      dbName,
      schemaGenerator: { ignorePolicies: true },
    });
    const diff = await managed.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain(`create policy "declared_tenant" on "rls_adoption_book"`);
    expect(diff).not.toContain('drop policy');
    expect(diff).not.toContain('disable row level security');

    await managed.schema.execute(diff);
    // the hand-written policy survives, the declared one is now present, and the diff is stable
    expect(await managed.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
    const policies = await managed.em.execute(
      `select policyname from pg_policies where tablename = 'rls_adoption_book' order by policyname`,
    );
    expect(policies.map(r => r.policyname)).toEqual(['declared_tenant', 'manual_tenant']);

    await orm.close(true);
    await managed.schema.dropDatabase();
    await managed.close(true);
  });

  test('with `ignorePolicies`, enabling and forcing RLS from metadata is still emitted', async () => {
    const orm = await MikroORM.init({ entities: [Book], dbName, schemaGenerator: { ignorePolicies: true } });
    await orm.schema.refresh();

    const meta = orm.getMetadata(Book);
    meta.rowLevelSecurity = 'force';
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain(`alter table "rls_adoption_book" enable row level security`);
    expect(diff).toContain(`alter table "rls_adoption_book" force row level security`);
    await orm.schema.execute(diff);

    // downgrading is suppressed under `ignorePolicies` — the hand-off back to unmanaged state is manual
    meta.rowLevelSecurity = false;
    expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });
});
