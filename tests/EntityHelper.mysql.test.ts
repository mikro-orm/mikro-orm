import { MikroORM, wrap } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { Author2, Book2, BookTag2, FooBar2, FooBaz2 } from './entities-sql';

describe('EntityHelperMySql', () => {

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

  test(`toObject allows to hide PK (GH issue 644)`, async () => {
    const bar = FooBar2.create('fb');
    await orm.em.persistAndFlush(bar);
    expect(wrap(bar).toObject(['id'])).not.toMatchObject({ id: bar.id, name: 'fb' });
  });

  test(`toObject handles recursion in 1:1`, async () => {
    const bar = FooBar2.create('fb');
    bar.baz = new FooBaz2('fz');
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const repo = orm.em.getRepository(FooBar2);
    const a = await repo.findOneOrFail(bar.id, ['baz.bar']);
    expect(wrap(a.baz).isInitialized()).toBe(true);
    expect(wrap(a.baz!.bar).isInitialized()).toBe(true);
    expect(wrap(a).toJSON()).toEqual({
      baz: {
        bar: { id: 1 }, // circular reference is simplified
        id: 1,
        name: 'fz',
        version: a.baz!.version,
      },
      fooBar: null,
      id: 1,
      name: 'fb',
      random: 123,
      version: a.version,
      array: null,
      object: null,
      blob: null,
    });
  });

  afterAll(async () => orm.close(true));

});
