import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { Collection, MikroORM, wrap } from '@mikro-orm/sqlite';

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
class Product {
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

test('toObject respects exclude from serialization context when entity is in identity map', async () => {
  // first load with all data so it's in the identity map
  await orm.em.find(Shop, {}, { populate: ['products', 'owner'] });

  // now load again with exclude - entity comes from identity map with full data
  const [shop] = await orm.em.find(
    Shop,
    {},
    {
      populate: ['products', 'owner'],
      exclude: ['owner.email'],
    },
  );

  // email is still loaded on the entity (from identity map), but excluded from the type
  // @ts-expect-error exclude removes `email` from the type
  expect(shop.owner.email).toBe('sp-1@yopmail.com');

  // but should be excluded from serialization via the context
  const serialized = wrap(shop).toObject();
  expect(serialized.owner).toEqual({ id: 1, name: 's1' });
  // @ts-expect-error exclude removes `email` from the serialized type
  expect(serialized.owner.email).toBeUndefined();
});

test('toObject respects top-level exclude from serialization context', async () => {
  await orm.em.find(Shop, {}, { populate: ['products', 'owner'] });

  const [shop] = await orm.em.find(
    Shop,
    {},
    {
      populate: ['products', 'owner'],
      exclude: ['name'],
    },
  );

  // name is still on the entity, but excluded from the type
  // @ts-expect-error exclude removes `name` from the type
  expect(shop.name).toBe('shop-1');

  // but should be excluded from serialization
  const serialized = wrap(shop).toObject();
  // @ts-expect-error exclude removes `name` from the serialized type
  expect(serialized.name).toBeUndefined();
  expect(serialized.id).toBe(1);
});

test('toObject respects deeply nested exclude from serialization context', async () => {
  await orm.em.find(Shop, {}, { populate: ['products.owner'] });

  const [shop] = await orm.em.find(
    Shop,
    {},
    {
      populate: ['products.owner'],
      exclude: ['products.owner.email'],
    },
  );

  // email is still on the nested entity, but excluded from the type
  // @ts-expect-error exclude removes `email` from the type
  expect(shop.products[0].owner.email).toBe('sp-1@yopmail.com');

  // but should be excluded from serialization
  const serialized = wrap(shop).toObject();
  // @ts-expect-error exclude removes `email` from the serialized type
  expect(serialized.products[0].owner.email).toBeUndefined();
  expect(serialized.products[0].owner.name).toBe('s1');
});
