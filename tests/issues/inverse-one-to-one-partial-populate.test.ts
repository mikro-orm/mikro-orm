import { Collection, LoadStrategy, wrap, serialize } from '@mikro-orm/core';
import {
  Entity,
  ManyToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
class ProductAttribute {
  @PrimaryKey()
  id!: number;

  @Property()
  value!: string;
}

@Entity()
class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToOne({ entity: () => ProductPackage, mappedBy: 'product', nullable: true })
  package?: ProductPackage | null;

  @ManyToMany({ entity: () => ProductAttribute, pivotTable: 'product_to_product_attribute' })
  attributes = new Collection<ProductAttribute>(this);
}

@Entity()
class ProductPackage {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToOne({ entity: () => Product, inversedBy: 'package' })
  product!: Product;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Product, ProductPackage, ProductAttribute],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test.each([undefined, LoadStrategy.SELECT_IN, LoadStrategy.JOINED, LoadStrategy.BALANCED])(
  'em.populate wires inverse 1:1 on mapped entities with partial fields, strategy: %s',
  async strategy => {
    const product1 = orm.em.create(Product, { title: 'Product 1' });
    const product2 = orm.em.create(Product, { title: 'Product 2' });
    orm.em.create(ProductPackage, { title: 'Package 1', product: product1 });
    orm.em.create(ProductPackage, { title: 'Package 2', product: product2 });
    await orm.em.flush();
    orm.em.clear();

    const em = orm.em.fork();
    const products = [
      em.map(Product, { id: product1.id, title: product1.title }),
      em.map(Product, { id: product2.id, title: product2.title }),
    ];

    await em.populate(products, ['package'], {
      fields: ['package.title'],
      strategy,
    });

    expect(products[0].package?.title).toBe('Package 1');
    expect(products[1].package?.title).toBe('Package 2');
    expect(products[0].package?.product).toBe(products[0]);
    expect(products[1].package?.product).toBe(products[1]);
  },
);

test.each([
  ['without projected fields', undefined],
  ['with projected fields', ['package.title'] as const],
])('em.populate refreshes partial inverse 1:1 relation objects from mapped entities %s', async (_, fields) => {
  const product1 = orm.em.create(Product, { title: 'Product 1' });
  const product2 = orm.em.create(Product, { title: 'Product 2' });
  const package1 = orm.em.create(ProductPackage, { title: 'Package 1', product: product1 });
  const package2 = orm.em.create(ProductPackage, { title: 'Package 2', product: product2 });
  await orm.em.flush();
  orm.em.clear();

  const em = orm.em.fork();
  const products = [
    em.map(Product, {
      id: product1.id,
      title: product1.title,
      package: { id: package1.id, product: { id: product1.id } },
    }),
    em.map(Product, {
      id: product2.id,
      title: product2.title,
      package: { id: package2.id, product: { id: product2.id } },
    }),
  ];
  const mock = mockLogger(orm, ['query']);

  await em.populate(products, ['package'], fields ? { fields } : {});

  expect(mock.mock.calls.some(([query]) => query.includes('from `product_package`'))).toBe(true);
  expect(products[0].package?.title).toBe('Package 1');
  expect(products[1].package?.title).toBe('Package 2');
  expect(products[0].package?.product).toBe(products[0]);
  expect(products[1].package?.product).toBe(products[1]);

  const dto = serialize(products, { populate: ['package'], forceObject: true });
  expect(dto[0].package).toMatchObject({ id: package1.id, title: 'Package 1' });
  expect(dto[1].package).toMatchObject({ id: package2.id, title: 'Package 2' });
});

test('em.populate discovers inverse 1:1 relation refs from mapped entities', async () => {
  const product1 = orm.em.create(Product, { title: 'Product 1' });
  const product2 = orm.em.create(Product, { title: 'Product 2' });
  const package1 = orm.em.create(ProductPackage, { title: 'Package 1', product: product1 });
  const package2 = orm.em.create(ProductPackage, { title: 'Package 2', product: product2 });
  await orm.em.flush();
  orm.em.clear();

  const em = orm.em.fork();
  const products = [
    em.map(Product, { id: product1.id, title: product1.title }),
    em.map(Product, { id: product2.id, title: product2.title }),
  ];
  const mock = mockLogger(orm, ['query']);

  await em.populate(products, ['package:ref'], { fields: ['package'] });

  expect(mock.mock.calls.some(([query]) => query.includes('from `product_package`'))).toBe(true);
  expect(products[0].package?.id).toBe(package1.id);
  expect(products[1].package?.id).toBe(package2.id);
  expect(products[0].package?.title).toBeUndefined();
  expect(products[1].package?.title).toBeUndefined();

  const dto = serialize(products, { populate: ['package'], forceObject: true });
  expect(dto[0].package).toMatchObject({ id: package1.id });
  expect(dto[1].package).toMatchObject({ id: package2.id });
});

test('em.populate loads inverse 1:1 and many-to-many refs without extra entity queries', async () => {
  const attribute = orm.em.create(ProductAttribute, { value: 'Black' });
  const product = orm.em.create(Product, { title: 'Product 1', attributes: [attribute] });
  const productPackage = orm.em.create(ProductPackage, { title: 'Package 1', product });
  await orm.em.flush();
  orm.em.clear();

  const em = orm.em.fork();
  const products = [em.map(Product, { id: product.id, title: product.title })];
  const mock = mockLogger(orm, ['query']);

  await em.populate(products, ['package:ref', 'attributes:ref'], {
    fields: ['package', 'attributes'],
  });
  const queries = mock.mock.calls.map(([query]) => String(query));

  expect(products[0].package?.id).toBe(productPackage.id);
  expect(products[0].package?.title).toBeUndefined();
  expect(wrap(products[0].package!).isInitialized()).toBe(false);

  expect(products[0].attributes).toBeInstanceOf(Collection);
  expect(products[0].attributes).toHaveLength(1);
  expect(products[0].attributes.isInitialized()).toBe(true);
  expect(products[0].attributes.isInitialized(true)).toBe(false);
  expect(wrap(products[0].attributes[0]).isInitialized()).toBe(false);

  expect(queries.filter(query => query.includes('from `product_package`'))).toHaveLength(1);
  expect(queries.filter(query => query.includes('from `product_to_product_attribute`'))).toHaveLength(1);
  expect(queries.some(query => query.includes('from `product` as'))).toBe(false);
  expect(queries.some(query => query.includes('join `product_attribute`'))).toBe(false);
});
