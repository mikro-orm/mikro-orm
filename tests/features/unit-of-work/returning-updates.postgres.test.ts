import { defineEntity, MikroORM, type Opt, OptimisticLockError, p, raw, Type, wrap } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

class Amount {
  constructor(readonly value: number) {}
}

class AmountType extends Type<Amount, number> {
  override convertToDatabaseValue(value: Amount): number {
    return value.value;
  }
  override convertToJSValue(value: number): Amount {
    return new Amount(Number(value));
  }
  override convertToDatabaseValueSQL(key: string): string {
    return `(${key} * 10)`;
  }
  override convertToJSValueSQL(key: string): string {
    return `(${key} / 10)`;
  }
  override getColumnType(): string {
    return 'integer';
  }
}

const Address = defineEntity({
  name: 'ReturningAddress',
  embeddable: true,
  properties: { name: p.string().trim().returning() },
});

const Account = defineEntity({
  name: 'ReturningAccount',
  schema: 'returning_updates',
  properties: {
    tenant: p.string().primary().fieldName('Tenant Key'),
    id: p.integer().primary().fieldName('Account Id'),
    name: p.string().trim().returning(),
    address: () => p.embedded(Address),
    amount: p.type(AmountType).returning(),
    derived: p.string().default('Initial').returning(),
    counter: p.integer().default(0),
    doubled: p
      .integer()
      .generated(columns => `(${columns.counter} * 2) stored`)
      .$type<Opt<number>>(),
    version: p.integer().version(),
    secret: p.string().trim().hidden().returning(),
    lazy: p.string().trim().lazy().returning(),
    ignored: p.string().trim().hydrate(false).returning(),
    virtual: p.string().persist(false).nullable().returning(),
    formula: p.integer().formula('42').returning(),
  },
});

const Parent = defineEntity({
  name: 'ReturningParent',
  properties: { id: p.integer().primary(), name: p.string().trim().returning() },
});
const Child = defineEntity({
  name: 'ReturningChild',
  properties: {
    id: p.integer().primary(),
    name: p.string().trim().returning(),
    parent: () => p.manyToOne(Parent),
  },
});

const Contact = defineEntity({
  name: 'ReturningContact',
  properties: {
    id: p.integer().primary(),
    name: p.string().trim().returning(),
    address: () => p.embedded(Address).returning(),
    details: () => p.embedded(Address).object().returning(),
    parent: () => p.manyToOne(Contact).nullable().returning(),
    children: () => p.oneToMany(Contact).mappedBy('parent').returning(),
    spouse: () => p.oneToOne(Contact).owner().inversedBy('partner').nullable().returning(),
    partner: () => p.oneToOne(Contact).mappedBy('spouse').nullable().returning(),
  },
});

class NumericKeyType extends Type<number, number> {
  override convertToJSValueSQL(key: string): string {
    return `abs(${key})`;
  }

  override getColumnType(): string {
    return 'integer';
  }
}

const Target = defineEntity({
  name: 'ReturningTarget',
  properties: {
    tenant: p.string().primary(),
    id: p.type(NumericKeyType).primary(),
  },
});

const Reference = defineEntity({
  name: 'ReturningReference',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    target: () => p.manyToOne(Target).returning(),
  },
});

let orm: MikroORM;
beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Account, Parent, Child, Contact, Reference],
    dbName: 'mikro_orm_test_returning_update_details',
  });
  await orm.schema.refresh();
  await orm.em
    .execute(`create or replace function returning_updates.derive_name() returns trigger language plpgsql as $$
    begin new.derived := upper(new.name); return new; end $$`);
  await orm.em.execute(`create trigger derive_name before update on returning_updates.returning_account
    for each row execute function returning_updates.derive_name()`);
});
beforeEach(async () => {
  orm.config.set('useBatchUpdates', true);
  await orm.schema.clear();
  await orm.schema.clear({ schema: 'returning_updates' });
});
afterAll(() => orm.close(true));

