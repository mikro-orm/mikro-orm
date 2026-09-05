import { defineEntity, MikroORM, wrap } from '@mikro-orm/sqlite';

const Address = defineEntity({
  name: 'Address',
  embeddable: true,
  properties: p => ({
    city: p.string(),
  }),
});

const User = defineEntity({
  name: 'User',
  properties: p => ({
    id: p.integer().primary().autoincrement(),
    name: p.string(),
    address: p.embedded(Address).object(),
  }),
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Address],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

describe('EntityAssigner', () => {
  // keys inherited from `Object.prototype` are never valid entity properties, so they have to be
  // ignored rather than written through to the accessor they resolve to
  test('assign() ignores special object keys', async () => {
    const user = orm.em.create(User, { name: 'alice', address: { city: 'prague' } });
    const proto = Object.getPrototypeOf(user);

    wrap(user).assign(JSON.parse('{"name":"alice2","__proto__":{"city":"nope"}}'));

    expect(user.name).toBe('alice2');
    expect(Object.getPrototypeOf(user)).toBe(proto);
  });

  test('assign() ignores special object keys in embeddables', async () => {
    const user = orm.em.create(User, { name: 'alice', address: { city: 'prague' } });
    const proto = Object.getPrototypeOf(user.address);

    orm.em.assign(user, { address: JSON.parse('{"city":"brno","__proto__":{"city":"nope"}}') });

    expect(user.address.city).toBe('brno');
    expect(Object.getPrototypeOf(user.address)).toBe(proto);
  });

  test('assign() ignores constructor and prototype keys', async () => {
    const user = orm.em.create(User, { name: 'alice', address: { city: 'prague' } });

    wrap(user).assign(JSON.parse('{"name":"alice2","constructor":{"city":"nope"},"prototype":{"city":"nope"}}'));

    expect(user.name).toBe('alice2');
    expect(Object.hasOwn(user, 'constructor')).toBe(false);
    expect(Object.hasOwn(user, 'prototype')).toBe(false);
    expect(user.constructor).toBe(User.meta.class);
  });
});
