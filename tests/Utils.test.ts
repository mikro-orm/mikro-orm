import { Utils } from'../lib/Utils';
import { Collection, EntityProperty, MikroORM } from '../lib';
import { Book } from './entities/Book';
import { Author } from './entities/Author';
import { initORM, wipeDatabase } from './bootstrap';

class Test {}

/**
 * @class UtilsTest
 */
describe('Utils', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORM());
  beforeEach(async () => wipeDatabase(orm.em));

  test('isObject', () => {
    expect(Utils.isObject(undefined)).toBe(false);
    expect(Utils.isObject('a')).toBe(false);
    expect(Utils.isObject(0)).toBe(false);
    expect(Utils.isObject(5)).toBe(false);
    expect(Utils.isObject(5.3)).toBe(false);
    expect(Utils.isObject(['a'])).toBe(true);
    expect(Utils.isObject(null)).toBe(false);
    expect(Utils.isObject(() => 1)).toBe(false);
    expect(Utils.isObject(function() { return 1; })).toBe(false);
    expect(Utils.isObject({})).toBe(true);
    expect(Utils.isObject(new Test())).toBe(true);
    expect(Utils.isObject(Test)).toBe(false);
  });

  test('isArray', () => {
    expect(Utils.isArray(undefined)).toBe(false);
    expect(Utils.isArray('a')).toBe(false);
    expect(Utils.isArray(0)).toBe(false);
    expect(Utils.isArray(5)).toBe(false);
    expect(Utils.isArray(5.3)).toBe(false);
    expect(Utils.isArray(['a'])).toBe(true);
    expect(Utils.isArray(null)).toBe(false);
    expect(Utils.isArray(() => 1)).toBe(false);
    expect(Utils.isArray(function() { return 1; })).toBe(false);
    expect(Utils.isArray({})).toBe(false);
    expect(Utils.isArray(new Test())).toBe(false);
    expect(Utils.isArray(Test)).toBe(false);
  });

  test('isString', () => {
    expect(Utils.isString(undefined)).toBe(false);
    expect(Utils.isString('a')).toBe(true);
    expect(Utils.isString(0)).toBe(false);
    expect(Utils.isString(5)).toBe(false);
    expect(Utils.isString(5.3)).toBe(false);
    expect(Utils.isString(['a'])).toBe(false);
    expect(Utils.isString(null)).toBe(false);
    expect(Utils.isString(() => 1)).toBe(false);
    expect(Utils.isString({})).toBe(false);
    expect(Utils.isString(new Test())).toBe(false);
    expect(Utils.isString(Test)).toBe(false);
  });

  test('equals', () => {
    expect(Utils.equals([1, 2, 3], [3, 2, 1])).toBe(false);
    expect(Utils.equals([1, 2, 3], [1, 2, 3, 4])).toBe(false);
    expect(Utils.equals([1, 2, 3, 4], [1, 2, 3])).toBe(false);
    expect(Utils.equals([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(Utils.equals({a: 'a', b: 'c'}, {a: 'b', b: 'c'})).toBe(false);
    expect(Utils.equals({a: 'a', b: 'c', c: {d: 'e', f: ['i', 'h']}}, {a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toBe(false);
    expect(Utils.equals({a: 'a', b: 'c'}, {a: 'a', b: 'c'})).toBe(true);
    expect(Utils.equals({a: 'a', b: 'c', c: {d: 'e', f: ['g', 'h']}}, {a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toBe(false);
    expect(Utils.equals({a: 'a', b: 'c', c: {d: 'e', f: ['g', 'h']}}, {a: 'a', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toBe(true);
  });

  test('diff', () => {
    expect(Utils.diff({a: 'a', b: 'c'}, {a: 'b', b: 'c'})).toEqual({a: 'b'});
    expect(Utils.diff({a: 'a', b: 'c', c: {d: 'e', f: ['i', 'h']}}, {a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toEqual({a: 'b', c: {f: ['g', 'h']}});
    expect(Utils.diff({a: 'a', b: 'c'}, {a: 'a', b: 'c'})).toEqual({});
    expect(Utils.diff({a: 'a', b: 'c', c: {d: 'e', f: ['g', 'h']}}, {a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toEqual({a: 'b'});
    expect(Utils.diff({a: 'a'}, {a: 'b', b: ['c']})).toEqual({a: 'b', b: ['c']});
    expect(Utils.diff({a: 'a', b: ['c']}, {b: []})).toEqual({b: []});
    expect(Utils.diff({a: 'a', b: ['c']}, {a: 'b'})).toEqual({a: 'b'});
    expect(Utils.diff({_id: 'a', createdAt: 1, updatedAt: 1}, {_id: 'b', createdAt: 2, updatedAt: 2})).toEqual({}); // ignored fields
  });

  test('diffEntities ignores collections', () => {
    const author1 = new Author('Name 1', 'e-mail');
    author1.books = new Collection<Book>({} as EntityProperty, author1);
    const author2 = new Author('Name 2', 'e-mail');
    author2.books = new Collection<Book>({} as EntityProperty, author2);
    expect(Utils.diffEntities(author1, author2)).toEqual({ name: 'Name 2' });
  });

  test('prepareEntity changes entity to string id', async () => {
    const author1 = new Author('Name 1', 'e-mail');
    const book = new Book('test', author1);
    const author2 = new Author('Name 2', 'e-mail');
    author2.favouriteBook = book;
    author2.version = 123;
    await orm.em.persist([author1, author2, book]);
    expect(Utils.diffEntities(author1, author2)).toEqual({ name: 'Name 2', favouriteBook: book.id });
  });

  test('copy', () => {
    const a = {a: 'a', b: 'c'};
    const b = Utils.copy(a);
    b.a = 'b';
    expect(a.a).toBe('a');
    expect(b.a).toBe('b');

    const c = {a: 'a', b: 'c', inner: {foo: 'bar'}} as any;
    const d = Utils.copy(c);
    d.inner.lol = 'new';
    expect(c.inner.lol).toBeUndefined();
    expect(d.inner.lol).toBe('new');
  });

  afterAll(async () => orm.close(true));

});
