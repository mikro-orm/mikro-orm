import { defineEntity, MikroORM, p, serialize, wrap } from '@mikro-orm/sqlite';

const SupplierSchema = defineEntity({
  name: 'Supplier',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    country: p.string(),
  },
});

class Supplier extends SupplierSchema.class {}

SupplierSchema.setClass(Supplier);

const ProductSchema = defineEntity({
  name: 'Product',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    price: p.integer(),
    supplier: () => p.manyToOne(Supplier),
  },
});

class Product extends ProductSchema.class {}

ProductSchema.setClass(Product);

describe('serialize options reuse', () => {
  let orm: MikroORM;
  let products: Product[];

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Product, Supplier],
    });
    await orm.schema.refresh();

    const supplier = orm.em.create(Supplier, { name: 'Supplier 1', country: 'GR' });
    orm.em.create(Product, { title: 'Product 1', price: 10, supplier });
    orm.em.create(Product, { title: 'Product 2', price: 20, supplier });
    await orm.em.flush();
    orm.em.clear();

    products = await orm.em.find(Product, {}, { populate: ['supplier'], orderBy: { id: 'asc' } });
  });

  afterAll(() => orm.close(true));

  it('serializes every entity of a call with the same options', () => {
    const options = { populate: ['supplier'], fields: ['title', 'supplier.name'] } as const;

    expect(serialize(products, options)).toEqual(products.map(product => serialize(product, options)));
    expect(serialize(products, options)).toEqual([
      { title: 'Product 1', supplier: { name: 'Supplier 1' } },
      { title: 'Product 2', supplier: { name: 'Supplier 1' } },
    ]);
  });

  it('does not mutate or cache the caller options', () => {
    const options: { populate: string; fields: string[] } = {
      populate: 'supplier',
      fields: ['title', 'supplier.name'],
    };

    expect(serialize(products[0], options as any)).toEqual({ title: 'Product 1', supplier: { name: 'Supplier 1' } });
    expect(options).toEqual({ populate: 'supplier', fields: ['title', 'supplier.name'] });

    options.fields.push('price', 'supplier.country');

    expect(serialize(products[0], options as any)).toEqual({
      title: 'Product 1',
      price: 10,
      supplier: { name: 'Supplier 1', country: 'GR' },
    });
    expect(wrap(products[0]).serialize(options as any)).toEqual({
      title: 'Product 1',
      price: 10,
      supplier: { name: 'Supplier 1', country: 'GR' },
    });
  });
});
