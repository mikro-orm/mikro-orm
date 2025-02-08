import { Entity, ManyToOne, MikroORM, PrimaryKey, Property, Utils, AbstractSqlDriver } from '@mikro-orm/knex';
import { PLATFORMS } from '../bootstrap';

@Entity()
class Author {

  @PrimaryKey({ name: 'author_id' })
  id!: number;

}

@Entity()
class Book {

  @PrimaryKey({ name: 'book_id' })
  id!: number;

  @ManyToOne(() => Author)
  author!: Author;

  @Property({ default: 1 })
  value?: number;

}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'batch-insert', port: 3308 },
  mariadb: { dbName: 'batch-insert', port: 3309 },
  postgresql: { dbName: 'batch-insert' },
};

describe.each(Utils.keys(options))('batch insert [%s]',  type => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Author, Book],
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  afterAll(() => orm.close());

  test('mapping of PKs with custom field name', async () => {
    const authors = [new Author(), new Author(), new Author()];
    const books = [new Book(), new Book(), new Book()];
    books[1].value = 2;
    books.forEach((b, idx) => b.author = authors[idx]);
    await orm.em.persist(books).flush();
    expect(authors.map(a => a.id)).toEqual([1, 2, 3]);
    expect(books.map(b => b.id)).toEqual([1, 2, 3]);
    expect(books.map(b => b.value)).toEqual([1, 2, 1]);
  });

  test('QB and custom field name', async () => {
    const res = await orm.em.qb(Author).insert([{}, {}, {}]);

    expect(res).toMatchObject({
      affectedRows: 3,
    });

    if (!['mysql', 'mariadb'].includes(type)) {
      for (const row of res.rows!) {
        expect(row.author_id).toBeDefined();
      }
    }
  });
});
