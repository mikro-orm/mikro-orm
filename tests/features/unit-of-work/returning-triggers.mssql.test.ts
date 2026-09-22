import { defineEntity, MikroORM, p } from '@mikro-orm/mssql';
import { mockLogger } from '../../helpers.js';

const Customer = defineEntity({
  name: 'ReturningTriggerCustomer',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string().trim().nullable().returning(),
  },
  // OUTPUT sees the values before AFTER triggers; this trigger only exercises OUTPUT INTO.
  triggers: [
    { name: 'returning_customer_audit', timing: 'after', events: ['insert', 'update'], body: 'SET NOCOUNT ON' },
  ],
});

let orm: MikroORM;
beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Customer],
    dbName: 'mikro_orm_test_returning_triggers',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
});
beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

test.each([1, 2])('flush INSERT/UPDATE on a table with triggers (%s entities)', async count => {
  const em = orm.em.fork();
  const customers = Array.from({ length: count }, (_, i) => em.create(Customer, { name: ` Initial ${i} ` }));
  await em.flush();
  customers.forEach((customer, i) => {
    expect(customer.name).toBe(`Initial ${i}`);
    customer.name = ` Updated ${i} `;
  });
  await em.flush();
  customers.forEach((customer, i) => expect(customer.name).toBe(`Updated ${i}`));
  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('supplied identity and DEFAULT VALUES keep OUTPUT INTO columns aligned', async () => {
  const em = orm.em.fork();
  const supplied = em.create(Customer, { id: 10, name: ' Supplied ' });
  await em.flush();
  expect(supplied.name).toBe('Supplied');
  const empty = em.create(Customer, {});
  await em.flush();
  expect(empty.id).toBeGreaterThan(10);
  expect(empty.name).toBeNull();
});

test('QueryBuilder handles updates and empty inserts on tables with triggers', async () => {
  const result = await orm.em.createQueryBuilder(Customer).insert({}).execute('run');
  expect(result.row).toMatchObject({ id: expect.any(Number), name: null });
  expect(result.affectedRows).toBe(1);
  const updated = await orm.em
    .createQueryBuilder(Customer)
    .update({ name: ' Updated ' })
    .where({ id: result.row!.id })
    .execute('run');
  expect(updated.row).toEqual({ name: 'Updated' });
  expect(updated.affectedRows).toBe(1);
  const missing = await orm.em
    .createQueryBuilder(Customer)
    .update({ name: ' Missing ' })
    .where({ id: -1 })
    .execute('run');
  expect(missing.affectedRows).toBe(0);
  expect(missing.rows).toEqual([]);
  const rows = await orm.em
    .createQueryBuilder(Customer)
    .update({ name: ' Again ' })
    .where({ id: result.row!.id })
    .execute('all');
  expect(rows).toEqual([{ name: 'Again' }]);
});

test.each([false, true])('upsert returns trigger table values (many=%s)', async many => {
  for (const name of [' First ', ' Updated ']) {
    const em = orm.em.fork();
    const data = { id: 10, name };
    const customer = many ? (await em.upsertMany(Customer, [data]))[0] : await em.upsert(Customer, data);
    expect(customer).toMatchObject({ id: 10, name: name.trim() });
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  }
});
