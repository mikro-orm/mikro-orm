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

test('cursor pagination with nullable values should work', async () => {

  // Create test data with some null values
  Array.from({ length: 10 }).forEach((_, i) => {
    orm.em.create(User, {
      name: `User ${i}`,
      age: i % 3 === 0 ? null : i * 10, // Every 3rd user has null age
    });
  });

  await orm.em.flush();

  // This should now work without throwing an error
  const result = await orm.em.findByCursor(User, {}, {
    first: 5,
    orderBy: {
      age: QueryOrder.ASC,
      id: QueryOrder.ASC,
    },
  });

  // Verify we got results
  expect(result.items).toHaveLength(5);
  expect(result.startCursor).toBeTruthy();
  expect(result.endCursor).toBeTruthy();

  // Test forward pagination
  if (result.endCursor) {
    const nextPage = await orm.em.findByCursor(User, {}, {
      first: 5,
      after: result.endCursor,
      orderBy: {
        age: QueryOrder.ASC,
        id: QueryOrder.ASC,
      },
    });

    expect(nextPage.items).toHaveLength(5);
  }

});

test('cursor pagination with all null values for nullable column', async () => {

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

});
