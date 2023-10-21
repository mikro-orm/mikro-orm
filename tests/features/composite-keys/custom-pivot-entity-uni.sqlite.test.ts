import {
  Entity,
  PrimaryKey,
  MikroORM,
  ManyToOne,
  Property,
  wrap,
  OneToMany,
  Collection,
  ManyToMany,
  PrimaryKeyProp,
} from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Order {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => OrderItem, item => item.order)
  items = new Collection<OrderItem>(this);

  @ManyToMany({ entity: () => Product, pivotEntity: () => OrderItem })
  products = new Collection<Product>(this);

  @Property()
  paid: boolean = false;

  @Property()
  shipped: boolean = false;

  @Property()
  created: Date = new Date();

}

@Entity()
export class Product {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  currentPrice: number;

  constructor(name: string, currentPrice: number) {
    this.name = name;
    this.currentPrice = currentPrice;
  }

}

@Entity()
export class OrderItem {

  @ManyToOne({ primary: true })
  order: Order;

  @ManyToOne({ primary: true })
  product: Product;

  @Property({ default: 1 })
  amount!: number;

  @Property({ default: 0 })
  offeredPrice: number;

  [PrimaryKeyProp]?: ['order', 'product'];

  constructor(order: Order, product: Product) {
    this.order = order;
    this.product = product;
    this.offeredPrice = product.currentPrice;
  }

}

describe('custom pivot entity for m:n with additional properties (unidirectional)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Product, OrderItem, Order],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  beforeEach(() => orm.schema.clearDatabase());

  test(`schema`, async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toMatchSnapshot();
  });

  async function createEntities() {
    const order1 = new Order();
    const order2 = new Order();
    const order3 = new Order();
    const product1 = new Product('p1', 111);
    const product2 = new Product('p2', 222);
    const product3 = new Product('p3', 333);
    const product4 = new Product('p4', 444);
    const product5 = new Product('p5', 555);
    const item11 = new OrderItem(order1, product1);
    item11.offeredPrice = 123;
    const item12 = new OrderItem(order1, product2);
    item12.offeredPrice = 3123;
    const item21 = new OrderItem(order2, product1);
    item21.offeredPrice = 4123;
    const item22 = new OrderItem(order2, product2);
    item22.offeredPrice = 1123;
    const item23 = new OrderItem(order2, product5);
    item23.offeredPrice = 1263;
    const item31 = new OrderItem(order3, product3);
    item31.offeredPrice = 7123;
    const item32 = new OrderItem(order3, product4);
    item32.offeredPrice = 9123;
    const item33 = new OrderItem(order3, product5);
    item33.offeredPrice = 5123;

    await orm.em.fork().persistAndFlush([order1, order2, order3]);
    return { order1, order2, product1, product2, product3, product4, product5 };
  }

  test(`should work`, async () => {
    const { product1, product2, product3, product4, product5 } = await createEntities();
    const productRepository = orm.em.getRepository(Product);

    const orders = await orm.em.find(Order, {}, { populate: true });
    expect(orders).toHaveLength(3);

    // test M:N lazy load
    orm.em.clear();
    let order = (await orm.em.findOne(Order, { products: product1.id }))!;
    expect(order.products.isInitialized()).toBe(false);
    await order.products.init();
    expect(order.products.isInitialized()).toBe(true);
    expect(order.products.count()).toBe(2);
    expect(order.products.getItems()[0]).toBeInstanceOf(Product);
    expect(order.products.getItems()[0].id).toBeDefined();
    expect(wrap(order.products.getItems()[0]).isInitialized()).toBe(true);

    // test collection CRUD
    // remove
    expect(order.products.count()).toBe(2);
    order.products.remove(t => t.id === product1.id); // we need to get reference as product1 is detached from current EM
    await orm.em.persistAndFlush(order);
    orm.em.clear();
    order = (await orm.em.findOne(Order, order.id, { populate: ['products'] as const }))!;
    expect(order.products.count()).toBe(1);

    // add
    order.products.add(productRepository.getReference(product1.id)); // we need to get reference as product1 is detached from current EM
    const product6 = new Product('fresh', 555);
    order.products.add(product6);
    await orm.em.persistAndFlush(order);
    orm.em.clear();
    order = (await orm.em.findOne(Order, order.id, { populate: ['products'] as const }))!;
    expect(order.products.count()).toBe(3);


    // slice
    expect(order.products.slice().length).toBe(3);
    expect(order.products.slice(0, 3).length).toBe(3);
    expect(order.products.slice(0, 1)).toEqual([order.products[0]]);

    // contains
    expect(order.products.contains(productRepository.getReference(product1.id))).toBe(true);
    expect(order.products.contains(productRepository.getReference(product2.id))).toBe(true);
    expect(order.products.contains(productRepository.getReference(product3.id))).toBe(false);
    expect(order.products.contains(productRepository.getReference(product4.id))).toBe(false);
    expect(order.products.contains(productRepository.getReference(product5.id))).toBe(false);
    expect(order.products.contains(productRepository.getReference(product6.id))).toBe(true);

    // removeAll
    order.products.removeAll();
    await orm.em.persistAndFlush(order);
    orm.em.clear();
    order = (await orm.em.findOne(Order, order.id, { populate: ['products'] as const }))!;
    expect(order.products.count()).toBe(0);
    expect(order.products.isEmpty()).toBe(true);
  });

  test(`search by m:n property and loadCount() works`, async () => {
    await createEntities();
    const res = await orm.em.find(Order, { products: { name: 'p1' } });
    expect(res).toHaveLength(2);
    const count = await res[0].products.loadCount();
    expect(count).toBe(2);
  });

});
