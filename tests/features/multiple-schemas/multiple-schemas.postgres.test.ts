import { BaseEntity, Cascade, Collection, Entity, LockMode, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers';

@Entity({ schema: 'n1' })
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Author, undefined, { nullable: true })
  mentor?: Author;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => Book, e => e.author, { cascade: [Cascade.REMOVE, Cascade.PERSIST] })
  books = new Collection<Book>(this);

}

@Entity({ schema: '*' })
export class Book extends BaseEntity<Book, 'id'> {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @ManyToOne(() => Author, { nullable: true, onDelete: 'cascade' })
  author?: Author;

  @ManyToOne(() => Book, { nullable: true })
  basedOn?: Book;

}

describe('multiple connected schemas in postgres', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: `mikro_orm_test_multi_schemas`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();

    for (const ns of ['n1', 'n2', 'n3', 'n4', 'n5']) {
      await orm.getSchemaGenerator().execute(`drop schema if exists ${ns} cascade`);
    }

    // `*` schema will be ignored
    await orm.getSchemaGenerator().updateSchema(); // `*` schema will be ignored

    // we need to pass schema for book
    await orm.getSchemaGenerator().updateSchema({ schema: 'n2' });
    await orm.getSchemaGenerator().updateSchema({ schema: 'n3' });
    await orm.getSchemaGenerator().updateSchema({ schema: 'n4' });
    await orm.getSchemaGenerator().updateSchema({ schema: 'n5' });
    orm.config.set('schema', 'n2'); // set the schema so we can work with book entities without options param
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.createQueryBuilder(Author).truncate().execute(); // schema from metadata
    await orm.em.createQueryBuilder(Book).truncate().execute(); // current schema from config
    await orm.em.createQueryBuilder(Book).withSchema('n3').truncate().execute();
    await orm.em.createQueryBuilder(Book).withSchema('n4').truncate().execute();
    await orm.em.createQueryBuilder(Book).withSchema('n5').truncate().execute();
    orm.em.clear();
  });

  // if we have schema specified on entity level, it only exists in that schema
  // if we have * schema on entity, it can exist in any schema, always controlled by the parameter
  // no schema on entity - default schema or from global orm config
  test('should work', async () => {
    const author = new Author();
    author.name = 'a1';
    author.books.add(new Book(), new Book(), new Book());
    author.books[1].basedOn = author.books[0];
    author.books[2].basedOn = author.books[0];

    // schema not specified yet, will be used from metadata
    expect(wrap(author).getSchema()).toBeUndefined();
    await orm.em.persistAndFlush(author);

    // schema is saved after flush
    expect(wrap(author).getSchema()).toBe('n1');
    expect(wrap(author.books[0]).getSchema()).toBe('n2');
    expect(wrap(author.books[1]).getSchema()).toBe('n2');
    expect(wrap(author.books[2]).getSchema()).toBe('n2');
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
    author.books.add(orm.em.create(Book, {}, { schema: 'n3' }), orm.em.create(Book, {}, { schema: 'n4' }), book51, book52);
    author.books[1].basedOn = author.books[0];
    author.books[2].basedOn = author.books[0];

    // schema not specified yet, will be used from metadata
    expect(wrap(author).getSchema()).toBeUndefined();
    const mock = mockLogger(orm);
    await orm.em.persistAndFlush(author);
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual([
      'Author-n1:1',
      'Book-n3:1',
      'Book-n4:1',
      'Book-n5:1',
      'Book-n5:2',
    ]);
    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "n1"."author" ("name") values ('a1') returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`insert into "n3"."book" ("author_id") values (1) returning "id"`);
    expect(mock.mock.calls[3][0]).toMatch(`insert into "n4"."book" ("author_id") values (1) returning "id"`);
    expect(mock.mock.calls[4][0]).toMatch(`insert into "n5"."book" ("author_id") values (1), (1) returning "id"`);
    expect(mock.mock.calls[5][0]).toMatch(`update "n4"."book" set "based_on_id" = 1 where "id" = 1`);
    expect(mock.mock.calls[6][0]).toMatch(`update "n5"."book" set "based_on_id" = 1 where "id" = 1`);
    expect(mock.mock.calls[7][0]).toMatch(`commit`);
    mock.mockReset();

    // schema is saved after flush as if the entity was loaded from db
    expect(wrap(author).getSchema()).toBe('n1');
    expect(wrap(author.books[0]).getSchema()).toBe('n3');
    expect(wrap(author.books[1]).getSchema()).toBe('n4');
    expect(author.books[2].getSchema()).toBe('n5');
    expect(author.books[3].getSchema()).toBe('n5');

    // update entities and flush
    author.name = 'new name';
    author.books[0].name = 'new name 1';
    author.books[1].name = 'new name 2';
    author.books[2].name = 'new name 3';
    author.books[3].name = 'new name 4';
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`update "n1"."author" set "name" = 'new name' where "id" = 1`);
    expect(mock.mock.calls[2][0]).toMatch(`update "n3"."book" set "name" = 'new name 1' where "id" = 1`);
    expect(mock.mock.calls[3][0]).toMatch(`update "n4"."book" set "name" = 'new name 2' where "id" = 1`);
    expect(mock.mock.calls[4][0]).toMatch(`update "n5"."book" set "name" = case when ("id" = 1) then 'new name 3' when ("id" = 2) then 'new name 4' else "name" end where "id" in (1, 2)`);
    expect(mock.mock.calls[5][0]).toMatch(`commit`);
    mock.mockReset();

    // remove entity
    orm.em.remove(author);
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`delete from "n3"."book" where "id" in (1)`);
    expect(mock.mock.calls[2][0]).toMatch(`delete from "n4"."book" where "id" in (1)`);
    expect(mock.mock.calls[3][0]).toMatch(`delete from "n5"."book" where "id" in (1, 2)`);
    expect(mock.mock.calls[4][0]).toMatch(`delete from "n1"."author" where "id" in (1)`);
    expect(mock.mock.calls[5][0]).toMatch(`commit`);

    orm.em.clear();

    const n1 = await orm.em.find(Author, {});
    const n3 = await orm.em.find(Book, {}, { schema: 'n3' });
    const n4 = await orm.em.find(Book, {}, { schema: 'n4' });
    const n5 = await orm.em.find(Book, {}, { schema: 'n5' });
    expect(n1).toHaveLength(0);
    expect(n3).toHaveLength(0);
    expect(n4).toHaveLength(0);
    expect(n5).toHaveLength(0);
  });

  test(`schema diffing won't remove other schemas or tables`, async () => {
    // `*` schema is found in metadata, so no schema deletes should be triggered
    const diff1 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe('');

    // should update only single schema, ignoring the rest
    const diff2 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ schema: 'n2', wrap: false });
    expect(diff2).toBe('');
    const diff3 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ schema: 'n3', wrap: false });
    expect(diff3).toBe('');
    const diff4 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ schema: 'n4', wrap: false });
    expect(diff4).toBe('');
    const diff5 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ schema: 'n5', wrap: false });
    expect(diff5).toBe('');
  });

  test('pessimistic locking', async () => {
    await orm.getSchemaGenerator().updateSchema();
    const author = new Author();
    author.name = 'a1';
    await orm.em.persistAndFlush(author);

    await orm.em.transactional(async em => {
      await orm.em.lock(author, LockMode.PESSIMISTIC_PARTIAL_WRITE);
      await orm.em.getDriver().lockPessimistic(author, { lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE, ctx: em.getTransactionContext() });
    });
  });

  test('generate entities for given schema only', async () => {
    const generator = orm.getEntityGenerator();
    const entities = await generator.generate({ schema: 'n2' });
    expect(entities).toMatchSnapshot();
  });

});
