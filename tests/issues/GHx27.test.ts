import { MikroORM, defineEntity, p } from '@mikro-orm/sqlite';

enum PaymentMethod {
  Cash = '1',
  Card = '2',
  Credit = '3',
}

const Base = defineEntity({
  abstract: true,
  name: 'Base',
  properties: {
    id: p.integer().primary(),
  },
});

const Order = defineEntity({
  name: 'Order',
  tableName: 'Orders',
  extends: Base,
  properties: {
    externalId: p.string().length(12).nullable(),
    externalBarcode: p.string().length(50).nullable(),
    soldAt: p.type('timestamp'),
    paymentProvider: p.string().length(50).nullable(),
    barcode: p.string().length(48),
    timestamp: p.bigint('number'),
    posId: p.string().length(50),
    posVersion: p.string().length(15),
    shiftId: p.uuid(),
    paymentMethods: p
      .enum(() => PaymentMethod)
      .nativeEnumName('Payment_methods_enum')
      .array(),
    receiptSequence: p.string().length(20),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Order],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

beforeEach(() => orm.schema.clear());

test('discovery', async () => {
  orm.em.create(Order, {
    soldAt: new Date(),
    barcode: '123456789012345678901234567890123456789012345678',
    timestamp: Date.now(),
    posId: 'POS123',
    posVersion: '1.0.0',
    shiftId: '550e8400-e29b-41d4-a716-446655440000',
    paymentMethods: [PaymentMethod.Cash, PaymentMethod.Card],
    receiptSequence: 'RCPT0001',
  });

  await orm.em.flush();

  const orders = await orm.em.findAll(Order);
  expect(orders).toHaveLength(1);
});
