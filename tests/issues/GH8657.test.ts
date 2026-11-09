import { defineEntity, MikroORM, Opt, p, Type, wrap } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

class OrderId {
  constructor(readonly value: string) {}
}

class OrderIdType extends Type<OrderId | null | undefined, string | null | undefined> {
  override convertToDatabaseValue(value: OrderId | string | null | undefined): string | null | undefined {
    if (value == null) {
      return value;
    }

    return typeof value === 'string' ? value : value.value;
  }

  override convertToJSValue(value: string | null | undefined): OrderId | null | undefined {
    return value == null ? value : new OrderId(value);
  }

  override compareAsType(): string {
    return 'string';
  }

  override getColumnType(): string {
    return 'text';
  }
}

const orderSchema = defineEntity({
  name: 'Order8657',
  properties: {
    id: p.type(OrderIdType).primary(),
    draft: () => p.oneToOne(Draft).mappedBy('order').ref().nullable(),
  },
});

class Order extends orderSchema.class {}
orderSchema.setClass(Order);

const draftSchema = defineEntity({
  name: 'Draft8657',
  properties: {
    id: p.string().primary(),
    order: () => p.oneToOne(Order).inversedBy('draft').ref().nullable(),
    updatedAt: p
      .integer()
      .onUpdate(() => Date.now())
      .$type<number & Opt>(),
  },
});

class Draft extends draftSchema.class {}
draftSchema.setClass(Draft);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Order, Draft],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const em = orm.em.fork();
  const order = em.create(Order, { id: new OrderId('order_1') });
  em.create(Draft, { id: 'draft_1', order, updatedAt: 0 });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('loading the inverse side keeps the auto-joined owner clean', async () => {
  const em = orm.em.fork();
  const order = await em.findOneOrFail(Order, new OrderId('order_1'));
  const draft = order.draft!.unwrap();
  expect(wrap(draft).isInitialized()).toBe(false);
  expect(wrap(draft, true).__originalEntityData).toEqual({ id: 'draft_1', order: 'order_1' });

  em.getUnitOfWork().computeChangeSets();
  expect(em.getUnitOfWork().getChangeSets()).toHaveLength(0);
});

test('populating the owner from the inverse side does not emit an update on flush', async () => {
  const em = orm.em.fork();
  const order = await em.findOneOrFail(Order, new OrderId('order_1'), { populate: ['draft'] });
  expect(wrap(order.draft!.unwrap(), true).__originalEntityData!.order).toBe('order_1');

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});
