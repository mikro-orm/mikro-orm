import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  Opt,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Rel,
  wrap,
} from '@mikro-orm/sqlite';

@Entity()
class Page {

  @PrimaryKey()
  pageId!: number;

  [PrimaryKeyProp]?: 'pageId';

  @Property()
  content!: string;

  @ManyToOne(() => Book)
  book!: Rel<Book>;

  @Property({ persist: false })
  bookId!: number & Opt;

  @ManyToOne(() => User)
  user!: Rel<User>;

  @Property({ persist: false })
  userId!: number & Opt;

}

@Entity()
class User {

  @PrimaryKey()
  userId!: number;

  [PrimaryKeyProp]?: 'userId';

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.user)
  books = new Collection<Book>(this);

  @OneToMany(() => Page, page => page.user)
  pages = new Collection<Page>(this);

}

@Entity()
class Book {

  @PrimaryKey()
  bookId!: number;

  [PrimaryKeyProp]?: 'bookId';

  @Property()
  title!: string;

  // Everything works if the lazy attribute is removed
  @Property({ lazy: true, nullable: true })
  description?: string;

  @OneToMany(() => Page, page => page.book)
  pages = new Collection<Page>(this);

  @ManyToOne(() => User, { name: 'userId' })
  user!: User;

  @Property({ persist: false })
  userId!: number & Opt;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Page, Book],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const user = orm.em.create(User, { name: 'Foo' });
  const book = orm.em.create(Book, { title: '42', user });

  orm.em.create(Page, { content: 'Lorem', book, user });
  orm.em.create(Page, { content: 'Ipsum', book, user });

  orm.em.create(Book, { title: '42 II', user });

  await orm.em.flush();
  orm.em.clear();

  const u = await orm.em.findOneOrFail(User, { name: 'Foo' });

  const books = await u.books.loadItems({
    where: { title: '42' },
    populate: ['pages'],
  });

  expect(wrap(books[0]).toObject()).toEqual({
    bookId: 1,
    title: '42',
    user: 1,
    pages: [
      {
        pageId: 1,
        content: 'Lorem',
        book: 1,
        user: 1,
      },
      {
        pageId: 2,
        content: 'Ipsum',
        book: 1,
        user: 1,
      },
    ],
  });
});
