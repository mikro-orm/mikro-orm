import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToMany(() => Book, book => book.user)
  public books = new Collection<Book>(this);

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToOne()
  user?: User;

  constructor(name: string) {
    this.name = name;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Book],
  });
  await orm.schema.refreshDatabase();

  const books = [{ name: 'Book 1' }, { name: 'Book 2' }];
  orm.em.create(User, { name: 'Foo', email: 'foo', books });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example - no populate - user debuggable in VSCode', async () => {
  const user = await orm.em.fork().findOneOrFail(User, { email: 'foo' });
  const s = (user as any)[Symbol.for('nodejs.util.inspect.custom')]();
  expect(s).toBe(`User {
  name: 'Foo',
  email: 'foo',
  id: 1,
  books: Collection<Book> { initialized: false, dirty: false }
}`);
  expect(user.name).toBe('Foo');
});

test('basic CRUD example - populate books - user should not be debuggable in VSCode', async () => {
  const user = await orm.em.fork().findOneOrFail(
    User,
    { email: 'foo' },
    { populate: ['books'] },
  );
  const s = (user as any)[Symbol.for('nodejs.util.inspect.custom')]();
  expect(s).toBe(`User {
  name: 'Foo',
  email: 'foo',
  id: 1,
  books: Collection<Book> {
    '0': Book { name: 'Book 1', user: [User], id: 1 },
    '1': Book { name: 'Book 2', user: [User], id: 2 },
    initialized: true,
    dirty: false
  }
}`);
  // expect(user.name).toBe('Bar');
});

