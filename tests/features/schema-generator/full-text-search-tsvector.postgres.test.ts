import { Entity, Index, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { PostgreSqlDriver, SchemaGenerator } from '@mikro-orm/postgresql';
import { FullTextType } from '@mikro-orm/postgresql';

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
  let generator: SchemaGenerator;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book],
      dbName: `mikro_orm_test_tsvector`,
      type: 'postgresql',
    });
    generator = orm.schema;
    await generator.ensureDatabase();
    await generator.execute('drop table if exists book');
    await generator.createSchema();
  });

  afterAll(() => orm.close(true));

  test('load entities', async () => {
    const repo = orm.em.getRepository(Book);

    const book1 = new Book('My Life on The Wall, part 1');
    const book2 = new Book('My Life on The Wall, part 2');
    const book3 = new Book('My Life on The Wall, part 3');
    const book4 = new Book('My Death on The Wall');
    const book5 = new Book('My Life on The House');
    const book6 = new Book(null);

    repo.persist([book1, book2, book3, book4, book5, book6]);
    await repo.flush();

    const fullTextBooks = (await repo.find({ searchableTitle: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks.length).toBe(3);
  });

});
