import { defineEntity, MikroORM, p, quote, serialize } from '@mikro-orm/sqlite';

const ClientProductOptionsSchema = defineEntity({
  embeddable: true,
  name: 'ClientProductOptions',
  properties: {
    excludeFromStrictStockManagement: p.boolean().default(false),
  },
});

export class ClientProductOptions extends ClientProductOptionsSchema.class {}
ClientProductOptionsSchema.setClass(ClientProductOptions);

const ProductSchema = defineEntity({
  name: 'Product',
  forceObject: true,
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    clientId: p.string(),
    productId: p.string(),
    options: () =>
      p
        .embedded(ClientProductOptions)
        .object()
        .onCreate(() => new ClientProductOptions()),
  },
  uniques: [{ properties: ['clientId', 'productId'] }],
});
class Product extends ProductSchema.class {}
ProductSchema.setClass(Product);

describe('defineEntity formula field INSERT', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Product],
      serialization: { forceObject: true },
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  it('test', async () => {
    const product = orm.em.create(Product, {
      title: 'Test',
      clientId: 'client-123',
      productId: 'product-456',
    });

    await orm.em.flush();

    expect(product.options).toEqual({ excludeFromStrictStockManagement: false });
  });
});
