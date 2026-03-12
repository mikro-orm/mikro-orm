import { MikroORM, defineEntity, p } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class A {
  @PrimaryKey()
  id!: number;

  @Property({ default: 50 })
  foo1!: number;

  @Property({ default: 50 })
  foo2: number = 50;

  @Property()
  foo3: number = 50;

  @Property({ version: true })
  version!: number;
}

const ProductSchema = defineEntity({
  name: 'Product',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    clientId: p.string(),
    productId: p.string(),
    barcodes: p.array(String).default([]),
    plu: p.array(String).default([]),
    isWeighted: p.boolean().default(false),
  },
  uniques: [{ properties: ['clientId', 'productId'] }],
});

class Product extends ProductSchema.class {}
ProductSchema.setClass(Product);

describe('default values in sqlite', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test(`database defaults will be available after flush`, async () => {
    const mock = mockLogger(orm, ['query']);

    const a = new A();
    expect(a.foo1).toBeUndefined();
    expect(a.foo2).toBe(50);
    expect(a.foo3).toBe(50);
    expect(a.version).toBeUndefined();
    await orm.em.persist(a).flush();

    // sqlite needs to reload via separate select query (inside tx, so 4 in total)
    expect(mock).toHaveBeenCalledTimes(3);
    expect(a.foo1).toBe(50);
    expect(a.foo2).toBe(50);
    expect(a.foo3).toBe(50);
    expect(a.version).toBe(1);
  });
});

describe('defineEntity default values in sqlite', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Product],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('array and scalar defaults are applied on em.create()', async () => {
    const product = orm.em.create(Product, {
      title: 'Test',
      clientId: 'client-123',
      productId: 'product-456',
      barcodes: ['1234567890123'],
      isWeighted: false,
    });

    // plu was not provided, should use default value
    expect(product.plu).toEqual([]);
    // explicitly provided values should be kept
    expect(product.barcodes).toEqual(['1234567890123']);
    expect(product.isWeighted).toBe(false);

    if (product.plu.length > 0) {
      orm.em.assign(product, { isWeighted: true });
    }

    await orm.em.flush();

    expect(product.isWeighted).toBe(false);
    expect(product.barcodes).toEqual(['1234567890123']);
    expect(product.plu).toEqual([]);
  });
});
