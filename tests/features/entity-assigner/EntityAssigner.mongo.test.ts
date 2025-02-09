import type { EntityData, MikroORM } from '@mikro-orm/core';
import { assign, wrap } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { Author, Book, BookTag } from '../../entities/index.js';
import { initORMMongo } from '../../bootstrap.js';

describe('EntityAssignerMongo', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => orm.schema.clearDatabase());

  test('#assign() should update entity values', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const jon = new Author('Jon Snow', 'snow@wall.st');
    const book = new Book('Book2', jon);
    await orm.em.persistAndFlush(book);
    expect(book.title).toBe('Book2');
    expect(book.author).toBe(jon);
    // @ts-expect-error unknown property
    book.assign({ title: 'Better Book2 1', author: god, notExisting: true });
    const partial = { title: 'Better Book2 1', author: god } as Partial<Book>;
    book.assign({ ...partial, title: 'foo' });
    expect(book.author).toBe(god);
    expect((book as any).notExisting).toBe(true);
    await orm.em.persistAndFlush(god);
    wrap(book, true).assign({ title: 'Better Book2 2', author: god.id });
    expect(book.author).toBe(god);
    book.assign({ title: 'Better Book2 3', author: jon._id });
    expect(book.title).toBe('Better Book2 3');
    expect(book.author).toBe(jon);
  });

  test('#assign() should update entity collection', async () => {
    const other = new BookTag('other');
    await orm.em.persistAndFlush(other);
    const jon = new Author('Jon Snow', 'snow@wall.st');
    const book = new Book('Book2', jon);
    const tag1 = new BookTag('tag 1');
    const tag2 = new BookTag('tag 2');
    const tag3 = new BookTag('tag 3');
    book.tags.add(tag1);
    book.tags.add(tag2);
    book.tags.add(tag3);
    await orm.em.persistAndFlush(book);
    assign(book, { tags: [other._id] });
    expect(book.tags.getIdentifiers('_id')).toMatchObject([other._id]);
    assign(book, { tags: [] });
    expect(book.tags.getIdentifiers()).toMatchObject([]);
    assign(book, { tags: [tag1.id, tag3.id] });
    expect(book.tags.getIdentifiers('id')).toMatchObject([tag1.id, tag3.id]);
    assign(book, { tags: [tag2] });
    expect(book.tags.getIdentifiers('_id')).toMatchObject([tag2._id]);
    assign(book, { tags: [wrap(tag2).toObject()] });
    expect(book.tags.getIdentifiers('_id')).toMatchObject([tag2._id]);
    expect(book.tags.isDirty()).toBe(true);
    expect(() => assign(book, { tags: [false] } as any)).toThrow(`Invalid collection values provided for 'Book.tags' in Book.assign(): [ false ]`);
    expect(() => assign(book, { publisher: [{ foo: 'bar' }] } as EntityData<Book>)).toThrow(`Invalid reference value provided for 'Book.publisher' in Book.assign(): [{"foo":"bar"}]`);
  });

  test('#assign() should ignore undefined properties', async () => {
    const jon = new Author('Jon Snow', 'snow@wall.st');
    assign<any>(jon, { name: 'test', unknown: 123 }, { onlyProperties: true });
    expect((jon as any).unknown).toBeUndefined();
  });

  test('#assign() should ignore undefined properties in nullability validation (#4566)', async () => {
    const jon = new Author('Jon Snow', 'snow@wall.st');
    assign<any>(jon, { name: 'test', emptyUnknown1: null, emptyUnknown2: undefined }, { onlyProperties: true });
    expect('emptyUnknown1' in jon).toBe(false);
    expect('emptyUnknown2' in jon).toBe(false);

    assign<any>(jon, { name: 'test', emptyUnknown1: null, emptyUnknown2: undefined });
    expect('emptyUnknown1' in jon).toBe(true);
    expect('emptyUnknown2' in jon).toBe(true);
    expect((jon as any).emptyUnknown1).toBeNull();
    expect((jon as any).emptyUnknown2).toBeUndefined();
  });

  test('#assign() should merge references', async () => {
    const jon = new Author('Jon Snow', 'snow@wall.st');
    orm.em.assign(jon, { favouriteBook: { _id: ObjectId.createFromTime(1), title: 'b1' } }, { merge: false });
    expect(wrap(jon.favouriteBook!, true).__em).toBeUndefined();
    orm.em.assign(jon, { favouriteBook: { _id: ObjectId.createFromTime(1), title: 'b1' } }, { merge: true });
    expect(wrap(jon.favouriteBook!, true).__em).not.toBeUndefined();
  });

  test('#assign() should merge collection items', async () => {
    const jon = new Author('Jon Snow', 'snow@wall.st');
    orm.em.assign(jon, { books: [{ _id: ObjectId.createFromTime(1), title: 'b1' }] }, { merge: false, updateNestedEntities: false });
    expect(wrap(jon.books[0], true).__em).toBeUndefined();
    orm.em.assign(jon, { books: [{ _id: ObjectId.createFromTime(2), title: 'b2' }] }, { merge: true, updateNestedEntities: false });
    expect(wrap(jon.books[0], true).__em).not.toBeUndefined();
  });

  test('#assign() ignores virtual props with only getters', async () => {
    const jon = new Author('n', 'e');
    assign<any>(jon, { code: '123' });
    expect(jon.getCode()).toBe(`e - n`);
    expect((jon as any).code).toBeUndefined();
  });

  test('newly created entity should be considered as populated (GH issue #784)', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const jon = new Author('Jon Snow', 'snow@wall.st');
    const book = new Book('Book2', jon);
    jon.favouriteAuthor = god;
    jon.books.add(book);
    await orm.em.persistAndFlush(jon);
    expect(jon.toObject().id).not.toBeUndefined();
    expect(jon.toObject().books).toHaveLength(1);
    expect(jon.toObject().books[0]).toMatchObject({
      title: 'Book2',
    });
    expect(jon.toObject().favouriteAuthor).toMatchObject({
      name: 'God',
    });
  });

  test('#assign() should ignore nested entities when onlyOwnProperties : true (#5327)', async () => {
    const jon = new Author('Jon SnowOwn', 'snowown@wall.st');
    const book = new Book('Book2', jon);
    book._id = new ObjectId();
    assign<any>(jon, { books: [book], name: 'Jon SnowOwn2' }, { onlyOwnProperties: true });
    expect((jon as any).books.length).toBe(0);
    expect(jon.name).toBe('Jon SnowOwn2');
    await orm.em.persistAndFlush(jon);
    const em = orm.em.fork();
    const dbBook = await em.findOne(Book, { _id: book._id });
    expect(dbBook).toBeNull();
  });

  test('#assign() should ignore nested entities when onlyOwnProperties : true (reference) (#5327)', async () => {
    const jon = new Author('Jon SnowOwn', 'snowown@wall.st');
    const em = orm.em.fork();
    await em.persistAndFlush(jon);
    const ref = orm.em.getReference(Author, jon._id);
    const book = new Book('Book2', jon);
    book._id = new ObjectId();
    assign<any>(ref, { books: [book], name: 'Jon SnowOwn2' }, { em: orm.em, onlyOwnProperties: true });
    expect((ref as any).books).toBeUndefined();
    expect(ref.name).toBe('Jon SnowOwn2');
    await orm.em.persistAndFlush(ref);
    const em2 = orm.em.fork();
    const dbBook = await em2.findOne(Book, { _id: book._id });
    expect(dbBook).toBeNull();
  });

  test('#assign() should not allow new 1:1 when onlyOwnProperties : true (#5327)', async () => {
    const jon = new Author('Jon SnowOwn', 'snowown@wall.st');
    const book = new Book('Book2');
    expect(() => assign<any>(book, { author: jon, title: 'GreatBook' }, { em: orm.em, onlyOwnProperties: true }))
    .toThrow();
  });

  test('#assign() should not create nested owned entity when onlyOwnProperties : true (#5327)', async () => {
    const book = new Book('Book2', new Author('Temp Author', 'tempmail@wall.st'));

    const jon = new Author('Jon SnowOwn', 'snowown@wall.st');
    jon._id = new ObjectId();
    assign<any>(book, { author: jon, title: 'GreatBook' }, { em: orm.em, onlyOwnProperties: true });
    expect(book.title).toBe('GreatBook');
    await orm.em.persistAndFlush(book);

    const em2 = orm.em.fork();
    const dbJon = await em2.findOne(Author, { _id: jon._id });
    expect(dbJon).toBeNull();

  });

  test('#assign() should not create nested owned entity when onlyOwnProperties : true (reference) (#5327)', async () => {
    const book = new Book('Book2', new Author('Temp Author', 'tempmail@wall.st'));
    book._id = new ObjectId();
    const em = orm.em.fork();
    await em.persistAndFlush(book);

    const ref = orm.em.getReference(Book, book._id);
    const jon = new Author('Jon SnowOwn', 'snowown@wall.st');
    jon._id = new ObjectId();
    assign<any>(ref, { author: jon, title: 'GreatBook' }, { em: orm.em, onlyOwnProperties: true });
    expect(ref.title).toBe('GreatBook');
    await orm.em.persistAndFlush(ref);

    const em2 = orm.em.fork();
    const dbJon = await em2.findOne(Author, { _id: jon._id });
    expect(dbJon).toBeNull();

  });

 test('#assign() should not update nested owned entity when onlyOwnProperties : true (#5327)', async () => {

    const em = orm.em.fork();
    const jon = new Author('Jon SnowOwn', 'snowown@wall.st');
    jon._id = new ObjectId();
    await em.persistAndFlush([jon]);

    expect(jon.termsAccepted).toBe(false);


    const payloadJon = {
      _id: jon._id,
      termsAccepted: true,
    };

    const book = new Book('Book2', new Author('Temp Author', 'tempmail@wall.st'));
    book._id = new ObjectId();

    assign<any>(book, { author: payloadJon, title: 'GreatBook' }, { em: orm.em, onlyOwnProperties: true });
    expect(book.title).toBe('GreatBook');
    await orm.em.persistAndFlush(book);

    const em2 = orm.em.fork();
    const dbJon = await em2.findOne(Author, { _id: jon._id });
    expect(dbJon).toBeTruthy();
    expect(dbJon?.termsAccepted).toBe(false);
  });

  test('#assign() should not update nested owned entity when onlyOwnProperties : true (reference) (#5327)', async () => {
    const book = new Book('Book2', new Author('Temp Author', 'tempmail@wall.st'));
    book._id = new ObjectId();
    const em = orm.em.fork();
    const jon = new Author('Jon SnowOwn', 'snowown@wall.st');
    jon._id = new ObjectId();
    await em.persistAndFlush([book, jon]);

    expect(jon.termsAccepted).toBe(false);

    const ref = orm.em.getReference(Book, book._id);

    const payloadJon = {
      _id: jon._id,
      termsAccepted: true,
    };

    assign<any>(ref, { author: payloadJon, title: 'GreatBook' }, { em: orm.em, onlyOwnProperties: true });
    expect(ref.title).toBe('GreatBook');
    await orm.em.persistAndFlush(ref);

    const em2 = orm.em.fork();
    const dbJon = await em2.findOne(Author, { _id: jon._id });
    expect(dbJon).toBeTruthy();
    expect(dbJon?.termsAccepted).toBe(false);
  });

  test('#assign() should add nested PrimaryKey when onlyOwnProperties : true (#5327)', async () => {
    const jon = new Author('Jon SnowOwn', 'snowown@wall.st');
    jon._id = new ObjectId();
    const em = orm.em.fork();
    await em.persistAndFlush(jon);
    const book = new Book('Book2');
    assign<any>(book, { author: jon._id }, { em: orm.em, onlyOwnProperties: true });
    expect(book.author).toBeTruthy();
  });

  test('#assign() should add nested PrimaryKey when onlyOwnProperties : true (reference) (#5327)', async () => {
    const jon = new Author('Jon SnowOwn', 'snowown@wall.st');
    const book = new Book('Book2', new Author('Temp Author', 'tempmail@wall.st'));
    book._id = new ObjectId();
    jon._id = new ObjectId();
    const em = orm.em.fork();
    await em.persistAndFlush([jon, book]);
    const ref = orm.em.getReference(Book, book._id);
    assign<any>(ref, { author: jon._id }, { em: orm.em, onlyOwnProperties: true });
    expect(ref.author).toBeTruthy();
  });

  afterAll(async () => orm.close(true));

});
