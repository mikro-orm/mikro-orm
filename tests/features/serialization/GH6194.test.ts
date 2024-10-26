import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  QueryOrder,
  raw,
  Ref,
  wrap,
} from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Shop, shop => shop.user, { ref: true, owner: true })
  shop!: Ref<Shop>;

}

@Entity()
class Shop {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => User, user => user.shop, { ref: true })
  user!: Ref<User>;

  @OneToMany(() => Order, order => order.shop)
  orders = new Collection<Order>(this);

}

@Entity()
class Order {

  @PrimaryKey()
  id!: number;

  @Property()
  time!: Date;

  @ManyToOne(() => Shop, { ref: true })
  shop!: Ref<Shop>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6194',
    entities: [User, Shop, Order],
  });
  await orm.schema.refreshDatabase();

  orm.em.create(User, {
    id: 1,
    name: 'User 1',
    shop: {
      id: 1,
      name: 'Shop 1',
      orders: [
        {
          id: 1,
          time: new Date('2024-10-24T01:00:00Z'),
        },
        {
          id: 2,
          time: new Date('2024-10-24T02:00:00Z'),
        },
      ],
    },
  });

  await orm.em.flush();
  orm.em.clear();
});

beforeEach(() => {
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('serialize users retrieved from em', async () => {
  const users = await orm.em.find(
    User,
    {},
    { populate: ['shop', 'shop.orders'] },
  );

  expect(wrap(users[0]).toObject()).toEqual({
    id: 1,
    name: 'User 1',
    shop: {
      id: 1,
      name: 'Shop 1',
      user: 1,
      orders: [
        {
          id: 1,
          time: new Date('2024-10-24T01:00:00Z'),
          shop: 1,
        },
        {
          id: 2,
          time: new Date('2024-10-24T02:00:00Z'),
          shop: 1,
        },
      ],
    },
  });
});

test('serialize users retrieved from qb', async () => {
  const users = await orm.em
    .createQueryBuilder(User, 'user')
    .leftJoinAndSelect('user.shop', 'shop')
    .leftJoinAndSelect('shop.orders', 'orders')
    .getResult();

  expect(wrap(users[0]).toObject()).toEqual({
    id: 1,
    name: 'User 1',
    shop: {
      id: 1,
      name: 'Shop 1',
      user: 1,
      orders: [
        {
          id: 1,
          time: new Date('2024-10-24T01:00:00Z'),
          shop: 1,
        },
        {
          id: 2,
          time: new Date('2024-10-24T02:00:00Z'),
          shop: 1,
        },
      ],
    },
  });
});

test('serialize users with populated orders by left joining subquery', async () => {
  const sampledOrdersQuery = orm.em
    .createQueryBuilder(Order, 'orders')
    .distinctOn([
      raw('cast("orders"."time" as date)') as unknown as string,
      'shop',
    ])
    .orderBy({
      [raw('cast("orders"."time" as date)') as unknown as string]:
      QueryOrder.DESC,
      shop: QueryOrder.DESC,
      id: QueryOrder.DESC,
    });

  const users = await orm.em
    .createQueryBuilder(User, 'user')
    .select('*')
    .leftJoinAndSelect('user.shop', 'shop')
    .leftJoinAndSelect(['shop.orders', sampledOrdersQuery], 'orders')
    .getResult();

  expect(wrap(users[0]).toObject()).toEqual({
    id: 1,
    name: 'User 1',
    shop: {
      id: 1,
      name: 'Shop 1',
      user: 1,
      orders: [
        {
          id: 2,
          time: new Date('2024-10-24T02:00:00Z'),
          shop: 1,
        },
      ],
    },
  });
});

test('serialize users with populated orders by left joining subquery, mapping and setting populate hint manually', async () => {
  const sampledOrdersQuery = orm.em
    .createQueryBuilder(Order, 'orders')
    .distinctOn([
      raw('cast("orders"."time" as date)') as unknown as string,
      'shop',
    ])
    .orderBy({
      [raw('cast("orders"."time" as date)') as unknown as string]:
      QueryOrder.DESC,
      shop: QueryOrder.DESC,
      id: QueryOrder.DESC,
    });

  const users = await orm.em
    .createQueryBuilder(User, 'user')
    .select('*')
    .leftJoinAndSelect('user.shop', 'shop')
    .leftJoinAndSelect(['shop.orders', sampledOrdersQuery], 'orders')
    .execute();

  const mappedUsers = users.map(user => orm.em.map(User, user));
  const loadedUsers = await orm.em.populate(mappedUsers, [
    'shop',
    'shop.orders',
  ]);

  expect(wrap(loadedUsers[0]).toObject()).toEqual({
    id: 1,
    name: 'User 1',
    shop: {
      id: 1,
      name: 'Shop 1',
      user: 1,
      orders: [
        {
          id: 2,
          time: new Date('2024-10-24T02:00:00Z'),
          shop: 1,
        },
      ],
    },
  });
});
