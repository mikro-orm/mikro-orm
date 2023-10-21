import { ObjectId } from 'bson';
import { inspect } from 'util';

import type { AnyEntity, MikroORM } from '@mikro-orm/core';
import { Reference, serialize, wrap } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { Author, Book, Publisher, Test } from './entities';
import { initORMMongo } from './bootstrap';
import FooBar from './entities/FooBar';
import { FooBaz } from './entities/FooBaz';

describe('EntityHelperMongo', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => orm.schema.clearDatabase());

  test('#toObject() should return DTO', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.born = new Date();
    expect(author).toBeInstanceOf(Author);
    expect(wrap(author).toObject()).toBeInstanceOf(Object);
    expect(author.toObject()).toBeInstanceOf(Object);
  });

  test('#toObject() should ignore properties marked with hidden flag', async () => {
    const test = Test.create('Bible');
    expect(test.hiddenField).toBeDefined();
    expect(wrap(test).toJSON().hiddenField).not.toBeDefined();
  });

  test('#toJSON() should return DTO', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author.born = new Date();
    expect(author).toBeInstanceOf(Author);
    expect(author.toJSON()).toBeInstanceOf(Object);
    expect(author.toJSON()).toMatchObject({ fooBar: 123 });
    expect(author.toJSON().email).toBeUndefined();
    expect(author.toJSON(false)).toMatchObject({ fooBar: 123, email: author.email });
  });

  test('#toJSON properly calls child entity toJSON with correct params', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    const bible2 = new Book('Bible pt. 2', god);
    const bible3 = new Book('Bible pt. 3', new Author('Lol', 'lol@lol.lol'));
    await orm.em.persistAndFlush([bible, bible2, bible3]);
    orm.em.clear();

    const newGod = await orm.em.findOneOrFail(Author, god.id, { populate: ['books.author'] });

    for (const book of newGod.books) {
      expect(book.toJSON()).toMatchObject({
        author: { name: book.author.name },
      });
    }
  });

  test('#toObject complex serialization (1:m -> m:1)', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    god.favouriteAuthor = god;
    bible.publisher = Reference.create(new Publisher('Publisher 1'));
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const author = await orm.em.findOneOrFail(Author, god.id, { populate: ['favouriteAuthor', 'books.author.books', 'books.publisher'] });
    const json = wrap(author).toObject(['name']);
    // @ts-expect-error
    expect(json.name).toBeUndefined();
    expect(json.termsAccepted).toBe(false);
    expect(json.favouriteAuthor).toBe(god.id); // self reference will be ignored even when explicitly populated
    expect(json.books![0]).toMatchObject({
      author: { name: bible.author.name },
      publisher: { name: (await bible.publisher.load()).name },
    });
    expect(json.books[0].author.books).toBeInstanceOf(Array); // even the cycle is there, as it is explicitly populated path
    expect(json.books[0].author.books).toHaveLength(1);
  });

  test('BaseEntity methods', async () => {
    const god = new Author('God', 'hello@heaven.god');
    expect(wrap(god, true).__populated).toBeUndefined();
    expect(wrap(god, true).__touched).toBe(true);
    expect(god.isTouched()).toBe(true);
    god.populated();
    await expect(god.populate(['favouriteAuthor'])).rejects.toThrowError('Entity Author is not managed.');
    expect(wrap(god, true).__populated).toBe(true);
    expect(wrap(god, true).__platform).toBe(orm.em.getDriver().getPlatform());

    const ref = god.toReference();
    expect(ref).toBeInstanceOf(Reference);
    expect(ref.getEntity()).toBe(god);

    await orm.em.persistAndFlush(god);
    await god.populate(['favouriteAuthor']);
    expect(wrap(god, true).__touched).toBe(false);
    expect(god.isTouched()).toBe(false);
    god.name = '123';
    expect(wrap(god, true).__touched).toBe(true);
    expect(god.isTouched()).toBe(true);
    expect(god.toPOJO()).toMatchObject({
      name: '123',
      email: 'hello@heaven.god',
      books: [],
      foo: 'bar',
      friends: [],
      termsAccepted: false,
    });
  });

  test('#load() should populate the entity', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const jon = orm.em.getReference(Author, author.id!);
    expect(wrap(jon).isInitialized()).toBe(false);
    await wrap(jon).init();
    expect(wrap(jon).isInitialized()).toBe(true);
  });

  test('#load() should refresh the entity if its already loaded', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const jon = await orm.em.findOneOrFail(Author, author.id);
    await orm.em.nativeUpdate(Author, { id: author.id }, { name: 'Changed!' });
    expect(jon.name).toBe('Jon Snow');
    await wrap(jon).init();
    expect(jon.name).toBe('Changed!');
  });

  test('should have string id getter and setter', async () => {
    const author = new Author('Jon Snow', 'snow@wall.st');
    author._id = new ObjectId('5b0ff0619fbec620008d2414');
    expect(author.id).toBe('5b0ff0619fbec620008d2414');

    author.id = '5b0d19b28b21c648c2c8a600';
    expect(author._id).toEqual(new ObjectId('5b0d19b28b21c648c2c8a600'));

    author.id = '';
    expect(author._id).toBeNull();
  });

  test('wrap helper returns the argument when its falsy', async () => {
    // @ts-expect-error
    expect(wrap(null)).toBeNull();
    // @ts-expect-error
    expect(wrap(undefined)).toBeUndefined();
  });

  test('setting m:1 reference is propagated to 1:m collection', async () => {
    const author = new Author('n', 'e');
    const book = new Book('t');
    book.author = author;
    expect(author.books.getItems()).toContain(book);
    await orm.em.persistAndFlush(book);
    orm.em.clear();

    const b = await orm.em.findOneOrFail(Book, book.id);
    expect(orm.em.getComparator().prepareEntity(b)).toEqual({
      _id: b._id,
      createdAt: b.createdAt,
      title: b.title,
      author: b.author._id,
    });
  });

  test('setting 1:1 reference is propagated to the inverse side', async () => {
    const bar = FooBar.create('bar');
    const baz = FooBaz.create('baz');
    bar.baz = baz;
    expect(baz.bar.unwrap()).toBe(bar);
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const b = await orm.em.findOneOrFail(FooBar, bar.id);
    expect(orm.em.getComparator().prepareEntity(b)).toEqual({
      _id: b._id,
      name: b.name,
      baz: b.baz!._id,
      onCreateTest: true,
      onUpdateTest: true,
    });
  });

  test('custom inspect shows get/set props', async () => {
    const bar = FooBar.create('bar');
    bar.baz = FooBaz.create('baz');
    let actual = inspect(bar);

    expect(actual).toBe('FooBar {\n' +
      '  meta: { onCreateCalled: false, onUpdateCalled: false },\n' +
      "  name: 'bar',\n" +
      "  baz: FooBaz { name: 'baz', bar: Ref<FooBar> { entity: [FooBar] } }\n" +
      '}');

    expect(inspect((bar as AnyEntity).__helper)).toBe('[WrappedEntity<FooBar>]');
    bar.baz = orm.em.getReference(FooBaz, '5b0ff0619fbec620008d2414');
    actual = inspect(bar);

    expect(actual).toBe('FooBar {\n' +
      '  meta: { onCreateCalled: false, onUpdateCalled: false },\n' +
      "  name: 'bar',\n" +
      "  baz: (FooBaz) { _id: ObjectId('5b0ff0619fbec620008d2414') }\n" +
      '}');

    process.env.MIKRO_ORM_LOG_EM_ID = '1';
    actual = inspect(bar);
    process.env.MIKRO_ORM_LOG_EM_ID = '0';

    expect(actual).toBe('FooBar [not managed] {\n' +
      '  meta: { onCreateCalled: false, onUpdateCalled: false },\n' +
      "  name: 'bar',\n" +
      "  baz: (FooBaz [managed by 1]) { _id: ObjectId('5b0ff0619fbec620008d2414') }\n" +
      '}');

    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    bible.createdAt = new Date('2020-07-18T17:31:08.535Z');
    god.favouriteAuthor = god;
    delete god.createdAt;
    delete (god as any).updatedAt;
    bible.publisher = Reference.create(new Publisher('Publisher 1'));
    actual = inspect(god);

    expect(actual).toBe('Author {\n' +
      '  hookTest: false,\n' +
      '  termsAccepted: false,\n' +
      '  books: Collection<Book> {\n' +
      "    '0': Book {\n" +
      '      createdAt: ISODate(\'2020-07-18T17:31:08.535Z\'),\n' +
      '      tags: [Collection<BookTag>],\n' +
      "      title: 'Bible',\n" +
      '      author: [Author],\n' +
      '      publisher: [Ref<Publisher>]\n' +
      '    },\n' +
      '    initialized: true,\n' +
      '    dirty: true\n' +
      '  },\n' +
      '  friends: Collection<Author> { initialized: true, dirty: false },\n' +
      "  name: 'God',\n" +
      "  email: 'hello@heaven.god',\n" +
      "  foo: 'bar',\n" +
      '  favouriteAuthor: Author {\n' +
      '    hookTest: false,\n' +
      '    termsAccepted: false,\n' +
      "    books: Collection<Book> { '0': [Book], initialized: true, dirty: true },\n" +
      '    friends: Collection<Author> { initialized: true, dirty: false },\n' +
      "    name: 'God',\n" +
      "    email: 'hello@heaven.god',\n" +
      "    foo: 'bar',\n" +
      '    favouriteAuthor: Author {\n' +
      '      hookTest: false,\n' +
      '      termsAccepted: false,\n' +
      '      books: [Collection<Book>],\n' +
      '      friends: [Collection<Author>],\n' +
      "      name: 'God',\n" +
      "      email: 'hello@heaven.god',\n" +
      "      foo: 'bar',\n" +
      '      favouriteAuthor: [Author]\n' +
      '    }\n' +
      '  }\n' +
      '}');
  });

  test('explicit serialization with not initialized properties', async () => {
    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    god.favouriteAuthor = god;
    bible.publisher = Reference.create(new Publisher('Publisher 1'));
    await orm.em.persistAndFlush(bible);
    orm.em.clear();

    const jon = await orm.em.findOneOrFail(Author, god, { populate: true });
    const [o] = serialize([jon], { populate: true });
    expect(o).toMatchObject({
      id: jon.id,
      createdAt: jon.createdAt,
      updatedAt: jon.updatedAt,
      email: 'hello@heaven.god',
      name: 'God',
    });
  });

  afterAll(async () => orm.close(true));

});
