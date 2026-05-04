import { Entity, MikroORM, OneToOne, PrimaryKey, Property, Ref } from '@mikro-orm/sqlite';

@Entity()
class OrderItemGHx42 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class OrderNoteGHx42 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class OrderGHx42 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => OrderItemGHx42, { ref: true })
  item!: Ref<OrderItemGHx42>;

  @OneToOne(() => OrderNoteGHx42, { ref: true })
  note!: Ref<OrderNoteGHx42>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [OrderGHx42, OrderItemGHx42, OrderNoteGHx42],
  });
  await orm.schema.refreshDatabase();

  orm.em.create(OrderGHx42, {
    id: 1,
    name: 'Order #1',
    item: { id: 1, name: 'Item #1' },
    note: { id: 1, name: 'Note #1' },
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('find order with fields returns order and item data correctly', async () => {
  const order = await orm.em.findOneOrFail(
    OrderGHx42,
    { id: 1 },
    {
      fields: ['id', 'name', 'item.id', 'item.name'],
    },
  );

  expect(order.id).toBe(1);
  expect(order.name).toBe('Order #1');
  expect(order.item.$.id).toBe(1);
  expect(order.item.$.name).toBe('Item #1');
});

test('find order with fields and populate note returns item data', async () => {
  orm.em.clear();
  const order = await orm.em.findOneOrFail(
    OrderGHx42,
    { id: 1 },
    {
      fields: ['id', 'name', 'item.id', 'item.name'],
      populate: ['note'],
    },
  );

  expect(order.id).toBe(1);
  expect(order.name).toBe('Order #1');
  expect(order.item.$.id).toBe(1);
  expect(order.item.$.name).toBe('Item #1');
});
