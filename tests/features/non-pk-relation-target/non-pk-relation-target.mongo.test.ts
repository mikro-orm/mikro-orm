import { MikroORM, Ref, Collection } from '@mikro-orm/mongodb';
import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Unique, SerializedPrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { ObjectId } from 'bson';

@Entity()
class Author {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  @Unique()
  uuid!: string;

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

}

@Entity()
class Book {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  title!: string;

  // This relation references Author by uuid instead of id (PK)
  @ManyToOne(() => Author, { ref: true, targetKey: 'uuid' })
  author!: Ref<Author>;

}

describe('non-PK relation target with MongoDB', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book],
      clientUrl: 'mongodb://localhost:27017/mikro_orm_test_non_pk_target',
    });
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  test('ManyToOne with targetKey', async () => {
    // Create an author with a UUID
    const author = orm.em.create(Author, { uuid: 'uuid-123', name: 'John Doe' });
    await orm.em.flush();
    orm.em.clear();

    // Load and create a book with the author
    const loadedAuthor = await orm.em.findOneOrFail(Author, { name: 'John Doe' });
    const book = orm.em.create(Book, { title: 'Test Book', author: loadedAuthor });
    await orm.em.flush();
    orm.em.clear();

    // Load the book and verify the author reference
    const loadedBook = await orm.em.findOneOrFail(Book, { title: 'Test Book' }, { populate: ['author'] });
    expect(loadedBook.author.unwrap().uuid).toBe('uuid-123');
    expect(loadedBook.author.unwrap().name).toBe('John Doe');
  });

  test('creating book and author in same flush with targetKey', async () => {
    // Create both author and book in the same flush
    // MongoDB doesn't have FK constraints, so this should work
    const newAuthor = orm.em.create(Author, { uuid: 'uuid-new-mongo', name: 'New Author' });
    await orm.em.flush(); // Flush author first to get the uuid value available

    const newBook = orm.em.create(Book, { title: 'New Book', author: newAuthor });
    await orm.em.flush();

    expect(newBook.id).toBeDefined();
    expect(newAuthor.id).toBeDefined();

    orm.em.clear();

    // Load and verify the relationship
    const loadedBook = await orm.em.findOneOrFail(Book, { title: 'New Book' }, { populate: ['author'] });
    expect(loadedBook.author.unwrap().uuid).toBe('uuid-new-mongo');
    expect(loadedBook.author.unwrap().name).toBe('New Author');
  });

  test('populate handles missing referenced entity with targetKey', async () => {
    // Create an author and a book
    const orphanAuthor = orm.em.create(Author, { uuid: 'uuid-orphan-mongo', name: 'Orphan Author' });
    await orm.em.flush();
    const orphanBook = orm.em.create(Book, { title: 'Orphan Book Mongo', author: orphanAuthor });
    await orm.em.flush();
    const bookId = orphanBook._id;

    // Delete the author directly via MongoDB (no FK constraints)
    await orm.em.getDriver().nativeDelete(Author, { uuid: 'uuid-orphan-mongo' }, { ctx: orm.em.getTransactionContext() });
    orm.em.clear();

    // Load the book with populate - the author should remain as an uninitialized reference
    // with just the targetKey value set, since the entity no longer exists
    const loadedBook = await orm.em.findOneOrFail(Book, { _id: bookId }, { populate: ['author'] });

    // The author reference still exists with the targetKey value
    expect(loadedBook.author).toBeDefined();
    expect(loadedBook.author.unwrap().uuid).toBe('uuid-orphan-mongo');
    // But it won't be fully initialized since the entity doesn't exist
    expect(loadedBook.author.isInitialized()).toBe(false);
  });

});
