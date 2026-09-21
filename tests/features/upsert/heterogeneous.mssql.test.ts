import { defineEntity, MikroORM, p } from '@mikro-orm/mssql';

const Customer = defineEntity({
  name: 'HeterogeneousCustomer',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    code: p.string().nullable(),
  },
});

const DefaultCustomer = defineEntity({
  name: 'HeterogeneousDefaultCustomer',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    code: p.string().default('DEFAULT'),
    note: p.string().nullable().default('Default note'),
    active: p.boolean().default(true),
  },
});

const TriggerCustomer = defineEntity({
  name: 'HeterogeneousTriggerCustomer',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string(),
    code: p.string().default('DEFAULT'),
    createdAt: p.datetime().defaultRaw('current_timestamp'),
  },
  triggers: [
    { name: 'heterogeneous_customer_audit', timing: 'after', events: ['insert', 'update'], body: 'SET NOCOUNT ON' },
  ],
});

let orm: MikroORM;
beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Customer, DefaultCustomer, TriggerCustomer],
    dbName: 'mikro_orm_test_heterogeneous_upsert',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
});
beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

test('inserts columns supplied only by a later row', async () => {
  await orm.em.fork().upsertMany(Customer, [
    { id: 1, name: 'First' },
    { id: 2, name: 'Second', code: 'EUR' },
  ]);
  expect(await orm.em.fork().find(Customer, {}, { orderBy: { id: 'asc' } })).toMatchObject([
    { id: 1, name: 'First', code: null },
    { id: 2, name: 'Second', code: 'EUR' },
  ]);
});

test('keeps excluded conflict fields while inserting a later row', async () => {
  await orm.em.fork().insert(Customer, { id: 1, name: 'First', code: 'OLD' });
  await orm.em.fork().upsertMany(
    Customer,
    [
      { id: 1, name: 'Updated' },
      { id: 2, name: 'Second', code: 'EUR' },
    ],
    { onConflictMergeFields: ['name'] },
  );
  expect(await orm.em.fork().find(Customer, {}, { orderBy: { id: 'asc' } })).toMatchObject([
    { id: 1, name: 'Updated', code: 'OLD' },
    { id: 2, name: 'Second', code: 'EUR' },
  ]);
});

test('preserves defaults for missing fields and keeps explicit null values', async () => {
  await orm.em.fork().upsertMany(DefaultCustomer, [
    { id: 1, name: 'First' },
    { id: 2, name: 'Second', code: 'EUR', note: null, active: false },
  ]);
  expect(await orm.em.fork().find(DefaultCustomer, {}, { orderBy: { id: 'asc' } })).toMatchObject([
    { id: 1, name: 'First', code: 'DEFAULT', note: 'Default note', active: true },
    { id: 2, name: 'Second', code: 'EUR', note: null, active: false },
  ]);
});

test('QueryBuilder applies defaults without mutating heterogeneous inputs', async () => {
  const input = [
    { id: 1, name: 'First' },
    { id: 2, name: 'Second', code: 'EUR' },
  ];
  const snapshot = structuredClone(input);
  await orm.em.fork().createQueryBuilder(DefaultCustomer).insert(input).onConflict('id').merge(['name']).execute();
  expect(input).toEqual(snapshot);
  expect(await orm.em.fork().find(DefaultCustomer, {}, { orderBy: { id: 'asc' } })).toMatchObject([
    { id: 1, code: 'DEFAULT' },
    { id: 2, code: 'EUR' },
  ]);
});

test('inlined defaults keep OUTPUT INTO aligned on tables with triggers and supplied identity', async () => {
  const rows = await orm.em.fork().upsertMany(TriggerCustomer, [
    { id: 1, name: 'First' },
    { id: 2, name: 'Second', code: 'EUR', createdAt: new Date(0) },
  ]);
  expect(rows).toMatchObject([
    { id: 1, name: 'First', code: 'DEFAULT' },
    { id: 2, name: 'Second', code: 'EUR', createdAt: new Date(0) },
  ]);
  const result = await orm.em
    .fork()
    .createQueryBuilder(TriggerCustomer)
    .insert([
      { id: 1, name: 'Updated' },
      { id: 3, name: 'Third', code: 'USD' },
    ])
    .onConflict('id')
    .merge(['name'])
    .returning(['id', 'name', 'code', 'createdAt'])
    .execute('run');
  expect(result.rows).toHaveLength(2);
  const found = await orm.em.fork().find(TriggerCustomer, {}, { orderBy: { id: 'asc' } });
  expect(found).toMatchObject([
    { id: 1, name: 'Updated', code: 'DEFAULT' },
    { id: 2, name: 'Second', code: 'EUR' },
    { id: 3, name: 'Third', code: 'USD' },
  ]);
  expect(found[0].createdAt.getTime()).toBeGreaterThan(1e12);
  expect(found[2].createdAt.getTime()).toBeGreaterThan(1e12);
});
