import { Collection, wrap } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @OneToMany(() => Shop, shop => shop.owner)
  shop = new Collection<Shop>(this);

  @OneToMany(() => Product, product => product.owner)
  product = new Collection<Product>(this);

}

@Entity()
class Shop {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Product, product => product.shop)
  products = new Collection<Product>(this);

  @ManyToOne(() => User)
  owner!: User;

}

@Entity()
export class Product {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Shop)
  shop!: Shop;

  @ManyToOne(() => User)
  owner!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, Shop, Product],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  orm.em.create(User, {
    name: 's1',
    email: 'sp-1@yopmail.com',
  });
  orm.em.create(User, {
    name: 'sp-2',
    email: 'sp-2@yopmail.com',
  });
  orm.em.create(Shop, {
    name: 'shop-1',
    owner: 1,
  });
  orm.em.create(Product, {
    name: 'product-1',
    shop: 1,
    owner: 1,
  });
  orm.em.create(Product, {
    name: 'product-2',
    shop: 1,
    owner: 2,
  });

  await orm.em.flush();
});

afterAll(() => orm.close());

beforeEach(() => orm.em.clear());

test('serialization works based on populate hint', async () => {
  const [shop] = await orm.em.find(Shop, {}, {
    populate: ['products', 'owner'],
  });

  expect(wrap(shop).toObject()).toEqual({
    id: 1,
    name: 'shop-1',
    products: [
      { id: 1, name: 'product-1', shop: 1, owner: 1 },
      { id: 2, name: 'product-2', shop: 1, owner: 2 },
    ],
    owner: { id: 1, name: 's1', email: 'sp-1@yopmail.com' },
  });

  wrap(shop.owner).populated(false);
  expect(wrap(shop).toObject()).toEqual({
    id: 1,
    name: 'shop-1',
    products: [
      { id: 1, name: 'product-1', shop: 1, owner: 1 },
      { id: 2, name: 'product-2', shop: 1, owner: 2 },
    ],
    owner: 1,
  });

  wrap(shop.products).populated(false);
  expect(wrap(shop).toObject()).toEqual({
    id: 1,
    name: 'shop-1',
    products: [1, 2],
    owner: 1,
  });

  wrap(shop.products).populated();
  wrap(shop.owner).populated(); // populates both occurrences
  expect(wrap(shop).toObject()).toEqual({
    id: 1,
    name: 'shop-1',
    products: [
      { id: 1, name: 'product-1', shop: 1, owner: { id: 1, name: 's1', email: 'sp-1@yopmail.com' } },
      { id: 2, name: 'product-2', shop: 1, owner: 2 },
    ],
    owner: { id: 1, name: 's1', email: 'sp-1@yopmail.com' },
  });
});

test('serialization respects partial loading hints 1', async () => {
  // populate hint is inferred and `products.owner` is skipped from it as we don't need to populate it for its FK
  const [shop1] = await orm.em.find(Shop, {}, {
    fields: ['name', 'products.name', 'products.owner', 'owner.name'],
  });
  expect(wrap(shop1).toObject()).toEqual({
    id: 1,
    name: 'shop-1',
    products: [
      { id: 1, name: 'product-1', owner: 1 },
      { id: 2, name: 'product-2', owner: 2 },
    ],
    owner: { id: 1, name: 's1' },
  });

  orm.config.get('serialization').includePrimaryKeys = false;
  const [shop2] = await orm.em.find(Shop, {}, {
    fields: ['name', 'products.name', 'products.owner', 'owner.name'],
  });
  expect(wrap(shop2).toObject()).toEqual({
    name: 'shop-1',
    products: [
      { name: 'product-1', owner: 1 },
      { name: 'product-2', owner: 2 },
    ],
    owner: { name: 's1' },
  });
  orm.config.get('serialization').includePrimaryKeys = true;
});

test('serialization respects partial loading hints 2', async () => {
  // but it gets populated if we select some of its properties
  const [shop] = await orm.em.find(Shop, {}, {
    fields: ['name', 'products.name', 'products.owner.email', 'owner.name'],
  });
  expect(wrap(shop).toObject()).toEqual({
    id: 1,
    name: 'shop-1',
    products: [
      // products level owner has only email
      { id: 1, name: 'product-1', owner: { id: 1, email: 'sp-1@yopmail.com' } },
      { id: 2, name: 'product-2', owner: { id: 2, email: 'sp-2@yopmail.com' } },
    ],
    // top level owner has only name
    owner: { id: 1, name: 's1' },
  });
});

test('serialization respects partial loading hints 3', async () => {
  // same result with joined strategy
  const [shop] = await orm.em.find(Shop, {}, {
    fields: ['name', 'products.name', 'products.owner.email', 'owner.name'],
    strategy: 'joined',
  });
  expect(wrap(shop).toObject()).toEqual({
    id: 1,
    name: 'shop-1',
    products: [
      // products level owner has only email
      { id: 1, name: 'product-1', owner: { id: 1, email: 'sp-1@yopmail.com' } },
      { id: 2, name: 'product-2', owner: { id: 2, email: 'sp-2@yopmail.com' } },
    ],
    // top level owner has only name
    owner: { id: 1, name: 's1' },
  });
});

test('serialization respects partial loading hints 4', async () => {
  const [shop] = await orm.em.find(Shop, {}, {
    fields: ['name', 'products.name', 'owner.name'],
  });
  expect(wrap(shop).toObject()).toEqual({
    id: 1,
    name: 'shop-1',
    products: [
      { id: 1, name: 'product-1' },
      { id: 2, name: 'product-2' },
    ],
    owner: { id: 1, name: 's1' },
  });
});
