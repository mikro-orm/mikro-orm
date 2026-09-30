import { MikroORM, Opt } from '@mikro-orm/mariadb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'ticket' })
class Ticket {
  @PrimaryKey({ sequence: { startWith: 1000 } })
  id!: number;

  @Property()
  name!: string;
}

@Entity({ tableName: 'ticket' })
class TicketChanged {
  @PrimaryKey({ sequence: { startWith: 2000 } })
  id!: number;

  @Property()
  name!: string;
}

@Entity({ tableName: 'purchase' })
class PurchaseByCode {
  @PrimaryKey()
  code!: string;
}

@Entity({ tableName: 'purchase' })
class Purchase {
  @PrimaryKey({ autoincrement: false })
  code!: string;

  @Property({ type: 'integer', autoincrement: true, sequence: { startWith: 500 } })
  number!: number & Opt;
}

async function bootstrap(entities: any[]) {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities,
    dbName: 'mikro_orm_test_sequence_options_mariadb',
    port: 3309,
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

test('autoincrement columns start from the declared value and clear() resets it', async () => {
  const orm = await bootstrap([Ticket]);

  const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(sql).toContain('engine = InnoDB auto_increment = 1000;');

  await expect(insertRows(orm)).resolves.toEqual([1000, 1001]);
  await orm.schema.clear();
  await expect(insertRows(orm)).resolves.toEqual([1000, 1001]);

  await orm.close(true);
});

test('the options are applied on create only and never diffed', async () => {
  const orm = await bootstrap([Ticket]);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  orm.discoverEntity(TicketChanged, Ticket);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  await orm.close(true);
});

test('incrementBy is not supported', async () => {
  @Entity()
  class Invalid {
    @PrimaryKey({ sequence: { startWith: 10, incrementBy: 2 } })
    id!: number;
  }

  await expect(
    MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Invalid],
      dbName: 'mikro_orm_test_sequence_options_mariadb',
      port: 3309,
    }),
  ).rejects.toThrow(
    `Invalid.id defines 'sequence.incrementBy', but MariaDbPlatform does not support a per-column increment`,
  );
});

test('the options apply to an autoincrement column added to an existing table', async () => {
  const orm = await bootstrap([PurchaseByCode]);
  await orm.em.fork().insertMany(PurchaseByCode, [{ code: 'a' }, { code: 'b' }]);

  orm.discoverEntity(Purchase, PurchaseByCode);
  await orm.schema.update();

  const em = orm.em.fork();
  em.create(Purchase, { code: 'c' });
  await em.flush();
  const purchases = await orm.em.fork().find(Purchase, {}, { orderBy: { number: 1 } });
  expect(purchases.map(p => p.number)).toEqual([500, 501, 502]);

  await orm.close(true);
});
