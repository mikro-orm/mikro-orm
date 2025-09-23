import { MikroORM, Entity, PrimaryKey, Property, QueryOrder } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  age?: number | null;

}

let orm: MikroORM;

beforeAll(async () => {

  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();

});

afterAll(async () => {

  await orm.close(true);

});

test('cursor pagination with nullable values should not throw error', async () => {

  // This reproduces the exact scenario from the GitHub issue
  Array.from({ length: 500 }).forEach((_, i) => {
    orm.em.create(User, {
      name: `User ${i}`,
      // Math.floor(Math.random() * 10) ? ... : null means ~10% chance of null
      age: Math.floor(Math.random() * 10) ? Math.floor(Math.random() * 100) : null,
    });
  });

  await orm.em.flush();

  // This was failing before with: CursorError: Cannot create cursor, value for 'User.age' is missing.
  // After our fix, it should work
  const result = await orm.em.findByCursor(User, {}, {
    first: 100,
    orderBy: {
      age: QueryOrder.ASC,
      id: QueryOrder.ASC,
    },
  });

  // Verify we got results
  expect(result.items).toHaveLength(100);
  expect(result.startCursor).toBeTruthy();
  expect(result.endCursor).toBeTruthy();

  // The key test: we should be able to generate cursors even when some items have null age
  expect(() => result.startCursor).not.toThrow();
  expect(() => result.endCursor).not.toThrow();

});

test('cursor pagination with all null values should work', async () => {

  orm.em.clear();

  // Create test data where all age values are null
  Array.from({ length: 5 }).forEach((_, i) => {
    orm.em.create(User, {
      name: `AllNull ${i}`,
      age: null,
    });
  });

  await orm.em.flush();

  // This should work even when all values in the nullable column are null
  const result = await orm.em.findByCursor(User, { name: { $like: 'AllNull%' } }, {
    first: 3,
    orderBy: {
      age: QueryOrder.ASC,
      id: QueryOrder.ASC,
    },
  });

  expect(result.items).toHaveLength(3);
  result.items.forEach(item => {
    expect(item.age).toBeNull();
  });

  // Verify cursors can be generated for null values
  expect(result.startCursor).toBeTruthy();
  expect(result.endCursor).toBeTruthy();

});

test('basic forward pagination with mixed null/non-null values', async () => {

  orm.em.clear();

  // Create predictable test data
  const users = [
    { name: 'User A', age: null },
    { name: 'User B', age: null },
    { name: 'User C', age: 10 },
    { name: 'User D', age: 20 },
    { name: 'User E', age: null },
  ];

  users.forEach(userData => {
    orm.em.create(User, userData);
  });

  await orm.em.flush();

  // Get first page
  const page1 = await orm.em.findByCursor(User, { name: { $like: 'User %' } }, {
    first: 2,
    orderBy: {
      age: QueryOrder.ASC,
      id: QueryOrder.ASC,
    },
  });

  expect(page1.items).toHaveLength(2);
  expect(page1.hasNextPage).toBe(true);

  // The key achievement: we can generate cursors for entities with null values
  expect(page1.startCursor).toBeTruthy();
  expect(page1.endCursor).toBeTruthy();

});
