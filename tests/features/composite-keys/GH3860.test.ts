import { Entity, PrimaryKey, MikroORM, ManyToOne, PrimaryKeyType, Property, Collection, ManyToMany } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Order {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => Product, pivotEntity: () => OrderItem })
  products = new Collection<Product>(this);

}

@Entity()
export class Product {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => Order, pivotEntity: () => OrderItem })
  orders = new Collection<Order>(this);

}

@Entity()
export class OrderItem {

  @ManyToOne({ primary: true })
  order: Order;

  @ManyToOne({ primary: true })
  product: Product;

  @Property({ default: 1 })
  amount!: number;

  [PrimaryKeyType]?: [number, number];

  constructor(order: Order, product: Product) {
    this.order = order;
    this.product = product;
  }

}

test(`validation of bidirectional M:N with pivotEntity`, async () => {
  const err = `Product.orders and Order.products use the same 'pivotEntity', but don't form a bidirectional relation. Specify 'inversedBy' or 'mappedBy' to link them.`;
  await expect(MikroORM.init({
    entities: [Product, OrderItem, Order],
    dbName: ':memory:',
    driver: SqliteDriver,
    connect: false,
  })).rejects.toThrowError(err);
});
