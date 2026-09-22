import { defineEntity, MikroORM, p, raw, Utils } from '@mikro-orm/sql';
import type { AbstractSqlDriver } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';
import { mockLogger } from '../../helpers.js';

const Customer = defineEntity({
  name: 'ReturningUpdateCustomer',
  properties: {
    id: p.integer().primary(),
    name: p.string().trim().returning(),
    code: p.string().trim().uppercase().fieldName('normalized_code').returning(),
    email: p.string().trim().lowercase().returning(),
    optional: p.string().trim().nullable().returning(),
    unreturned: p.string().trim(),
    disabled: p.string().trim().returning(false),
    counter: p.integer().default(0),
  },
});

const options = {
  postgresql: { dbName: 'mikro_orm_test_returning_updates' },
  sqlite: { dbName: ':memory:' },
  mssql: { dbName: 'mikro_orm_test_returning_updates', password: 'Root.Root' },
};

const initial = { name: 'Initial', code: 'OLD', email: 'old@example.com', unreturned: 'Initial', disabled: 'Initial' };
const input = {
  name: ' Customer ',
  code: ' eur ',
  email: ' NEW@EXAMPLE.COM ',
  unreturned: ' Other ',
  disabled: ' Other ',
};
const expected = { name: 'Customer', code: 'EUR', email: 'new@example.com', optional: null };

describe.each(Utils.keys(options))('returning properties on update [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({ entities: [Customer], driver: PLATFORMS[type], ...options[type] });
    await orm.schema.refresh();
  });
  beforeEach(async () => {
    orm.config.set('useBatchUpdates', true);
    orm.config.set('batchSize', 2);
    await orm.schema.clear();
  });
  afterAll(() => orm.close(true));

  test.each([
    { count: 1, batch: true },
    { count: 1, batch: false },
    { count: 5, batch: true },
    { count: 3, batch: false },
  ])('hydrates updates and snapshots ($count entities, batching=$batch)', async ({ count, batch }) => {
    const em = orm.em.fork();
    // Reverse the PK order so returning rows cannot be mapped by array position.
    const customers = Array.from({ length: count }, (_, i) => em.create(Customer, { id: count - i, ...initial }));
    await em.flush();
    orm.config.set('useBatchUpdates', batch);
    customers.forEach((customer, i) => Object.assign(customer, input, { name: ` Customer ${i} ` }));
    const mock = mockLogger(orm);

    await em.flush();

    const queries = mock.mock.calls.map(([query]) => query as string);
    const updates = queries.filter(query => query.includes('update '));
    expect(updates).toHaveLength(batch ? Math.ceil(count / 2) : count);
    for (const query of updates) {
      expect(query).toContain(type === 'mssql' ? 'output inserted.' : ' returning ');
      expect(query).toContain('normalized_code');
      expect(query).toContain('optional');
    }
    expect(queries.filter(query => /\bselect\b/i.test(query) && !query.includes('@@rowcount'))).toEqual([]);
    for (const [i, customer] of customers.entries()) {
      expect(customer).toMatchObject({
        ...expected,
        name: `Customer ${i}`,
        unreturned: input.unreturned,
        disabled: input.disabled,
      });
    }

    mock.mockClear();
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
    for (const [i, customer] of customers.entries()) {
      expect(await em.fork().findOneOrFail(Customer, customer.id)).toMatchObject({
        ...expected,
        name: `Customer ${i}`,
        unreturned: 'Other',
        disabled: 'Other',
      });
    }
  });

  test.each(['automatic', 'id', 'star', 'empty'] as const)('QueryBuilder returning: %s', async returning => {
    const em = orm.em.fork();
    const customer = em.create(Customer, { id: 1, ...initial });
    await em.flush();
    const qb = em.createQueryBuilder(Customer).update(input).where({ id: 1 });
    if (returning === 'id') {
      qb.returning(['id']);
    }
    if (returning === 'star') {
      qb.returning('*');
    }
    if (returning === 'empty') {
      qb.returning([]);
    }
    const result = await qb.execute('run');
    if (returning === 'id') {
      expect(result.row).toEqual({ id: 1 });
    } else {
      expect(result.row).toMatchObject({
        name: 'Customer',
        normalized_code: 'EUR',
        email: 'new@example.com',
        optional: null,
      });
      if (returning !== 'star') {
        expect(result.row).not.toHaveProperty('unreturned');
        expect(result.row).not.toHaveProperty('disabled');
      }
    }
    expect(customer.name).toBe('Initial');
    expect(result.affectedRows).toBe(1);
  });

  test('native update returns values without synchronizing the identity map', async () => {
    const em = orm.em.fork();
    const customer = em.create(Customer, { id: 1, ...initial });
    await em.flush();
    const result = await orm.driver.nativeUpdate(Customer, { id: 1 }, input);
    expect(result.row).toMatchObject({ name: 'Customer', normalized_code: 'EUR', email: 'new@example.com' });
    expect(customer.name).toBe('Initial');
    expect(await em.nativeUpdate(Customer, { id: 1 }, { name: ' Again ' })).toBe(1);
    expect(customer.name).toBe('Initial');
    const missing = await orm.driver.nativeUpdate(Customer, { id: 999 }, input);
    expect(missing.affectedRows).toBe(0);
    expect(missing.rows ?? []).toEqual([]);
    expect(await em.nativeUpdate(Customer, { id: 1 }, {})).toBe(0);
  });

  test('returns raw expressions together with supplied and omitted returning properties', async () => {
    const em = orm.em.fork();
    const customer = em.create(Customer, { id: 1, ...initial, optional: 'Kept' });
    await em.flush();
    customer.name = input.name;
    customer.counter = raw('counter + 1');
    await em.flush();
    expect(customer).toMatchObject({ name: 'Customer', optional: 'Kept', counter: 1 });
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  });

  test('preserves null, empty strings and normalization-only no-ops', async () => {
    const em = orm.em.fork();
    const customer = em.create(Customer, { id: 1, ...initial, optional: 'Kept' });
    await em.flush();
    Object.assign(customer, { name: '   ', optional: null });
    await em.flush();
    expect(customer.name).toBe('');
    expect(customer.optional).toBeNull();
    customer.name = '  ';
    const mock = mockLogger(orm);
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
    expect(customer.name).toBe('  ');
  });

  test('rolls back updates when the transaction fails', async () => {
    const em = orm.em.fork();
    em.create(Customer, { id: 1, ...initial });
    await em.flush();
    await expect(
      em.transactional(async tx => {
        const customer = await tx.findOneOrFail(Customer, 1);
        customer.name = input.name;
        await tx.flush();
        expect(customer.name).toBe('Customer');
        throw new Error('abort returning update');
      }),
    ).rejects.toThrow('abort returning update');
    expect(await em.fork().findOneOrFail(Customer, 1)).toMatchObject({ name: 'Initial' });
  });

  test('does not introduce returning hints for DELETE', async () => {
    const em = orm.em.fork();
    em.create(Customer, { id: 1, ...initial });
    await em.flush();
    const qb = em.createQueryBuilder(Customer).delete({ id: 1 });
    expect(qb.getQuery()).not.toMatch(/\b(returning|output)\b/);
    expect((await qb.execute('run')).affectedRows).toBe(1);
  });
});
