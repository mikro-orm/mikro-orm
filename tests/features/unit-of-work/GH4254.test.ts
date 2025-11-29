import { Cascade } from '@mikro-orm/core';
import { Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
export class OrderSummary {

  @OneToOne({
    entity: () => Order,
    deleteRule: 'cascade',
    primary: true,
    mapToPk: true,
  })
  orderId!: number;

  @Property()
  prop!: string;

}

@Entity()
export class Order {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => OrderSummary, 'orderId', {
    cascade: [Cascade.ALL],
    eager: true,
  })
  summary!: OrderSummary;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Order, OrderSummary],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 1352`, async () => {
  const entity = orm.em.create(Order, {
    id: 4,
    summary: orm.em.create(OrderSummary, {
      orderId: 4,
      prop: '123',
    }),
  });
  orm.em.persist(entity);
  await orm.em.flush();
});

test(`GH issue 4254`, async () => {
  orm.em.create(Order, {
    id: 4,
    summary: {
      orderId: 4,
      prop: '123',
    },
  });
});
