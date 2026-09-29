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