test.each([false, true])('composite keys, conversions, embeddables and versioning (batch=%s)', async batch => {
  const em = orm.em.fork();
  // Use QB with an explicit list to seed independently of automatic INSERT returning.
  for (const id of [2, 1]) {
    await em
      .createQueryBuilder(Account)
      .insert({
        tenant: 'tenant',
        id,
        name: 'Initial',
        address: { name: 'Old street' },
        amount: new Amount(1),
        secret: 'Old',
        lazy: 'Old',
        ignored: 'Old',
      })
      .returning(['id'])
      .execute();
  }
  const accounts = await em.find(Account, {}, { orderBy: { id: 'desc' } });
  const staleEm = em.fork();
  const stale = await staleEm.findOneOrFail(Account, ['tenant', 1]);
  orm.config.set('useBatchUpdates', batch);
  accounts.forEach(account => {
    account.name = ` Account ${account.id} `;
    account.address.name = ` Street ${account.id} `;
    account.amount = new Amount(account.id + 2);
    account.secret = ' Hidden ';
    account.lazy = ' Lazy ';
    account.ignored = ' Ignored ';
    account.counter = raw('counter + 1');
  });
  const mock = mockLogger(orm);
  await em.flush();
  const updates = mock.mock.calls.map(([q]) => q as string).filter(q => q.includes('update '));
  expect(updates).toHaveLength(batch ? 1 : 2);
  for (const query of updates) {
    const returning = query.slice(query.indexOf(' returning '));
    expect(returning).toContain('address_name');
    expect(returning).toContain('derived');
    expect(returning).toContain('doubled');
    expect(returning).toContain('version');
    expect(returning).toContain(' / 10');
    expect(returning).not.toMatch(/ignored|virtual|formula/);
    expect(query).toContain('"returning_updates"."returning_account"');
  }
  for (const account of accounts) {
    expect(account).toMatchObject({
      name: `Account ${account.id}`,
      address: { name: `Street ${account.id}` },
      amount: new Amount(account.id + 2),
      derived: `ACCOUNT ${account.id}`,
      counter: 1,
      doubled: 2,
      version: 2,
      secret: 'Hidden',
      lazy: 'Lazy',
      ignored: ' Ignored ',
    });
    expect(wrap(account).toObject()).not.toHaveProperty('secret');
  }
  mock.mockClear();
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
  for (const account of accounts) {
    const stored = await em.fork().findOneOrFail(Account, [account.tenant, account.id], { populate: ['lazy'] });
    expect(stored.name).toBe(account.name);
    expect(stored.amount).toEqual(account.amount);
    expect(stored.address.name).toBe(account.address.name);
    expect(stored.derived).toBe(account.derived);
  }
  stale.name = ' Stale ';
  await expect(staleEm.flush()).rejects.toThrow(OptimisticLockError);
});

