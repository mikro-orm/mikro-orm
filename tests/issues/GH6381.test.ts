import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';

class Invoice {

  id!: number;
  invoiceNumber: string;
  amount: number;

  constructor(invoiceNumber: string, amount: number) {
    this.invoiceNumber = invoiceNumber;
    this.amount = amount;
  }

}

const invoiceEntitySchema = new EntitySchema({
  class: Invoice,
  properties: {
    id: {
      primary: true,
      type: Number,
    },
    invoiceNumber: {
      type: String,
      unique: true,
    },
    amount: {
      type: Number,
    },
  },
  schema: 'public',
});

let orm: MikroORM;

describe('Testing mikro-orm nested transactional behavior regarding entity persistence/retrieval', () => {
  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [invoiceEntitySchema],
      dbName: '6381',
    });

    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close();
  });

  test('Test 1 - Should work transparently if no nested transaction is used', async () => {
    await orm.em.transactional(async em => {
      const invoice = new Invoice('I001', 100);
      em.persist(invoice);

      const foundInvoice = await em.findOne(Invoice, {
        invoiceNumber: 'I001',
      });

      expect(foundInvoice === invoice).toBe(true);
    });
  });

  test('Test 2 - Should work transparently if a nested transaction is used ?', async () => {
    await orm.em.transactional(async rootEm => {
      const invoice = new Invoice('I002', 100);
      rootEm.persist(invoice);

      await rootEm.transactional(async childEm => {
        const foundInvoice = await childEm.findOne(Invoice, {
          invoiceNumber: 'I002',
        });

        expect(foundInvoice).not.toBeNull();
        expect(foundInvoice === invoice).toBe(true);
      });
    });
  });

  test('Test 3 - Should work if a nested transaction is used (having explicitely re-marked the entities with em.persist(...) within the nested transaction', async () => {
    await orm.em.transactional(async rootEm => {
      const invoice = new Invoice('I003', 100);
      rootEm.persist(invoice);

      await rootEm.transactional(async childEm => {
        childEm.persist(invoice);

        const foundInvoice = await childEm.findOne(Invoice, {
          invoiceNumber: 'I003',
        });

        expect(foundInvoice).not.toBeNull();
        expect(foundInvoice === invoice).toBe(true);
      });
    });
  });

  test('Test 4 - Should work if a nested transaction is used (having explicitely flushed the parent transactional context before entering the nested transaction)', async () => {
    await orm.em.transactional(async rootEm => {
      const invoice = new Invoice('I004', 100);
      rootEm.persist(invoice);
      await rootEm.flush();

      await rootEm.transactional(async childEm => {
        const foundInvoice = await childEm.findOne(Invoice, {
          invoiceNumber: 'I004',
        });

        expect(foundInvoice).not.toBeNull();
        expect(foundInvoice === invoice).toBe(true);
      });
    });
  });
});
