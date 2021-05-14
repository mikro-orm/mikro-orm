import { Collection, Entity, LoadStrategy, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Type } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Order {

  @PrimaryKey()
  id!: number;

  @OneToMany('OrderItem', 'order')
  orderItems = new Collection<OrderItem>(this);

}

const prefix = 'foo';

class CustomType extends Type<string, string> {

  convertToDatabaseValue(value: string): string {
    return prefix + value;
  }

  convertToJSValue(value: string): string {
    return value.substring(prefix.length);
  }

  getColumnType(): string {
    return 'text';
  }

}

@Entity()
export class OrderItem {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Order, { onDelete: 'cascade' })
  order!: Order;

  @Property({ type: CustomType })
  customType!: string;

}

describe('GH issue 1754', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Order, OrderItem],
      dbName: `:memory:`,
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  afterEach(async () => {
    await orm.em.nativeDelete(Order, {});
  });

  test(`joined strategy with custom types in collection items`, async () => {
    const order = new Order();
    const item1 = new OrderItem();
    item1.order = order;
    item1.customType = 'some thing';
    order.orderItems.add(item1);
    await orm.em.fork().persistAndFlush(order);

    const ordersSelectIn = await orm.em.fork().find(Order, {}, {
      populate: ['orderItems'],
      strategy: LoadStrategy.SELECT_IN,
    });

    const ordersJoined = await orm.em.fork().find(Order, {}, {
      populate: ['orderItems'],
      strategy: LoadStrategy.JOINED,
    });

    expect(ordersSelectIn[0].orderItems[0].customType).toBe('some thing');
    expect(ordersJoined[0].orderItems[0].customType).toBe('some thing');
  });

});
