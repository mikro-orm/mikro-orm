import { Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

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

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
  const em = orm.em.fork();
  const a1 = em.create(Author, { id: 1, name: 'a', email: 'z' });
  const a2 = em.create(Author, { id: 2, name: 'b', email: 'y' });
  em.create(Book, { id: 1, title: 't1', author: a1 });
  em.create(Book, { id: 2, title: 't2', author: a2 });
  await em.flush();
});

afterAll(async () => orm.close(true));

const findAuthors = (dir: unknown) => orm.em.fork().find(Author, {}, { orderBy: { name: dir } as any });
const findBooks = (dir: unknown) => orm.em.fork().find(Book, {}, { orderBy: { author: dir } as any });

test('rejects an array as the order direction of a scalar property', async () => {
  await expect(findAuthors([{ email: 'asc' }])).rejects.toThrow(/Invalid order direction/);
  await expect(findAuthors([])).rejects.toThrow(/Invalid order direction/);
});

test('rejects an array as the order direction of a relation', async () => {
  await expect(findBooks([{ name: 'asc' }])).rejects.toThrow(/Invalid order direction/);
});

test('accepts a nested order map on a relation', async () => {
  const books = await findBooks({ email: 'asc' });
  expect(books.map(b => b.id)).toEqual([2, 1]);
});
