import { Utils } from '../lib/Utils';
import { Collection, EntityProperty, MikroORM } from '../lib';
import { Author, Book } from './entities';
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
    expect(Utils.isObject(new Date())).toBe(true);
    expect(Utils.isObject(Test)).toBe(false);
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
    expect(Utils.diff({a: 'a', b: 'c', c: {d: 'e', f: ['i', 'h']}}, {a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toEqual({a: 'b', c: {d: 'e', f: ['g', 'h']}});
    expect(Utils.diff({a: 'a', b: 'c'}, {a: 'a', b: 'c'})).toEqual({});
    expect(Utils.diff({a: 'a', b: 'c', c: {d: 'e', f: ['g', 'h']}}, {a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toEqual({a: 'b'});
    expect(Utils.diff({a: 'a'}, {a: 'b', b: ['c']})).toEqual({a: 'b', b: ['c']});
    expect(Utils.diff({a: 'a', b: ['c']}, {b: []})).toEqual({b: []});
    expect(Utils.diff({a: 'a', b: ['c']}, {a: 'b'})).toEqual({a: 'b'});
    expect(Utils.diff({_id: 'a'}, {_id: 'b'})).toEqual({}); // ignored fields
    expect(Utils.diff({a: new Date()}, {a: new Date('2018-01-01')})).toEqual({a: new Date('2018-01-01')});
  });

  test('diffEntities ignores collections', () => {
    const author1 = new Author('Name 1', 'e-mail');
    author1.books = new Collection<Book>(author1, {} as EntityProperty);
    const author2 = new Author('Name 2', 'e-mail');
    author2.books = new Collection<Book>(author2, {} as EntityProperty);
    expect(Utils.diffEntities(author1, author2)).toEqual({ name: 'Name 2' });
  });

  test('prepareEntity changes entity to string id', async () => {
    const author1 = new Author('Name 1', 'e-mail');
    const author2 = new Author('Name 2', 'e-mail');
    const book1 = new Book('Book 1', author1);
    const book2 = new Book('Book 2', author2);
    await orm.em.persist([book1, book2, author1, author2]);
    expect(Utils.diffEntities(book1, book2)).toEqual({ title: 'Book 2', author: author2._id });
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

  /**
   * regression test for running code coverage with nyc, mocha and ts-node and entity has default constructor value as enum parameter
   */
  test('getParamNames', () => {
    const func = `function (email, organization, role=(cov_1a0rd1emyt.b[13][0]++, Test.TEST)) {}`;
    expect(Utils.getParamNames(func)).toEqual([ 'email', 'organization', 'role' ]);
    expect(Utils.getParamNames('')).toEqual([]);
  });

  afterAll(async () => orm.close(true));

});
