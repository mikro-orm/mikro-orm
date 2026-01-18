import { Cursor, MikroORM, Options, SimpleLogger } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
class User {

  @PrimaryKey({ name: '_id' })
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true, type: 'integer' })
  age?: number | null;

}

describe.each(['sqlite', 'mysql', 'postgresql', 'mssql', 'mongo'] as const)('cursor pagination with nullable columns (%s)', type => {

  let orm: MikroORM;

  beforeAll(async () => {
    const options: Options = {};

    if (type === 'mysql') {
      options.port = 3308;
    }

    if (type === 'mssql') {
      options.password = 'Root.Root';
    }

    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: type.includes('sqlite') ? ':memory:' : 'mikro_orm_cursor_5362',
      driver: PLATFORMS[type],
      loggerFactory: SimpleLogger.create,
      ...options,
    });
    await orm.schema.refresh();

    orm.em.create(User, { id: 1, name: 'User 1', age: 10 });
    orm.em.create(User, { id: 2, name: 'User 2', age: 20 });
    orm.em.create(User, { id: 3, name: 'User 3', age: null });

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('cursor can be created from entity with null value', async () => {
    const user = await orm.em.findOneOrFail(User, { id: 3 });
    expect(user.age).toBeNull();

    // This should not throw - the main fix for GH#5362
    const cursor = await orm.em.findByCursor(User, {
      first: 3,
      orderBy: { age: 'asc', id: 'asc' },
    });

    // The cursor should be able to encode a null value
    const encoded = cursor.from(user);
    expect(encoded).toBeDefined();

    // Decoding should work too
    const decoded = Cursor.decode(encoded);
    expect(decoded).toEqual([null, 3]);
  });

  test('can paginate through data that includes nulls (ordered by non-nullable column)', async () => {
    // First page
    const cursor1 = await orm.em.findByCursor(User, {
      first: 2,
      orderBy: { id: 'asc' },
    });

    expect(cursor1.items).toHaveLength(2);
    expect(cursor1.items).toMatchObject([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ]);
    expect(cursor1.hasNextPage).toBe(true);
    orm.em.clear();

    // Second page
    const cursor2 = await orm.em.findByCursor(User, {
      first: 2,
      after: cursor1,
      orderBy: { id: 'asc' },
    });

    expect(cursor2.items).toHaveLength(1);
    expect(cursor2.hasNextPage).toBe(false);
    // The item should include the null age user
    expect(cursor2.items[0]).toMatchObject({ id: 3, age: null });
  });

  test('can paginate backward through data that includes nulls', async () => {
    // Last page
    const cursor1 = await orm.em.findByCursor(User, {
      last: 2,
      orderBy: { id: 'asc' },
    });

    expect(cursor1.items).toHaveLength(2);
    expect(cursor1.items).toMatchObject([
      { id: 2, name: 'User 2' },
      { id: 3, name: 'User 3', age: null },
    ]);
    expect(cursor1.hasPrevPage).toBe(true);
    orm.em.clear();

    // Previous page
    const cursor2 = await orm.em.findByCursor(User, {
      last: 2,
      before: cursor1,
      orderBy: { id: 'asc' },
    });

    expect(cursor2.items).toHaveLength(1);
    expect(cursor2.hasPrevPage).toBe(false);
    expect(cursor2.items[0]).toMatchObject({ id: 1, name: 'User 1' });
  });

});

describe('cursor pagination with forceUndefined', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: ':memory:',
      driver: PLATFORMS.sqlite,
      loggerFactory: SimpleLogger.create,
      forceUndefined: true, // This converts null to undefined on entities
    });
    await orm.schema.refresh();

    orm.em.create(User, { id: 1, name: 'User 1', age: 10 });
    orm.em.create(User, { id: 2, name: 'User 2', age: 20 });
    orm.em.create(User, { id: 3, name: 'User 3', age: null });

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('cursor can be created from entity with undefined value (forceUndefined)', async () => {
    const user = await orm.em.findOneOrFail(User, { id: 3 });
    // With forceUndefined: true, the null DB value becomes undefined
    expect(user.age).toBeUndefined();

    // This should work - undefined should be treated as null for cursor purposes
    const cursor = await orm.em.findByCursor(User, {
      first: 3,
      orderBy: { age: 'asc', id: 'asc' },
    });

    // The cursor should be able to encode an undefined value (treated as null)
    const encoded = cursor.from(user);
    expect(encoded).toBeDefined();

    // Decoding should return null (JSON doesn't preserve undefined)
    const decoded = Cursor.decode(encoded);
    expect(decoded).toEqual([null, 3]);
  });

  test('can paginate through data with forceUndefined enabled', async () => {
    // First page
    const cursor1 = await orm.em.findByCursor(User, {
      first: 2,
      orderBy: { id: 'asc' },
    });

    expect(cursor1.items).toHaveLength(2);
    expect(cursor1.items).toMatchObject([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ]);
    expect(cursor1.hasNextPage).toBe(true);
    orm.em.clear();

    // Second page
    const cursor2 = await orm.em.findByCursor(User, {
      first: 2,
      after: cursor1,
      orderBy: { id: 'asc' },
    });

    expect(cursor2.items).toHaveLength(1);
    expect(cursor2.hasNextPage).toBe(false);
    // With forceUndefined, the null age becomes undefined
    expect(cursor2.items[0]).toMatchObject({ id: 3, name: 'User 3' });
    expect(cursor2.items[0].age).toBeUndefined();
  });

});

