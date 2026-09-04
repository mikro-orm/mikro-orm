import { defineEntity, LoadStrategy, MikroORM, p } from '@mikro-orm/sqlite';

const Permission = defineEntity({
  name: 'Permission',
  properties: {
    id: p.integer().primary(),
    platform: p.string(),
    users: () => p.manyToMany(User).mappedBy('permissions'),
  },
});

const Country = defineEntity({
  name: 'Country',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Client = defineEntity({
  name: 'Client',
  properties: {
    id: p.integer().primary(),
    country: () => p.manyToOne(Country),
    users: () => p.oneToMany(User).mappedBy('client'),
  },
});

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    isApproved: p.boolean(),
    client: () => p.manyToOne(Client),
    permissions: () => p.manyToMany(Permission).owner(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Client, User, Permission, Country],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const pos = orm.em.create(Permission, { id: 1, platform: '1' });
  const inventory = orm.em.create(Permission, { id: 2, platform: '3' });
  orm.em.create(Client, {
    id: 1,
    country: { id: 1, name: 'Greece' },
    users: [
      { id: 1, isApproved: true, permissions: [pos, inventory] },
      { id: 2, isApproved: true, permissions: [inventory] },
      { id: 3, isApproved: true, permissions: [] },
      { id: 4, isApproved: false, permissions: [pos] },
    ],
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test.each(Object.values(LoadStrategy))(
  '%s populateFilter preserves approved users with no matching permissions',
  async strategy => {
    const client = await orm.em.fork().findOneOrFail(Client, 1, {
      strategy,
      populate: ['country', 'users.permissions'],
      populateWhere: { users: { isApproved: true } },
      populateFilter: { users: { permissions: { platform: '1' } } },
      populateOrderBy: { users: { id: 'asc', permissions: { id: 'asc' } } },
    });

    expect(client.country.name).toBe('Greece');
    expect(client.users.map(user => ({ id: user.id, permissions: user.permissions.getIdentifiers() }))).toEqual([
      { id: 1, permissions: [1] },
      { id: 2, permissions: [] },
      { id: 3, permissions: [] },
    ]);
  },
);

test('balanced populateFilter loads permissions on already managed users', async () => {
  const em = orm.em.fork();
  const existing = await em.findOneOrFail(Client, 1, {
    strategy: 'balanced',
    populate: ['users'],
    populateWhere: { users: { isApproved: true } },
    populateOrderBy: { users: { id: 'asc' } },
  });
  const users = existing.users.getItems();
  expect(users.every(user => !user.permissions.isInitialized())).toBe(true);

  const client = await em.findOneOrFail(Client, 1, {
    strategy: 'balanced',
    populate: ['country', 'users.permissions'],
    populateWhere: { users: { isApproved: true } },
    populateFilter: { users: { permissions: { platform: '1' } } },
    populateOrderBy: { users: { id: 'asc', permissions: { id: 'asc' } } },
  });

  expect(client).toBe(existing);
  client.users.getItems().forEach((user, index) => expect(user).toBe(users[index]));
  expect(client.country.name).toBe('Greece');
  expect(client.users.map(user => ({ id: user.id, permissions: user.permissions.getIdentifiers() }))).toEqual([
    { id: 1, permissions: [1] },
    { id: 2, permissions: [] },
    { id: 3, permissions: [] },
  ]);
});

test.each([LoadStrategy.SELECT_IN, LoadStrategy.BALANCED])(
  '%s nested populateWhere requires matching permissions',
  async strategy => {
    const client = await orm.em.fork().findOneOrFail(Client, 1, {
      strategy,
      populate: ['users.permissions'],
      populateWhere: { users: { isApproved: true, permissions: { platform: '1' } } },
    });

    expect(client.users.map(user => ({ id: user.id, permissions: user.permissions.getIdentifiers() }))).toEqual([
      { id: 1, permissions: [1] },
    ]);
  },
);

test.each(Object.values(LoadStrategy))('%s populateFilter combines with entity filters', async strategy => {
  const em = orm.em.fork();
  em.addFilter({ name: 'visiblePermissions', entity: Permission, cond: { id: { $ne: 2 } }, default: true });

  const client = await em.findOneOrFail(Client, 1, {
    strategy,
    populate: ['country', 'users.permissions'],
    populateWhere: { users: { isApproved: true } },
    populateFilter: { users: { permissions: { platform: '3' } } },
    populateOrderBy: { users: { id: 'asc' } },
  });

  expect(client.users.map(user => ({ id: user.id, permissions: user.permissions.getIdentifiers() }))).toEqual([
    { id: 1, permissions: [] },
    { id: 2, permissions: [] },
    { id: 3, permissions: [] },
  ]);
});

test.each(Object.values(LoadStrategy))('%s populateFilter supports the inverse many-to-many side', async strategy => {
  const permission = await orm.em.fork().findOneOrFail(Permission, 1, {
    strategy,
    populate: ['users'],
    populateFilter: { users: { isApproved: true } },
  });

  expect(permission.users.getIdentifiers()).toEqual([1]);
});