test('updates existing parent/children and inserts a new child in the same flush', async () => {
  const em = orm.em.fork();
  const parent = em.create(Parent, { id: 1, name: 'Initial' });
  const first = em.create(Child, { id: 1, name: 'First', parent });
  const second = em.create(Child, { id: 2, name: 'Second', parent });
  await em.flush();
  Object.assign(parent, { name: ' Parent ' });
  Object.assign(first, { name: ' First updated ' });
  Object.assign(second, { name: ' Second updated ' });
  const added = em.create(Child, { id: 3, name: ' Added ', parent });
  const mock = mockLogger(orm);
  await em.flush();
  expect([parent.name, first.name, second.name, added.name]).toEqual([
    'Parent',
    'First updated',
    'Second updated',
    'Added',
  ]);
  expect(mock.mock.calls.filter(([q]) => /\bselect\b/.test(q as string))).toEqual([]);
  expect(mock.mock.calls.filter(([q]) => (q as string).includes('update '))).toHaveLength(2);
  expect(mock.mock.calls.filter(([q]) => (q as string).includes('insert into '))).toHaveLength(1);
  mock.mockClear();
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('relation predicates keep returning on the outer UPDATE only (#8282)', async () => {
  const em = orm.em.fork();
  const parent = em.create(Parent, { id: 1, name: 'Parent' });
  em.create(Child, { id: 1, name: 'Initial', parent });
  await em.flush();
  const mock = mockLogger(orm);
  expect(await em.nativeUpdate(Child, { parent: { name: 'Parent' } }, { name: ' Updated ' })).toBe(1);
  const query = mock.mock.calls[0][0] as string;
  expect(query).toContain('select');
  expect(query.match(/ returning /g)).toHaveLength(1);
  expect(query).toMatch(/\) returning "name"/);
  expect(await em.fork().findOneOrFail(Child, 1)).toMatchObject({ name: 'Updated' });
});

test.each([false, true])('returns physical relation and embedded columns only (batch=%s)', async batch => {
  const em = orm.em.fork();
  const contacts = [1, 2].map(id =>
    em.create(Contact, { id, name: 'Initial', address: { name: 'Street' }, details: { name: 'Details' } }),
  );
  await em.flush();
  orm.config.set('useBatchUpdates', batch);
  contacts[0].parent = contacts[1];
  contacts[0].spouse = contacts[1];
  contacts.forEach(contact => {
    contact.name = ` Contact ${contact.id} `;
    contact.address.name = ` Street ${contact.id} `;
    contact.details.name = `Details ${contact.id}`;
  });

  const mock = mockLogger(orm);
  await em.flush();
  const updates = mock.mock.calls.map(([q]) => q as string).filter(q => q.includes('update '));
  expect(updates).toHaveLength(batch ? 1 : 2);
  for (const query of updates) {
    const returning = query.slice(query.indexOf(' returning '));
    expect(returning).toContain('"parent_id"');
    expect(returning).toContain('"spouse_id"');
    expect(returning).toContain('"address_name"');
    expect(returning).toContain('"details"');
    expect(returning).not.toMatch(/"(address|children|partner)"/);
  }
  expect(contacts[0].parent).toBe(contacts[1]);
  expect(contacts[0].spouse).toBe(contacts[1]);
  for (const contact of contacts) {
    expect(contact).toMatchObject({
      name: `Contact ${contact.id}`,
      address: { name: `Street ${contact.id}` },
      details: { name: `Details ${contact.id}` },
    });
  }
  mock.mockClear();
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test.each(['single', 'batch', 'query-builder'] as const)(
  'returns every column of composite relations with SQL conversions (%s)',
  async mode => {
    const em = orm.em.fork();
    const target = em.create(Target, { tenant: 'tenant', id: 1 });
    const references = [1, 2].map(id => em.create(Reference, { id, name: 'Initial', target }));
    await em.flush();
    const mock = mockLogger(orm);
    if (mode === 'query-builder') {
      const result = await em.createQueryBuilder(Reference).update({ name: 'Updated' }).execute('run');
      expect(result.rows).toEqual([
        { target_tenant: 'tenant', target_id: 1 },
        { target_tenant: 'tenant', target_id: 1 },
      ]);
    } else {
      orm.config.set('useBatchUpdates', mode === 'batch');
      references.forEach(reference => (reference.name = 'Updated'));
      await em.flush();
      expect(references.every(reference => reference.target === target)).toBe(true);
    }
    const updates = mock.mock.calls.map(([q]) => q as string).filter(q => q.includes('update '));
    expect(updates).toHaveLength(mode === 'single' ? 2 : 1);
    for (const query of updates) {
      const returning = query.slice(query.indexOf(' returning '));
      expect(returning).toContain('"target_tenant"');
      expect(returning).toContain('abs("target_id") as "target_id"');
    }
    mock.mockClear();
    await em.flush();
    expect(mock).not.toHaveBeenCalled();
  },
);
