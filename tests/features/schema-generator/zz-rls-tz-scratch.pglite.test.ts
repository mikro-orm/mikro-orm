import { defineEntity, MikroORM, p } from '@mikro-orm/pglite';

const Ent = defineEntity({
  name: 'RlsTime',
  tableName: 'rls_time',
  properties: {
    id: p.integer().primary(),
    openAt: p.time(),
  },
  filters: {
    after: { name: 'after', cond: (args: any) => ({ openAt: { $gte: args.t } }), rls: true, default: false },
  },
});

describe('rls time idempotency [pglite]', () => {
  test('time cast round-trips without drift', async () => {
    const orm = await MikroORM.init({ entities: [Ent], dbName: 'memory://' });
    await orm.schema.refresh();
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');
    await orm.close();
  });
});
