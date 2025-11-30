import { Collection, MikroORM, Rel, QueryOrder, wrap } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Shop)
  shop!: Rel<Shop>;

}

@Entity()
class Shop {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => User, user => user.shop)
  user!: User;

  @OneToMany(() => Order, order => order.shop)
  orders = new Collection<Order>(this);

}

@Entity()
class Order {

  @PrimaryKey()
  id!: number;

  @Property()
  category!: string;

  @Property()
  time!: Date;

  @ManyToOne(() => Shop)
  shop!: Shop;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Shop, Order],
    serialization: { forceObject: true },
  });
  await orm.schema.refresh();

  orm.em.create(User, {
    id: 1,
    name: 'User 1',
    shop: {
      id: 1,
      name: 'Shop 1',
      orders: [
        {
          id: 1,
          category: 'A',
          time: new Date('2025-01-02T00:00:00Z'),
        },
        {
          id: 2,
          category: 'B',
          time: new Date('2025-01-02T00:00:00Z'),
        },
        {
          id: 3,
          category: 'A',
          time: new Date('2025-01-01T00:00:00Z'),
        },
        {
          id: 4,
          category: 'B',
          time: new Date('2025-01-01T00:00:00Z'),
        },
      ],
    },
  });

  await orm.em.flush();
  orm.em.clear();
});

beforeEach(async () => {
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('serialize orders fetched separately using find and populate', async () => {
  const users = await orm.em.find(User, {});
  const populatedUsers = await orm.em.populate(users, ['shop.orders'], {
    where: {
      shop: {
        orders: {
          category: 'A',
        },
      },
    },
    orderBy: {
      shop: {
        orders: {
          time: QueryOrder.DESC,
        },
      },
    },
  });

  expect(wrap(populatedUsers[0]).toObject()).toEqual({
    id: 1,
    name: 'User 1',
    shop: {
      id: 1,
      name: 'Shop 1',
      user: { id: 1 },
      orders: [
        {
          id: 1,
          category: 'A',
          shop: { id: 1 },
          time: new Date('2025-01-02T00:00:00Z'),
        },
        {
          id: 3,
          category: 'A',
          shop: { id: 1 },
          time: new Date('2025-01-01T00:00:00Z'),
        },
      ],
    },
  });
});

test('serialize orders fetched separately using find and populate 2', async () => {
  const users = await orm.em.find(User, {}, { populate: ['shop'] });
  const populatedUsers = await orm.em.populate(users, ['shop.orders'], {
    where: {
      shop: {
        orders: {
          category: 'A',
        },
      },
    },
    orderBy: {
      shop: {
        orders: {
          time: QueryOrder.DESC,
        },
      },
    },
  });

  expect(wrap(populatedUsers[0]).toObject()).toEqual({
    id: 1,
    name: 'User 1',
    shop: {
      id: 1,
      name: 'Shop 1',
      user: { id: 1 },
      orders: [
        {
          id: 1,
          category: 'A',
          shop: { id: 1 },
          time: new Date('2025-01-02T00:00:00Z'),
        },
        {
          id: 3,
          category: 'A',
          shop: { id: 1 },
          time: new Date('2025-01-01T00:00:00Z'),
        },
      ],
    },
  });
});

test('serialize orders fetched separately using find and populate 3', async () => {
  const users = await orm.em.find(User, {}, { populate: ['shop'] });
  const populatedUsers = await orm.em.populate(users, ['shop.orders'], {
    where: {
      shop: {
        orders: {
          category: 'A',
        },
      },
    },
    orderBy: {
      shop: {
        orders: {
          time: QueryOrder.DESC,
        },
      },
    },
  });

  expect(wrap(populatedUsers[0]).serialize({ populate: ['shop.orders'] })).toEqual({
    id: 1,
    name: 'User 1',
    shop: {
      id: 1,
      name: 'Shop 1',
      user: { id: 1 },
      orders: [
        {
          id: 1,
          category: 'A',
          shop: { id: 1 },
          time: new Date('2025-01-02T00:00:00Z'),
        },
        {
          id: 3,
          category: 'A',
          shop: { id: 1 },
          time: new Date('2025-01-01T00:00:00Z'),
        },
      ],
    },
  });
});
