import { Entity, PrimaryKey, MikroORM, ManyToOne, PrimaryKeyType, Property, wrap, OneToMany, Collection, ManyToMany } from '@mikro-orm/core';

@Entity()
export class Order {

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => OrderItem, item => item.order)
  items = new Collection<OrderItem>(this);

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
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

  @ManyToMany(() => Order, o => o.products)
  orders = new Collection<Order>(this);

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

  [PrimaryKeyType]: [number, number];

  constructor(order: Order, product: Product) {
    this.order = order;
    this.product = product;
    this.offeredPrice = product.currentPrice;
  }

}

describe('custom pivot entity for m:n with additional properties', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Product, OrderItem, Order],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test(`schema`, async () => {
    const sql = await orm.getSchemaGenerator().getCreateSchemaSQL();
    expect(sql).toMatchSnapshot();
  });

  test(`should work`, async () => {
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

    const orders = await orm.em.find(Order, {}, { populate: true });
    expect(orders).toHaveLength(3);

    // test inverse side
    const productRepository = orm.em.getRepository(Product);
    let products = await productRepository.findAll();
    expect(products).toBeInstanceOf(Array);
    expect(products.length).toBe(5);
    expect(products[0]).toBeInstanceOf(Product);
    expect(products[0].name).toBe('p1');
    expect(products[0].orders).toBeInstanceOf(Collection);
    expect(products[0].orders.isInitialized()).toBe(true);
    expect(products[0].orders.isDirty()).toBe(false);
    expect(products[0].orders.count()).toBe(2);
    expect(products[0].orders.length).toBe(2);

    orm.em.clear();
    products = await orm.em.find(Product, {});
    expect(products[0].orders.isInitialized()).toBe(false);
    expect(products[0].orders.isDirty()).toBe(false);
    expect(() => products[0].orders.getItems()).toThrowError(/Collection<Order> of entity Product\[\d+] not initialized/);
    expect(() => products[0].orders.remove(order1, order2)).toThrowError(/Collection<Order> of entity Product\[\d+] not initialized/);
    expect(() => products[0].orders.removeAll()).toThrowError(/Collection<Order> of entity Product\[\d+] not initialized/);
    expect(() => products[0].orders.contains(order1)).toThrowError(/Collection<Order> of entity Product\[\d+] not initialized/);

    // test M:N lazy load
    orm.em.clear();
    products = await productRepository.findAll();
    await products[0].orders.init();
    expect(products[0].orders.count()).toBe(2);
    expect(products[0].orders.getItems()[0]).toBeInstanceOf(Order);
    expect(products[0].orders.getItems()[0].id).toBeDefined();
    expect(wrap(products[0].orders.getItems()[0]).isInitialized()).toBe(true);
    expect(products[0].orders.isInitialized()).toBe(true);
    const old = products[0];
    expect(products[1].orders.isInitialized()).toBe(false);
    products = await productRepository.findAll({ populate: ['orders'] as const });
    expect(products[1].orders.isInitialized()).toBe(true);
    expect(products[0].id).toBe(old.id);
    expect(products[0]).toBe(old);
    expect(products[0].orders).toBe(old.orders);

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
  });

});
