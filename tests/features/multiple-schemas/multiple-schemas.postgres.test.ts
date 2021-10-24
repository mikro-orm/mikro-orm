import { Collection, Entity, LockMode, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity({ schema: 'n1' })
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Author, undefined, { nullable: true })
  mentor?: Author;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => Book, e => e.author)
  books = new Collection<Book>(this);

}

@Entity({ schema: '*' })
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { nullable: true })
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
    await orm.getSchemaGenerator().createSchema();
    // TODO this is not working, tries to remove FKs from table that does not exist yet
    // TODO looks like updateSchema() is removing all the other schemas just created by previous runs,
    //   we need to ignore the other namespaces somehow? maybe when the schema option is specified, let's not remove any other namespaces?
    // await orm.getSchemaGenerator().updateSchema(); // `*` schema will be ignored

    // we need to pass schema for book
    await orm.getSchemaGenerator().createSchema({ schema: 'n2' });
    await orm.getSchemaGenerator().createSchema({ schema: 'n3' });
    await orm.getSchemaGenerator().createSchema({ schema: 'n4' });
    await orm.getSchemaGenerator().createSchema({ schema: 'n5' });
    orm.config.set('schema', 'n2'); // set the schema so we can work with book entities without options param
    // TODO we should probably validate usage of `*` when creating queries (if no schema is provided in config nor options)
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    // TODO withSchema should not be needed for author (use default from metadata)
    await orm.em.createQueryBuilder(Author).withSchema('n1').truncate().execute();
    await orm.em.createQueryBuilder(Book).withSchema('n2').truncate().execute();
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
    author.books.add(orm.em.create(Book, {}, { schema: 'n3' }), orm.em.create(Book, {}, { schema: 'n4' }), orm.em.create(Book, {}, { schema: 'n5' }));
    author.books[1].basedOn = author.books[0];
    author.books[2].basedOn = author.books[0];

    // schema not specified yet, will be used from metadata
    expect(wrap(author).getSchema()).toBeUndefined();
    await orm.em.persistAndFlush(author);
    expect(orm.em.getUnitOfWork().getIdentityMap().keys()).toEqual([
      'Author-n1:1',
      'Book-n3:1',
      'Book-n4:1',
      'Book-n5:1',
    ]);

    // schema is saved after flush as if the entity was loaded from db
    expect(wrap(author).getSchema()).toBe('n1');
    expect(wrap(author.books[0]).getSchema()).toBe('n3');
    expect(wrap(author.books[1]).getSchema()).toBe('n4');
    expect(wrap(author.books[2]).getSchema()).toBe('n5');
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

});
