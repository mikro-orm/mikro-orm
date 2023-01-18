import type { EventSubscriber, FlushEventArgs } from '@mikro-orm/core';
import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Subscriber } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({ tableName: 'customers' })
class Customer {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string = 'Foo';

  @OneToMany(() => Order, order => order.customer)
  orders = new Collection<Order>(this);

}

@Entity({ tableName: 'orders' })
class Order {

  @PrimaryKey()
  id!: number;

  @Property()
  value: number = 200;

  @ManyToOne(() => Customer)
  customer!: Customer;

}

@Subscriber()
class OrdersSubscriber implements EventSubscriber<Order> {

  static emptyChangelogs: boolean[] = [];

  async afterFlush(args: FlushEventArgs): Promise<void> {
    const changeSets = args.uow.getChangeSets();

    for (const changeSet of changeSets) {
      if (changeSet.entity instanceof Order) {
        OrdersSubscriber.emptyChangelogs.push(args.uow.getChangeSets().length === 0);
        await args.em.populate(changeSet.entity, ['customer']);
        OrdersSubscriber.emptyChangelogs.push(args.uow.getChangeSets().length === 0);
      }
    }
  }

}

let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Customer],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3345`, async () => {
  const parent = orm.em.create(Customer, { name: 'asd', orders: [{ value: 123 }, { value: 456 }] });
  await orm.em.persist(parent).flush();

  parent.orders[0].value = 666;
  await orm.em.flush();

  orm.em.clear();
  const o = await orm.em.findOneOrFail(Order, parent.orders[0]);
  o.value = 3223232;
  await orm.em.flush();

  expect(OrdersSubscriber.emptyChangelogs).toEqual([false, false, false, false, false, false, false, false]);
});
