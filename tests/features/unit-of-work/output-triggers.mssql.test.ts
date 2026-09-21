import { defineEntity, MikroORM, p } from '@mikro-orm/mssql';
import { mockLogger } from '../../helpers.js';

const Customer = defineEntity({
  name: 'OutputTriggerCustomer',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string().nullable().returning(),
  },
  // OUTPUT sees the values before AFTER triggers; this trigger only exercises OUTPUT INTO.
  triggers: [{ name: 'output_customer_audit', timing: 'after', events: ['insert', 'update'], body: 'SET NOCOUNT ON' }],
});

const Person = defineEntity({
  name: 'OutputTriggerPerson',
  discriminatorColumn: 'type',
  properties: {
    id: p.integer().primary().autoincrement(),
    type: p.string(),
  },
  triggers: [{ name: 'output_person_audit', timing: 'after', events: ['insert'], body: 'SET NOCOUNT ON' }],
});
const Employee = defineEntity({
  name: 'OutputTriggerEmployee',
  extends: Person,
  discriminatorValue: 'employee',
  properties: { name: p.string().nullable() },
});
const Manager = defineEntity({
  name: 'OutputTriggerManager',
  extends: Person,
  discriminatorValue: 'manager',
  properties: { promotedAt: p.datetime().nullable().defaultRaw('current_timestamp') },
});

let orm: MikroORM;
beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Customer, Person, Employee, Manager],
    dbName: 'mikro_orm_test_output_triggers',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
});
beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

test.each([1, 2])('native inserts return only data rows and the affected count (%s rows)', async count => {
  const result = await orm.em.getDriver().nativeInsertMany(
    Customer,
    Array.from({ length: count }, (_, i) => ({ name: `Customer ${i}` })),
  );
  expect(result.affectedRows).toBe(count);
  expect(result.rows).toHaveLength(count);
  result.rows!.forEach((row, i) => expect(row).toEqual({ id: expect.any(Number), name: `Customer ${i}` }));
});

test('supplied identity and DEFAULT VALUES keep OUTPUT INTO columns aligned', async () => {
  const em = orm.em.fork();
  const supplied = em.create(Customer, { id: 10, name: 'Supplied' });
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
    .update({ name: 'Updated' })
    .returning('name')
    .where({ id: result.row!.id })
    .execute('run');
  expect(updated.row).toEqual({ name: 'Updated' });
  expect(updated.affectedRows).toBe(1);
  const missing = await orm.em
    .createQueryBuilder(Customer)
    .update({ name: 'Missing' })
    .returning('name')
    .where({ id: -1 })
    .execute('run');
  expect(missing.affectedRows).toBe(0);
  expect(missing.rows).toEqual([]);
  expect(missing.row).toBeUndefined();
  const rows = await orm.em
    .createQueryBuilder(Customer)
    .update({ name: 'Again' })
    .returning('name')
    .where({ id: result.row!.id })
    .execute('all');
  expect(rows).toEqual([{ name: 'Again' }]);
});

test.each([false, true])('upsert returns trigger table values (many=%s)', async many => {
  for (const name of ['First', 'Updated']) {
    const em = orm.em.fork();
    const data = { id: 10, name };
    const customer = many ? (await em.upsertMany(Customer, [data]))[0] : await em.upsert(Customer, data);
    expect(customer).toMatchObject({ id: 10, name });
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  }
});

test('empty native inserts on trigger tables return all generated identities', async () => {
  const result = await orm.em.getDriver().nativeInsertMany(Customer, [{}, {}]);
  expect(result.affectedRows).toBe(2);
  expect(result.rows).toEqual([
    { id: expect.any(Number), name: null },
    { id: expect.any(Number), name: null },
  ]);
  expect(result.rows![0].id).not.toBe(result.rows![1].id);
});

test('get does not expose the count row for a non-matching update', async () => {
  const row = await orm.em
    .createQueryBuilder(Customer)
    .update({ name: 'Missing' })
    .where({ id: -1 })
    .returning('name')
    .execute('get');
  expect(row).toBeNull();
});

test('STI child inserts keep OUTPUT INTO columns aligned with sibling defaults', async () => {
  const em = orm.em.fork();
  const employee = em.create(Employee, { type: 'employee', name: 'Employee' });
  await em.flush();
  expect(employee.id).toEqual(expect.any(Number));
});
