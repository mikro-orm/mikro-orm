import { Entity, type EntityManager, ManyToOne, MikroORM, PrimaryKey, Property, IdentifiedReference, Reference, ForeignKeyConstraintViolationException } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import type { BetterSqliteDriver } from '@mikro-orm/better-sqlite';


@Entity()
export class Author {

  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;

}


@Entity()
export class Book {

  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;

  @ManyToOne(() => Author, { wrappedReference: true })
  author!: IdentifiedReference<Author>;

}


async function createEntities(em: EntityManager) {
  const author = new Author();
  author.id = '1';
  author.name = 'Bradley Jones';

  const book = new Book();
  book.id = '2';
  book.name = 'C++ in 21 days';
  book.author = Reference.create(author);

  await em.persistAndFlush([author, book]);
  return author;
}


describe('sqlite driver', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });
  afterAll(async () => await orm.close(true));

  test('delete operation should throw ForeignKeyConstraintViolationException, when we have corresponding constraint in db', async () => {
    const entity = await createEntities(orm.em);
    expect.assertions(1);
    try {
      await orm.em.removeAndFlush(entity);
    } catch (e) {
      expect(e).toBeInstanceOf(ForeignKeyConstraintViolationException);
    }
  });
});


describe('better-sqlite driver', () => {

  let orm: MikroORM<BetterSqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: ':memory:',
      type: 'better-sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });
  afterAll(async () => await orm.close(true));

  test('delete operation should throw ForeignKeyConstraintViolationException, when we have corresponding constraint in db', async () => {
    const entity = await createEntities(orm.em);
    expect.assertions(1);
    try {
      await orm.em.removeAndFlush(entity);
    } catch (e) {
      expect(e).toBeInstanceOf(ForeignKeyConstraintViolationException);
    }
  });
});

