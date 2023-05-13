import {
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  Ref,
  Rel,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

@Entity()
class Shipment {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @Property()
  createdAt!: Date;

  @Property({ onUpdate: () => new Date() })
  updatedAt!: Date;

  @OneToMany(() => LineItem, li => li.shipment)
  lineItems2 = new Collection<LineItem>(this);

  @ManyToOne(() => Order, { hidden: true })
  order!: Rel<Order>;

}

@Entity()
class Order {

  @PrimaryKey()
  id!: number;

  @Property()
  number!: string;

  @Property()
  createdAt!: Date;

  @Property({ onUpdate: () => new Date() })
  updatedAt!: Date;

  @OneToMany(() => LineItem, li => li.order)
  lineItems = new Collection<LineItem>(this);

  @OneToMany(() => Shipment, s => s.order)
  shipments = new Collection<Shipment>(this);

}

@Entity()
class LineItem {

  @PrimaryKey()
  id!: string;

  @Property()
  sku!: string;

  @Property()
  name!: string;

  @Property()
  createdAt!: Date;

  @Property({ onUpdate: () => new Date() })
  updatedAt!: Date;

  @ManyToOne(() => Order, { ref: true, hidden: true })
  order!: Ref<Order>;

  @ManyToOne(() => Shipment, { ref: true, hidden: true })
  shipment!: Ref<Shipment>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    loadStrategy: LoadStrategy.JOINED,
    entities: [Order, Shipment, LineItem],
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('4339', async () => {
  orm.em.create(Order, {
    id: 1234,
    number: '6789567833435',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  orm.em.create(Shipment, {
    id: '67e24192-4454-41d5-af5f-25940b63b759',
    order: 1234,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  orm.em.create(Shipment, {
    id: '8d466cb1-8abc-4423-a1a8-5081ec43d26e',
    order: 1234,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  orm.em.create(LineItem, {
    id: v4(),
    shipment: '67e24192-4454-41d5-af5f-25940b63b759',
    order: 1234,
    sku: 'TEST_SKU',
    name: 'Test Product',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  orm.em.create(LineItem, {
    id: v4(),
    shipment: '8d466cb1-8abc-4423-a1a8-5081ec43d26e',
    order: 1234,
    sku: 'TEST_SKU_2',
    name: 'Test Product 2',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await orm.em.flush();
  orm.em.clear();

  // console.log('reload reload reload reload reload reload');
  const order = await orm.em.findOneOrFail(Order, 1234, {
    populate: ['lineItems', 'shipments', 'shipments.lineItems2'],
    refresh: true,
  });

  // console.log(order);
  // console.log(order.shipments[0]);
  expect(order.id).toBe(1234);
  expect(order.lineItems).toHaveLength(2);
  expect(order.shipments).toHaveLength(2);
  expect(order.shipments[0].lineItems2).toHaveLength(1);
});
