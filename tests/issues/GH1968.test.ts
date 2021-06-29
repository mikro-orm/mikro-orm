import { BigIntType, Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
class Author {

  @PrimaryKey({ type: BigIntType })
  id?: string;

  @Property()
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany({ entity: () => Book, mappedBy: (book: Book) => book.author, orphanRemoval: true })
  books: Collection<Book> = new Collection<Book>(this);

}

@Entity()
class Book {

  @PrimaryKey({ type: BigIntType })
  id?: string;

  @Property()
  name!: string;

  @ManyToOne({ entity: () => Author })
  author!: Author;

}

describe('GH issue 1968', () => {
  let orm: MikroORM;

  beforeEach(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: ':memory:',
      type: 'sqlite',
    });

    await orm.getSchemaGenerator().createSchema();
    const author = orm.em.create(Author, {
      name: 'Stephen King',
      books: [{ name: 'b1' }, { name: 'b1' }, { name: 'b1' }],
    });
    await orm.em.fork().persistAndFlush(author);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('serialize object graph with bigints', async () => {
    const stephenKing = await orm.em.findOne(Author, { name: 'Stephen King' }, { populate: ['books'] });
    expect(JSON.stringify(stephenKing)).toBe('{"id":"1","name":"Stephen King","books":[{"id":"1","name":"b1","author":"1"},{"id":"2","name":"b1","author":"1"},{"id":"3","name":"b1","author":"1"}]}');
  });

});
