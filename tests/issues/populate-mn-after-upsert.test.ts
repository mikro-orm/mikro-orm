import { Collection } from '@mikro-orm/core';
import { defineEntity, MikroORM, p, quote, sql } from '@mikro-orm/sqlite';

const ProductAttribute = defineEntity({
  name: 'ProductAttribute',
  tableName: 'product_attributes',
  properties: {
    id: p.integer().primary(),
    value: p.string(),
  },
});

const ProductPackage = defineEntity({
  name: 'ProductPackage',
  tableName: 'product_packages',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    product: () => p.oneToOne(Product).deleteRule('cascade'),
  },
});

const ProductReview = defineEntity({
  name: 'ProductReview',
  tableName: 'product_reviews',
  properties: {
    id: p.integer().primary(),
    body: p.string(),
    product: () => p.manyToOne(Product).deleteRule('cascade'),
  },
});

const Product = defineEntity({
  name: 'Product',
  tableName: 'products',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    externalId: p.string().length(12).nullable(),
    category: p.string().default('default'),
    package: () =>
      p
        .oneToOne(ProductPackage)
        .mappedBy(pkg => pkg.product)
        .nullable()
        .orphanRemoval(),
    attributes: () =>
      p
        .manyToMany(ProductAttribute)
        .owner()
        .pivotTable('_join_products_attributes')
        .joinColumn('product_id')
        .inverseJoinColumn('attribute_id'),
    reviews: () => p.oneToMany(ProductReview).mappedBy(r => r.product),
  },
  indexes: [
    {
      name: 'products_external_id_unique',
      expression: (columns, table, indexName) =>
        quote`CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${table} (${columns.externalId}) WHERE ${columns.externalId} IS NOT NULL`,
    },
  ],
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Product, ProductPackage, ProductAttribute, ProductReview],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.clear();
  orm.em.clear();
});

async function flushAndClear() {
  await orm.em.flush();
  orm.em.clear();
}

function upsertProducts(...products: any[]) {
  return orm.em.upsertMany(Product, products, {
    onConflictFields: sql`(external_id) where external_id is not null`,
    onConflictAction: 'merge',
    onConflictMergeFields: ['title', 'category'],
  });
}

test('populate after upsertMany loads existing M:N references via attributes:ref', async () => {
  const attr1 = orm.em.create(ProductAttribute, { value: 'Black' });
  const attr2 = orm.em.create(ProductAttribute, { value: 'Red' });
  await flushAndClear();

  const attrs = await orm.em.find(ProductAttribute, {});
  orm.em.create(Product, {
    title: 'Test Product',
    externalId: 'EXT000000001',
    category: 'Test Category',
    package: { title: 'Box' },
    attributes: attrs.map(attr => attr.id),
  });
  await flushAndClear();

  const [upserted] = await upsertProducts(
    orm.em.create(Product, {
      title: 'Test Product Updated',
      externalId: 'EXT000000001',
      category: 'Updated Category',
    }),
  );

  await orm.em.populate(upserted, ['package', 'attributes:ref']);

  expect(upserted.package?.title).toBe('Box');
  expect(upserted.attributes).toBeInstanceOf(Collection);
  expect(upserted.attributes).toHaveLength(2);
  expect(
    upserted.attributes
      .getItems()
      .map(attr => attr.id)
      .sort(),
  ).toEqual([attr1.id, attr2.id].sort());
});

test('populate after upsertMany still fully loads M:N objects via attributes', async () => {
  const attr = orm.em.create(ProductAttribute, { value: 'Green' });
  await flushAndClear();

  orm.em.create(Product, {
    title: 'Product With Attr',
    externalId: 'EXT000000002',
    category: 'Cat',
    attributes: [attr.id],
  });
  await flushAndClear();

  const [upserted] = await upsertProducts(
    orm.em.create(Product, {
      title: 'Product With Attr Updated',
      externalId: 'EXT000000002',
      category: 'Cat Updated',
    }),
  );

  await orm.em.populate(upserted, ['attributes']);

  expect(upserted.attributes).toBeInstanceOf(Collection);
  expect(upserted.attributes).toHaveLength(1);
  expect(upserted.attributes[0].value).toBe('Green');
});

test('populate after upsertMany initializes an empty M:N collection for inserted rows', async () => {
  const attr = orm.em.create(ProductAttribute, { value: 'Blue' });
  await flushAndClear();

  const [upserted] = await upsertProducts(
    orm.em.create(Product, {
      title: 'Brand New Product',
      externalId: 'EXT000000003',
      category: 'New Category',
    }),
  );

  await orm.em.populate(upserted, ['package', 'attributes:ref']);

  expect(upserted.attributes).toBeInstanceOf(Collection);
  expect(upserted.attributes).toHaveLength(0);

  upserted.attributes.set([orm.em.getReference(ProductAttribute, attr.id)]);
  await orm.em.flush();

  orm.em.clear();
  const reloaded = await orm.em.findOneOrFail(Product, { externalId: 'EXT000000003' }, { populate: ['attributes'] });
  expect(reloaded.attributes).toHaveLength(1);
  expect(reloaded.attributes[0].value).toBe('Blue');
});

test('populate after upsertMany does not insert duplicate pivot rows when setting the same reference', async () => {
  const attr = orm.em.create(ProductAttribute, { value: 'Black' });
  await orm.em.flush();

  const existing = orm.em.create(Product, {
    title: 'Existing Product',
    category: 'Old Category',
    externalId: 'EXT000000004',
  });
  existing.attributes.add(attr);
  await flushAndClear();

  const [upserted] = await upsertProducts(
    orm.em.create(Product, {
      title: 'Existing Product Updated',
      category: 'New Category',
      externalId: 'EXT000000004',
    }),
  );

  await orm.em.populate(upserted, ['attributes:ref']);
  upserted.attributes.set([orm.em.getReference(ProductAttribute, attr.id)]);

  await expect(orm.em.flush()).resolves.toBeUndefined();

  orm.em.clear();
  const reloaded = await orm.em.findOneOrFail(Product, { externalId: 'EXT000000004' }, { populate: ['attributes'] });
  expect(reloaded.attributes).toHaveLength(1);
  expect(reloaded.attributes[0].id).toBe(attr.id);
});

test('populate after upsertMany loads existing 1:M references', async () => {
  const product = orm.em.create(Product, {
    title: 'Product With Reviews',
    externalId: 'EXT000000005',
    category: 'Category',
  });
  orm.em.create(ProductReview, { body: 'great', product });
  orm.em.create(ProductReview, { body: 'good', product });
  await flushAndClear();

  const [upserted] = await upsertProducts(
    orm.em.create(Product, {
      title: 'Product With Reviews Updated',
      externalId: 'EXT000000005',
      category: 'Updated Category',
    }),
  );

  await orm.em.populate(upserted, ['reviews']);

  expect(upserted.reviews).toBeInstanceOf(Collection);
  expect(upserted.reviews).toHaveLength(2);
  expect(
    upserted.reviews
      .getItems()
      .map(r => r.body)
      .sort(),
  ).toEqual(['good', 'great']);
});
