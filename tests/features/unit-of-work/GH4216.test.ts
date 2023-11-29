import {
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  OneToMany,
  PopulateHint,
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

  @OneToMany({
    entity: 'LineItem',
    mappedBy: 'shipment',
  })
  lineItems = new Collection<LineItem>(this);

  @ManyToOne(() => Order, { hidden: true, deleteRule: 'cascade' })
  order!: Rel<Order>;

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

  // Relationships
  @ManyToOne(() => Order, { hidden: true })
  order!: Ref<Order>;

  @ManyToOne(() => Shipment, { hidden: true })
  shipment!: Ref<Shipment>;

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

  @OneToMany({
    entity: 'LineItem',
    mappedBy: 'order',
  })
  lineItems = new Collection<LineItem>(this);

  @OneToMany({ entity: 'Shipment', mappedBy: 'order' })
  shipments = new Collection<Shipment>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    loadStrategy: LoadStrategy.JOINED,
    populateWhere: PopulateHint.ALL,
    entities: [Order, Shipment, LineItem],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 4219`, async () => {
  orm.em.create(Order, {
    id: 1234,
    number: '6789567833435',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const shipments = [
    orm.em.create(Shipment, {
      id: '67e24192-4454-41d5-af5f-25940b63b759',
      order: orm.em.getReference(Order, 1234),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    orm.em.create(Shipment, {
      id: '8d466cb1-8abc-4423-a1a8-5081ec43d26e',
      order: orm.em.getReference(Order, 1234),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ];

  const lineItems = [
    orm.em.create(LineItem, {
      id: v4(),
      shipment: orm.em.getReference(
        Shipment,
        '67e24192-4454-41d5-af5f-25940b63b759',
      ),
      order: orm.em.getReference(Order, 1234),
      sku: 'TEST_SKU',
      name: 'Test Product',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    orm.em.create(LineItem, {
      id: v4(),
      shipment: orm.em.getReference(
        Shipment,
        '8d466cb1-8abc-4423-a1a8-5081ec43d26e',
      ),
      order: orm.em.getReference(Order, 1234),
      sku: 'TEST_SKU_2',
      name: 'Test Product 2',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ];

  shipments.forEach(shipment => orm.em?.persist(shipment));
  lineItems.forEach(lineItem => orm.em?.persist(lineItem));

  await orm.em.flush();

  const order = await orm.em.findOne(Order, 1234, {
    populate: ['lineItems', 'shipments', 'shipments.lineItems'],
    refresh: true,
  });

  expect(order?.id).toBe(1234);
});
