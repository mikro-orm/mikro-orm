import {
  MikroORM,
  Entity,
  PrimaryKey,
  Property,
  SimpleLogger,
  Collection,
  Ref,
  ManyToMany,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToMany(() => BookTag)
  tags = new Collection<BookTag>(this);

  constructor({ id, title }: { id?: number; title: string }) {
    if (id) {
      this.id = id;
    }
    this.title = title;
  }

}

@Entity()
export class BookTag {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany(() => Book, book => book.tags)
  books = new Collection<Book>(this);

  constructor({ id, name, books }: { id?: number; name: string; books: (Book | Ref<Book>)[] }) {
    if (id) {
      this.id = id;
    }
    this.name = name;
    this.books.add(books);
  }

}
describe('GH #5019', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book, BookTag],
      dbName: ':memory:',
      loggerFactory: options => new SimpleLogger(options),
    });
    await orm.schema.refreshDatabase();

    const books = [
      new Book({ id: 1, title: 'One' }),
      new Book({ id: 2, title: 'Two' }),
      new Book({ id: 3, title: 'Three' }),
      new Book({ id: 4, title: 'Four' }),
      new Book({ id: 5, title: 'Five' }),
      new Book({ id: 6, title: 'Six' }),
    ];
    orm.em.persist(books);

    const tags = [
      new BookTag({ id: 1, name: '1', books: [books[0]] }),
      new BookTag({ id: 2, name: '2', books: [books[0], books[3]] }),
      new BookTag({ id: 3, name: '3', books: [books[1], books[2], books[3]] }),
    ];
    orm.em.persist(tags);

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('query 1', async () => {
    const mock = mockLogger(orm);
    const tags1 = await orm.em.fork().find(BookTag, { books: 1 }, { populate: ['books:ref'] });
    expect(mock.mock.calls).toMatchSnapshot(); // FIXME: exact query might vary once fixed
  });

  test('query 2', async () => {
    const mock = mockLogger(orm);
    const tags2 = await orm.em.fork().find(BookTag, { books: 1 }, { populate: ['books'] });
    expect(mock.mock.calls).toMatchSnapshot(); // FIXME: exact query might vary once fixed
  });

  test('query 3', async () => {
    const mock = mockLogger(orm);
    const tags3 = await orm.em.fork().find(BookTag, { id: 1 }, { populate: ['books'] });
    expect(mock.mock.calls).toMatchSnapshot();
  });
});