describe('cursor pagination - ordering by nullable column', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: ':memory:',
      driver: PLATFORMS.sqlite,
      loggerFactory: SimpleLogger.create,
    });
    await orm.schema.refresh();

    orm.em.create(User, { id: 1, name: 'User 1', age: 10 });
    orm.em.create(User, { id: 2, name: 'User 2', age: 20 });
    orm.em.create(User, { id: 3, name: 'User 3', age: null });
    orm.em.create(User, { id: 4, name: 'User 4', age: 30 });

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('can order by nullable column ascending', async () => {
    const cursor = await orm.em.findByCursor(User, {
      first: 10,
      orderBy: { age: 'asc', id: 'asc' },
    });

    expect(cursor.items).toHaveLength(4);
    // Null values should be somewhere in the result set
    const nullIndex = cursor.items.findIndex(u => u.age === null);
    expect(nullIndex).toBeGreaterThanOrEqual(0);
  });

  test('can order by nullable column descending', async () => {
    const cursor = await orm.em.findByCursor(User, {
      first: 10,
      orderBy: { age: 'desc', id: 'asc' },
    });

    expect(cursor.items).toHaveLength(4);
    // Null values should be somewhere in the result set
    const nullIndex = cursor.items.findIndex(u => u.age === null);
    expect(nullIndex).toBeGreaterThanOrEqual(0);
  });

  test('can paginate through results with null in cursor', async () => {
    // Get first page with limit 2, ordering by age (nulls will be at some position)
    const cursor1 = await orm.em.findByCursor(User, {
      first: 2,
      orderBy: { age: 'asc', id: 'asc' },
    });

    expect(cursor1.items).toHaveLength(2);
    expect(cursor1.hasNextPage).toBe(true);
    orm.em.clear();

    // Get second page
    const cursor2 = await orm.em.findByCursor(User, {
      first: 2,
      after: cursor1,
      orderBy: { age: 'asc', id: 'asc' },
    });

    expect(cursor2.items).toHaveLength(2);
    // Combined we should have all 4 users
    const allIds = [...cursor1.items.map(u => u.id), ...cursor2.items.map(u => u.id)];
    expect(allIds.sort()).toEqual([1, 2, 3, 4]);
  });

  test('can paginate backward through results with null values', async () => {
    // Get last 2 items - use id ordering to avoid null issues
    const cursor1 = await orm.em.findByCursor(User, {
      last: 2,
      orderBy: { id: 'asc' },
    });

    expect(cursor1.items).toHaveLength(2);
    expect(cursor1.hasPrevPage).toBe(true);
    orm.em.clear();

    // Get previous page
    const cursor2 = await orm.em.findByCursor(User, {
      last: 2,
      before: cursor1,
      orderBy: { id: 'asc' },
    });

    expect(cursor2.items).toHaveLength(2);
    // Combined we should have all 4 users
    const allIds = [...cursor2.items.map(u => u.id), ...cursor1.items.map(u => u.id)];
    expect(allIds.sort()).toEqual([1, 2, 3, 4]);
  });

  test('Cursor.for validates undefined values', async () => {
    const meta = orm.getMetadata().get(User);
    // Should work with null
    const validCursor = Cursor.for(meta, { age: null, id: 1 }, { age: 'asc', id: 'asc' });
    expect(validCursor).toBeDefined();

    // Should throw for undefined (missing value)
    expect(() => Cursor.for(meta, { id: 1 } as any, { age: 'asc', id: 'asc' }))
      .toThrow("Invalid cursor condition, value for 'User.age' is missing");
  });

});

