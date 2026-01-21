import { MikroORM, Ref, Collection } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Unique, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

// Entity in custom schema
@Entity({ schema: 'custom_schema' })
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  uuid!: string;

  @Property()
  name!: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

}

@Entity({ schema: 'custom_schema' })
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author, { ref: true, targetKey: 'uuid' })
  author!: Ref<Author>;

}

describe('non-PK relation target with schema (postgres)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book],
      dbName: 'mikro_orm_test_non_pk_target',
    });
    await orm.schema.ensureDatabase();

    // Drop and recreate schema using schema generator
    await orm.schema.execute('drop schema if exists custom_schema cascade');
    await orm.schema.update({ schema: 'custom_schema' });
  });

  beforeEach(() => orm.em.clear());

  afterAll(() => orm.close(true));

  test('relation with targetKey in custom schema', async () => {
    // Create an author
    const author = orm.em.create(Author, { uuid: 'uuid-123', name: 'John Doe' });
    await orm.em.flush();
    orm.em.clear();

    // Load the author
    const loadedAuthor = await orm.em.findOneOrFail(Author, { name: 'John Doe' });
    expect(loadedAuthor.uuid).toBe('uuid-123');

    // Create a book with the author
    const book = orm.em.create(Book, {
      title: 'Test Book',
      author: loadedAuthor,
    });
    await orm.em.flush();
    orm.em.clear();

    // Load the book and verify the author reference works
    const loadedBook = await orm.em.findOneOrFail(Book, { title: 'Test Book' }, {
      populate: ['author'],
    });
    expect(loadedBook.author.unwrap().uuid).toBe('uuid-123');
    expect(loadedBook.author.unwrap().name).toBe('John Doe');
  });

  test('identity map key includes schema for alternate key', async () => {
    // Get a reference to author by uuid
    const authorRef = orm.em.getReference(Author, 'uuid-123', { key: 'uuid' });

    // Verify it's stored in identity map with the correct schema
    const identityMap = orm.em.getUnitOfWork().getIdentityMap();
    const keys = identityMap.keys();

    // Check that the key includes schema information
    const authorKey = keys.find(k => k.includes('Author') && k.includes('[uuid]'));
    expect(authorKey).toBeDefined();
    expect(authorKey).toContain('custom_schema'); // Should include schema in the key
  });

  test('getReference finds entity by alternate key with schema', async () => {
    // Load the book without populating author
    const book = await orm.em.findOneOrFail(Book, { title: 'Test Book' });
    expect(book.author.isInitialized()).toBe(false);

    // The author reference should have the uuid property set
    const authorRef = book.author.unwrap();
    expect(authorRef.uuid).toBe('uuid-123');

    // Populate and verify
    await orm.em.populate(book, ['author']);
    expect(book.author.isInitialized()).toBe(true);
    expect(book.author.unwrap().name).toBe('John Doe');
  });

  test('select-in strategy works with targetKey in custom schema', async () => {
    // Create another book
    const author = await orm.em.findOneOrFail(Author, { name: 'John Doe' });
    const book2 = orm.em.create(Book, {
      title: 'Second Book',
      author,
    });
    await orm.em.flush();
    orm.em.clear();

    // Load books with select-in strategy
    const books = await orm.em.find(Book, {}, {
      populate: ['author'],
      strategy: 'select-in',
      orderBy: { title: 'asc' },
    });

    expect(books).toHaveLength(2);
    // Both books should reference the same author instance
    expect(books[0].author.unwrap()).toBe(books[1].author.unwrap());
    expect(books[0].author.unwrap().uuid).toBe('uuid-123');
  });

});
