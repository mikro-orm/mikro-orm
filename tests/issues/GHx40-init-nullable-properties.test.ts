import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

// When `initNullableProperties` is enabled, nullable properties (both
// nullable() and strictNullable()) should be initialized to `null` (or
// `undefined` when forceUndefined is set) when omitted from em.create()
// data, so the runtime value matches the type and the database
// representation from the start.

const UserSchema = defineEntity({
  name: 'GHx40User',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string(),
    // nullable() — T | null | undefined
    locale: p.string().nullable(),
    code: p.integer().nullable(),
    // strictNullable() — T | null
    bio: p.string().strictNullable(),
    created: p.datetime().strictNullable(),
  },
});

let orm: MikroORM;

afterEach(() => orm.close(true));

describe('GHx40 - initNullableProperties option', () => {
  test('nullable and strictNullable properties are null after em.create()', async () => {
    orm = await MikroORM.init({
      entities: [UserSchema],
      dbName: ':memory:',
      initNullableProperties: true,
    });
    await orm.schema.create();

    const user = orm.em.create(UserSchema, { name: 'Foo' });

    // All nullable properties should be null immediately, not undefined
    expect(user.locale).toBeNull();
    expect(user.code).toBeNull();
    expect(user.bio).toBeNull();
    expect(user.created).toBeNull();

    await orm.em.flush();
    orm.em.clear();

    // After round-trip, values should still be null
    const loaded = await orm.em.findOneOrFail(UserSchema, user.id);
    expect(loaded.locale).toBeNull();
    expect(loaded.code).toBeNull();
    expect(loaded.bio).toBeNull();
    expect(loaded.created).toBeNull();
  });

  test('nullable properties respect forceUndefined config', async () => {
    orm = await MikroORM.init({
      entities: [UserSchema],
      dbName: ':memory:',
      initNullableProperties: true,
      forceUndefined: true,
    });
    await orm.schema.create();

    const user = orm.em.create(UserSchema, { name: 'Bar' });

    // With forceUndefined, nullable properties should be undefined
    expect(user.locale).toBeUndefined();
    expect(user.code).toBeUndefined();
    expect(user.bio).toBeUndefined();
    expect(user.created).toBeUndefined();
  });

  test('explicitly provided values are not overwritten', async () => {
    orm = await MikroORM.init({
      entities: [UserSchema],
      dbName: ':memory:',
      initNullableProperties: true,
    });
    await orm.schema.create();

    const now = new Date();
    const user = orm.em.create(UserSchema, {
      name: 'Baz',
      locale: 'en',
      code: 42,
      bio: 'Hello',
      created: now,
    });

    expect(user.locale).toBe('en');
    expect(user.code).toBe(42);
    expect(user.bio).toBe('Hello');
    expect(user.created).toBe(now);
  });

  test('disabled by default — nullable properties remain undefined', async () => {
    orm = await MikroORM.init({
      entities: [UserSchema],
      dbName: ':memory:',
    });
    await orm.schema.create();

    const user = orm.em.create(UserSchema, { name: 'Qux' });

    expect(user.locale).toBeUndefined();
    expect(user.code).toBeUndefined();
    expect(user.bio).toBeUndefined();
    expect(user.created).toBeUndefined();
  });
});
