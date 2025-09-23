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

test('reproduce nullable cursor pagination issue', async () => {
  // Create test data with some null values
  Array.from({ length: 10 }).forEach((_, i) => {
    orm.em.create(User, {
      name: `User ${i}`,
      age: i % 3 === 0 ? null : i * 10 // Every 3rd user has null age
    });
  });

  await orm.em.flush();

  // This should fail with: CursorError: Cannot create cursor, value for 'User.age' is missing.
  await expect(orm.em.findByCursor(User, {}, {
    first: 5,
    orderBy: {
      age: QueryOrder.ASC,
      id: QueryOrder.ASC,
    }
  })).rejects.toThrow("Cannot create cursor, value for 'User.age' is missing.");
});