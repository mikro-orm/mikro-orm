import { Collection, LoadStrategy, MikroORM, type EntityManager } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, b => b.author, { orphanRemoval: true })
  books = new Collection<Book>(this);

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;
}

let orm: MikroORM;
let flushes = 0;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book, Tag],
    dbName: ':memory:',
    subscribers: [{ beforeFlush: () => void flushes++ }],
  });
  await orm.schema.create();
  const tags = [orm.em.create(Tag, { id: 1, name: 't1' }), orm.em.create(Tag, { id: 2, name: 't2' })];
  orm.em.create(Author, {
    id: 1,
    name: 'a1',
    tags,
    books: [
      { id: 1, title: 'b1' },
      { id: 2, title: 'b2' },
    ],
  });
  orm.em.create(Author, { id: 2, name: 'a2', tags, books: [{ id: 3, title: 'b3' }] });
  await orm.em.flush();
});

beforeEach(() => {
  flushes = 0;
});

afterAll(async () => {
  await orm.close(true);
});

async function expectNoAutoFlush(em: EntityManager) {
  const uow = em.getUnitOfWork();
  expect(uow.getPersistStack().size).toBe(0);
  expect(uow.shouldAutoFlush(em.getMetadata(Book))).toBe(false);
  expect(uow.shouldAutoFlush(em.getMetadata(Tag))).toBe(false);
  await em.find(Book, {});
  await em.find(Tag, {});
  expect(flushes).toBe(0);
}

test.each([LoadStrategy.SELECT_IN, LoadStrategy.JOINED, LoadStrategy.BALANCED])(
  'loading collections via populate (%s) does not schedule an auto-flush',
  async strategy => {
    const em = orm.em.fork();
    const authors = await em.find(Author, {}, { populate: ['books', 'tags'], strategy });
    expect(authors[0].books).toHaveLength(2);
    expect(authors[0].tags).toHaveLength(2);
    await expectNoAutoFlush(em);
  },
);

test('loading collections via init() and loadItems() does not schedule an auto-flush', async () => {
  const em = orm.em.fork();
  const [a1, a2] = await em.find(Author, {}, { orderBy: { id: 1 } });
  await a1.books.init();
  await a1.tags.init();
  expect(await a2.books.loadItems()).toHaveLength(1);
  expect(await a2.tags.loadItems()).toHaveLength(2);
  await expectNoAutoFlush(em);
});

test('loading collections via em.populate() does not schedule an auto-flush', async () => {
  const em = orm.em.fork();
  const authors = await em.find(Author, {});
  await em.populate(authors, ['books', 'tags']);
  expect(authors[0].books).toHaveLength(2);
  await em.populate(authors, ['books', 'tags'], { refresh: true });
  await expectNoAutoFlush(em);
});

test('adding a new item to a loaded collection still auto-flushes', async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(Author, 1, { populate: ['books'] });
  author.books.add(em.create(Book, { id: 10, title: 'new', author }, { persist: false }));
  expect(em.getUnitOfWork().shouldAutoFlush(em.getMetadata(Book))).toBe(true);
  const books = await em.find(Book, {});
  expect(flushes).toBe(1);
  expect(books.map(b => b.title)).toContain('new');
  author.books.remove(b => b.id === 10);
  await em.flush();
});

test('moving a loaded item to another collection still auto-flushes', async () => {
  const em = orm.em.fork();
  const [a1, a2] = await em.find(Author, {}, { populate: ['books'], orderBy: { id: 1 } });
  const book = a1.books[0];
  a2.books.add(book);
  expect(em.getUnitOfWork().shouldAutoFlush(em.getMetadata(Book))).toBe(true);
  await em.find(Book, {});
  expect(flushes).toBe(1);
  expect(await em.fork().count(Book, { author: 2 })).toBe(2);
  a1.books.add(book);
  await em.flush();
});

test('loadCount() after a joined populate counts the items in the database', async () => {
  const a1 = await orm.em.fork().findOneOrFail(Author, 1, { populate: ['books'], strategy: LoadStrategy.JOINED });
  expect(a1.books).toHaveLength(2);
  expect(await a1.books.loadCount()).toBe(2);

  const a2 = await orm.em
    .fork()
    .findOneOrFail(
      Author,
      { id: 1, books: { title: 'b1' } },
      { populate: ['books'], populateWhere: 'infer', strategy: LoadStrategy.JOINED },
    );
  expect(a2.books).toHaveLength(1);
  expect(await a2.books.loadCount()).toBe(2);

  const a3 = await orm.em.fork().findOneOrFail(Author, 1, {
    populate: ['books'],
    populateFilter: { books: { title: 'b2' } },
    strategy: LoadStrategy.JOINED,
  });
  expect(a3.books).toHaveLength(1);
  expect(await a3.books.loadCount()).toBe(2);
});
