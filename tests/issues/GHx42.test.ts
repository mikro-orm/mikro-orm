import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';

const OrderSchema = defineEntity({
  name: 'OrderGHx42',
  properties: {
    id: p.integer().primary(),
    name: p.text(),
    item: () => p.oneToOne(OrderItem),
    note: () => p.oneToOne(OrderNote),
  },
});
class Order extends OrderSchema.class {}
OrderSchema.setClass(Order);

const OrderItemSchema = defineEntity({
  name: 'OrderItemGHx42',
  schema: 'inventory_ghx42',
  properties: {
    id: p.integer().primary(),
    name: p.text(),
  },
});
class OrderItem extends OrderItemSchema.class {}
OrderItemSchema.setClass(OrderItem);

const OrderNoteSchema = defineEntity({
  name: 'OrderNoteGHx42',
  schema: 'notes_ghx42',
  properties: {
    id: p.integer().primary(),
    name: p.text(),
  },
});
class OrderNote extends OrderNoteSchema.class {}
OrderNoteSchema.setClass(OrderNote);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Order, OrderItem, OrderNote],
    dbName: 'mikro_orm_test_ghx42',
  });
  await orm.schema.refresh({ dropDb: true });

  orm.em.create(Order, {
    id: 1,
    name: 'Order #1',
    item: { id: 1, name: 'Item #1' },
    note: { id: 1, name: 'Note #1' },
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('find order with fields returns order and item data correctly', async () => {
  const order = await orm.em.findOneOrFail(
    Order,
    { id: 1 },
    {
      fields: ['id', 'name', 'item.id', 'item.name'],
    },
  );

  expect(order.id).toBe(1);
  expect(order.name).toBe('Order #1');
  expect(order.item.id).toBe(1);
  expect(order.item.name).toBe('Item #1');
});

test('find order with fields and populate note returns item data', async () => {
  orm.em.clear();
  const order = await orm.em.findOneOrFail(
    Order,
    { id: 1 },
    {
      fields: ['id', 'name', 'item.id', 'item.name'],
      populate: ['note'],
    },
  );

  expect(order.id).toBe(1);
  expect(order.name).toBe('Order #1');
  expect(order.item.id).toBe(1);
  expect(order.item.name).toBe('Item #1');
});
