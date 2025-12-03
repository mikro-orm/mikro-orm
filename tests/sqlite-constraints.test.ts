import { type EntityManager, ForeignKeyConstraintViolationException, MikroORM, Ref, Reference } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;

}

@Entity()
class Book {

  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author>;

}

async function createEntities(em: EntityManager) {
  const author = new Author();
  author.id = '1';
  author.name = 'Bradley Jones';

  const book = new Book();
  book.id = '2';
  book.name = 'C++ in 21 days';
  book.author = Reference.create(author);

  await em.persist([author, book]).flush();
  return author;
}

describe('sqlite driver', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });
  afterAll(async () => await orm.close(true));

  test('delete operation should throw ForeignKeyConstraintViolationException, when we have corresponding constraint in db', async () => {
    const entity = await createEntities(orm.em);
    expect.assertions(1);
    try {
      await orm.em.remove(entity).flush();
    } catch (e) {
      expect(e).toBeInstanceOf(ForeignKeyConstraintViolationException);
    }
  });
});
