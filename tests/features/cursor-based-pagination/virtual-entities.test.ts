import { MikroORM, QueryOrder } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  age!: number;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => User)
  owner!: User;
}

@Entity({
  expression: `
    SELECT "user".id, "user".name, "user".age, COUNT(b.id) AS book_count
    FROM "user"
           LEFT JOIN "book" b ON b.owner_id = "user".id
    GROUP BY "user".id
  `,
})
class UserBookSummary {
  @Property()
  id!: number;

  @Property()
  name!: string;

  @Property()
  age!: number;

  @Property()
  bookCount!: number;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, Book, UserBookSummary],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
  const em = orm.em;
  const users = [
    em.create(User, { name: 'Alice', age: 30 }),
    em.create(User, { name: 'Bob', age: 24 }),
    em.create(User, { name: 'Charlie', age: 28 }),
    em.create(User, { name: 'David', age: 35 }),
    em.create(User, { name: 'Eve', age: 22 }),
  ];
  em.create(Book, { title: 'The Great Gatsby', owner: users[0] });
  em.create(Book, { title: '1984', owner: users[1] });
  em.create(Book, { title: 'Brave New World', owner: users[2] });
  em.create(Book, { title: 'To Kill a Mockingbird', owner: users[3] });
  em.create(Book, { title: 'Moby Dick', owner: users[4] });
  await em.flush();
  em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('should correctly paginate virtual entities using cursors', async () => {
  const firstResult = await orm.em.findByCursor(UserBookSummary, { orderBy: { id: QueryOrder.ASC }, first: 3 });
  expect(firstResult.endCursor).not.toBeNull();
  const cursor = firstResult.endCursor!;
  const finalResult = await orm.em.findByCursor(UserBookSummary, {
    after: cursor,
    orderBy: { id: QueryOrder.ASC },
    first: 2,
  });
  expect(finalResult.items.map(item => item.id)).toEqual([4, 5]);
});
