import { Collection, MikroORM } from '@mikro-orm/mssql';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';

@Entity()
class Order7437 {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @OneToMany(() => OrderItem7437, item => item.order)
  items = new Collection<OrderItem7437>(this);
}

@Entity()
class OrderItem7437 {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @ManyToOne(() => Order7437, { primary: true })
  order!: Order7437;

  @Property({ type: 'string', nullable: true })
  status?: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '7437',
    password: 'Root.Root',
    entities: [Order7437, OrderItem7437],
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('batch update with composite PK including ManyToOne', async () => {
  const em = orm.em.fork();

  const order = new Order7437();
  em.persist(order);

  const item1 = new OrderItem7437();
  item1.order = order;
  em.persist(item1);

  const item2 = new OrderItem7437();
  item2.order = order;
  em.persist(item2);

  await em.flush();

  item1.status = 'nok';
  item2.status = 'ok';

  await em.flush();

  em.clear();

  const items = await em.find(OrderItem7437, { order });
  expect(items).toHaveLength(2);

  const loaded1 = items.find(i => i.id === item1.id);
  const loaded2 = items.find(i => i.id === item2.id);
  expect(loaded1?.status).toBe('nok');
  expect(loaded2?.status).toBe('ok');
});
