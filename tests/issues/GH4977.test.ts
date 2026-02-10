import { MikroORM, SimpleLogger, Collection, Ref, ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  constructor({ id, name }: { id?: number; name: string }) {
    if (id) {
      this.id = id;
    }
    this.name = name;
  }
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToOne(() => Author, { ref: true })
  author: Ref<Author>;

  @ManyToOne(() => Publisher, { ref: true })
  publisher!: Ref<Publisher>;

  constructor({ id, title, author }: { id?: number; title: string; author: Author | Ref<Author> }) {
    if (id) {
      this.id = id;
    }
    this.title = title;
    this.author = ref(author);
  }
}

@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, book => book.publisher)
  books = new Collection<Book, Publisher>(this);

  constructor({ id, name = 'asd' }: { id?: number; name?: string }) {
    if (id) {
      this.id = id;
    }
    this.name = name;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book],
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refresh();
  const authors = [
    new Author({ id: 1, name: 'a' }),
    new Author({ id: 2, name: 'b' }),
    new Author({ id: 3, name: 'c' }),
    new Author({ id: 4, name: 'd' }),
    new Author({ id: 5, name: 'e' }),
  ];
  orm.em.persist(authors);

  const publishers = [new Publisher({ id: 1, name: 'AAA' }), new Publisher({ id: 2, name: 'BBB' })];
  orm.em.persist(publishers);

  const books = [
    new Book({ id: 1, title: 'One', author: authors[0] }),
    new Book({ id: 2, title: 'Two', author: authors[0] }),
    new Book({ id: 3, title: 'Three', author: authors[1] }),
    new Book({ id: 4, title: 'Four', author: authors[2] }),
    new Book({ id: 5, title: 'Five', author: authors[2] }),
    new Book({ id: 6, title: 'Six', author: authors[2] }),
  ];
  books[0].publisher = ref(publishers[0]);
  books[1].publisher = ref(publishers[1]);
  books[2].publisher = ref(publishers[1]);
  books[3].publisher = ref(publishers[1]);
  books[4].publisher = ref(publishers[1]);
  books[5].publisher = ref(publishers[1]);
  orm.em.persist(books);

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('GH #4977', async () => {
  const author = await orm.em.findOneOrFail(Author, { id: 1 });
  const books = await author.books.loadItems({ populate: ['*'] });
  books.forEach(({ author, publisher }) => {
    expect(author.isInitialized()).toBeTruthy();
    expect(publisher.isInitialized()).toBeTruthy();
  });
  expect(books).toMatchSnapshot();
});
