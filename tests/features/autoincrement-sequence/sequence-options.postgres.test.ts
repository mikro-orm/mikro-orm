import { MikroORM, Opt } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'ticket' })
class Ticket {
  @PrimaryKey({ sequence: { startWith: 1000, incrementBy: 5 } })
  id!: number;

  @Property()
  name!: string;
}

@Entity({ tableName: 'ticket' })
class TicketChanged {
  @PrimaryKey({ sequence: { startWith: 2000, incrementBy: 10 } })
  id!: number;

  @Property()
  name!: string;
}

@Entity({ tableName: 'invoice' })
class Invoice {
  @PrimaryKey({ generated: 'identity', sequence: { startWith: 10, incrementBy: 2 } })
  id!: number;

  @Property()
  name!: string;
}

@Entity({ tableName: 'invoice' })
class InvoiceChanged {
  @PrimaryKey({ generated: 'identity', sequence: { startWith: 20 } })
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Purchase {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'integer', autoincrement: true, sequence: { startWith: 500 } })
  number!: number & Opt;
}

@Entity({ tableName: 'purchase' })
class PurchaseWithoutNumber {
  @PrimaryKey()
  id!: number;
}

@Entity({ tableName: 'purchase' })
class PurchaseWithPlainNumber {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'integer', nullable: true })
  number?: number;
}

@Entity({ tableName: 'coupon' })
class CouponByCode {
  @PrimaryKey()
  code!: string;
}

@Entity({ tableName: 'coupon' })
class Coupon {
  @PrimaryKey({ sequence: { startWith: 100 } })
  id!: number;

  @Property()
  code!: string;
}

async function bootstrap(entities: any[]) {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities,
    dbName: 'mikro_orm_test_sequence_options',
  });
  await orm.schema.refresh();
  return orm;
}

async function insertRows(orm: MikroORM) {
  const em = orm.em.fork();
  const tickets = [em.create(Ticket, { name: 't1' }), em.create(Ticket, { name: 't2' })];
  const invoices = [em.create(Invoice, { name: 'i1' }), em.create(Invoice, { name: 'i2' })];
  const purchases = [em.create(Purchase, {}), em.create(Purchase, {})];
  await em.flush();

  return {
    tickets: tickets.map(t => t.id),
    invoices: invoices.map(i => i.id),
    purchases: purchases.map(p => p.number),
  };
}

test('autoincrement columns start from the declared values and clear() resets them', async () => {
  const orm = await bootstrap([Ticket, Invoice, Purchase]);
  const expected = { tickets: [1000, 1005], invoices: [10, 12], purchases: [500, 501] };

  const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(sql).toContain('"id" int generated always as identity (start with 10 increment by 2) not null primary key');
  expect(sql).toContain(`pg_get_serial_sequence('"ticket"', 'id')`);
  expect(sql).toContain(`pg_get_serial_sequence('"purchase"', 'number')`);

  await expect(insertRows(orm)).resolves.toEqual(expected);
  await orm.schema.clear();
  await expect(insertRows(orm)).resolves.toEqual(expected);

  await orm.close(true);
});

test('the options are applied on create only and never diffed', async () => {
  const orm = await bootstrap([Ticket, Invoice, Purchase]);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  orm.discoverEntity(TicketChanged, Ticket);
  orm.discoverEntity(InvoiceChanged, Invoice);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  await orm.close(true);
});

test('clear() restarts at the declared start when the table was created with different options', async () => {
  const orm = await bootstrap([Ticket, Invoice]);

  orm.discoverEntity(TicketChanged, Ticket);
  orm.discoverEntity(InvoiceChanged, Invoice);
  await orm.schema.clear();
  const em = orm.em.fork();
  const ticket = em.create(TicketChanged, { name: 't' });
  const invoice = em.create(InvoiceChanged, { name: 'i' });
  await em.flush();
  expect([ticket.id, invoice.id]).toEqual([2000, 20]);

  await orm.close(true);
});

test('sequence options require an autoincrement property', async () => {
  @Entity()
  class Invalid {
    @PrimaryKey()
    id!: number;

    @Property({ sequence: { startWith: 10 } })
    counter!: number;
  }

  await expect(
    MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Invalid],
      dbName: 'mikro_orm_test_sequence_options',
    }),
  ).rejects.toThrow(`Invalid.counter defines the 'sequence' option, but is not an autoincrement property`);
});

test('the options apply to an autoincrement column added to an existing table', async () => {
  const orm = await bootstrap([PurchaseWithoutNumber]);
  await orm.em.fork().insertMany(PurchaseWithoutNumber, [{ id: 101 }, { id: 102 }]);

  orm.discoverEntity(Purchase, PurchaseWithoutNumber);
  await orm.schema.update();
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  const em = orm.em.fork();
  em.create(Purchase, {});
  await em.flush();
  const purchases = await orm.em.fork().find(Purchase, {}, { orderBy: { number: 1 } });
  // existing rows are numbered from the declared start too
  expect(purchases.map(p => p.number)).toEqual([500, 501, 502]);

  await orm.close(true);
});

test('the options apply when an existing column becomes autoincrement', async () => {
  const orm = await bootstrap([PurchaseWithPlainNumber]);
  await orm.em.fork().insertMany(PurchaseWithPlainNumber, [{ id: 101, number: 10 }]);

  orm.discoverEntity(Purchase, PurchaseWithPlainNumber);
  await orm.schema.update();
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  const em = orm.em.fork();
  const purchase = em.create(Purchase, {});
  await em.flush();
  expect(purchase.number).toBe(500);

  await orm.close(true);
});

test('the options apply when an existing column with higher values becomes autoincrement', async () => {
  const orm = await bootstrap([PurchaseWithPlainNumber]);
  await orm.em.fork().insertMany(PurchaseWithPlainNumber, [{ id: 101, number: 700 }]);

  orm.discoverEntity(Purchase, PurchaseWithPlainNumber);
  await orm.schema.update();

  const em = orm.em.fork();
  const purchase = em.create(Purchase, {});
  await em.flush();
  // existing values above the declared start are never reused
  expect(purchase.number).toBe(701);

  await orm.close(true);
});

test('sequence options conflict with identity options in generated', async () => {
  @Entity()
  class Invalid {
    @PrimaryKey({ generated: 'identity (start with 5)', sequence: { startWith: 10 } })
    id!: number;
  }

  await expect(
    MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Invalid],
      dbName: 'mikro_orm_test_sequence_options',
    }),
  ).rejects.toThrow(
    `Invalid.id defines the 'sequence' option together with identity options in 'generated', use only one of them`,
  );
});

test('the options apply to an autoincrement primary key added to an existing table', async () => {
  const orm = await bootstrap([CouponByCode]);
  await orm.em.fork().insertMany(CouponByCode, [{ code: 'a' }, { code: 'b' }]);

  orm.discoverEntity(Coupon, CouponByCode);
  await orm.schema.update();
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  const em = orm.em.fork();
  em.create(Coupon, { code: 'c' });
  await em.flush();
  const coupons = await orm.em.fork().find(Coupon, {}, { orderBy: { id: 1 } });
  expect(coupons.map(c => c.id)).toEqual([100, 101, 102]);

  await orm.close(true);
});
