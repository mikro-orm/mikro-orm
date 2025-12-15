import {
  MikroORM,
  defineEntity,
  p,
  wrap,
} from '@mikro-orm/sqlite';

enum OrderCreditNoteStatus {
  Active = 'Active',
  Redeemed = 'Redeemed',
  Expired = 'Expired',
}

const Client = defineEntity({
  name: 'Client',
  tableName: 'clients',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    createdAt: p.datetime().defaultRaw('current_timestamp'),
    updatedAt: p
      .datetime()
      .defaultRaw('current_timestamp')
      .onUpdate(() => new Date()),
  },
});

const ClientUser = defineEntity({
  name: 'ClientUser',
  tableName: 'client_users',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    createdAt: p.datetime().defaultRaw('current_timestamp'),
    updatedAt: p
      .datetime()
      .defaultRaw('current_timestamp')
      .onUpdate(() => new Date()),
  },
});

const Order = defineEntity({
  name: 'Order',
  tableName: 'orders',
  properties: {
    id: p.integer().primary(),
    barcode: p.string(),
    totalAmount: p.decimal(),
    createdAt: p.datetime().defaultRaw('current_timestamp'),
    updatedAt: p
      .datetime()
      .defaultRaw('current_timestamp')
      .onUpdate(() => new Date()),
  },
});

const OrderCreditNote = defineEntity({
  name: 'OrderCreditNote',
  tableName: 'order_credit_notes',
  properties: {
    id: p.integer().primary(),
    client: () => p.manyToOne(Client),
    chainAdmin: () => p.manyToOne(Client),
    clientUser: () => p.manyToOne(ClientUser),
    status: p
      .enum(() => OrderCreditNoteStatus)
      .default(OrderCreditNoteStatus.Active),
    redeemedBy: () => p.manyToOne(ClientUser).nullable(),
    order: () => p.manyToOne(Order),
    redeemedOrder: () => p.manyToOne(Order).nullable(),
    code: p.string().length(50).index(),
    amount: p.decimal(),
    remainingAmount: p.decimal(),
    expiresAt: p.datetime(),
    redeemedAt: p.datetime().nullable(),
    createdAt: p.datetime().defaultRaw('current_timestamp'),
    updatedAt: p
      .datetime()
      .defaultRaw('current_timestamp')
      .onUpdate(() => new Date()),
  },
  uniques: [{ properties: ['chainAdmin', 'code'] }],
});