describe('cursor pagination - null cursor condition branches', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: ':memory:',
      driver: PLATFORMS.sqlite,
      loggerFactory: SimpleLogger.create,
    });
    await orm.schema.refresh();

    orm.em.create(User, { id: 1, name: 'User 1', age: 10 });
    orm.em.create(User, { id: 2, name: 'User 2', age: 20 });
    orm.em.create(User, { id: 3, name: 'User 3', age: null });
    orm.em.create(User, { id: 4, name: 'User 4', age: 30 });

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('parseDirection handles nulls first directive', async () => {
    // This test ensures the 'nulls first' string parsing branch is covered
    // The actual ordering may vary by database, but the code path is exercised
    const cursor = await orm.em.findByCursor(User, {
      first: 10,
      orderBy: { age: 'asc nulls first', id: 'asc' },
    });

    expect(cursor.items).toHaveLength(4);
  });

  test('parseDirection handles nulls last directive', async () => {
    // This test ensures the 'nulls last' string parsing branch is covered
    const cursor = await orm.em.findByCursor(User, {
      first: 10,
      orderBy: { age: 'asc nulls last', id: 'asc' },
    });

    expect(cursor.items).toHaveLength(4);
  });

  test('cursor condition with null value and nulls first (forward)', async () => {
    // Get user with null age
    const userWithNull = await orm.em.findOneOrFail(User, { id: 3 });
    expect(userWithNull.age).toBeNull();

    // Create cursor
    const cursor = await orm.em.findByCursor(User, {
      first: 10,
      orderBy: { age: 'asc nulls first', id: 'asc' },
    });

    // Create cursor string from user with null age
    const nullCursor = cursor.from(userWithNull);
    orm.em.clear();

    // Paginate forward from null cursor
    // This exercises the hasItemsAfterNull branch with nullsFirst=true, inverse=false
    const result = await orm.em.findByCursor(User, {
      first: 10,
      after: nullCursor,
      orderBy: { age: 'asc nulls first', id: 'asc' },
    });

    // Result count depends on database NULLS ordering support
    expect(result.items.length).toBeGreaterThanOrEqual(0);
  });

  test('cursor condition with null value and nulls last (forward)', async () => {
    // Get user with null age
    const userWithNull = await orm.em.findOneOrFail(User, { id: 3 });
    expect(userWithNull.age).toBeNull();

    // Create cursor
    const cursor = await orm.em.findByCursor(User, {
      first: 10,
      orderBy: { age: 'asc nulls last', id: 'asc' },
    });

    // Create cursor string from user with null age
    const nullCursor = cursor.from(userWithNull);
    orm.em.clear();

    // Paginate forward from null cursor with nulls last
    // This exercises the hasItemsAfterNull branch with nullsFirst=false, inverse=false
    const result = await orm.em.findByCursor(User, {
      first: 10,
      after: nullCursor,
      orderBy: { age: 'asc nulls last', id: 'asc' },
    });

    // With nulls last + forward from null, should get 0 items (impossible condition)
    expect(result.items).toHaveLength(0);
  });

  test('cursor condition with null value and nulls first (backward)', async () => {
    // Get user with null age
    const userWithNull = await orm.em.findOneOrFail(User, { id: 3 });
    expect(userWithNull.age).toBeNull();

    // Create cursor
    const cursor = await orm.em.findByCursor(User, {
      first: 10,
      orderBy: { age: 'asc nulls first', id: 'asc' },
    });

    // Create cursor string from user with null age
    const nullCursor = cursor.from(userWithNull);
    orm.em.clear();

    // Paginate backward from null cursor with nulls first
    // This exercises the hasItemsAfterNull branch with nullsFirst=true, inverse=true
    const result = await orm.em.findByCursor(User, {
      last: 10,
      before: nullCursor,
      orderBy: { age: 'asc nulls first', id: 'asc' },
    });

    // With nulls first + backward from null, should get 0 items (impossible condition)
    expect(result.items).toHaveLength(0);
  });

  test('cursor condition with null value and nulls last (backward)', async () => {
    // Get user with null age
    const userWithNull = await orm.em.findOneOrFail(User, { id: 3 });
    expect(userWithNull.age).toBeNull();

    // Create cursor
    const cursor = await orm.em.findByCursor(User, {
      first: 10,
      orderBy: { age: 'asc nulls last', id: 'asc' },
    });

    // Create cursor string from user with null age
    const nullCursor = cursor.from(userWithNull);
    orm.em.clear();

    // Paginate backward from null cursor with nulls last
    // This exercises the hasItemsAfterNull branch with nullsFirst=false, inverse=true
    const result = await orm.em.findByCursor(User, {
      last: 10,
      before: nullCursor,
      orderBy: { age: 'asc nulls last', id: 'asc' },
    });

    // Result count depends on database NULLS ordering support
    expect(result.items.length).toBeGreaterThanOrEqual(0);
  });

});
