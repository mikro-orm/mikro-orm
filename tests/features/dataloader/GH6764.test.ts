import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Test {
  @PrimaryKey()
  id!: number;
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Test)
  test!: Test;

  @OneToMany(() => Book, item => item.author, { cascade: [], orphanRemoval: true })
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne({ entity: () => Author, strategy: 'joined', deleteRule: 'cascade' })
  author!: Author;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('collection item can be removed in a clean transaction, and afterwards the collection can be retrieved with the remaining items reloaded', async () => {
  const author = orm.em.create(Author, { name: 'test author', test: {} });
  const book1 = orm.em.create(Book, { title: 'book 1', author });
  const book2 = orm.em.create(Book, { title: 'book 2', author });
  const book3 = orm.em.create(Book, { title: 'book 3', author });
  const t2 = new Test();
  await orm.em.persist([book1, book2, book3, t2]).flush();

  await orm.em.transactional(
    async em => {
      const book = await em.findOneOrFail(Book, { title: 'book 1' });
      await em.remove(book).flush();

      const nestedAuthor = await em.findOneOrFail(Author, { id: author.id });
      nestedAuthor.name = 'new name';
      nestedAuthor.test = t2;
      const books: { title: string }[] = await nestedAuthor.books.loadItems();
      expect(books.map(b => b.title)).toEqual(['book 2', 'book 3']);
    },
    { clear: true },
  );

  expect(author.name).toBe('new name');
  expect(author.test.id).toBe(t2.id);
  expect(author.test).toBe(t2);
  expect(await orm.em.findOne(Book, { title: 'book 1' })).toBeNull();

  const booksBeforeReload: { title: string }[] = author.books.getItems();
  expect(booksBeforeReload.map(b => b.title)).toEqual(['book 1', 'book 2', 'book 3']);

  const booksAfterReload: { title: string }[] = await author.books.loadItems({ refresh: true });
  expect(booksAfterReload.map(b => b.title)).toEqual(['book 2', 'book 3']);
});
