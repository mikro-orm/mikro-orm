import { Collection, MikroORM, raw } from '@mikro-orm/postgresql';
import {
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class Statistic {
  @Property()
  revenue!: number;
}

@Entity()
class Event {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany({ entity: () => Order, mappedBy: order => order.event })
  orders = new Collection<Order>(this);

  @Embedded({ entity: () => Statistic, nullable: true, prefix: false, persist: false })
  statistic?: Statistic;
}

@Entity()
class Order {
  @PrimaryKey()
  id!: number;

  @Property()
  total!: number;

  @ManyToOne(() => Event, { nullable: true })
  event!: Event;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Order, Event],
    dbName: '5578',
  });
  await orm.schema.refresh();
});

beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

test('Hydrate non persistent properties on embeddable', async () => {
  const eventFoo = orm.em.create(Event, { id: 1, name: 'Foo' });
  const eventBar = orm.em.create(Event, { id: 2, name: 'Bar' });
  orm.em.create(Order, { id: 1, total: 100, event: eventFoo });
  orm.em.create(Order, { id: 2, total: 150, event: eventFoo });
  orm.em.create(Order, { id: 3, total: 40, event: eventBar });
  orm.em.create(Order, { id: 4, total: 20, event: eventBar });
  await orm.em.flush();
  orm.em.clear();

  const qb = orm.em.createQueryBuilder(Event, 'e');

  const results = await qb
    .select(['e.*', raw('sum(o.total)::int4 as revenue')])
    .leftJoin('e.orders', 'o')
    .groupBy('e.id')
    .getResult();

  expect(results.find(e => e.name === 'Foo')?.statistic?.revenue).toBe(250);
  expect(results.find(e => e.name === 'Bar')?.statistic?.revenue).toBe(60);
});
