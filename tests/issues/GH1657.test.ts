import { Collection, Entity, LoadStrategy, Logger, ManyToOne, MikroORM, OneToMany, PrimaryKey, wrap } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Order {

  @PrimaryKey()
  id: number;

  @OneToMany('OrderItem', 'order1')
  orderItems1 = new Collection<OrderItem>(this);

  @OneToMany('OrderItem', 'order2')
  orderItems2 = new Collection<OrderItem>(this);

  constructor(id: number) {
    this.id = id;
  }

}

@Entity()
class OrderItem {

  @PrimaryKey()
  id: number;

  @ManyToOne({
    entity: () => Order,
    eager: true,
    nullable: true,
  })
  order1?: Order;

  @ManyToOne({
    entity: () => Order,
    strategy: LoadStrategy.JOINED,
    eager: true,
    nullable: true,
  })
  order2?: Order;

  constructor(id: number) {
    this.id = id;
  }

}

describe('GH issue 1657', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Order, OrderItem],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('eager loading m:1 with joined strategy', async () => {
    const order1 = new Order(1);
    const order2 = new Order(2);
    const orderItem1 = new OrderItem(3);
    const orderItem2 = new OrderItem(4);
    order1.orderItems1.add(orderItem1);
    order2.orderItems2.add(orderItem2);
    await orm.em.persistAndFlush([order1, order2]);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, ['query', 'query-params']);
    Object.assign(orm.config, { logger });
    const res1 = await orm.em.find(OrderItem, { id: { $lte: 100 } });
    expect(res1).toHaveLength(2);
    expect(wrap(res1[0].order1).isInitialized()).toBe(true);
    expect(wrap(res1[1].order2).isInitialized()).toBe(true);

    // first query loads item and joins the order2 relation (eager + joined strategy)
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.`id`, `e0`.`order1_id`, `e0`.`order2_id`, `o1`.`id` as `o1__id` from `order_item` as `e0` left join `order` as `o1` on `e0`.`order2_id` = `o1`.`id` where `e0`.`id` <= 100');
    // second query loads order1 relation (eager + select-in strategy)
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.* from `order` as `e0` where `e0`.`id` in (1) order by `e0`.`id` asc');

    expect(mock.mock.calls).toHaveLength(2);
  });

});
