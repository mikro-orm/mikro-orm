import { AbstractSqlDriver, MikroORM, Opt } from '@mikro-orm/sql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { PgliteDriver } from '@mikro-orm/pglite';
import { mockLogger } from '../../helpers.js';
import {
  Embeddable,
  Embedded,
  Entity,
  Formula,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class PriceBreakdown {
  @Property()
  finalPrice!: number;

  @Property()
  settledAmount!: number;

  @Formula((cols, table) => `round(${table.alias}.final_price - ${table.alias}.settled_amount, 3)`)
  unsettledAmount!: Opt<number>;
}

@Entity()
class Customer {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;
}

@Entity()
class Invoice {
  @PrimaryKey()
  id!: number;

  @Property()
  invoiceSequence!: number;

  @Embedded(() => PriceBreakdown, { prefix: false })
  priceBreakdown!: PriceBreakdown;

  @ManyToOne(() => Customer)
  customer!: Customer;
}

@Entity()
class Payment {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Invoice)
  invoice!: Invoice;
}

describe.each([
  { driver: SqliteDriver, balance: 75, quote: '`' },
  { driver: PgliteDriver, balance: '75.000', quote: '"' },
])('$driver.name', ({ driver, balance, quote }) => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Invoice, Payment],
      driver,
      metadataProvider: ReflectMetadataProvider,
      dbName: driver === SqliteDriver ? ':memory:' : 'memory://',
    });
    await orm.schema.refresh();
    const invoice = orm.em.create(Invoice, {
      invoiceSequence: 42,
      priceBreakdown: { finalPrice: 100, settledAmount: 25 },
      customer: { name: 'Alice', email: 'alice@example.com' },
    });
    orm.em.create(Payment, { invoice });
    await orm.em.flush();
  });

  beforeEach(() => orm.em.clear());
  afterAll(() => orm.close(true));

  test('find explicitly selects an embedded formula', async () => {
    const mock = mockLogger(orm);
    const [invoice] = await orm.em.find(
      Invoice,
      {},
      {
        fields: ['invoiceSequence', 'priceBreakdown.unsettledAmount'],
      },
    );
    expect(mock.mock.calls[0][0]).toContain('round(');
    expect(mock.mock.calls[0][0]).not.toContain('.*');
    expect(invoice.id).toBeDefined();
    expect(invoice.invoiceSequence).toBe(42);
    expect(invoice.priceBreakdown.unsettledAmount).toBe(balance);
    expect(invoice.priceBreakdown).not.toHaveProperty('finalPrice');
    expect(invoice.priceBreakdown).not.toHaveProperty('settledAmount');
    expect(invoice).toHaveProperty('customer', undefined);
  });

  test('findAndCount selects an embedded formula with a narrow populated relation', async () => {
    const [[invoice], count] = await orm.em.findAndCount(
      Invoice,
      {},
      {
        fields: ['invoiceSequence', 'priceBreakdown.unsettledAmount', 'customer.name'],
        populate: ['customer'],
      },
    );
    expect(count).toBe(1);
    expect(invoice.priceBreakdown.unsettledAmount).toBe(balance);
    expect(invoice.priceBreakdown).not.toHaveProperty('finalPrice');
    expect(invoice.customer.id).toBeDefined();
    expect(invoice.customer.name).toBe('Alice');
    expect(invoice.customer).toHaveProperty('email', undefined);
  });

  test('selects formulas when selecting the whole embeddable', async () => {
    const [invoice] = await orm.em.find(Invoice, {}, { fields: ['priceBreakdown'] });
    expect(invoice.priceBreakdown).toEqual({ finalPrice: 100, settledAmount: 25, unsettledAmount: balance });
  });

  test('query builder expands the whole embeddable including its formula', async () => {
    const invoice = await orm.em.qb(Invoice, 'inv').select(['id', 'priceBreakdown']).getSingleResult();
    expect(invoice!.priceBreakdown).toEqual({ finalPrice: 100, settledAmount: 25, unsettledAmount: balance });
  });

  test('root wildcard evaluates the embedded formula', async () => {
    const [invoice] = await orm.em.find(Invoice, {}, { fields: ['*'] });
    expect(invoice.priceBreakdown.unsettledAmount).toBe(balance);
  });

  test.each(['joined', 'select-in'] as const)(
    'selects an embedded formula through a %s populated relation',
    async strategy => {
      const [[payment], count] = await orm.em.findAndCount(
        Payment,
        {},
        {
          fields: ['invoice.invoiceSequence', 'invoice.priceBreakdown.unsettledAmount'],
          populate: ['invoice'],
          strategy,
        },
      );
      expect(count).toBe(1);
      expect(payment.invoice.invoiceSequence).toBe(42);
      expect(payment.invoice.priceBreakdown.unsettledAmount).toBe(balance);
      expect(payment.invoice.priceBreakdown).not.toHaveProperty('finalPrice');
    },
  );

  test('query builder resolves an embedded formula in having', async () => {
    const field: string = 'priceBreakdown.unsettledAmount';
    const rows = await orm.em
      .qb(Invoice, 'inv')
      .select('priceBreakdown.unsettledAmount as balance')
      .groupBy('priceBreakdown.unsettledAmount')
      .having({ [field]: { $gt: 50 } })
      .execute();
    expect(rows).toEqual([{ balance }]);
  });

  test('query builder preserves a custom formula result alias', async () => {
    const rows = await orm.em.qb(Invoice, 'inv').select('inv.priceBreakdown.unsettledAmount as balance').execute();
    expect(rows).toEqual([{ balance }]);
  });

  test('query builder selects the formula with the table and column aliases', () => {
    const sql = orm.em.qb(Invoice, 'inv').select(['invoiceSequence', 'priceBreakdown.unsettledAmount']).getQuery();
    expect(sql.replaceAll(quote, '"')).toBe(
      'select "inv"."invoice_sequence", round("inv".final_price - "inv".settled_amount, 3) as "unsettled_amount" from "invoice" as "inv"',
    );
  });
});
