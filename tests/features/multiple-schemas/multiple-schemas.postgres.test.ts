import { BaseEntity, Cascade, Collection, Entity, LockMode, ManyToMany, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';
import { EntityGenerator } from '@mikro-orm/entity-generator';

@Entity({ schema: 'n1' })
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Author, undefined, { nullable: true })
  mentor?: Author;

  @OneToMany(() => Book, e => e.author, { cascade: [Cascade.REMOVE, Cascade.PERSIST] })
  books = new Collection<Book>(this);

}

@Entity({ schema: '*' })
export class BookTag extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

}

@Entity({ schema: '*' })
export class Book extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @ManyToOne(() => Author, { nullable: true, deleteRule: 'cascade' })
  author?: Author;

  @ManyToOne(() => Book, { nullable: true })
  basedOn?: Book;

  @ManyToMany(() => BookTag, undefined, { cascade: [Cascade.ALL] })
  tags = new Collection<BookTag>(this);

}

describe('multiple connected schemas in postgres', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeEach(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book, BookTag],
      dbName: `mikro_orm_test_multi_schemas`,
      driver: PostgreSqlDriver,
      extensions: [EntityGenerator],
    });
    await orm.schema.ensureDatabase();

    for (const ns of ['n1', 'n2', 'n3', 'n4', 'n5']) {
      await orm.schema.execute(`drop schema if exists ${ns} cascade`);
    }

    // `*` schema will be ignored
    await orm.schema.updateSchema(); // `*` schema will be ignored

    // we need to pass schema for book
    await orm.schema.updateSchema({ schema: 'n2' });
    await orm.schema.updateSchema({ schema: 'n3' });
    await orm.schema.updateSchema({ schema: 'n4' });
    await orm.schema.updateSchema({ schema: 'n5' });
    orm.config.set('schema', 'n2'); // set the schema so we can work with book entities without options param
  });

  afterEach(async () => {
    await orm.close(true);
  });

  // if we have schema specified on entity level, it only exists in that schema
  // if we have * schema on entity, it can exist in any schema, always controlled by the parameter
  // no schema on entity - default schema or from global orm config
  test('should work', async () => {
    let author = new Author();
    author.name = 'a1';
    author.books.add(new Book(), new Book(), new Book());
    author.books[0].tags.add(new BookTag(), new BookTag(), new BookTag());
    author.books[1].basedOn = author.books[0];
    author.books[1].tags.add(new BookTag(), new BookTag(), new BookTag());
    author.books[2].basedOn = author.books[0];
    author.books[2].tags.add(new BookTag(), new BookTag(), new BookTag());

    // schema not specified yet, will be used from metadata
    expect(wrap(author).getSchema()).toBeUndefined();
    await orm.em.persistAndFlush(author);

    // schema is saved after flush
    expect(wrap(author).getSchema()).toBe('n1');
    expect(wrap(author.books[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[0].tags[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[1]).getSchema()).toBe('n2');
    expect(wrap(author.books[1].tags[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[2]).getSchema()).toBe('n2');
    expect(wrap(author.books[2].tags[0]).getSchema()).toBe('n2');

    orm.em.clear();
    author = await orm.em.findOneOrFail(Author, author, { populate: ['*'] });

    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual([
      'Author-n1:1',
      'Book-n2:1',
      'Book-n2:2',
      'Book-n2:3',
      'BookTag-n2:1',
      'BookTag-n2:2',
      'BookTag-n2:3',
      'BookTag-n2:4',
      'BookTag-n2:5',
      'BookTag-n2:6',
      'BookTag-n2:7',
      'BookTag-n2:8',
      'BookTag-n2:9',
    ]);

    expect(wrap(author).getSchema()).toBe('n1');
    expect(wrap(author.books[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[0].tags[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[1]).getSchema()).toBe('n2');
    expect(wrap(author.books[1].tags[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[2]).getSchema()).toBe('n2');
    expect(wrap(author.books[2].tags[0]).getSchema()).toBe('n2');

    // update entities and flush
    author.name = 'new name';
    author.books[0].name = 'new name 1';
    author.books[0].tags[0].name = 'new name 1';
    author.books[1].name = 'new name 2';
    author.books[1].tags[0].name = 'new name 2';
    author.books[2].name = 'new name 3';
    author.books[2].tags[0].name = 'new name 3';

    const mock = mockLogger(orm);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`update "n2"."book_tag" set "name" = case when ("id" = 1) then 'new name 1' when ("id" = 4) then 'new name 2' when ("id" = 7) then 'new name 3' else "name" end where "id" in (1, 4, 7)`);
    expect(mock.mock.calls[2][0]).toMatch(`update "n1"."author" set "name" = 'new name' where "id" = 1`);
    expect(mock.mock.calls[3][0]).toMatch(`update "n2"."book" set "name" = case when ("id" = 1) then 'new name 1' when ("id" = 2) then 'new name 2' when ("id" = 3) then 'new name 3' else "name" end where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[4][0]).toMatch(`commit`);
    mock.mockReset();

    // remove entity
    orm.em.remove(author);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`delete from "n2"."book" where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[2][0]).toMatch(`delete from "n1"."author" where "id" in (1)`);
    expect(mock.mock.calls[3][0]).toMatch(`delete from "n2"."book_tag" where "id" in (1, 2, 3, 4, 5, 6, 7, 8, 9)`);
    expect(mock.mock.calls[4][0]).toMatch(`commit`);

    orm.em.clear();

    const n1 = await orm.em.find(Author, {});
    const n3 = await orm.em.find(Book, {});
    const n4 = await orm.em.find(Book, {});
    const n5 = await orm.em.find(Book, {});
    const n3tags = await orm.em.find(BookTag, {});
    const n4tags = await orm.em.find(BookTag, {});
    const n5tags = await orm.em.find(BookTag, {});
    expect(n1).toHaveLength(0);
    expect(n3).toHaveLength(0);
    expect(n4).toHaveLength(0);
    expect(n5).toHaveLength(0);
    expect(n3tags).toHaveLength(0);
    expect(n4tags).toHaveLength(0);
    expect(n5tags).toHaveLength(0);
  });

  test('use different schema via options', async () => {
    // author is always in schema `n1`
    const author = new Author();
    author.name = 'a1';

    // each book has different schema, such collection can be used for persisting, but it can't be loaded (as we can load only from single schema at a time)
    const book51 = orm.em.create(Book, {});
    book51.setSchema('n5');
    const book52 = orm.em.create(Book, {});
    wrap(book52).setSchema('n5');
    author.books.add(
      orm.em.create(Book, {}, { schema: 'n3' }),
      orm.em.create(Book, {}, { schema: 'n4' }),
      book51,
      book52,
    );
    author.books[0].tags.add(new BookTag(), new BookTag(), new BookTag());
    author.books[1].basedOn = author.books[0];
    author.books[1].tags.add(new BookTag(), new BookTag(), new BookTag());
    author.books[2].basedOn = author.books[0];
    author.books[2].tags.add(new BookTag(), new BookTag(), new BookTag());
    author.books[3].tags.add(new BookTag(), new BookTag(), new BookTag());

    // schema not specified yet, will be used from metadata
    expect(wrap(author).getSchema()).toBeUndefined();
    const mock = mockLogger(orm);
    await orm.em.persistAndFlush(author);
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual([
      'BookTag-n3:1',
      'BookTag-n3:2',
      'BookTag-n3:3',
      'BookTag-n5:1',
      'BookTag-n5:2',
      'BookTag-n5:3',
      'BookTag-n5:4',
      'BookTag-n5:5',
      'BookTag-n5:6',
      'BookTag-n4:1',
      'BookTag-n4:2',
      'BookTag-n4:3',
      'Author-n1:1',
      'Book-n3:1',
      'Book-n5:1',
      'Book-n5:2',
      'Book-n4:1',
    ]);
    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "n3"."book_tag" ("id") values (default), (default), (default) returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`insert into "n5"."book_tag" ("id") values (default), (default), (default), (default), (default), (default) returning "id"`);
    expect(mock.mock.calls[3][0]).toMatch(`insert into "n4"."book_tag" ("id") values (default), (default), (default) returning "id"`);
    expect(mock.mock.calls[4][0]).toMatch(`insert into "n1"."author" ("name") values ('a1') returning "id"`);
    expect(mock.mock.calls[5][0]).toMatch(`insert into "n3"."book" ("author_id") values (1) returning "id"`);
    expect(mock.mock.calls[6][0]).toMatch(`insert into "n5"."book" ("author_id") values (1), (1) returning "id"`);
    expect(mock.mock.calls[7][0]).toMatch(`insert into "n4"."book" ("author_id") values (1) returning "id"`);
    expect(mock.mock.calls[8][0]).toMatch(`update "n5"."book" set "based_on_id" = 1 where "id" = 1`);
    expect(mock.mock.calls[9][0]).toMatch(`update "n4"."book" set "based_on_id" = 1 where "id" = 1`);
    expect(mock.mock.calls[10][0]).toMatch(`insert into "n3"."book_tags" ("book_tag_id", "book_id") values (1, 1), (2, 1), (3, 1)`);
    expect(mock.mock.calls[11][0]).toMatch(`insert into "n5"."book_tags" ("book_tag_id", "book_id") values (1, 1), (2, 1), (3, 1), (4, 2), (5, 2), (6, 2)`);
    expect(mock.mock.calls[12][0]).toMatch(`insert into "n4"."book_tags" ("book_tag_id", "book_id") values (1, 1), (2, 1), (3, 1)`);
    expect(mock.mock.calls[13][0]).toMatch(`commit`);
    mock.mockReset();

    // schema is saved after flush as if the entity was loaded from db
    expect(wrap(author).getSchema()).toBe('n1');
    expect(wrap(author.books[0]).getSchema()).toBe('n3');
    expect(wrap(author.books[0].tags[0]).getSchema()).toBe('n3');
    expect(wrap(author.books[1]).getSchema()).toBe('n4');
    expect(wrap(author.books[1].tags[0]).getSchema()).toBe('n4');
    expect(author.books[2].getSchema()).toBe('n5');
    expect(author.books[2].tags[0].getSchema()).toBe('n5');
    expect(author.books[3].getSchema()).toBe('n5');
    expect(author.books[3].tags[0].getSchema()).toBe('n5');

    // update entities and flush
    author.name = 'new name';
    author.books[0].name = 'new name 1';
    author.books[0].tags[0].name = 'new name 1';
    author.books[1].name = 'new name 2';
    author.books[1].tags[0].name = 'new name 2';
    author.books[2].name = 'new name 3';
    author.books[2].tags[0].name = 'new name 3';
    author.books[3].name = 'new name 4';
    author.books[3].tags[0].name = 'new name 4';
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`update "n1"."author" set "name" = 'new name' where "id" = 1`);
    expect(mock.mock.calls[2][0]).toMatch(`update "n3"."book" set "name" = 'new name 1' where "id" = 1`);
    expect(mock.mock.calls[3][0]).toMatch(`update "n4"."book" set "name" = 'new name 2' where "id" = 1`);
    expect(mock.mock.calls[4][0]).toMatch(`update "n5"."book" set "name" = case when ("id" = 1) then 'new name 3' when ("id" = 2) then 'new name 4' else "name" end where "id" in (1, 2)`);
    expect(mock.mock.calls[5][0]).toMatch(`update "n3"."book_tag" set "name" = 'new name 1' where "id" = 1`);
    expect(mock.mock.calls[6][0]).toMatch(`update "n5"."book_tag" set "name" = case when ("id" = 1) then 'new name 3' when ("id" = 4) then 'new name 4' else "name" end where "id" in (1, 4)`);
    expect(mock.mock.calls[7][0]).toMatch(`update "n4"."book_tag" set "name" = 'new name 2' where "id" = 1`);
    expect(mock.mock.calls[8][0]).toMatch(`commit`);
    mock.mockReset();

    const fork = orm.em.fork();
    await fork.findOneOrFail(Author, author, { populate: ['*'], schema: 'n5' });

    expect(mock.mock.calls[0][0]).toMatch(`select "a0".* from "n1"."author" as "a0" where "a0"."id" = 1 limit 1`);
    expect(mock.mock.calls[1][0]).toMatch(`select "b0".* from "n5"."book" as "b0" where "b0"."author_id" in (1)`);
    expect(mock.mock.calls[2][0]).toMatch(`select "b1".*, "b0"."book_tag_id" as "fk__book_tag_id", "b0"."book_id" as "fk__book_id" from "n5"."book_tags" as "b0" inner join "n5"."book_tag" as "b1" on "b0"."book_tag_id" = "b1"."id" where "b0"."book_id" in (2, 1)`);
    mock.mockReset();

    expect(fork.getUnitOfWork().getIdentityMap().keys()).toEqual([
      'Author-n1:1',
      'Book-n5:2',
      'Book-n5:1',
      'BookTag-n5:5',
      'BookTag-n5:6',
      'BookTag-n5:4',
      'BookTag-n5:2',
      'BookTag-n5:3',
      'BookTag-n5:1',
    ]);

    // remove entity
    orm.em.remove(author);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`delete from "n3"."book" where "id" in (1)`);
    expect(mock.mock.calls[2][0]).toMatch(`delete from "n4"."book" where "id" in (1)`);
    expect(mock.mock.calls[3][0]).toMatch(`delete from "n5"."book" where "id" in (1, 2)`);
    expect(mock.mock.calls[4][0]).toMatch(`delete from "n1"."author" where "id" in (1)`);
    expect(mock.mock.calls[5][0]).toMatch(`delete from "n3"."book_tag" where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[6][0]).toMatch(`delete from "n4"."book_tag" where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[7][0]).toMatch(`delete from "n5"."book_tag" where "id" in (1, 2, 3, 4, 5, 6)`);
    expect(mock.mock.calls[8][0]).toMatch(`commit`);

    orm.em.clear();

    const n1 = await orm.em.find(Author, {});
    const n3 = await orm.em.find(Book, {}, { schema: 'n3' });
    const n4 = await orm.em.find(Book, {}, { schema: 'n4' });
    const n5 = await orm.em.find(Book, {}, { schema: 'n5' });
    const n3tags = await orm.em.find(BookTag, {}, { schema: 'n3' });
    const n4tags = await orm.em.find(BookTag, {}, { schema: 'n4' });
    const n5tags = await orm.em.find(BookTag, {}, { schema: 'n5' });
    expect(n1).toHaveLength(0);
    expect(n3).toHaveLength(0);
    expect(n4).toHaveLength(0);
    expect(n5).toHaveLength(0);
    expect(n3tags).toHaveLength(0);
    expect(n4tags).toHaveLength(0);
    expect(n5tags).toHaveLength(0);
  });

  test(`schema diffing won't remove other schemas or tables`, async () => {
    // `*` schema is found in metadata, so no schema deletes should be triggered
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe('');

    // should update only single schema, ignoring the rest
    const diff2 = await orm.schema.getUpdateSchemaSQL({ schema: 'n2', wrap: false });
    expect(diff2).toBe('');
    const diff3 = await orm.schema.getUpdateSchemaSQL({ schema: 'n3', wrap: false });
    expect(diff3).toBe('');
    const diff4 = await orm.schema.getUpdateSchemaSQL({ schema: 'n4', wrap: false });
    expect(diff4).toBe('');
    const diff5 = await orm.schema.getUpdateSchemaSQL({ schema: 'n5', wrap: false });
    expect(diff5).toBe('');
  });

  test('pessimistic locking', async () => {
    await orm.schema.updateSchema();
    const author = new Author();
    author.name = 'a1';
    await orm.em.persistAndFlush(author);

    await orm.em.transactional(async em => {
      await orm.em.lock(author, LockMode.PESSIMISTIC_PARTIAL_WRITE);
      await orm.em.getDriver().lockPessimistic(author, { lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE, ctx: em.getTransactionContext() });
    });
  });

  test('generate entities for all schemas', async () => {
    const generator = orm.getEntityGenerator();
    const entities = await generator.generate();
    expect(entities).toMatchSnapshot();
  });

  test('generate entities for given schema only', async () => {
    const generator = orm.getEntityGenerator();
    const entities = await generator.generate({ schema: 'n2' });
    expect(entities).toMatchSnapshot();
  });

  test('use different schema via options in em.insert/Many', async () => {
    const mock = mockLogger(orm);

    // author is always in schema `n1`
    const author = new Author();
    author.name = 'a1';
    await orm.em.insert(author);

    // each book has different schema, such collection can be used for persisting, but it can't be loaded (as we can load only from single schema at a time)
    const book31 = new Book();
    const book41 = new Book();
    const book51 = new Book();
    const book52 = new Book();
    author.books.add(book31, book41, book51, book52);

    await orm.em.insertMany(Book, [book51, book52], { schema: 'n5' });
    await orm.em.insert(Book, book31, { schema: 'n3' });
    await orm.em.insert(Book, book41, { schema: 'n4' });

    orm.em.merge(author);

    // schema not specified yet, will be used from metadata
    expect(wrap(author).getSchema()).toBe('n1'); // set by `em.create()`
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual([
      'Author-n1:1',
      'Book-n3:1',
      'Book-n4:1',
      'Book-n5:1',
      'Book-n5:2',
    ]);
    expect(mock.mock.calls[0][0]).toMatch(`insert into "n1"."author" ("name") values ('a1') returning "id"`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "n5"."book" ("author_id") values (1), (1) returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`insert into "n3"."book" ("author_id") values (1) returning "id"`);
    expect(mock.mock.calls[3][0]).toMatch(`insert into "n4"."book" ("author_id") values (1) returning "id"`);
    mock.mockReset();

    // schema is saved after flush as if the entity was loaded from db
    expect(wrap(author).getSchema()).toBe('n1');
    expect(wrap(author.books[0]).getSchema()).toBe('n3');
    expect(wrap(author.books[1]).getSchema()).toBe('n4');
    expect(author.books[2].getSchema()).toBe('n5');
    expect(author.books[3].getSchema()).toBe('n5');
  });

});
