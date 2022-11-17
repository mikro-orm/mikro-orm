import { Collection, Entity, ManyToOne, NotNullConstraintViolationException, OneToMany, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';

@Entity()
class Order {
  [OptionalProps]?: 'orderId';

  @PrimaryKey()
  orderId: string = v4();

  @PrimaryKey()
  customerId!: string;

  @PrimaryKey()
  companyId!: string;

  @OneToMany(() => OrderEvent, (orderEvent) => orderEvent.order, {
    orphanRemoval: true,
  })
  events = new Collection<OrderEvent>(this);
}

@Entity({ tableName: 'order' })
class Order2 {
  [OptionalProps]?: 'orderId';

  @PrimaryKey()
  orderId: string = v4();

  @PrimaryKey()
  customerId!: string;

  @PrimaryKey()
  companyId!: string;

  @OneToMany(() => OrderEvent, (orderEvent) => orderEvent.order)
  events = new Collection<OrderEvent>(this);
}

@Entity()
class OrderEvent {
  [OptionalProps]?: 'orderEventId' | 'order';

  @PrimaryKey()
  orderEventId: string = v4();

  @Property()
  name!: string;

  @ManyToOne(() => Order, { primary: true })
  order!: Order;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Order, OrderEvent],
    dbName: 'mikro_orm_test_3543',
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(() => orm.close(true));

test('GH issue 3543', async () => {
  let order = orm.em.create(Order, {
    customerId: '456',
    companyId: '789',
  });

  order.events.add(orm.em.create(OrderEvent, { name: 'created' }));
  order.events.add(orm.em.create(OrderEvent, { name: 'pending' }));

  await orm.em.persistAndFlush(order);
  orm.em.clear();

  order = await orm.em.findOneOrFail(
    Order,
    {
      customerId: '456',
      companyId: '789',
      orderId: order.orderId,
    },
    { populate: true }
  );

  order.events.removeAll();
  await orm.em.flush();
  orm.em.clear();

  order = await orm.em.findOneOrFail(
    Order,
    {
      customerId: '456',
      companyId: '789',
      orderId: order.orderId,
    },
    { populate: true }
  );

  expect(order.events).toHaveLength(0);
});

test('GH issue 3543 without orphan removal builds correct query', async () => {
  orm.getMetadata().get('Order').properties.events.orphanRemoval = false;
  let order = orm.em.create(Order, {
    customerId: '456',
    companyId: '789',
  });

  order.events.add(orm.em.create(OrderEvent, { name: 'created' }));
  order.events.add(orm.em.create(OrderEvent, { name: 'pending' }));

  await orm.em.persistAndFlush(order);
  orm.em.clear();

  order = await orm.em.findOneOrFail(
    Order,
    {
      customerId: '456',
      companyId: '789',
      orderId: order.orderId,
    },
    { populate: true }
  );

  // disconnecting the relation without orphan removal means nulling it on the owning side, which fails as it is a non-null PK column
  order.events.removeAll();
  await expect(orm.em.flush()).rejects.toThrowError(NotNullConstraintViolationException);
});
