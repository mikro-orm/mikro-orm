import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, serialize } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: bigint;

  @Property()
  name!: string;

  @OneToMany({ entity: () => Book, mappedBy: (book: Book) => book.author, orphanRemoval: true })
  books: Collection<Book> = new Collection<Book>(this);

}

@Entity()
class Book {

  @PrimaryKey()
  id!: bigint;

  @Property()
  name!: string;

  @ManyToOne({ entity: () => Author })
  author!: Author;

}

let orm: MikroORM;

beforeEach(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: ':memory:',
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('serialize object graph with bigints (GH #1968)', async () => {
  orm.em.create(Author, {
    name: 'Stephen King',
    books: [{ name: 'b1' }, { name: 'b1' }, { name: 'b1' }],
  });
  await orm.em.flush();
  orm.em.clear();

  const stephenKing1 = await orm.em.fork().findOneOrFail(Author, { name: 'Stephen King' }, { populate: ['books'] });
  expect(JSON.stringify(stephenKing1)).toBe('{"id":"1","name":"Stephen King","books":[{"id":"1","name":"b1","author":"1"},{"id":"2","name":"b1","author":"1"},{"id":"3","name":"b1","author":"1"}]}');
  expect(serialize(stephenKing1, { populate: ['books'] })).toEqual({
    id: '1',
    name: 'Stephen King',
    books: [
      { id: '1', name: 'b1', author: '1' },
      { id: '2', name: 'b1', author: '1' },
      { id: '3', name: 'b1', author: '1' },
    ],
  });

  const stephenKing2 = await orm.em.fork().findOneOrFail(Author, { name: 'Stephen King' }, { populate: ['books:ref'] });
  expect(JSON.stringify(stephenKing2)).toBe('{"id":"1","name":"Stephen King","books":["1","2","3"]}');
  expect(serialize(stephenKing2, { populate: ['books:ref'] })).toEqual({ id: '1', name: 'Stephen King', books: ['1', '2', '3'] });
});