describe('assign() with getReference() and unpersisted ManyToOne relations', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Client, ClientUser, Order, OrderCreditNote],
      dbName: ':memory:',
    });

    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.schema.clearDatabase());

  test('getReference + assign correctly handles unpersisted relation FK', async () => {
    // Setup: Create existing credit note in DB
    const client = orm.em.create(Client, { name: 'Store A' });
    const user = orm.em.create(ClientUser, { name: 'Cashier 1' });
    const returnOrder = orm.em.create(Order, {
      barcode: 'RET-001',
      totalAmount: '50.00',
    });

    const creditNote = orm.em.create(OrderCreditNote, {
      client,
      chainAdmin: client,
      clientUser: user,
      order: returnOrder,
      code: 'CN-001',
      amount: '50.00',
      remainingAmount: '50.00',
      expiresAt: new Date(),
      status: OrderCreditNoteStatus.Active,
    });

    await orm.em.flush();
    const creditNoteId = creditNote.id;
    const userId = user.id;
    orm.em.clear();

    // Action: Create new order and update credit note using getReference
    const newOrder = orm.em.create(Order, {
      barcode: 'ORD-001',
      totalAmount: '200.00',
    });

    const creditNoteRef = orm.em.getReference(OrderCreditNote, creditNoteId);

    wrap(creditNoteRef).assign({
      status: OrderCreditNoteStatus.Redeemed,
      redeemedBy: userId,
      redeemedOrder: newOrder, // Unpersisted entity
      remainingAmount: '0.00',
      redeemedAt: new Date(),
    });

    await orm.em.flush();
    orm.em.clear();

    // Verify: redeemedOrder FK is correctly set
    const result = await orm.em.findOneOrFail(OrderCreditNote, creditNoteId, {
      populate: ['redeemedOrder', 'redeemedBy'],
    });

    // All of these should work
    expect(result.status).toBe(OrderCreditNoteStatus.Redeemed);
    expect(result.remainingAmount).toBe('0');
    expect(result.redeemedBy).toBeDefined();
    expect(result.redeemedOrder).toBeDefined();
    expect(result.redeemedOrder?.barcode).toBe('ORD-001');
  });

  test('workaround: loading entity instead of getReference works', async () => {
    // Setup: Create existing credit note in DB
    const client = orm.em.create(Client, { name: 'Store A' });
    const user = orm.em.create(ClientUser, { name: 'Cashier 1' });
    const returnOrder = orm.em.create(Order, {
      barcode: 'RET-002',
      totalAmount: '50.00',
    });

    const creditNote = orm.em.create(OrderCreditNote, {
      client,
      chainAdmin: client,
      clientUser: user,
      order: returnOrder,
      code: 'CN-002',
      amount: '50.00',
      remainingAmount: '50.00',
      expiresAt: new Date(),
      status: OrderCreditNoteStatus.Active,
    });

    await orm.em.flush();
    const creditNoteId = creditNote.id;
    const userId = user.id;
    orm.em.clear();

    // Action: Create new order and update credit note using loaded entity
    const newOrder = orm.em.create(Order, {
      barcode: 'ORD-002',
      totalAmount: '200.00',
    });

    // Load entity instead of using getReference
    const loadedCreditNote = await orm.em.findOneOrFail(
      OrderCreditNote,
      creditNoteId,
    );

    wrap(loadedCreditNote).assign({
      status: OrderCreditNoteStatus.Redeemed,
      redeemedBy: userId,
      redeemedOrder: newOrder, // Works with loaded entity
      remainingAmount: '0',
      redeemedAt: new Date(),
    });

    await orm.em.flush();
    orm.em.clear();

    // Verify: redeemedOrder is correctly set
    const result = await orm.em.findOneOrFail(OrderCreditNote, creditNoteId, {
      populate: ['redeemedOrder', 'redeemedBy'],
    });

    // All work
    expect(result.status).toBe(OrderCreditNoteStatus.Redeemed);
    expect(result.remainingAmount).toBe('0');
    expect(result.redeemedBy).toBeDefined();
    expect(result.redeemedOrder).toBeDefined();
    expect(result.redeemedOrder?.barcode).toBe('ORD-002');
  });

  test('multiple entities in loop with getReference and unpersisted relations', async () => {
    // Setup: Create multiple existing credit notes
    const client = orm.em.create(Client, { name: 'Store A' });
    const user = orm.em.create(ClientUser, { name: 'Cashier 1' });

    const returnOrder1 = orm.em.create(Order, {
      barcode: 'RET-003',
      totalAmount: '30.00',
    });
    const returnOrder2 = orm.em.create(Order, {
      barcode: 'RET-004',
      totalAmount: '20.00',
    });

    const creditNote1 = orm.em.create(OrderCreditNote, {
      client,
      chainAdmin: client,
      clientUser: user,
      order: returnOrder1,
      code: 'CN-003',
      amount: '30.00',
      remainingAmount: '30.00',
      expiresAt: new Date(),
      status: OrderCreditNoteStatus.Active,
    });

    const creditNote2 = orm.em.create(OrderCreditNote, {
      client,
      chainAdmin: client,
      clientUser: user,
      order: returnOrder2,
      code: 'CN-004',
      amount: '20.00',
      remainingAmount: '20.00',
      expiresAt: new Date(),
      status: OrderCreditNoteStatus.Active,
    });

    await orm.em.flush();
    const creditNoteIds = [creditNote1.id, creditNote2.id];
    const userId = user.id;
    orm.em.clear();

    // Action: Create new order and update multiple credit notes using getReference in loop
    const newOrder = orm.em.create(Order, {
      barcode: 'ORD-003',
      totalAmount: '100.00',
    });

    for (const creditNoteId of creditNoteIds) {
      const creditNoteRef = orm.em.getReference(OrderCreditNote, creditNoteId);

      wrap(creditNoteRef).assign({
        status: OrderCreditNoteStatus.Redeemed,
        redeemedBy: userId,
        redeemedOrder: newOrder, // Unpersisted entity
        remainingAmount: '0',
      });
    }

    await orm.em.flush();
    orm.em.clear();

    // Verify: Both credit notes correctly reference the new order
    const results = await orm.em.find(
      OrderCreditNote,
      {
        id: { $in: creditNoteIds },
      },
      {
        populate: ['redeemedOrder'],
      },
    );

    for (const result of results) {
      expect(result.status).toBe(OrderCreditNoteStatus.Redeemed);
      expect(result.redeemedOrder).toBeDefined();
      expect(result.redeemedOrder?.barcode).toBe('ORD-003');
    }
  });
});
