import { defineEntity, MikroORM, p, Utils } from '@mikro-orm/sql';
import type { AbstractSqlDriver } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';
import { mockLogger } from '../../helpers.js';

const Customer = defineEntity({
  name: 'PartialUpsertCustomer',
  properties: {
    id: p.integer().primary().autoincrement(),
    key: p.string().unique(),
    name: p.string(),
    revision: p.integer(),
  },
});

const options = {
  postgresql: { dbName: 'mikro_orm_test_partial_upsert' },
  sqlite: { dbName: ':memory:' },
  mssql: { dbName: 'mikro_orm_test_partial_upsert', password: 'Root.Root' },
};

describe.each(Utils.keys(options))('partial upsert results [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;
  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Customer],
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refresh();
  });
  beforeEach(() => orm.schema.clear());
  afterAll(() => orm.close(true));

  test('matches mixed inserted, updated and suppressed rows to their entities', async () => {
    const em = orm.em.fork();
    await em.insertMany(Customer, [
      { key: 'one', name: 'First', revision: 3 },
      { key: 'two', name: 'Second', revision: 1 },
    ]);
    const customers = await em.upsertMany(
      Customer,
      [
        { key: 'one', name: 'Ignored', revision: 2 },
        { key: 'three', name: 'Third', revision: 2 },
        { key: 'two', name: 'Updated', revision: 2 },
      ],
      { onConflictFields: ['key'], onConflictWhere: { revision: { $lt: 2 } } },
    );
    expect(customers).toMatchObject([
      { key: 'one', name: 'First', revision: 3 },
      { key: 'three', name: 'Third', revision: 2 },
      { key: 'two', name: 'Updated', revision: 2 },
    ]);
    expect(new Set(customers.map(customer => customer.id)).size).toBe(3);
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
    for (const customer of customers) {
      expect(await em.fork().findOneOrFail(Customer, customer.id)).toMatchObject({
        key: customer.key,
        name: customer.name,
        revision: customer.revision,
      });
    }
  });

  test.each([false, true])('reloads a suppressed conflict with a supplied primary key (many=%s)', async many => {
    const data = { id: 10, key: 'one', name: 'First', revision: 3 };
    await orm.em.fork().insert(Customer, data);
    const em = orm.em.fork();
    const input = { ...data, name: 'Ignored', revision: 2 };
    const conflict = { onConflictWhere: { revision: { $lt: 2 } } };
    const customer = many
      ? (await em.upsertMany(Customer, [input], conflict))[0]
      : await em.upsert(Customer, input, conflict);
    expect(customer).toMatchObject(data);
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
    expect(await em.fork().findOneOrFail(Customer, data.id)).toMatchObject(data);
  });
});
