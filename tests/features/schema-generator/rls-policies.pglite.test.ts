import { EntitySchema, MikroORM } from '@mikro-orm/pglite';

const Rls = new EntitySchema({
  name: 'RlsPgLite',
  tableName: 'rls_pglite',
  rowLevelSecurity: 'force',
  properties: {
    id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
    tenantId: { type: 'string', name: 'tenantId', fieldName: 'tenant_id', columnType: 'uuid' },
  },
  policies: [
    { name: 'pglite_sel', command: 'select', using: `tenant_id = current_setting('app.tenant')::uuid` },
    { name: 'pglite_ins', command: 'insert', check: `tenant_id = current_setting('app.tenant')::uuid` },
  ],
});

describe('rls policies [pglite]', () => {
  test('policies survive a create + refresh round-trip [pglite]', async () => {
    const orm = await MikroORM.init({ entities: [Rls], dbName: 'memory://' });
    await orm.schema.refresh();

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // refresh drops and recreates everything, then re-introspection must still match
    await orm.schema.refresh();
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.close();
  });
});
