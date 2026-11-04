import { defineEntity, MikroORM, p } from '@mikro-orm/libsql';

const Ticket = defineEntity({
  name: 'Ticket',
  properties: {
    id: p.integer().primary().sequence({ startWith: 1000 }),
    name: p.string(),
  },
});

test('autoincrement columns start from the declared value and clear() resets it', async () => {
  const orm = await MikroORM.init({ entities: [Ticket], dbName: ':memory:' });
  await orm.schema.create();

  const insertRows = async () => {
    const em = orm.em.fork();
    const tickets = [em.create(Ticket, { name: 't1' }), em.create(Ticket, { name: 't2' })];
    await em.flush();
    return tickets.map(t => t.id);
  };

  await expect(insertRows()).resolves.toEqual([1000, 1001]);
  await orm.schema.clear();
  await expect(insertRows()).resolves.toEqual([1000, 1001]);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  await orm.close(true);
});
