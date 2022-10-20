import {
  Collection,
  Entity,
  EntityCaseNamingStrategy,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  PrimaryKeyType,
  Property,
} from '@mikro-orm/core';

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

  @ManyToOne({ primary: true, fieldName: 'orderId' })
  order: Order;

  @ManyToOne({ primary: true, fieldName: 'productId' })
  product: Product;

  @Property({ default: 1 })
  amount!: number;

  @Property({ default: 0 })
  offeredPrice: number;

  [PrimaryKeyType]?: [number, number];

  constructor(order: Order, product: Product) {
    this.order = order;
    this.product = product;
    this.offeredPrice = product.currentPrice;
  }

}

describe('mikroOrm', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Product, OrderItem, Order],
      dbName: ':memory:',
      type: 'sqlite',
      namingStrategy: EntityCaseNamingStrategy,
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => await orm.close(true));

  beforeEach(() => orm.schema.clearDatabase());

  test('schema', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();

    expect(sql).toMatchSnapshot();
  });

  async function creatEntities() {
    const order1 = new Order();
    const product1 = new Product('p1', 111);

    const item11 = new OrderItem(order1, product1);
    item11.offeredPrice = 123;

    await orm.em.fork().persistAndFlush(order1);

    return { order1 };
  }

  test('should populate m:n with custom fieldName', async () => {
    await creatEntities();

    await expect(
      orm.em.fork().find(Order, {}, { populate: ['products'] }),
    ).resolves.not.toThrow();

    const orderRepository = orm.em.fork().getRepository(Order);

    await expect(
      orderRepository.findAll({ populate: ['products'] }),
    ).resolves.not.toThrow();
  });
});
