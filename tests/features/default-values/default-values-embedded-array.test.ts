import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const PaymentDetailSchema = defineEntity({
  embeddable: true,
  name: 'PaymentDetail',
  properties: {
    paymentMethod: p.string(),
    amount: p
      .decimal('number')
      .precision(10)
      .scale(3)
      .onCreate(() => 0),
  },
});

export class PaymentDetail extends PaymentDetailSchema.class {}
PaymentDetailSchema.setClass(PaymentDetail);

const InvoiceSchema = defineEntity({
  name: 'Invoice',
  properties: {
    id: p.integer().primary(),
    invoiceNumber: p.string(),
    payments: () => p.embedded(PaymentDetail).array().nullable(),
  },
});
export class Invoice extends InvoiceSchema.class {}
InvoiceSchema.setClass(Invoice);

describe('defineEntity', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Invoice],
      serialization: { forceObject: true },
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  it('test', async () => {
    const invoice = orm.em.create(Invoice, {
      invoiceNumber: 'INV-123',
      payments: [{ paymentMethod: 'cash' }],
    });

    await orm.em.flush();
    expect(invoice.payments).toHaveLength(1);
    expect(invoice.payments![0]).toEqual({ paymentMethod: 'cash', amount: 0 });

    orm.em.clear();

    const loaded = await orm.em.findOne(Invoice, { id: invoice.id }, { fields: ['invoiceNumber', 'payments'] });
    expect(loaded).toBeTruthy();
    expect(loaded!.payments).toHaveLength(1);
    expect(loaded!.payments![0]).toEqual({ paymentMethod: 'cash', amount: 0 });
  });
});
