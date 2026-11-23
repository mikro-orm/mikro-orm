import { Collection, wrap } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Author {
  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;
}

@Entity()
class Tag {
  @PrimaryKey()
  code!: string;

  @Property()
  label!: string;

  @ManyToOne(() => Tag, { nullable: true })
  parent?: Tag;

  @OneToMany(() => Tag, tag => tag.parent)
  children = new Collection<Tag>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book, Tag],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('assign() updates a related entity with a zero primary key instead of replacing it', async () => {
  const em = orm.em.fork();
  em.create(Author, { id: 0, name: 'author', books: [{ id: 1, title: 'book' }] });
  em.create(Author, { id: 1, name: 'other', books: [{ id: 0, title: 'book' }] });
  await em.flush();
  em.clear();

  const book = await em.findOneOrFail(Book, 1, { populate: ['author'] });
  wrap(book).assign({ author: { id: 0, name: 'updated author' } });
  expect(book.author.name).toBe('updated author');

  const author = await em.findOneOrFail(Author, 1, { populate: ['books'] });
  const original = author.books[0];
  wrap(author).assign({ books: [{ id: 0, title: 'updated book' }] });
  expect(author.books[0]).toBe(original);
  expect(original.title).toBe('updated book');

  await em.flush();
  em.clear();

  expect((await em.findOneOrFail(Author, 0)).name).toBe('updated author');
  expect((await em.findOneOrFail(Book, 0)).title).toBe('updated book');
});

test('assign() updates a related entity with an empty string primary key instead of replacing it', async () => {
  const em = orm.em.fork();
  const b0 = em.create(Tag, { code: 'b', label: 'b' });
  const empty = em.create(Tag, { code: '', label: 'empty', parent: b0 });
  em.create(Tag, { code: 'a', label: 'a', parent: empty });
  await em.flush();
  em.clear();

  const a = await em.findOneOrFail(Tag, { code: 'a' }, { populate: ['parent'] });
  wrap(a).assign({ parent: { code: '', label: 'updated parent' } });
  expect(a.parent!.label).toBe('updated parent');

  await em.flush();
  em.clear();

  const b = await em.findOneOrFail(Tag, { code: 'b' }, { populate: ['children'] });
  const original = b.children[0];
  wrap(b).assign({ children: [{ code: '', label: 'updated child' }] });
  expect(b.children[0]).toBe(original);
  expect(original.label).toBe('updated child');

  await em.flush();
  em.clear();

  expect((await em.findOneOrFail(Tag, { code: '' })).label).toBe('updated child');
});
