import { Entity, ManyToOne, MikroORM, PrimaryKey } from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

}

@Entity({ schema: 'books' })
class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  author!: User;

}

describe.each(['public', undefined] as string[])('mixing custom and default schema in relations', schema => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book, User],
      dbName: `6373`,
      schema,
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  afterAll(async () => {
    await orm.close();
  });

  test(`an entity can be persisted along with its related entities that exist in a different schema`, async () => {
    let book = new Book();
    book.author = new User();
    await orm.em.persistAndFlush(book);
    const userKey = schema ? `User-${schema}:1` : 'User-1';
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual([
      'User-public:1',
      'Book-books:1',
    ]);

    orm.em.clear();
    book = await orm.em.findOneOrFail(Book, book, { populate: ['author'], strategy: 'joined' });
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual([
      'Book-books:1',
      'User-public:1',
    ]);

    orm.em.clear();
    book = await orm.em.findOneOrFail(Book, book, { populate: ['author'], strategy: 'select-in' });

    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual([
      'Book-books:1',
      'User-public:1',
    ]);
  });
});
