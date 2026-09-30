import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';

class Ticket {
  id!: number;
  name!: string;
}

const schema = (startWith: number, nullableName = false) =>
  new EntitySchema({
    class: Ticket,
    tableName: 'ticket',
    properties: {
      id: { type: 'number', primary: true, sequence: { startWith } },
      name: { type: 'string', nullable: nullableName },
    },
  });

async function insertRows(orm: MikroORM) {
  const em = orm.em.fork();
  const tickets = [em.create(Ticket, { name: 't1' }), em.create(Ticket, { name: 't2' })];
  await em.flush();
  return tickets.map(t => t.id);
}

test('autoincrement columns start from the declared value and clear() resets it', async () => {
  const orm = await MikroORM.init({ entities: [schema(1000)], dbName: ':memory:' });
  await orm.schema.create();

  const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(sql).toContain(
    "insert into `sqlite_sequence` (name, seq) select 'ticket', 999 where not exists (select 1 from `sqlite_sequence` where name = 'ticket');",
  );

  await expect(insertRows(orm)).resolves.toEqual([1000, 1001]);
  await orm.schema.clear();
  await expect(insertRows(orm)).resolves.toEqual([1000, 1001]);

  await orm.close(true);
});

test('the options are applied on create only and never diffed', async () => {
  const orm = await MikroORM.init({ entities: [schema(1000)], dbName: ':memory:' });
  await orm.schema.create();
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  orm.discoverEntity(schema(2000), Ticket);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  await orm.close(true);
});

test('clear() applies startWith to a table created without the option', async () => {
  const plain = new EntitySchema({
    class: Ticket,
    tableName: 'ticket',
    properties: { id: { type: 'number', primary: true }, name: { type: 'string' } },
  });
  const orm = await MikroORM.init({ entities: [plain], dbName: ':memory:' });
  await orm.schema.create();

  orm.discoverEntity(schema(1000), Ticket);
  await orm.schema.clear();
  await expect(insertRows(orm)).resolves.toEqual([1000, 1001]);

  await orm.close(true);
});

test('incrementBy is not supported', async () => {
  const invalid = new EntitySchema({
    name: 'Invalid',
    properties: {
      id: { type: 'number', primary: true, sequence: { startWith: 10, incrementBy: 2 } },
    },
  });

  await expect(MikroORM.init({ entities: [invalid], dbName: ':memory:' })).rejects.toThrow(
    `Invalid.id defines 'sequence.incrementBy', but SqlitePlatform does not support a per-column increment`,
  );
});

test('a table rebuild keeps the current counter', async () => {
  const orm = await MikroORM.init({ entities: [schema(1000)], dbName: ':memory:' });
  await orm.schema.create();
  await expect(insertRows(orm)).resolves.toEqual([1000, 1001]);

  orm.discoverEntity(schema(1000, true), Ticket);
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain('ticket__temp_alter');
  await orm.schema.execute(diff);

  await expect(insertRows(orm)).resolves.toEqual([1002, 1003]);
  await expect(
    orm.em.getConnection().execute(`select seq from sqlite_sequence where name = 'ticket'`),
  ).resolves.toEqual([{ seq: 1003 }]);

  await orm.close(true);
});
