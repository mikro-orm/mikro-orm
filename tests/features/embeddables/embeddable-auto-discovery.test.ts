import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

const LocalizedText = defineEntity({
  embeddable: true,
  name: 'LocalizedText',
  properties: {
    ar: p.text().nullable(),
    ar_EG: p.text().nullable(),
  },
});

const Base = defineEntity({
  abstract: true,
  name: 'Base',
  properties: {
    id: p.integer().primary(),
  },
});

const Brand = defineEntity({
  name: 'Brand',
  tableName: 'Brands',
  extends: Base,
  properties: {
    name: p.string().length(100),
    imageUrl: p.text().nullable(),
    localizedName: () => p.embedded(LocalizedText).onCreate(() => LocalizedText.new()),
    isDeleted: p.boolean().default(false),
    productsCount: p.integer().persist(false).nullable(),
  },
});

const Category = defineEntity({
  name: 'Category',
  tableName: 'Categories',
  extends: Base,
  properties: {
    name: p.string().length(100),
    localizedName: () => p.embedded(LocalizedText).onCreate(() => LocalizedText.new()),
    productsCount: p.integer().persist(false).nullable(),
  },
});

describe('embeddable auto-discovery with defineEntity', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    // LocalizedText embeddable is auto-discovered (not in entities array)
    // This should NOT throw "Duplicate table names are not allowed" error
    orm = await MikroORM.init({
      entities: [Category, Brand],
      dbName: ':memory:',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  beforeEach(() => orm.schema.clear());

  test('embeddable used by multiple entities is discovered once', async () => {
    orm.em.create(Brand, {
      name: 'Test Brand',
    });
    orm.em.create(Category, {
      name: 'Test Category',
    });

    await orm.em.flush();

    const [brands, categories] = await Promise.all([orm.em.findAll(Brand), orm.em.findAll(Category)]);
    expect(brands).toHaveLength(1);
    expect(categories).toHaveLength(1);
  });
});
