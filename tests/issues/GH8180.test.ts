import { Collection, MikroORM, PopulateHint, Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true, nullable: true })
  author?: Ref<Author>;

  @OneToMany(() => Review, r => r.book)
  reviews = new Collection<Review>(this);
}

@Entity()
class Review {
  @PrimaryKey()
  id!: number;

  @Property()
  rating!: number;

  @ManyToOne(() => Book, { ref: true })
  book!: Ref<Book>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book, Review],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const em = orm.em.fork();
  await em.insertMany(Author, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  await em.insertMany(Book, [
    { id: 100, author: 3 },
    { id: 101, author: 2 },
  ]);
  // book 100 is matched by the `reviews` branch, book 101 by the `author` branch only
  await em.insertMany(Review, [
    { id: 1000, rating: 5, book: 100 },
    { id: 1002, rating: 1, book: 101 },
  ]);
});

afterAll(async () => {
  await orm.close(true);
});

test('populate where with `$or` keeps the disjunction when loading a nested to-many relation', async () => {
  const em = orm.em.fork();
  const authors = await em.find(Author, {}, { orderBy: { id: 'asc' } });
  const mock = mockLogger(orm);

  await em.populate(authors, ['books.reviews'], {
    strategy: 'select-in',
    where: {
      books: {
        $or: [{ reviews: { rating: 5 } }, { author: { $in: [2] } }],
      },
    },
  });

  const queries: string[] = mock.mock.calls.map(call => call[0]);
  const bookQuery = queries.find(query => query.includes('from `book`'))!;
  const reviewQuery = queries.find(query => query.includes('from `review`'))!;

  // the collection query keeps both branches of the disjunction
  expect(bookQuery).toMatch(/`r1`\.`rating` = 5 or `b0`\.`author_id` in \(2\)/);
  expect(authors.map(author => author.books.getIdentifiers())).toEqual([[], [101], [100]]);

  // the nested populate must not apply one branch of the `$or` on its own
  expect(reviewQuery).not.toMatch(/`rating` = 5/);
  const books = authors.flatMap(author => author.books.getItems());
  expect(books.map(book => [book.id, book.reviews.getIdentifiers()])).toEqual([
    [101, [1002]],
    [100, [1000]],
  ]);
});

test('find with an inferred `$or` on a to-many relation does not narrow the collection by one branch', async () => {
  const em = orm.em.fork();
  const mock = mockLogger(orm);

  const authors = await em.find(
    Author,
    { $or: [{ books: { author: { $in: [2] } } }, { id: 3 }] },
    { populate: ['books'], populateWhere: PopulateHint.INFER, strategy: 'select-in', orderBy: { id: 'asc' } },
  );

  // author 3 matched via the `id` branch only, its collection must stay complete
  expect(authors.map(author => author.books.getIdentifiers())).toEqual([[101], [100]]);

  const queries: string[] = mock.mock.calls.map(call => call[0]);
  const bookQuery = queries.find(query => query.includes('from `book` as `b0`'))!;
  expect(bookQuery).not.toMatch(/`author_id` in \(2\)/);
});

test('joined strategy with an inferred `$or` on a to-many relation does not narrow the collection by one branch', async () => {
  const em = orm.em.fork();
  const mock = mockLogger(orm);

  const authors = await em.find(
    Author,
    { $or: [{ books: { author: { $in: [2] } } }, { id: 3 }] },
    { populate: ['books'], populateWhere: PopulateHint.INFER, strategy: 'joined', orderBy: { id: 'asc' } },
  );

  expect(authors.map(author => author.books.getIdentifiers())).toEqual([[101], [100]]);

  const queries: string[] = mock.mock.calls.map(call => call[0]);
  expect(queries[0]).not.toMatch(/on `a0`\.`id` = `b1`\.`author_id` and /);
});
