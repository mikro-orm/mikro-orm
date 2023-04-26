import { Entity, Index, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { FullTextType, PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity({ tableName: 'book' })
export class Book {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'string', nullable: true })
  title!: string | null;

  @Index({ type: 'fulltext' })
  @Property({ type: FullTextType, nullable: true, onUpdate: (book: Book) => book.title, onCreate: (book: Book) => book.title })
  searchableTitle!: string;

  constructor(title: string | null) {
    this.title = title;
  }

}

describe('full text search tsvector in postgres', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book],
      dbName: `mikro_orm_test_tsvector`,
      driver: PostgreSqlDriver,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists book');
    await orm.schema.createSchema();
  });

  beforeEach(() => orm.schema.clearDatabase());
  afterAll(() => orm.close(true));

  test('load entities', async () => {
    const book1 = new Book('My Life on The ? Wall, part 1');
    await orm.em.persist(book1).flush();

    const repo = orm.em.getRepository(Book);
    const fullTextBooks = (await repo.find({ searchableTitle: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks.length).toBe(1);
  });

  test('load entities (multi)', async () => {
    const book1 = new Book('My Life on The ? Wall, part 1');
    const book2 = new Book('My Life on The Wall, part 2');
    const book3 = new Book('My Life on The Wall, part 3');
    const book4 = new Book('My Death on The Wall');
    const book5 = new Book('My Life on The House');
    const book6 = new Book(null);

    await orm.em.persist([book1, book2, book3, book4, book5, book6]).flush();

    const repo = orm.em.getRepository(Book);
    const fullTextBooks = (await repo.find({ searchableTitle: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks).toHaveLength(3);
  });

});
