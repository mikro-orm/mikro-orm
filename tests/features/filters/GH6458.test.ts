import { Collection, Entity, Filter, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
@Filter({ name: 'soft-delete', cond: { deletedAt: null }, default: true })
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  @Property({ nullable: true })
  deletedAt: Date | null = null;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
@Filter({ name: 'soft-delete', cond: { deletedAt: null }, default: true })
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToOne(() => Author, { nullable: true })
  author!: Author;

  @Property({ type: Date, nullable: true })
  deletedAt: Date | null = null;

  constructor(title: string) {
    this.title = title;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6458', async () => {
  const king = orm.em.create(Author, { name: 'Stephen King' });
  orm.em.create(Book, { title: 'The Stand', author: king, deletedAt: new Date() });
  const tolkien = orm.em.create(Author, { name: 'Tolkien', deletedAt: new Date() });
  orm.em.create(Book, { title: 'The Hobbit', author: tolkien });
  await orm.em.flush();
  orm.em.clear();

  // When finding a book by a deleted author, it should return an empty array.
  const result1 = await orm.em.find(
    Book,
    { author: { name: 'Tolkien' } },
    { populate: ['author'] },
  );
  expect(result1).toHaveLength(0);

  // When finding an author by the title of a deleted book, it should return an empty array.
  const result2 = await orm.em.find(
    Author,
    { books: { title: 'The Stand' } },
  );
  expect(result2).toHaveLength(0);

  // When finding an author by the title of a deleted book, it should return an empty array.
  const result3 = await orm.em.find(
    Author,
    { books: { title: 'The Stand' } },
    { populate: ['books'] },
  );
  expect(result3).toHaveLength(0);
});
