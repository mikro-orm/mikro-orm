import { Cascade, Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => Book, b => b.publisher)
  books = new Collection<Book>(this);
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => Book, b => b.author, { cascade: [Cascade.PERSIST, Cascade.REMOVE] })
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToOne(() => Publisher, { nullable: true })
  publisher?: Publisher;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book, Publisher],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const author = orm.em.create(Author, { id: 1 });
  const publisher = orm.em.create(Publisher, { id: 1 });

  for (let i = 1; i <= 10; i++) {
    orm.em.create(Book, { id: i, title: `book ${i}`, author, publisher: i % 2 ? publisher : undefined });
  }

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

function expectIndexes(coll: Collection<Book>, ids: number[]) {
  const items = coll.getItems(false);
  expect(items.map(b => b.id)).toEqual(ids);
  expect(coll.length).toBe(ids.length);
  expect(coll.count()).toBe(ids.length);
  expect(Object.keys(coll).filter(key => /^\d+$/.test(key))).toEqual(ids.map((_, i) => String(i)));
  items.forEach((item, i) => expect((coll as any)[i]).toBe(item));
}

test('em.remove() of many collection items updates the array indexes of each loaded collection', async () => {
  const author = await orm.em.findOneOrFail(Author, 1, { populate: ['books'] });
  const publisher = await orm.em.findOneOrFail(Publisher, 1, { populate: ['books'] });
  expectIndexes(publisher.books, [1, 3, 5, 7, 9]);

  orm.em.remove(author.books.getItems().filter(b => b.id <= 3 || b.id === 7 || b.id === 10));
  expectIndexes(author.books, [4, 5, 6, 8, 9]);
  expectIndexes(publisher.books, [5, 9]);
  expect(author.books.isDirty()).toBe(true);
  expect(publisher.books.isDirty()).toBe(true);

  await orm.em.flush();
  expectIndexes(author.books, [4, 5, 6, 8, 9]);
  expectIndexes(publisher.books, [5, 9]);
  expect(await orm.em.fork().count(Book)).toBe(5);
});

test('em.remove() of all collection items clears the array indexes', async () => {
  const author = await orm.em.findOneOrFail(Author, 1, { populate: ['books'] });

  orm.em.remove(author.books.getItems());
  expectIndexes(author.books, []);

  await orm.em.flush();
  expect(await orm.em.fork().count(Book)).toBe(0);
});

test('em.remove() keeps the indexes in sync when it throws on an invalid item', async () => {
  const author = await orm.em.findOneOrFail(Author, 1, { populate: ['books'] });
  const [b1, b2] = author.books.getItems();

  expect(() => orm.em.remove([b1, b2, {} as Book])).toThrow(
    `You need to pass entity instance or reference to 'em.remove()'`,
  );
  expectIndexes(author.books, [3, 4, 5, 6, 7, 8, 9, 10]);
});

test('cascade remove updates the array indexes of the other loaded collections', async () => {
  const other = orm.em.create(Author, { id: 2 });
  orm.em.create(Book, { id: 11, title: 'book 11', author: other, publisher: 1 });
  await orm.em.flush();
  orm.em.clear();

  const author = await orm.em.findOneOrFail(Author, 1, { populate: ['books'] });
  const publisher = await orm.em.findOneOrFail(Publisher, 1, { populate: ['books'] });
  expectIndexes(publisher.books, [1, 3, 5, 7, 9, 11]);

  orm.em.remove(author);
  await orm.em.flush();

  expectIndexes(author.books, []);
  expectIndexes(publisher.books, [11]);
  expect(await orm.em.fork().count(Book)).toBe(1);
});

test('removing many items reassigns the array indexes once per collection', async () => {
  const author = await orm.em.findOneOrFail(Author, 1, { populate: ['books'] });
  await orm.em.findOneOrFail(Publisher, 1, { populate: ['books'] });
  const reindex = vi.spyOn(Collection.prototype, 'reindex');

  orm.em.remove(author.books.getItems().slice(0, 4));
  expect(reindex).toHaveBeenCalledTimes(2);

  reindex.mockClear();
  orm.em.remove(author);
  await orm.em.flush();
  expect(reindex).toHaveBeenCalledTimes(2);
  reindex.mockRestore();
});
