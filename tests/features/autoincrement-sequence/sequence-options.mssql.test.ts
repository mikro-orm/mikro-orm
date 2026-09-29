import { MikroORM, Opt } from '@mikro-orm/mssql';
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

@Entity({ tableName: 'big_ticket' })
class BigTicket {
  @PrimaryKey({ type: 'bigint', sequence: { startWith: 5_000_000_000 } })
  id!: string;

  @Property()
  name!: string;
}

@Entity()
class Purchase {
  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property({ type: 'integer', autoincrement: true, sequence: { startWith: 500 } })
  number!: number & Opt;
}

@Entity({ inheritance: 'tpt' })
abstract class Vehicle {
  @PrimaryKey({ type: 'integer', sequence: { startWith: 100 } })
  id!: number;

  @Property({ type: 'string' })
  name!: string;
}

@Entity()
class Car extends Vehicle {
  @Property({ type: 'integer' })
  doors!: number;
}

async function bootstrap(entities: any[]) {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities,
    dbName: 'mikro_orm_test_sequence_options',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
  return orm;
}

async function insertRows(orm: MikroORM) {
  const em = orm.em.fork();
  const tickets = [em.create(Ticket, { name: 't1' }), em.create(Ticket, { name: 't2' })];
  await em.flush();
  return tickets.map(t => t.id);
}

test('autoincrement columns start from the declared values and clear() resets them', async () => {
  const orm = await bootstrap([Ticket]);

  const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(sql).toContain('[id] int identity(1000,5) not null constraint [ticket_pkey] primary key');

  await expect(insertRows(orm)).resolves.toEqual([1000, 1005]);
  await orm.schema.clear();
  await expect(insertRows(orm)).resolves.toEqual([1000, 1005]);

  // an identity that was already used must still restart at the declared start after repeated clears
  await orm.schema.clear();
  await orm.schema.clear();
  await expect(insertRows(orm)).resolves.toEqual([1000, 1005]);

  await orm.close(true);
});

test('the options are applied on create only and never diffed', async () => {
  const orm = await bootstrap([Ticket]);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  orm.discoverEntity(TicketChanged, Ticket);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  await orm.close(true);
});

test('clear() restarts at the declared start when the table was created with a different increment', async () => {
  const orm = await bootstrap([Ticket]);
  await insertRows(orm);

  orm.discoverEntity(TicketChanged, Ticket);
  await orm.schema.clear();
  const em = orm.em.fork();
  const ticket = em.create(TicketChanged, { name: 't' });
  await em.flush();
  expect(ticket.id).toBe(2000);

  await orm.close(true);
});

test('clear() resets a bigint identity beyond the int range', async () => {
  const orm = await bootstrap([BigTicket]);
  const insert = async () => {
    const em = orm.em.fork();
    const ticket = em.create(BigTicket, { name: 't' });
    await em.flush();
    return ticket.id;
  };

  await expect(insert()).resolves.toBe('5000000000');
  await orm.schema.clear();
  await expect(insert()).resolves.toBe('5000000000');

  await orm.close(true);
});

test('clear() resets a non-PK autoincrement column', async () => {
  const orm = await bootstrap([Purchase]);
  const insert = async () => {
    const em = orm.em.fork();
    const purchases = [em.create(Purchase, { id: 1 }), em.create(Purchase, { id: 2 })];
    await em.flush();
    return purchases.map(p => p.number);
  };

  await expect(insert()).resolves.toEqual([500, 501]);
  await orm.schema.clear();
  await expect(insert()).resolves.toEqual([500, 501]);

  await orm.close(true);
});

test('clear() reseeds only the root table of a TPT hierarchy', async () => {
  const orm = await bootstrap([Vehicle, Car]);
  const insert = async () => {
    const em = orm.em.fork();
    const car = em.create(Car, { name: 'car', doors: 4 });
    await em.flush();
    return car.id;
  };

  await expect(insert()).resolves.toBe(100);
  await orm.schema.clear();
  await expect(insert()).resolves.toBe(100);

  await orm.close(true);
});
