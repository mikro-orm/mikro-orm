import { defineEntity, MikroORM, p, Utils } from '@mikro-orm/sql';
import type { AbstractSqlDriver } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';
import { mockLogger } from '../../helpers.js';

const Customer = defineEntity({
  name: 'ReturningUpsertCustomer',
  properties: {
    id: p.integer().primary().autoincrement(),
    key: p.string().trim().unique().returning(),
    name: p.string().trim().returning(),
    code: p.string().trim().uppercase().nullable().returning(),
    revision: p.integer(),
  },
});

const DefaultCustomer = defineEntity({
  name: 'ReturningDefaultCustomer',
  properties: {
    id: p.integer().primary(),
    name: p.string().trim().returning(),
    code: p.string().uppercase().default('DEFAULT').returning(),
  },
});

const options = {
  postgresql: { dbName: 'mikro_orm_test_returning_upserts' },
  sqlite: { dbName: ':memory:' },
  mssql: { dbName: 'mikro_orm_test_returning_upserts', password: 'Root.Root' },
};

describe.each(Utils.keys(options))('returning properties on upsert [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;
  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Customer, DefaultCustomer],
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refresh();
  });
  beforeEach(() => orm.schema.clear());
  afterAll(() => orm.close(true));

  test.each([false, true])('hydrates insert and conflict update (many=%s)', async many => {
    for (const revision of [1, 2]) {
      const em = orm.em.fork();
      const data = { key: 'one', name: ` Customer ${revision} `, code: ' eur ', revision };
      const mock = mockLogger(orm);
      const customer = many ? (await em.upsertMany(Customer, [data]))[0] : await em.upsert(Customer, data);
      expect(customer).toMatchObject({ name: `Customer ${revision}`, code: 'EUR', revision });
      expect(mock.mock.calls.some(([query]) => /(insert|merge) into\b/.test(query as string))).toBe(true);
      expect(mock.mock.calls.filter(([query]) => /\bselect\b/.test(query as string))).toEqual([]);
      mock.mockClear();
      await em.flush();
      expect(mock).not.toHaveBeenCalled();
      expect(await em.fork().findOneOrFail(Customer, customer.id)).toMatchObject({
        name: customer.name,
        code: 'EUR',
        revision,
      });
    }
  });

  test.each(['merge', 'exclude', 'ignore'] as const)('preserves conflict %s fields', async mode => {
    await orm.em.fork().insert(Customer, { key: 'one', name: 'Initial', code: 'OLD', revision: 1 });
    const em = orm.em.fork();
    const conflict =
      mode === 'merge'
        ? { onConflictMergeFields: ['name' as const] }
        : mode === 'exclude'
          ? { onConflictExcludeFields: ['code' as const, 'revision' as const] }
          : { onConflictAction: 'ignore' as const };
    const customer = await em.upsert(
      Customer,
      { key: 'one', name: ' Customer ', code: ' eur ', revision: 2 },
      conflict,
    );
    expect(customer).toMatchObject({ name: mode === 'ignore' ? 'Initial' : 'Customer', code: 'OLD', revision: 1 });
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
    expect(await em.fork().findOneOrFail(Customer, customer.id)).toMatchObject({
      name: customer.name,
      code: 'OLD',
      revision: 1,
    });
  });

  test('maps mixed inserted and updated rows, including suppressed conflicts', async () => {
    const em = orm.em.fork();
    await em.insertMany(Customer, [
      { key: 'one', name: 'First', code: 'OLD', revision: 3 },
      { key: 'two', name: 'Second', code: 'OLD', revision: 1 },
    ]);
    const customers = await em.upsertMany(
      Customer,
      [
        { key: 'one', name: ' Ignored ', code: ' eur ', revision: 2 },
        { key: 'three', name: ' Third ', code: ' usd ', revision: 2 },
        { key: 'two', name: ' Updated ', code: ' gbp ', revision: 2 },
      ],
      { onConflictFields: ['key'], onConflictWhere: { revision: { $lt: 2 } } },
    );
    expect(customers).toMatchObject([
      { key: 'one', name: 'First', code: 'OLD', revision: 3 },
      { key: 'three', name: 'Third', code: 'USD', revision: 2 },
      { key: 'two', name: 'Updated', code: 'GBP', revision: 2 },
    ]);
    expect(new Set(customers.map(c => c.id)).size).toBe(3);
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
    for (const customer of customers) {
      expect(await em.fork().findOneOrFail(Customer, customer.id)).toMatchObject({
        key: customer.key,
        name: customer.name,
        code: customer.code,
      });
    }
  });

  test.each([false, true])('returns marked columns from heterogeneous inputs (conflict=%s)', async conflict => {
    const em = orm.em.fork();
    await em.insert(Customer, { key: 'one', name: 'First', code: 'OLD', revision: 1 });
    if (conflict) {
      await em.insert(Customer, { key: 'two', name: 'Second', code: 'OLD', revision: 1 });
    }
    const customers = await em.upsertMany(Customer, [
      { key: 'one', name: ' Updated ', revision: 2 },
      { key: 'two', name: ' Second ', code: ' eur ', revision: 2 },
    ]);
    expect(customers).toMatchObject([
      { key: 'one', name: 'Updated', code: 'OLD' },
      { key: 'two', name: 'Second', code: 'EUR' },
    ]);
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
    for (const customer of customers) {
      expect(await em.fork().findOneOrFail(Customer, customer.id)).toMatchObject({
        key: customer.key,
        name: customer.name,
        code: customer.code,
      });
    }
  });

  test('preserves database defaults omitted from heterogeneous inputs', async () => {
    const em = orm.em.fork();
    const customers = await em.upsertMany(DefaultCustomer, [
      { id: 1, name: ' First ' },
      { id: 2, name: ' Second ', code: 'eur' },
    ]);
    expect(customers).toMatchObject([
      { id: 1, name: 'First', code: 'DEFAULT' },
      { id: 2, name: 'Second', code: 'EUR' },
    ]);
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  });

  test.each(['merge', 'exclude', 'ignore'] as const)('preserves batch conflict %s fields', async mode => {
    await orm.em.fork().insert(Customer, { key: 'one', name: 'Initial', code: 'OLD', revision: 1 });
    const em = orm.em.fork();
    const conflict =
      mode === 'merge'
        ? { onConflictMergeFields: ['name' as const] }
        : mode === 'exclude'
          ? { onConflictExcludeFields: ['code' as const, 'revision' as const] }
          : { onConflictAction: 'ignore' as const };
    const customers = await em.upsertMany(
      Customer,
      [
        { key: 'one', name: ' Customer ', code: ' eur ', revision: 2 },
        { key: 'two', name: ' Second ', code: ' usd ', revision: 2 },
      ],
      conflict,
    );
    expect(customers).toMatchObject([
      { key: 'one', name: mode === 'ignore' ? 'Initial' : 'Customer', code: 'OLD', revision: 1 },
      { key: 'two', name: 'Second', code: 'USD', revision: 2 },
    ]);
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  });

  test('returns a normalized conflict key and reloads a suppressed single upsert', async () => {
    const first = await orm.em.fork().upsert(Customer, { key: ' one ', name: ' First ', revision: 3 });
    expect(first.key).toBe('one');
    const em = orm.em.fork();
    const customer = await em.upsert(
      Customer,
      { key: 'one', name: ' Ignored ', revision: 2 },
      {
        onConflictWhere: { revision: { $lt: 2 } },
      },
    );
    expect(customer).toMatchObject({ id: first.id, key: 'one', name: 'First', revision: 3 });
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  });
});
