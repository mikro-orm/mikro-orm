import { BaseEntity, Cascade, Collection, Entity, ManyToMany, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

@Entity({ schema: 'n1' })
class Author {

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
class BookTag extends BaseEntity {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

}

@Entity({ schema: '*' })
class Book extends BaseEntity {

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

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book, BookTag],
      dbName: `mikro_orm_test_multi_schemas_em`,
      driver: PostgreSqlDriver,
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

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    orm.config.set('schema', 'n2'); // set the schema so we can work with book entities without options param
    await orm.em.createQueryBuilder(Author).truncate().execute(); // schema from metadata
    await orm.em.createQueryBuilder(Book).truncate().execute(); // current schema from config
    await orm.em.createQueryBuilder(Book).withSchema('n3').truncate().execute();
    await orm.em.createQueryBuilder(Book).withSchema('n4').truncate().execute();
    await orm.em.createQueryBuilder(Book).withSchema('n5').truncate().execute();
    await orm.em.createQueryBuilder(BookTag).truncate().execute(); // current schema from config
    await orm.em.createQueryBuilder(BookTag).withSchema('n3').truncate().execute();
    await orm.em.createQueryBuilder(BookTag).withSchema('n4').truncate().execute();
    await orm.em.createQueryBuilder(BookTag).withSchema('n5').truncate().execute();
    orm.em.clear();
  });

  // if we have schema specified on entity level, it only exists in that schema
  // if we have * schema on entity, it can exist in any schema, defined in forked EntityManager
  // no schema on entity - default schema or from global orm config
  test('should work. different schema on orm and fork', async () => {
    orm.config.set('schema', 'n4'); // set the schema to a different schema than the fork

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
    const fork = orm.em.fork({
      schema: 'n2',
    });

    await fork.persistAndFlush(author);
    // schema is saved after flush
    expect(wrap(author).getSchema()).toBe('n1');
    expect(wrap(author.books[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[0].tags[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[1]).getSchema()).toBe('n2');
    expect(wrap(author.books[1].tags[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[2]).getSchema()).toBe('n2');
    expect(wrap(author.books[2].tags[0]).getSchema()).toBe('n2');

    fork.clear();
    author = await fork.findOneOrFail(Author, author, { populate: ['*'] });

    expect(fork.getUnitOfWork().getIdentityMap().keys()).toEqual([
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
    await fork.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`update "n2"."book_tag" set "name" = case when ("id" = 1) then 'new name 1' when ("id" = 4) then 'new name 2' when ("id" = 7) then 'new name 3' else "name" end where "id" in (1, 4, 7)`);
    expect(mock.mock.calls[2][0]).toMatch(`update "n1"."author" set "name" = 'new name' where "id" = 1`);
    expect(mock.mock.calls[3][0]).toMatch(`update "n2"."book" set "name" = case when ("id" = 1) then 'new name 1' when ("id" = 2) then 'new name 2' when ("id" = 3) then 'new name 3' else "name" end where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[4][0]).toMatch(`commit`);
    mock.mockReset();

    // remove entity
    const authorRef = fork.getReference(Author, 1);
    fork.remove(authorRef);
    await fork.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`delete from "n2"."book" where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[2][0]).toMatch(`delete from "n1"."author" where "id" in (1)`);
    expect(mock.mock.calls[3][0]).toMatch(`delete from "n2"."book_tag" where "id" in (1, 2, 3, 4, 5, 6, 7, 8, 9)`);
    expect(mock.mock.calls[4][0]).toMatch(`commit`);

    fork.clear();

    const n1 = await fork.find(Author, {});
    const n3 = await fork.find(Book, {});
    const n4 = await fork.find(Book, {});
    const n5 = await fork.find(Book, {});
    const n3tags = await fork.find(BookTag, {});
    const n4tags = await fork.find(BookTag, {});
    const n5tags = await fork.find(BookTag, {});
    expect(n1).toHaveLength(0);
    expect(n3).toHaveLength(0);
    expect(n4).toHaveLength(0);
    expect(n5).toHaveLength(0);
    expect(n3tags).toHaveLength(0);
    expect(n4tags).toHaveLength(0);
    expect(n5tags).toHaveLength(0);
  });

  test('different schema on orm and fork, set schema with setter', async () => {
    orm.config.set('schema', 'n4'); // set the schema to a different schema than the fork

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
    const fork = orm.em.fork({
      schema: 'n1',
    });
    fork.schema = 'n2';

    await fork.persistAndFlush(author);
    // schema is saved after flush
    expect(wrap(author).getSchema()).toBe('n1');
    expect(wrap(author.books[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[0].tags[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[1]).getSchema()).toBe('n2');
    expect(wrap(author.books[1].tags[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[2]).getSchema()).toBe('n2');
    expect(wrap(author.books[2].tags[0]).getSchema()).toBe('n2');

    fork.clear();
    author = await fork.findOneOrFail(Author, author, { populate: ['*'] });

    expect(fork.getUnitOfWork().getIdentityMap().keys()).toEqual([
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
    await fork.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`update "n2"."book_tag" set "name" = case when ("id" = 1) then 'new name 1' when ("id" = 4) then 'new name 2' when ("id" = 7) then 'new name 3' else "name" end where "id" in (1, 4, 7)`);
    expect(mock.mock.calls[2][0]).toMatch(`update "n1"."author" set "name" = 'new name' where "id" = 1`);
    expect(mock.mock.calls[3][0]).toMatch(`update "n2"."book" set "name" = case when ("id" = 1) then 'new name 1' when ("id" = 2) then 'new name 2' when ("id" = 3) then 'new name 3' else "name" end where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[4][0]).toMatch(`commit`);
    mock.mockReset();

    // remove entity
    fork.remove(author);
    await fork.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`delete from "n2"."book" where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[2][0]).toMatch(`delete from "n1"."author" where "id" in (1)`);
    expect(mock.mock.calls[3][0]).toMatch(`delete from "n2"."book_tag" where "id" in (1, 2, 3, 4, 5, 6, 7, 8, 9)`);
    expect(mock.mock.calls[4][0]).toMatch(`commit`);

    fork.clear();

    const n1 = await fork.find(Author, {});
    const n3 = await fork.find(Book, {});
    const n4 = await fork.find(Book, {});
    const n5 = await fork.find(Book, {});
    const n3tags = await fork.find(BookTag, {});
    const n4tags = await fork.find(BookTag, {});
    const n5tags = await fork.find(BookTag, {});
    expect(n1).toHaveLength(0);
    expect(n3).toHaveLength(0);
    expect(n4).toHaveLength(0);
    expect(n5).toHaveLength(0);
    expect(n3tags).toHaveLength(0);
    expect(n4tags).toHaveLength(0);
    expect(n5tags).toHaveLength(0);
  });

  test('different schema on orm and fork, clear schema with setter', async () => {
    orm.config.set('schema', 'n2'); // set the schema to a different schema than the fork

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
    const fork = orm.em.fork({
      schema: 'n4',
    });
    fork.schema = null;

    await fork.persistAndFlush(author);
    // schema is saved after flush
    expect(wrap(author).getSchema()).toBe('n1');
    expect(wrap(author.books[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[0].tags[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[1]).getSchema()).toBe('n2');
    expect(wrap(author.books[1].tags[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[2]).getSchema()).toBe('n2');
    expect(wrap(author.books[2].tags[0]).getSchema()).toBe('n2');

    fork.clear();
    author = await fork.findOneOrFail(Author, author, { populate: ['*'] });

    expect(fork.getUnitOfWork().getIdentityMap().keys()).toEqual([
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
    await fork.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`update "n2"."book_tag" set "name" = case when ("id" = 1) then 'new name 1' when ("id" = 4) then 'new name 2' when ("id" = 7) then 'new name 3' else "name" end where "id" in (1, 4, 7)`);
    expect(mock.mock.calls[2][0]).toMatch(`update "n1"."author" set "name" = 'new name' where "id" = 1`);
    expect(mock.mock.calls[3][0]).toMatch(`update "n2"."book" set "name" = case when ("id" = 1) then 'new name 1' when ("id" = 2) then 'new name 2' when ("id" = 3) then 'new name 3' else "name" end where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[4][0]).toMatch(`commit`);
    mock.mockReset();

    // remove entity
    fork.remove(author);
    await fork.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`delete from "n2"."book" where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[2][0]).toMatch(`delete from "n1"."author" where "id" in (1)`);
    expect(mock.mock.calls[3][0]).toMatch(`delete from "n2"."book_tag" where "id" in (1, 2, 3, 4, 5, 6, 7, 8, 9)`);
    expect(mock.mock.calls[4][0]).toMatch(`commit`);

    fork.clear();

    const n1 = await fork.find(Author, {});
    const n3 = await fork.find(Book, {});
    const n4 = await fork.find(Book, {});
    const n5 = await fork.find(Book, {});
    const n3tags = await fork.find(BookTag, {});
    const n4tags = await fork.find(BookTag, {});
    const n5tags = await fork.find(BookTag, {});
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

    // Schema in orm config is n2
    const mainForkN4 = orm.em.fork({
      schema: 'n4',
    });

    // each book has different schema, such collection can be used for persisting, but it can't be loaded (as we can load only from single schema at a time)
    const book51 = mainForkN4.create(Book, {});
    book51.setSchema('n5');
    const book52 = mainForkN4.create(Book, {});
    wrap(book52).setSchema('n5');
    author.books.add(
      mainForkN4.create(Book, {}, { schema: 'n3' }),
      mainForkN4.create(Book, {}),
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
    await mainForkN4.persistAndFlush(author);
    expect(mainForkN4.getUnitOfWork().getIdentityMap().keys()).toEqual([
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
    await mainForkN4.flush();

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

    const fork = mainForkN4.fork();
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
    mainForkN4.remove(author);
    await mainForkN4.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`delete from "n3"."book" where "id" in (1)`);
    expect(mock.mock.calls[2][0]).toMatch(`delete from "n4"."book" where "id" in (1)`);
    expect(mock.mock.calls[3][0]).toMatch(`delete from "n5"."book" where "id" in (1, 2)`);
    expect(mock.mock.calls[4][0]).toMatch(`delete from "n1"."author" where "id" in (1)`);
    expect(mock.mock.calls[5][0]).toMatch(`delete from "n3"."book_tag" where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[6][0]).toMatch(`delete from "n4"."book_tag" where "id" in (1, 2, 3)`);
    expect(mock.mock.calls[7][0]).toMatch(`delete from "n5"."book_tag" where "id" in (1, 2, 3, 4, 5, 6)`);
    expect(mock.mock.calls[8][0]).toMatch(`commit`);

    mainForkN4.clear();

    const n1 = await mainForkN4.find(Author, {});
    const n3 = await mainForkN4.find(Book, {}, { schema: 'n3' });
    const n4 = await mainForkN4.find(Book, {});
    const n5 = await mainForkN4.find(Book, {}, { schema: 'n5' });
    const n3tags = await mainForkN4.find(BookTag, {}, { schema: 'n3' });
    const n4tags = await mainForkN4.find(BookTag, {});
    const n5tags = await mainForkN4.find(BookTag, {}, { schema: 'n5' });
    expect(n1).toHaveLength(0);
    expect(n3).toHaveLength(0);
    expect(n4).toHaveLength(0);
    expect(n5).toHaveLength(0);
    expect(n3tags).toHaveLength(0);
    expect(n4tags).toHaveLength(0);
    expect(n5tags).toHaveLength(0);
  });


});
