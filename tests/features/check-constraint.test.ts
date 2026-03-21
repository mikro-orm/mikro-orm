import { CheckConstraintViolationException, defineEntity, MikroORM, p, quote } from '@mikro-orm/sqlite';

const ProductSchema = defineEntity({
  name: 'Product',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    barcodes: p.array(String).default([]),
    plu: p.array(String).default([]),
    price: p.decimal('number').default(0),
    stock: p
      .decimal('number')
      .default(0)
      .check(columns => quote`${columns.stock} >= 0`),
  },
});
class Product extends ProductSchema.class {}
ProductSchema.setClass(Product);

describe('check constraint', () => {
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

  it('should throw on invalid check constraint', async () => {
    const product = orm.em.create(Product, {
      title: 'Test Product Valid',
      barcodes: ['TEST183828'],
      plu: ['TEST943'],
      stock: -10,
      price: -5,
    });

    await expect(orm.em.flush()).rejects.toThrowError(CheckConstraintViolationException);
    expect(product.id).not.toBeDefined();
  });
});
