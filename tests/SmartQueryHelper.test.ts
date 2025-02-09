import type { MikroORM } from '@mikro-orm/core';
import { Reference, QueryHelper } from '@mikro-orm/core';
import { initORMMySql } from './bootstrap.js';
import { Author2, Book2, FooBar2, FooBaz2, Test2 } from './entities-sql/index.js';
import { FooParam2 } from './entities-sql/FooParam2.js';

describe('QueryHelper', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('processWhere returns empty object for undefined condition', async () => {
    expect(QueryHelper.processWhere({ where: undefined as any, entityName: 'id', metadata: orm.getMetadata(), platform: orm.em.getDriver().getPlatform() })).toEqual({});
  });

  test('processWhere returns pk when pk is empty string and condition is entity', async () => {
    const test = new Book2('t', 1);
    test.uuid = '';
    expect(QueryHelper.processWhere({ where: test, entityName: 'id', metadata: orm.getMetadata(), platform: orm.em.getDriver().getPlatform() })).toEqual('');
  });

  test('processWhere returns pk when pk is 0 and condition is entity', async () => {
    const test = new Test2({ id: 0 });
    expect(QueryHelper.processWhere({ where: test, entityName: 'id', metadata: orm.getMetadata(), platform: orm.em.getDriver().getPlatform() })).toEqual(0);
  });

  test('test entity conversion to PK', async () => {
    const test = Test2.create('t123');
    test.id = 123;
    expect(QueryHelper.processParams({ test })).toEqual({ test: test.id });
    expect(QueryHelper.processParams(test)).toEqual(test.id);
    const author = new Author2('name', 'mail');
    const book = new Book2('test', author);
    expect(QueryHelper.processParams(book)).toEqual(book.uuid);
    const bookRef = Reference.create(book);
    expect(QueryHelper.processParams(bookRef)).toEqual(bookRef.uuid);
    expect(QueryHelper.processParams({ book: bookRef })).toEqual({ book: bookRef.uuid });
    const field = undefined;
    expect(QueryHelper.processParams({ field })).toEqual({ field: null });
  });

  test('test entity conversion to composite PK', async () => {
    const bar = FooBar2.create('bar');
    bar.id = 3;
    const baz = new FooBaz2('baz');
    baz.id = 7;
    expect(QueryHelper.processParams({ field: new FooParam2(bar, baz, 'val') })).toEqual({ field: [3, 7] });
  });

  test('test array conversion to $in query', async () => {
    const author = new Author2('name', 'mail');
    const book1 = new Book2('b1', author);
    const book2 = new Book2('b2', author);
    const book3 = new Book2('b3', author);
    expect(QueryHelper.processWhere<Author2>({ where: [1, 2, 3], entityName: 'uuid', metadata: orm.getMetadata(), platform: orm.em.getDriver().getPlatform() })).toEqual({ uuid: { $in: [1, 2, 3] } });
    expect(QueryHelper.processWhere<Book2>({ where: [book1, book2, book3], entityName: 'uuid', metadata: orm.getMetadata(), platform: orm.em.getDriver().getPlatform() })).toEqual({ uuid: { $in: [book1.uuid, book2.uuid, book3.uuid] } });
    expect(QueryHelper.processWhere<Author2>({ where: { favouriteBook: ['1', '2', '3'] }, entityName: 'id', metadata: orm.getMetadata(), platform: orm.em.getDriver().getPlatform() })).toEqual({ favouriteBook: { $in: ['1', '2', '3'] } });
    expect(QueryHelper.processWhere<Book2>({ where: { $or: [{ author: [1, 2, 3] }, { author: [7, 8, 9] }] }, entityName: 'id', metadata: orm.getMetadata(), platform: orm.em.getDriver().getPlatform() })).toEqual({
      $or: [{ author: { $in: [1, 2, 3] } }, { author: { $in: [7, 8, 9] } }],
    });
  });

});
