import type { EventSubscriber, FlushEventArgs } from '@mikro-orm/core';
import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Subscriber, wrap } from '@mikro-orm/core';
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';

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

  getSubscribedEntities() {
    return [Order];
  }

  async afterFlush(args: FlushEventArgs): Promise<void> {
    const changeSets = args.uow.getChangeSets();

    for (const changeSet of changeSets) {
      if (changeSet.entity instanceof Order) {
        await args.em.populate(changeSet.entity, ['customer']);
      }
    }
  }

}

let orm: MikroORM<BetterSqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Order, Customer],
    dbName: ':memory:',
    driver: BetterSqliteDriver,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH issue 3005', async () => {
  const a = new Order();
  a.customer = new Customer();
  await orm.em.fork().persistAndFlush(a);

  const order = await orm.em.findOneOrFail(Order, a);
  order.value = Math.floor(Math.random() * 200 + 1);
  expect(wrap(order.customer).isInitialized()).toBe(false);
  expect(order.customer.name).toBeUndefined();
  await orm.em.flush();
  expect(wrap(order.customer).isInitialized()).toBe(true);
  expect(order.customer.name).toBe('Foo');
});
