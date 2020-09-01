import { assign, EntityData, MikroORM, wrap } from '@mikro-orm/core';
import { MongoDriver, ObjectId } from '@mikro-orm/mongodb';
import { Author, Book, BookTag } from './entities';
import { initORMMongo, wipeDatabase } from './bootstrap';

describe('EntityAssignerMongo', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => wipeDatabase(orm.em));

  test('#assign() should update entity values', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const jon = new Author('Jon Snow', 'snow@wall.st');
    const book = new Book('Book2', jon);
    await orm.em.persistAndFlush(book);
    expect(book.title).toBe('Book2');
    expect(book.author).toBe(jon);
    book.assign({ title: 'Better Book2 1', author: god, notExisting: true });
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
    expect(() => assign(book, { tags: [false] } as any)).toThrowError(`Invalid collection values provided for 'Book.tags' in Book.assign(): [ false ]`);
    expect(() => assign(book, { publisher: [{ foo: 'bar' }] } as EntityData<Book>)).toThrowError(`Invalid reference value provided for 'Book.publisher' in Book.assign(): [{"foo":"bar"}]`);
  });

  test('#assign() should ignore undefined properties', async () => {
    const jon = new Author('Jon Snow', 'snow@wall.st');
    assign(jon, { name: 'test', unknown: 123 }, { onlyProperties: true });
    expect((jon as any).unknown).toBeUndefined();
  });

  test('#assign() should merge references', async () => {
    const jon = new Author('Jon Snow', 'snow@wall.st');
    orm.em.assign(jon, { favouriteBook: { _id: ObjectId.createFromTime(1), title: 'b1' } }, { merge: false });
    expect(wrap(jon.favouriteBook, true).__em).toBeUndefined();
    orm.em.assign(jon, { favouriteBook: { _id: ObjectId.createFromTime(1), title: 'b1' } }, { merge: true });
    expect(wrap(jon.favouriteBook, true).__em).not.toBeUndefined();
  });

  test('#assign() should merge collection items', async () => {
    const jon = new Author('Jon Snow', 'snow@wall.st');
    orm.em.assign(jon, { books: [{ _id: ObjectId.createFromTime(1), title: 'b1' }] }, { merge: false });
    expect(wrap(jon.books[0], true).__em).toBeUndefined();
    orm.em.assign(jon, { books: [{ _id: ObjectId.createFromTime(2), title: 'b2' }] }, { merge: true });
    expect(wrap(jon.books[0], true).__em).not.toBeUndefined();
  });

  test('#assign() ignores virtual props with only getters', async () => {
    const jon = new Author('n', 'e');
    assign(jon, { code: '123' });
    expect(jon.getCode()).toBe(`e - n`);
    expect((jon as any).code).toBeUndefined();
  });

  afterAll(async () => orm.close(true));

});
