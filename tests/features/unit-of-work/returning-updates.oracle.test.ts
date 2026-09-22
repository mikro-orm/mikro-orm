import { defineEntity, MikroORM, p, Type } from '@mikro-orm/oracledb';
import { mockLogger } from '../../helpers.js';

const Customer = defineEntity({
  name: 'ReturningOracleCustomer',
  properties: {
    tenant: p.string().primary().fieldName('tenant_key'),
    id: p.integer().primary(),
    name: p.string().trim().returning(),
    code: p.string().trim().uppercase().returning(),
  },
});

class AmountType extends Type<number, number> {
  override convertToJSValue(value: number): number {
    return Number(value);
  }

  override convertToDatabaseValueSQL(key: string): string {
    return `(${key} * 10)`;
  }

  override convertToJSValueSQL(key: string): string {
    return `(${key} / 10)`;
  }

  override getColumnType(): string {
    return 'number';
  }
}

const Amount = defineEntity({
  name: 'ReturningOracleAmount',
  properties: {
    id: p.integer().primary(),
    amount: p.type(AmountType).returning(),
  },
});

let orm: MikroORM;
beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Customer, Amount],
    dbName: 'mikro_orm_test_returning_updates',
    password: 'oracle123',
  });
  await orm.schema.refresh();
});
beforeEach(() => orm.schema.clear());
afterAll(() => orm.close(true));

test.each([false, true])('aligns returning columns and OUT binds (batch=%s)', async batch => {
  const em = orm.em.fork();
  const customers = [2, 1].map(id => em.create(Customer, { tenant: 'tenant', id, name: 'Initial', code: 'OLD' }));
  await em.flush();
  orm.config.set('useBatchUpdates', batch);
  customers.forEach(c => {
    c.name = ` Customer ${c.id} `;
    c.code = ` eur ${c.id} `;
  });
  const mock = mockLogger(orm);
  await em.flush();
  const updates = mock.mock.calls.map(([q]) => q as string).filter(q => q.includes('update '));
  expect(updates).toHaveLength(batch ? 1 : 2);
  expect(updates.every(q => q.includes(' returning ') && q.includes(' into '))).toBe(true);
  customers.forEach(c => expect(c).toMatchObject({ name: `Customer ${c.id}`, code: `EUR ${c.id}` }));
  mock.mockClear();
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
  for (const customer of customers) {
    expect(await em.fork().findOneOrFail(Customer, { tenant: 'tenant', id: customer.id })).toMatchObject({
      name: customer.name,
      code: customer.code,
    });
  }
});

test('batch SQL conversions use OUT bindings without column aliases', async () => {
  const em = orm.em.fork();
  await em.insertMany(Amount, [
    { id: 1, amount: 1 },
    { id: 2, amount: 2 },
  ]);
  const amounts = await em.find(Amount, {}, { fields: ['id', 'amount'], orderBy: { id: 'asc' } });
  expect(amounts.map(item => item.amount)).toEqual([1, 2]);
  orm.config.set('useBatchUpdates', true);
  amounts.forEach(item => (item.amount += 2));

  const mock = mockLogger(orm);
  await em.flush();
  expect(amounts.map(item => item.amount)).toEqual([3, 4]);
  const updates = mock.mock.calls.map(([query]) => query as string).filter(query => query.includes('update '));
  expect(updates).toHaveLength(1);
  expect(updates[0]).toContain('returning "id", ("amount" / 10) into :out_id, :out_amount');
  mock.mockClear();
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
  const stored = await em.fork().find(Amount, {}, { fields: ['id', 'amount'], orderBy: { id: 'asc' } });
  expect(stored.map(item => item.amount)).toEqual([3, 4]);
});
