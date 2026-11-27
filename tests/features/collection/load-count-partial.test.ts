import { Collection, LoadStrategy, MikroORM } from '@mikro-orm/sqlite';
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
class Author {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  @OneToMany(() => Book, b => b.author, { where: { title: 'foo' } })
  fooBooks = new Collection<Book>(this);

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  @ManyToMany({ entity: () => Tag, pivotTable: 'author_tags', where: { name: 'foo' } })
  fooTags = new Collection<Tag>(this);
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

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author, Book, Tag],
    dbName: ':memory:',
  });
  await orm.schema.create();
  const em = orm.em.fork();
  const author = em.create(Author, { id: 1 });

  for (let i = 1; i <= 5; i++) {
    em.create(Book, { id: i, title: i <= 2 ? 'foo' : 'bar', author });
    author.tags.add(em.create(Tag, { id: i, name: i <= 2 ? 'foo' : 'bar' }));
  }

  await em.flush();
});

afterAll(() => orm.close(true));

test.each([LoadStrategy.SELECT_IN, LoadStrategy.BALANCED, LoadStrategy.JOINED])(
  'loadCount after populateWhere (%s)',
  async strategy => {
    const a = await orm.em.fork().findOneOrFail(Author, 1, {
      populate: ['books', 'tags'],
      populateWhere: { books: { title: 'foo' }, tags: { name: 'foo' } },
      strategy,
    });
    expect(a.books).toHaveLength(2);
    expect(a.tags).toHaveLength(2);
    expect(await a.books.loadCount()).toBe(5);
    expect(await a.tags.loadCount()).toBe(5);
  },
);

test('loadCount after init with where', async () => {
  const a = await orm.em.fork().findOneOrFail(Author, 1);
  await a.books.init({ where: { title: 'foo' } });
  await a.tags.init({ where: { name: 'foo' } });
  expect(a.books).toHaveLength(2);
  expect(await a.books.loadCount()).toBe(5);
  expect(await a.tags.loadCount()).toBe(5);
});

test('loadCount after a full load uses the loaded length', async () => {
  const a = await orm.em.fork().findOneOrFail(Author, 1, { populate: ['books'] });
  expect(await a.books.loadCount()).toBe(5);
});

test('loadCount after matching with store', async () => {
  const a = await orm.em.fork().findOneOrFail(Author, 1);
  await a.books.matching({ where: { title: 'foo' }, store: true });
  expect(a.books).toHaveLength(2);
  expect(await a.books.loadCount()).toBe(5);
});

test.each([false, true])('loadCount with a property-level where (dataloader: %s)', async dataloader => {
  const a = await orm.em.fork().findOneOrFail(Author, 1);
  const b = await orm.em.fork().findOneOrFail(Author, 1, { populate: ['fooBooks'] });
  expect(await a.fooBooks.loadCount({ dataloader })).toBe(2);
  expect(await b.fooBooks.loadCount({ dataloader })).toBe(2);
  expect(await a.fooBooks.loadCount({ dataloader, where: { id: 1 } })).toBe(1);
});

test.each([false, true])('loadCount with a property-level where on M:N (dataloader: %s)', async dataloader => {
  const a = await orm.em.fork().findOneOrFail(Author, 1);
  const b = await orm.em.fork().findOneOrFail(Author, 1, { populate: ['fooTags'] });
  expect(await a.fooTags.loadCount({ dataloader })).toBe(2);
  expect(await b.fooTags.loadCount({ dataloader })).toBe(2);
  expect(await a.fooTags.loadCount({ dataloader, where: { id: 1 } })).toBe(1);
  expect(await a.tags.loadCount({ dataloader, where: { name: 'foo' } })).toBe(2);
});
