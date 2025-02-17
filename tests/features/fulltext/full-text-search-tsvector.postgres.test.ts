import { Entity, Index, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { FullTextType, PostgreSqlDriver, WeightedFullTextValue } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

const createWeightedValue = (book: Book): WeightedFullTextValue => ({ A: book.title!, B: book.description! });

@Entity({ tableName: 'book' })
export class Book {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'string', nullable: true })
  title!: string | null;

  @Property({ type: 'string', nullable: true })
  description!: string | null;

  @Index({ type: 'fulltext' })
  @Property({ type: FullTextType, nullable: true, onUpdate: (book: Book) => book.title, onCreate: (book: Book) => book.title })
  searchableTitle!: string;

  @Index({ type: 'fulltext' })
  @Property({ type: 'tsvector', nullable: true, onUpdate: (book: Book) => book.title, onCreate: (book: Book) => book.title })
  searchableTitleNoType!: string;

  @Index({ type: 'fulltext' })
  @Property({ type: new FullTextType('english'), nullable: true, onUpdate: (book: Book) => book.title, onCreate: (book: Book) => book.title })
  searchableTitleEnglish!: string;

  @Index({ type: 'fulltext' })
  @Property({ type: FullTextType, nullable: true, onUpdate: createWeightedValue, onCreate: createWeightedValue })
  searchableTitleWeighted!: WeightedFullTextValue;

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
    const repo = orm.em.getRepository(Book);

    const book1 = new Book('My Life on The ? Wall, part 1');
    await orm.em.persist(book1).flush();
    const mock = mockLogger(orm);
    await orm.em.persist(book1).flush();
    expect(mock).not.toHaveBeenCalled();

    const fullTextBooks = (await repo.find({ searchableTitle: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks.length).toBe(1);

    const fullTextBooks2 = (await repo.find({ searchableTitleNoType: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks2).toHaveLength(1);
  });

  test('load entities (multi)', async () => {
    const repo = orm.em.getRepository(Book);

    const book1 = new Book('My Life on The ? Wall, part 1');
    const book2 = new Book('My Life on The Wall, part 2');
    const book3 = new Book('My Life on The Wall, part 3');
    const book4 = new Book('My Death on The Wall');
    const book5 = new Book('My Life on The House');
    const book6 = new Book(null);

    orm.em.persist([book1, book2, book3, book4, book5, book6]);
    await orm.em.flush();

    const fullTextBooks = (await repo.find({ searchableTitle: { $fulltext: 'life wall' } }))!;
    expect(fullTextBooks).toHaveLength(3);
  });

  test('update entity', async () => {
    const book1 = new Book('My Life on The Wall');
    await orm.em.persist(book1).flush();

    const newTitle = 'My Life on The ? Wall, part ? ?';
    book1.title = newTitle;
    await orm.em.flush();
    orm.em.clear();

    const reloadedBook = await orm.em.findOne(Book, { id: book1.id });
    expect(reloadedBook?.title).toBe(newTitle);
  });

  test('should insert/update entities with custom regconfig + weighted', async () => {
    const repo = orm.em.getRepository(Book);

    const book = new Book('My Life on The ? Wall, part 1');
    orm.em.persist(book);

    const mock = mockLogger(orm);

    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "book" ("title", "searchable_title", "searchable_title_no_type", "searchable_title_english", "searchable_title_weighted") values ('My Life on The ? Wall, part 1', to_tsvector('simple', 'My Life on The ? Wall, part 1'), to_tsvector('simple', 'My Life on The ? Wall, part 1'), to_tsvector('english', 'My Life on The ? Wall, part 1'), setweight(to_tsvector('simple', 'My Life on The ? Wall, part 1'), 'A')) returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`commit`);

    book.title = 'Test title';
    book.description = 'Test description of book';

    mock.mockReset();

    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`update "book" set "title" = 'Test title', "description" = 'Test description of book', "searchable_title" = to_tsvector('simple', 'Test title'), "searchable_title_no_type" = to_tsvector('simple', 'Test title'), "searchable_title_english" = to_tsvector('english', 'Test title'), "searchable_title_weighted" = setweight(to_tsvector('simple', 'Test title'), 'A') || setweight(to_tsvector('simple', 'Test description of book'), 'B') where "id" = 1`);
    expect(mock.mock.calls[2][0]).toMatch(`commit`);
  });

  test('should insert null when empty weight object is used', async () => {
    const repo = orm.em.getRepository(Book);

    const book = new Book('My Life on The ? Wall, part 1');
    orm.em.persist(book);

    book.searchableTitleWeighted = {};

    const mock = mockLogger(orm);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "book" ("title", "searchable_title", "searchable_title_no_type", "searchable_title_english", "searchable_title_weighted") values ('My Life on The ? Wall, part 1', to_tsvector('simple', 'My Life on The ? Wall, part 1'), to_tsvector('simple', 'My Life on The ? Wall, part 1'), to_tsvector('english', 'My Life on The ? Wall, part 1'), default) returning "id`);
    expect(mock.mock.calls[2][0]).toMatch(`commit`);

    orm.em.clear();

    const book2 = new Book('My Life on The ? Wall, part 1');
    orm.em.persist(book2);

    book2.searchableTitleWeighted = { A: undefined };

    mock.mockClear();
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "book" ("title", "searchable_title", "searchable_title_no_type", "searchable_title_english", "searchable_title_weighted") values ('My Life on The ? Wall, part 1', to_tsvector('simple', 'My Life on The ? Wall, part 1'), to_tsvector('simple', 'My Life on The ? Wall, part 1'), to_tsvector('english', 'My Life on The ? Wall, part 1'), default) returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`commit`);
  });

  test('should throw error when invalid weight is used', async () => {
    const repo = orm.em.getRepository(Book);

    const book = new Book('My Life on The ? Wall, part 1');
    orm.em.persist(book);

    // Cast to any as directly assigning this property is typechecked.
    // However, when updating from onUpdate or onCreate,
    // the value is not type checked and therefore should
    // throw an error when an invalid object is passed
    book.searchableTitleWeighted = { E: 'invalid weight' } as any;

    await expect(orm.em.flush()).rejects.toThrow('Weight should be one of A, B, C, D.');
  });

  test('should find entities with custom regconfig', async () => {
    const repo = orm.em.getRepository(Book);

    const book = new Book('My Life on The ? Wall, part 1');
    orm.em.persist(book);
    await orm.em.flush();

    orm.em.clear();

    const mock = mockLogger(orm);

    const fullTextBooks = (await repo.find({ searchableTitle: { $fulltext: 'life wall' } }))!;
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".* from "book" as "b0" where "b0"."searchable_title" @@ plainto_tsquery('simple', 'life wall')`);
    expect(fullTextBooks).toHaveLength(1);
    mock.mockReset();

    const fullTextBooks2 = (await repo.find({ searchableTitleEnglish: { $fulltext: 'life wall' } }))!;
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".* from "book" as "b0" where "b0"."searchable_title_english" @@ plainto_tsquery('english', 'life wall')`);
    expect(fullTextBooks2).toHaveLength(1);
    mock.mockReset();

    const fullTextBooks3 = (await repo.find({ searchableTitleWeighted: { $fulltext: 'life wall' } }))!;
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".* from "book" as "b0" where "b0"."searchable_title_weighted" @@ plainto_tsquery('simple', 'life wall')`);
    expect(fullTextBooks3).toHaveLength(1);
  });

});
