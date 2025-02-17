import { randomUUID } from 'node:crypto';
import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Ref, types } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

abstract class BaseEntity {

  @PrimaryKey({
    type: types.uuid,
    onCreate: () => randomUUID(),
  })
  id!: string;

}

@Entity()
class Product extends BaseEntity {

  @Property()
  name!: string;

  @Property()
  price!: number;

}

@Entity()
class Order extends BaseEntity {

  @OneToMany(() => OrderItem, e => e.order)
  items!: Collection<OrderItem>;

}


@Entity()
class OrderItem {

  @ManyToOne(() => Order, { primary: true, ref: true })
  order!: Ref<Order>;

  @ManyToOne(() => Product, { primary: true, ref: true })
  product!: Ref<Product>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Product, Order, OrderItem],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const product = orm.em.create(Product, { name: 'Product 1', price: 100 });
  const order = orm.em.create(Order, {});
  order.items.add(orm.em.create(OrderItem, { order, product }));
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);
  const [item] = await orm.em.find(OrderItem, { order: order.id }, {
    populate: ['product'],
  });
  expect(item.product.isInitialized()).toBe(true);
  expect(mock).toHaveBeenCalledTimes(1);
});
