import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const ClientProductOptionsSchema = defineEntity({
  embeddable: true,
  name: 'ClientProductOptions',
  properties: {
    excludeFromStrictStockManagement: p.boolean().default(false),
  },
});

export class ClientProductOptions extends ClientProductOptionsSchema.class {}
ClientProductOptionsSchema.setClass(ClientProductOptions);

const ClientProductSchema = defineEntity({
  name: 'ClientProduct',
  tableName: 'ClientProducts',
  properties: {
    id: p.integer().primary(),
    name: p.string().length(80).unique(),
    options: () =>
      p
        .embedded(ClientProductOptions)
        .object()
        .onCreate(() => new ClientProductOptions()),
  },
});

export class ClientProduct extends ClientProductSchema.class {}
ClientProductSchema.setClass(ClientProduct);

describe('GH #7411', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [ClientProduct],
      serialization: { forceObject: true },
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  it('should apply embedded defaults during upsert with onCreate', async () => {
    const cp = await orm.em.upsert(
      ClientProduct,
      {
        name: 'Test Product',
      },
      { onConflictAction: 'ignore', onConflictFields: ['name'] },
    );

    expect(cp.id).toBeDefined();
    expect(cp.options).not.toBeNull();
    expect(cp.options.excludeFromStrictStockManagement).toBe(false);
  });
});
