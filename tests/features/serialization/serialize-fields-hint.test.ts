import { defineEntity, MikroORM, p, quote, serialize } from '@mikro-orm/sqlite';

const SupplierSchema = defineEntity({
  name: 'Supplier',
  forceObject: true,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    balance: p.float(),
    remainingBalance: p.float(),
    totalBalance: p
      .float()
      .formula(cols => quote`${cols.balance} + ${cols.remainingBalance}`)
      .precision(10)
      .scale(2),
  },
});

class Supplier extends SupplierSchema.class {}

SupplierSchema.setClass(Supplier);

const ProductSchema = defineEntity({
  name: 'Product',
  forceObject: true,
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    clientId: p.string(),
    productId: p.string(),
    supplier: () => p.manyToOne(Supplier),
  },
  uniques: [{ properties: ['clientId', 'productId'] }],
});

class Product extends ProductSchema.class {}

ProductSchema.setClass(Product);

describe('serialize respects partial loading type hint', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Product, Supplier],
      serialization: { forceObject: true },
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  it('explicit serialization respects fields hint from Loaded type', async () => {
    const clientId = 'client-123';
    const productId = 'product-456';
    const supplier = orm.em.create(Supplier, { name: 'Supplier 1', balance: 100, remainingBalance: 50 });
    const product = orm.em.create(Product, { title: 'Test', clientId, productId, supplier });

    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Product, product.id, {
      fields: ['supplier.name'],
      populate: ['supplier'],
    });
    // @ts-expect-error - balance is not in fields hint
    expect(loaded.supplier.balance).toBeUndefined();
    const serialized = serialize(loaded, { populate: ['supplier'] });

    expect(serialized).toBeDefined();
    expect(serialized.supplier.name).toBe('Supplier 1');
    // @ts-expect-error - balance is not in fields hint, serialize should respect this
    expect(serialized.supplier.balance).toBeUndefined();
  });
});
