import { Collection, wrap } from '@mikro-orm/core';
import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

const ProductAttribute = defineEntity({
  name: 'ProductAttribute',
  properties: {
    id: p.integer().primary(),
    value: p.string(),
  },
});

const ProductPackage = defineEntity({
  name: 'ProductPackage',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    product: () => p.oneToOne(Product),
  },
});

const Product = defineEntity({
  name: 'Product',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    package: () =>
      p
        .oneToOne(ProductPackage)
        .mappedBy(pkg => pkg.product)
        .nullable(),
    attributes: () => p.manyToMany(ProductAttribute).owner(),
  },
});

const ClientProduct = defineEntity({
  name: 'ClientProduct',
  properties: {
    id: p.integer().primary(),
    shortName: p.string(),
    product: () => p.manyToOne(Product),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [ClientProduct, Product, ProductPackage, ProductAttribute],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

beforeEach(async () => {
  await orm.schema.clear();
  orm.em.clear();
});

test('combining `:ref` populate hints with overlapping `fields` does not duplicate queries', async () => {
  const product = orm.em.create(Product, {
    title: 'foo',
    package: { title: 'box' },
    attributes: [{ value: 'red' }],
  });
  const cp = orm.em.create(ClientProduct, { shortName: 'bar', product });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);
  const loaded = await orm.em.findOneOrFail(ClientProduct, cp.id, {
    fields: ['shortName', 'product.title', 'product.package', 'product.attributes'],
    populate: ['product.package:ref', 'product.attributes:ref'],
  });
  const queries = mock.mock.calls.map(([msg]) => String(msg));

  expect(loaded.product.title).toBe('foo');
  expect(loaded.product.package?.id).toBe(product.package?.id);
  expect(wrap(loaded.product.package!).isInitialized()).toBe(false);
  expect(loaded.product.attributes).toBeInstanceOf(Collection);
  expect(loaded.product.attributes).toHaveLength(1);
  expect(loaded.product.attributes.isInitialized()).toBe(true);
  expect(loaded.product.attributes.isInitialized(true)).toBe(false);
  expect(wrap(loaded.product.attributes[0]).isInitialized()).toBe(false);

  // product is loaded once via the join in the main query — no separate refetch
  expect(queries.filter(query => query.includes('from `product` as'))).toHaveLength(0);
  // attributes pivot is fetched exactly once (ref-only, no join into product_attribute)
  expect(queries.filter(query => query.includes('from `product_attributes` as'))).toHaveLength(1);
  expect(queries.some(query => query.includes('join `product_attribute`'))).toBe(false);
});
