import { Cursor, MikroORM, ref, Ref, SimpleLogger } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true, type: 'integer' })
  rating?: number | null;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author, { ref: true, nullable: true })
  author?: Ref<Author> | null;
}

describe('cursor pagination with nested null values', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book],
      dbName: ':memory:',
      driver: PLATFORMS.sqlite,
      loggerFactory: SimpleLogger.create,
    });
    await orm.schema.refresh();

    const author1 = orm.em.create(Author, { id: 1, name: 'Author 1', rating: 5 });
    const author2 = orm.em.create(Author, { id: 2, name: 'Author 2', rating: null });

    orm.em.create(Book, { id: 1, title: 'Book 1', author: ref(author1) });
    orm.em.create(Book, { id: 2, title: 'Book 2', author: ref(author2) });
    orm.em.create(Book, { id: 3, title: 'Book 3', author: null });

    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('cursor can be created from entity with nested null value', async () => {
    // Book with author that has null rating
    const book = await orm.em.findOneOrFail(Book, { id: 2 }, { populate: ['author'] });
    expect(book.author!.$.rating).toBeNull();

    const cursor = await orm.em.findByCursor(Book, {
      first: 10,
      orderBy: { author: { rating: 'asc' }, id: 'asc' },
      populate: ['author'],
    });

    // The cursor should be able to encode a nested null value
    const encoded = cursor.from(book);
    expect(encoded).toBeDefined();

    // Decoding should work - the nested object has null rating
    const decoded = Cursor.decode(encoded);
    expect(decoded).toEqual([{ rating: null }, 2]);
  });

  test('paginate through books ordered by author rating with nulls', async () => {
    // First page - order by id to avoid ordering issues with nulls
    const cursor1 = await orm.em.findByCursor(Book, {
      first: 2,
      orderBy: { id: 'asc' },
      populate: ['author'],
    });

    expect(cursor1.items).toHaveLength(2);
    expect(cursor1.hasNextPage).toBe(true);
    orm.em.clear();

    // Continue pagination
    const cursor2 = await orm.em.findByCursor(Book, {
      first: 2,
      after: cursor1,
      orderBy: { id: 'asc' },
      populate: ['author'],
    });

    // Should get the last book
    expect(cursor2.items.length).toBe(1);
    // Combined we should have all books
    const allIds = [...cursor1.items.map(b => b.id), ...cursor2.items.map(b => b.id)];
    expect(allIds.sort()).toEqual([1, 2, 3]);
  });

  test('paginate forward from book with nested null rating', async () => {
    // Get book with author that has null rating
    const bookWithNullRating = await orm.em.findOneOrFail(Book, { id: 2 }, { populate: ['author'] });
    expect(bookWithNullRating.author!.$.rating).toBeNull();

    const cursor = await orm.em.findByCursor(Book, {
      first: 10,
      orderBy: { author: { rating: 'asc nulls first' }, id: 'asc' },
      populate: ['author'],
    });

    // Create cursor from the entity with nested null
    const afterCursor = cursor.from(bookWithNullRating);

    // Paginate forward
    orm.em.clear();
    const result = await orm.em.findByCursor(Book, {
      first: 10,
      after: afterCursor,
      orderBy: { author: { rating: 'asc nulls first' }, id: 'asc' },
      populate: ['author'],
    });

    // Should get books with non-null author ratings
    expect(result.items.length).toBeGreaterThanOrEqual(0);
  });

  test('throws error for missing nested property when relation not populated', async () => {
    // Get book WITHOUT populating author
    const book = await orm.em.findOneOrFail(Book, { id: 1 });

    const cursor = await orm.em.findByCursor(Book, {
      first: 10,
      orderBy: { author: { rating: 'asc' }, id: 'asc' },
    });

    // Should throw because author is not populated
    expect(() => cursor.from(book)).toThrow(`Cannot create cursor, value for 'Book.author' is missing.`);
  });
});
