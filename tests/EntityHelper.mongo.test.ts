import { ObjectId } from 'mongodb';
import { inspect } from 'util';

import { AnyEntity, MikroORM, Reference, wrap } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { Author, Book, Publisher, Test } from './entities';
import { initORMMongo, wipeDatabase } from './bootstrap';
import FooBar from './entities/FooBar';
import { FooBaz } from './entities/FooBaz';

describe('EntityHelperMongo', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => wipeDatabase(orm.em));

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

    const author = (await orm.em.findOne(Author, god.id, { populate: ['favouriteAuthor', 'books.author.books', 'books.publisher'] }))!;
    const json = wrap(author).toObject();
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
    god.populated();
    expect(wrap(god, true).__populated).toBe(true);
    expect(wrap(god, true).__platform).toBe(orm.em.getDriver().getPlatform());

    const ref = god.toReference();
    expect(ref).toBeInstanceOf(Reference);
    expect(ref.getEntity()).toBe(god);
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

    const jon = await orm.em.findOne(Author, author.id);
    await orm.em.nativeUpdate(Author, { id: author.id }, { name: 'Changed!' });
    expect(jon!.name).toBe('Jon Snow');
    await wrap(jon).init();
    expect(jon!.name).toBe('Changed!');
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
    expect(wrap(null)).toBeNull();
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
    expect(baz.bar).toBe(bar);
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

    // util.inspect was buggy in node < 12 so we cannot compare the same snapshot
    if (+process.version.match(/^v(\d+\.\d+)/)![1] >= 12) {
      expect(actual).toBe('FooBar {\n' +
        '  meta: { onCreateCalled: false, onUpdateCalled: false },\n' +
        "  name: 'bar',\n" +
        '  baz: FooBaz {\n' +
        "    name: 'baz',\n" +
        "    bar: FooBar { meta: [Object], name: 'bar', baz: [FooBaz] }\n" +
        '  }\n' +
        '}');
    }

    expect(inspect((bar as AnyEntity).__helper)).toBe('[WrappedEntity<FooBar>]');
    bar.baz = orm.em.getReference(FooBaz, '5b0ff0619fbec620008d2414');
    actual = inspect(bar);

    // util.inspect was buggy in node < 12 so we cannot compare the same snapshot
    if (+process.version.match(/^v(\d+\.\d+)/)![1] >= 12) {
      expect(actual).toBe('FooBar {\n' +
        '  meta: { onCreateCalled: false, onUpdateCalled: false },\n' +
        "  name: 'bar',\n" +
        "  baz: Ref<FooBaz> { _id: ObjectId('5b0ff0619fbec620008d2414') }\n" +
        '}');
    }

    const god = new Author('God', 'hello@heaven.god');
    const bible = new Book('Bible', god);
    bible.createdAt = new Date('2020-07-18T17:31:08.535Z');
    god.favouriteAuthor = god;
    delete god.createdAt;
    delete (god as any).updatedAt;
    bible.publisher = Reference.create(new Publisher('Publisher 1'));
    actual = inspect(god);

    // util.inspect was buggy in node < 12 so we cannot compare the same snapshot
    if (+process.version.match(/^v(\d+\.\d+)/)![1] >= 12) {
      expect(actual).toBe('Author {\n' +
        '  hookTest: false,\n' +
        '  termsAccepted: false,\n' +
        '  books: Collection {\n' +
        "    '0': Book {\n" +
        '      createdAt: ISODate(\'2020-07-18T17:31:08.535Z\'),\n' +
        '      tags: [Collection],\n' +
        "      title: 'Bible',\n" +
        '      author: [Author],\n' +
        '      publisher: [Reference]\n' +
        '    },\n' +
        '    initialized: true,\n' +
        '    dirty: true\n' +
        '  },\n' +
        '  friends: Collection { initialized: true, dirty: false },\n' +
        "  name: 'God',\n" +
        "  email: 'hello@heaven.god',\n" +
        "  foo: 'bar',\n" +
        '  favouriteAuthor: Author {\n' +
        '    hookTest: false,\n' +
        '    termsAccepted: false,\n' +
        "    books: Collection { '0': [Book], initialized: true, dirty: true },\n" +
        '    friends: Collection { initialized: true, dirty: false },\n' +
        "    name: 'God',\n" +
        "    email: 'hello@heaven.god',\n" +
        "    foo: 'bar',\n" +
        '    favouriteAuthor: Author {\n' +
        '      hookTest: false,\n' +
        '      termsAccepted: false,\n' +
        '      books: [Collection],\n' +
        '      friends: [Collection],\n' +
        "      name: 'God',\n" +
        "      email: 'hello@heaven.god',\n" +
        "      foo: 'bar',\n" +
        '      favouriteAuthor: [Author]\n' +
        '    }\n' +
        '  }\n' +
        '}');
    }
  });

  afterAll(async () => orm.close(true));

});
