import { Collection, Entity, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Rel } from '@mikro-orm/mssql';
import { mockLogger } from '../../helpers.js';

@Entity()
class Order {

  @PrimaryKey({ autoincrement: false })
  id!: number;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  orderItems = new Collection<OrderItem>(this);

}

@Entity()
class OrderItem {

  @PrimaryKey({ autoincrement: false })
  id!: number;

  @ManyToOne(() => Order, { primary: true })
  order!: Order;

  @OneToOne(() => Storey, storey => storey.orderItem)
  storey!: Rel<Storey>;

}

@Entity()
class Storey {

  @PrimaryKey({ autoincrement: false })
  id!: number;

  @OneToOne(() => OrderItem, { primary: true })
  orderItem!: OrderItem;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'test2',
    password: 'Root.Root',
    entities: [
      Order,
      OrderItem,
      Storey,
    ],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('composite keys in sql server', async () => {
  const order = new Order();
  order.id = 1;

  const orderItem = new OrderItem();
  orderItem.id = 1;
  orderItem.order = order;
  const orderItem2 = new OrderItem();
  orderItem2.id = 2;
  orderItem2.order = order;

  const storey = new Storey();
  storey.id = 1;
  storey.orderItem = orderItem;
  const storey2 = new Storey();
  storey2.id = 2;
  storey2.orderItem = orderItem2;

  orm.em.persist(order);
  orm.em.persist(orderItem);
  orm.em.persist(storey);
  orm.em.persist(storey2);

  await orm.em.flush();
  orm.em.clear();

  const order3 = await orm.em.findOneOrFail(Order, { id: 1 });
  const orderItems = await orm.em.find(OrderItem, { order: order3 });
  expect(orderItems).toHaveLength(2);

  const mock = mockLogger(orm);
  await orm.em.fork().find(Storey, { id: 1, orderItem: orderItems[0] });
  expect(mock.mock.calls[0][0]).toMatch('select [s0].* from [storey] as [s0] where [s0].[id] = 1 and [s0].[order_item_id] = 1 and [s0].[order_item_order_id] = 1');

  await orm.em.fork().find(Storey, { orderItem: orderItems });
  expect(mock.mock.calls[1][0]).toMatch('select [s0].* from [storey] as [s0] where (([s0].[order_item_id] = 1 and [s0].[order_item_order_id] = 1) or ([s0].[order_item_id] = 2 and [s0].[order_item_order_id] = 1))');
});
