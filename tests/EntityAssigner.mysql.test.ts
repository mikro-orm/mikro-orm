import { MikroORM, Reference, wrap } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { Author2, Book2, BookTag2, FooBar2, Publisher2, PublisherType } from './entities-sql';

describe('EntityAssignerMySql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  beforeEach(async () => wipeDatabaseMySql(orm.em));

  test('assign() should update entity values [mysql]', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    await orm.em.persistAndFlush(book);
    expect(book.title).toBe('Book2');
    expect(book.author).toBe(jon);
    wrap(book).assign({ title: 'Better Book2 1', author: god, notExisting: true });
    expect(book.author).toBe(god);
    expect((book as any).notExisting).toBe(true);
    await orm.em.persistAndFlush(god);
    wrap(book).assign({ title: 'Better Book2 2', author: god.id });
    expect(book.author).toBe(god);
    wrap(book).assign({ title: 'Better Book2 3', author: jon.id });
    expect(book.title).toBe('Better Book2 3');
    expect(book.author).toBe(jon);
  });

  test('assign() should fix property types [mysql]', async () => {
    const god = new Author2('God', 'hello@heaven.god');
    wrap(god).assign({ createdAt: '2018-01-01', termsAccepted: 1 });
    expect(god.createdAt).toEqual(new Date('2018-01-01'));
    expect(god.termsAccepted).toBe(true);

    const d1 = +new Date('2018-01-01');
    wrap(god).assign({ createdAt: '' + d1, termsAccepted: 0 });
    expect(god.createdAt).toEqual(new Date('2018-01-01'));
    expect(god.termsAccepted).toBe(false);

    wrap(god).assign({ createdAt: d1, termsAccepted: 0 });
    expect(god.createdAt).toEqual(new Date('2018-01-01'));

    const d2 = +new Date('2018-01-01 00:00:00.123');
    wrap(god).assign({ createdAt: '' + d2 });
    expect(god.createdAt).toEqual(new Date('2018-01-01 00:00:00.123'));

    wrap(god).assign({ createdAt: d2 });
    expect(god.createdAt).toEqual(new Date('2018-01-01 00:00:00.123'));
  });

  test('assign() should update entity collection [mysql]', async () => {
    const other = new BookTag2('other');
    await orm.em.persistAndFlush(other);
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    const tag1 = new BookTag2('tag 1');
    const tag2 = new BookTag2('tag 2');
    const tag3 = new BookTag2('tag 3');
    book.tags.add(tag1, tag2, tag3);
    await orm.em.persistAndFlush(book);
    wrap(book).assign({ tags: [other.id] });
    expect(book.tags.getIdentifiers()).toMatchObject([other.id]);
    wrap(book).assign({ tags: [] });
    expect(book.tags.getIdentifiers()).toMatchObject([]);
    wrap(book).assign({ tags: [tag1.id, tag3.id] });
    expect(book.tags.getIdentifiers()).toMatchObject([tag1.id, tag3.id]);
    wrap(book).assign({ tags: [tag2] });
    expect(book.tags.getIdentifiers()).toMatchObject([tag2.id]);
    await orm.em.flush();

    orm.em.clear();
    const book2 = await orm.em.findOneOrFail(Book2, book.uuid);
    await book2.tags.init();
    expect(book2.tags.getIdentifiers()).toMatchObject([tag2.id]);
  });

  test('assign() should update m:1 or 1:1 nested entities [mysql]', async () => {
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book1 = new Book2('Book2', jon);
    const jon2 = new Author2('Jon2 Snow', 'snow3@wall.st');
    const book2 = new Book2('Book2', jon2);
    await orm.em.persistAndFlush(book1);
    await orm.em.persistAndFlush(book2);
    wrap(book1).assign({ author: { name: 'Jon Snow2' } });
    expect(book1.author.name).toEqual('Jon Snow2');
    expect(book1.author.email).toBeUndefined();
    expect(book1.author).not.toEqual(jon);

    wrap(book2).assign({ author: { name: 'Jon Snow2' } }, { updateNestedEntities: true });
    expect(book2.author.name).toEqual('Jon Snow2');
    expect(book2.author.email).toEqual('snow3@wall.st');
    expect(book2.author).toEqual(jon2);
  });

  test('assign() with updateNestedEntities flag should ignore not initialized entities [mysql]', async () => {
    const jon = new Author2('Jon2 Snow', 'snow3@wall.st');
    const book = new Book2('Book2', jon);
    const publisher = new Publisher2('Good Books LLC', PublisherType.LOCAL);
    book.publisher = Reference.create(publisher);
    await orm.em.persistAndFlush(book);

    const id = book.uuid;

    orm.em.clear();

    const book2 = (await orm.em.getRepository(Book2).findOne(id))!;
    const originalAuthorRef = book2.author;
    const originalPublisherWrappedRef = book2.publisher;

    expect(Reference.isReference(book2.author)).toEqual(false);
    expect(wrap(book2.author).isInitialized()).toEqual(false);

    expect(wrap(book2.publisher).isInitialized()).toEqual(false);
    expect(Reference.isReference(book2.publisher)).toEqual(true);

    wrap(book2).assign({ author: { name: 'Jon Snow2' }, publisher: { name: 'Better Books LLC' } }, { updateNestedEntities: true });
    wrap(originalAuthorRef).populated(true);

    // this means that the original object has been replaced, something updateNestedEntities does not do
    expect(book2.author).not.toEqual(originalAuthorRef);
    expect(book2.publisher).not.toEqual(originalPublisherWrappedRef);
  });

  test('assign() should update not initialized collection [mysql]', async () => {
    const other = new BookTag2('other');
    await orm.em.persistAndFlush(other);
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    const tag1 = new BookTag2('tag 1');
    const tag2 = new BookTag2('tag 2');
    const tag3 = new BookTag2('tag 3');
    book.tags.add(tag1, tag2, tag3);
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    const book1 = await orm.em.findOneOrFail(Book2, book.uuid);
    wrap(book1).assign({ tags: [tag1.id, other.id] });
    await orm.em.flush();
    orm.em.clear();

    const book2 = await orm.em.findOneOrFail(Book2, book.uuid, ['tags']);
    expect(book2.tags.getIdentifiers()).toMatchObject([tag1.id, other.id]);
  });

  test('assign() allows deep merging of object properties [mysql]', async () => {
    const jon = new Author2('Jon Snow', 'snow@wall.st');
    const book = new Book2('Book2', jon);
    book.meta = { items: 5, category: 'test' };
    wrap(book).assign({ meta: { items: 3, category: 'foo' } });
    expect(book.meta).toEqual({ items: 3, category: 'foo' });
    wrap(book).assign({ meta: { category: 'bar' } }, { mergeObjects: true });
    expect(book.meta).toEqual({ items: 3, category: 'bar' });
    wrap(book).assign({ meta: { category: 'bar' } });
    expect(book.meta).toEqual({ category: 'bar' });
    jon.identities = ['1', '2'];
    wrap(jon).assign({ identities: ['3', '4'] }, { mergeObjects: true });
    expect(jon.identities).toEqual(['3', '4']);
  });

  test('assigning blobs (GH issue #1406)', async () => {
    const bar = FooBar2.create('initial name');
    bar.blob = Buffer.from('abcdefg');
    await orm.em.fork().persistAndFlush(bar);

    const em = orm.em.fork();
    const existing = await em.findOneOrFail(FooBar2, bar);
    em.assign(existing, {
      name: 'updated name',
      blob: Buffer.from('123456'),
    }, { mergeObjects: true });
    await em.flush();

    const bar1 = await orm.em.fork().findOneOrFail(FooBar2, 1);
    expect(bar1.name).toBe('updated name');
    expect(bar1.blob!.toString()).toBe('123456');
  });

  afterAll(async () => orm.close(true));

});
