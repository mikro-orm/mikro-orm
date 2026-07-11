import { defineEntity, MikroORM, p, raw, sql } from '@mikro-orm/sqlite';

const Tag = defineEntity({
  name: 'Tag',
  tableName: 'tags',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Review = defineEntity({
  name: 'Review',
  tableName: 'reviews',
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
    reviewCount: p.integer().persist(false),
    tags: () =>
      p.manyToMany(Tag).owner().pivotTable('_join_products_tags').joinColumn('product_id').inverseJoinColumn('tag_id'),
    reviews: () => p.oneToMany(Review).mappedBy(r => r.product),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Product, Tag, Review],
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

async function seedData() {
  const tag1 = orm.em.create(Tag, { name: 'electronics' });
  const tag2 = orm.em.create(Tag, { name: 'sale' });
  const p1 = orm.em.create(Product, { title: 'Product A', tags: [tag1, tag2] });
  const p2 = orm.em.create(Product, { title: 'Product B', tags: [tag1] });
  orm.em.create(Review, { body: 'great', product: p1 });
  orm.em.create(Review, { body: 'good', product: p1 });
  orm.em.create(Review, { body: 'ok', product: p2 });
  await orm.em.flush();
  orm.em.clear();
}

test('orderBy a persist(false) qb.as() virtual field with plain getResultList', async () => {
  await seedData();

  const reviewCountQB = orm.em
    .createQueryBuilder(Review, 'r')
    .select(raw('count(*)'))
    .where({ product: { id: sql.ref('p.id') } });

  const results = await orm.em
    .createQueryBuilder(Product, 'p')
    .select(['id', 'title'])
    .addSelect(reviewCountQB.as('reviewCount'))
    .orderBy({ reviewCount: 'desc' })
    .getResultList();

  expect(results.map(r => [r.title, (r as any).reviewCount])).toEqual([
    ['Product A', 2],
    ['Product B', 1],
  ]);
});

test('qb.as() virtual field survives clone and orderBy works with M:N join', async () => {
  await seedData();

  const reviewCountQB = orm.em
    .createQueryBuilder(Review, 'r')
    .select(raw('count(*)'))
    .where({ product: { id: sql.ref('p.id') } });

  const qb = orm.em
    .createQueryBuilder(Product, 'p')
    .select(['id', 'title'])
    .joinAndSelect('p.tags', 't')
    .addSelect(reviewCountQB.as('reviewCount'))
    .orderBy({ reviewCount: 'desc' })
    .limit(10);

  const [results, count] = await qb.getResultAndCount();

  expect(count).toBe(2);
  expect(results[0].title).toBe('Product A');
  expect((results[0] as any).reviewCount).toBe(2);
  expect(results[1].title).toBe('Product B');
  expect((results[1] as any).reviewCount).toBe(1);
});

test('raw() virtual field works with orderBy and M:N pagination', async () => {
  await seedData();

  const reviewCountQB = orm.em
    .createQueryBuilder(Review, 'r')
    .select(raw('count(*)'))
    .where({ product: { id: sql.ref('p.id') } });

  const qb = orm.em
    .createQueryBuilder(Product, 'p')
    .select(['id', 'title', raw(`(${reviewCountQB.getFormattedQuery()}) as "review_count"`)])
    .joinAndSelect('p.tags', 't')
    .orderBy({ reviewCount: 'desc' })
    .limit(10);

  const [results, count] = await qb.getResultAndCount();

  expect(count).toBe(2);
  expect(results[0].title).toBe('Product A');
  expect((results[0] as any).reviewCount).toBe(2);
  expect(results[1].title).toBe('Product B');
  expect((results[1] as any).reviewCount).toBe(1);
});
