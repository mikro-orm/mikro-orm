import { MikroORM, Ref, Collection } from '@mikro-orm/postgresql';
import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Unique,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  uuid!: string;

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author, { ref: true, targetKey: 'uuid' })
  author!: Ref<Author>;
}

describe('non-PK relation target (targetKey)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book],
      dbName: 'mikro_orm_test_non_pk_target',
    });
    await orm.schema.ensureDatabase();
    await orm.schema.refresh();

    const author = orm.em.create(Author, { uuid: 'uuid-123', name: 'John Doe' });
    orm.em.create(Book, { title: 'My Book', author });
    await orm.em.flush();
  });

  beforeEach(() => orm.em.clear());

  afterAll(() => orm.close(true));

  test('creating book with author reference by uuid', async () => {
    const loadedBook = await orm.em.findOneOrFail(Book, { title: 'My Book' });
    expect(loadedBook.author.unwrap().uuid).toBe('uuid-123');
  });

  test('populate author with select-in strategy', async () => {
    const book = await orm.em.findOneOrFail(Book, { title: 'My Book' });
    expect(book.author.isInitialized()).toBe(false);

    await orm.em.populate(book, ['author'], { strategy: 'select-in' });
    expect(book.author.isInitialized()).toBe(true);
    expect(book.author.unwrap().uuid).toBe('uuid-123');
    expect(book.author.unwrap().name).toBe('John Doe');
  });

  test('populate inverse oneToMany uses targetKey on owning side', async () => {
    const author = await orm.em.findOneOrFail(Author, { name: 'John Doe' });
    expect(author.books.isInitialized()).toBe(false);

    await orm.em.populate(author, ['books']);
    expect(author.books.isInitialized()).toBe(true);
    expect(author.books.getItems()).toHaveLength(1);
    expect(author.books.getItems()[0].title).toBe('My Book');
  });

  test('find author with populate books uses targetKey', async () => {
    const author = await orm.em.findOneOrFail(Author, { name: 'John Doe' }, { populate: ['books'] });
    expect(author.books.getItems()).toHaveLength(1);
    expect(author.books.getItems()[0].title).toBe('My Book');
  });

  test('collection.load uses targetKey on owning side', async () => {
    const author = await orm.em.findOneOrFail(Author, { name: 'John Doe' });
    const books = await author.books.loadItems();
    expect(books).toHaveLength(1);
    expect(books[0].title).toBe('My Book');
  });
});
