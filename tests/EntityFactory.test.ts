import { ObjectId } from 'bson';
import type { MikroORM, EntityFactory } from '@mikro-orm/core';
import { Collection, ReferenceKind, wrap } from '@mikro-orm/core';
import { Book, Author, Publisher, Test, BookTag } from './entities';
import { initORMMongo, mockLogger } from './bootstrap';
import { AuthorRepository } from './repositories/AuthorRepository';
import { BookRepository } from './repositories/BookRepository';

describe('EntityFactory', () => {

  let orm: MikroORM;
  let factory: EntityFactory;

  beforeAll(async () => {
    orm = await initORMMongo();
    factory = orm.em.getEntityFactory();
    expect(orm.config.getNamingStrategy().referenceColumnName()).toBe('_id');
  });

  beforeEach(async () => orm.schema.clearDatabase());

  afterAll(async () => orm.close(true));

  test('should load entities', async () => {
    const metadata = orm.getMetadata().getAll();
    expect(metadata).toBeInstanceOf(Object);
    expect(metadata[Author.name]).toBeInstanceOf(Object);
    expect(metadata[Author.name].path).toBe('./entities/Author.ts');
    expect(metadata[Author.name].toJsonParams).toEqual(['strict', 'strip']);
    expect(metadata[Author.name].properties).toBeInstanceOf(Object);
    expect(metadata[Author.name].properties.books.type).toBe(Book.name);
    expect(metadata[Author.name].properties.books.kind).toBe(ReferenceKind.ONE_TO_MANY);
    expect(metadata[Author.name].properties.foo.type).toBe('string');
    expect(metadata[Author.name].properties.age.type).toBe('number');
    expect(metadata[Author.name].properties.age.nullable).toBe(true); // nullable is sniffed via ts-morph too
    expect(metadata[Author.name].repository()).toBe(AuthorRepository);
    expect(metadata[Book.name].properties.author.type).toBe(Author.name);
    expect(metadata[Book.name].properties.author.kind).toBe(ReferenceKind.MANY_TO_ONE);
    expect(metadata[Book.name].repository()).toBe(BookRepository);
    expect(metadata[Publisher.name].properties.tests.owner).toBe(true);
  });

  test('should return reference', async () => {
    const ref = factory.createReference(Book, '5b0d19b28b21c648c2c8a600');
    expect(ref).toBeInstanceOf(Book);
    expect(ref._id).toBeInstanceOf(ObjectId);
    expect(ref.id).toBe('5b0d19b28b21c648c2c8a600');
    expect(ref.title).toBeUndefined();
    expect(ref.tags).toBeUndefined();
    expect(ref.toJSON()).toEqual({ id: '5b0d19b28b21c648c2c8a600' });
  });

  test('should return entity', async () => {
    const entity = factory.create(Author, { id: '5b0d19b28b21c648c2c8a600', name: 'test', email: 'mail@test.com', books: { title: 'asd' } });
    expect(entity).toBeInstanceOf(Author);
    expect(entity.id).toBe('5b0d19b28b21c648c2c8a600');
    expect(entity.name).toBe('test');
    expect(entity.email).toBe('mail@test.com');
    expect(entity.books.isInitialized()).toBe(true);
    expect(entity.books).toHaveLength(1);
    expect(entity.books[0].title).toBe('asd');
  });

  test('should return embeddable', async () => {
    // we are testing this on Author entity as it does not really matter whether it is an embeddable type or not
    const data = { id: '5b0d19b28b21c648c2c8a600', name: 'test', email: 'mail@test.com', books: { title: 'asd' } };
    const managedEntity = factory.createEmbeddable(Author, data);
    expect(managedEntity).toBeInstanceOf(Author);
    expect(managedEntity._id).toBeUndefined();
    expect(managedEntity.name).toBeUndefined();
    expect(managedEntity.email).toBeUndefined();
    expect(managedEntity.books).toBeUndefined();
    expect(managedEntity.books).toBeUndefined();

    const newEntity = factory.createEmbeddable(Author, data, { newEntity: true });
    expect(newEntity).toBeInstanceOf(Author);
    // not available, as we are not hydrating here, just filling constructor parameters
    expect(newEntity._id).toBeUndefined();
    expect(newEntity.name).toBe('test');
    expect(newEntity.email).toBe('mail@test.com');
    expect(newEntity.books.isInitialized()).toBe(true);
    // books are not assigned either, again we just care about creating the instance, while filling the constructor parameters
    expect(newEntity.books).toHaveLength(0);
  });

  test('entity ctor can have different params than props', async () => {
    const entity = factory.create(Test, { name: 'test' });
    expect(entity).toBeInstanceOf(Test);
    expect(entity._id).toBeUndefined();
    expect(entity.name).toBe('test');
  });

  test('should return entity without id', async () => {
    const author = factory.create(Author, { name: 'test', favouriteBook: '5b0d19b28b21c648c2c8a600', email: 'mail@test.com' });
    expect(author).toBeInstanceOf(Author);
    expect(author.id).toBeNull();
    expect(author.name).toBe('test');
    expect(author.email).toBe('mail@test.com');
    expect(author.favouriteBook).toBeInstanceOf(Book);
    expect(author.favouriteBook!.id).toBe('5b0d19b28b21c648c2c8a600');
  });

  test('should return entity without id [reference as constructor parameter]', async () => {
    // we need to use normal entity manager to have working identity map
    const author = orm.em.getReference(Author, '5b0d19b28b21c648c2c8a600');
    expect(author.id).toBe('5b0d19b28b21c648c2c8a600');
    const book = orm.em.create(Book, { title: 'book title', author: author.id });
    expect(book).toBeInstanceOf(Book);
    expect(book.id).toBeNull();
    expect(book.title).toBe('book title');
    expect(book.author).toBe(author);

    // try with id of entity that is not managed
    const book2 = orm.em.create(Book, { title: 'book title', author: '5b0d19b28b21c648c2c8a601' });
    expect(book2).toBeInstanceOf(Book);
    expect(book2.id).toBeNull();
    expect(book2.title).toBe('book title');
    expect(book2.author).toBeInstanceOf(Author);
    expect(book2.author.id).toBe('5b0d19b28b21c648c2c8a601');
  });

  test('create should create entity without calling constructor', async () => {
    const p1 = new Publisher(); // calls constructor, so uses default name
    expect(p1.name).toBe('asd');
    expect(p1).toBeInstanceOf(Publisher);
    expect(p1.books).toBeInstanceOf(Collection);
    expect(p1.tests).toBeInstanceOf(Collection);
    const p2 = factory.create(Publisher, { id: '5b0d19b28b21c648c2c8a601' });
    expect(p2).toBeInstanceOf(Publisher);
    expect(p2.name).toBeUndefined();
    expect(p2.books).toBeInstanceOf(Collection);
    expect(p2.tests).toBeInstanceOf(Collection);
    const p3 = factory.create(Publisher, { id: '5b0d19b28b21c648c2c8a602', name: 'test' });
    expect(p3).toBeInstanceOf(Publisher);
    expect(p3.name).toBe('test');
    expect(p3.books).toBeInstanceOf(Collection);
    expect(p3.tests).toBeInstanceOf(Collection);
  });

  test('create should create entity without calling constructor', async () => {
    const p1 = new Publisher(); // calls constructor, so uses default name
    expect(p1.name).toBe('asd');
    expect(p1).toBeInstanceOf(Publisher);
    expect(p1.books).toBeInstanceOf(Collection);
    expect(p1.tests).toBeInstanceOf(Collection);
    const p2 = factory.createReference(Publisher, '5b0d19b28b21c648c2c8a600');
    expect(p2).toBeInstanceOf(Publisher);
    expect(p2.name).toBeUndefined();
    expect(p1.books).toBeInstanceOf(Collection);
    expect(p1.tests).toBeInstanceOf(Collection);
  });

  test('create return entity without hydrating it if it is already an entity', async () => {
    const p1 = new Publisher();
    expect(p1.name).toBe('asd');
    const p2 = factory.create(Publisher, p1);
    expect(p2).toBe(p1);
  });

  test('create does not merge entity instances', async () => {
    const a1 = new Author('n', 'e');
    a1.id = '5b0d19b28b21c648c2c8a600';
    const t1 = new BookTag('t1');
    t1.id = '5b0d19b28b21c648c2c8a601';

    // managed entity have an internal __em reference, so that is what we are testing here
    expect(wrap(a1, true).__em).toBeUndefined();
    expect(wrap(t1, true).__em).toBeUndefined();
    const b1 = factory.create(Book, { author: a1, tags: [t1] });
    expect(wrap(a1, true).__em).toBeUndefined();
    expect(wrap(t1, true).__em).toBeUndefined();
    expect(wrap(b1, true).__em).toBeUndefined();
  });

  test('create should ignore invalid reference values', async () => {
    const a = factory.create(Author, { favouriteAuthor: false } as any);
    expect(a).toBeInstanceOf(Author);
    expect(a.name).toBeUndefined();
    expect(a.favouriteAuthor).toBeUndefined();
  });

  test('create works with entity constructor param', async () => {
    const author = new Author('n', 'e');
    const book = factory.create(Book, { title: 't', author });
    expect(book.author).toBe(author);
  });

  test('create should flag collections as dirty for new entities', async () => {
    const a = new Author('n', 'e');
    const t1 = new BookTag('t1');
    const t2 = new BookTag('t2');
    const t3 = new BookTag('t3');
    const b1 = factory.create(Book, { title: 'b1', author: a, tags: [t1, t2, t3] }, { newEntity: false });
    expect(b1.tags.isDirty()).toBe(false);
    const b2 = factory.create(Book, { title: 'b2', author: a, tags: [t1, t2, t3] }, { newEntity: true });
    expect(b2.tags.isDirty()).toBe(true);
  });

  test('create entity from nested object', async () => {
    const repo = orm.em.getRepository(Author);
    const a1 = repo.create({ name: 'Jon', email: 'jon@snow.com', books: [
      { title: 'B1', publisher: '5b0d19b28b21c648c2c8a600', tags: [{ name: 't1' }, '5b0d19b28b21c648c2c8a601'] },
    ] });

    expect(a1.name).toBe('Jon');
    expect(a1.email).toBe('jon@snow.com');
    expect(a1.books.isInitialized()).toBe(true);
    expect(a1.books.isDirty()).toBe(true);
    expect(a1.books[0].title).toBe('B1');
    expect(a1.books[0].author).toBe(a1); // propagation to owning side
    expect(a1.books[0].publisher!.id).toBe('5b0d19b28b21c648c2c8a600');
    expect(wrap(a1.books[0].publisher!).isInitialized()).toBe(false);
    expect(a1.books[0].tags.isInitialized()).toBe(true);
    expect(a1.books[0].tags.isDirty()).toBe(true); // owning side
    expect(a1.books[0].tags[0].name).toBe('t1');
    expect(a1.books[0].tags[0].id).toBe(null);
    expect(a1.books[0].tags[1].id).toBe('5b0d19b28b21c648c2c8a601');

    const mock = mockLogger(orm);

    await orm.em.persistAndFlush(a1);

    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('book-tag'\)\.insertMany\(\[ { name: 't1' } ], {}\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('author'\)\.insertMany\(\[ { createdAt: ISODate\('.*'\), updatedAt: ISODate\('.*'\), foo: 'bar', name: 'Jon', email: 'jon@snow\.com', termsAccepted: false } ], {}\);/);
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('books-table'\)\.insertMany\(\[ { createdAt: ISODate\('.*'\), title: 'B1', author: ObjectId\('.*'\), publisher: ObjectId\('5b0d19b28b21c648c2c8a600'\), tags: \[ ObjectId\('.*'\), ObjectId\('5b0d19b28b21c648c2c8a601'\) ] } ], {}\);/);

    orm.em.clear();
    mock.mock.calls.length = 0;

    const a2 = repo.create({ name: 'Jon', email: 'jon2@snow.com' });
    repo.assign(a2, { books: [
      { title: 'B1', publisher: '5b0d19b28b21c648c2c8a600', tags: [{ name: 't1' }, '5b0d19b28b21c648c2c8a601'] },
    ] });

    expect(a2.name).toBe('Jon');
    expect(a2.email).toBe('jon2@snow.com');
    expect(a2.books.isInitialized()).toBe(true);
    expect(a2.books.isDirty()).toBe(true);
    expect(a2.books[0].title).toBe('B1');
    expect(a2.books[0].author).toBe(a2); // propagation to owning side
    expect(a2.books[0].publisher!.id).toBe('5b0d19b28b21c648c2c8a600');
    expect(wrap(a2.books[0].publisher!).isInitialized()).toBe(false);
    expect(a2.books[0].tags.isInitialized()).toBe(true);
    expect(a2.books[0].tags.isDirty()).toBe(true); // owning side
    expect(a2.books[0].tags[0].name).toBe('t1');
    expect(a2.books[0].tags[0].id).toBe(null);
    expect(a2.books[0].tags[1].id).toBe('5b0d19b28b21c648c2c8a601');

    await orm.em.persistAndFlush(a2);

    expect(mock.mock.calls.length).toBe(3);
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('book-tag'\)\.insertMany\(\[ { name: 't1' } ], {}\);/);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('author'\)\.insertMany\(\[ { createdAt: ISODate\('.*'\), updatedAt: ISODate\('.*'\), foo: 'bar', name: 'Jon', email: 'jon2@snow\.com', termsAccepted: false } ], {}\);/);
    expect(mock.mock.calls[2][0]).toMatch(/db\.getCollection\('books-table'\)\.insertMany\(\[ { createdAt: ISODate\('.*'\), title: 'B1', author: ObjectId\('.*'\), publisher: ObjectId\('5b0d19b28b21c648c2c8a600'\), tags: \[ ObjectId\('.*'\), ObjectId\('5b0d19b28b21c648c2c8a601'\) ] } ], {}\);/);
  });

  test('em.create() should not mutate the input object (GH issue 1294)', async () => {
    const data = {
      name: 'this is my name',
      email: 'e',
      age: 21,
    };

    const entity = orm.em.create(Author, data);
    expect(data.name).toEqual('this is my name');
    expect(data.age).toEqual(21);
    expect(entity.name).toEqual('this is my name');
    expect(entity.age).toEqual(21);
  });

});
