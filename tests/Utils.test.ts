import { ObjectID } from 'mongodb';
import { Collection, MikroORM, Utils } from '../lib';
import { Author, Book } from './entities';
import { initORM, wipeDatabase } from './bootstrap';
import { MetadataStorage } from '../lib/metadata';
import { Book2 } from './entities-sql';

class Test {}

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
    expect(Utils.isObject(['a'])).toBe(false);
    expect(Utils.isObject(null)).toBe(false);
    expect(Utils.isObject(() => 1)).toBe(false);
    expect(Utils.isObject(function () { return 1; })).toBe(false);
    expect(Utils.isObject({})).toBe(true);
    expect(Utils.isObject(new Test())).toBe(true);
    expect(Utils.isObject(new Date())).toBe(true);
    expect(Utils.isObject(Test)).toBe(false);
  });

  test('isEntity', () => {
    expect(Utils.isEntity(Author.prototype)).toBe(true);
    expect(Utils.isEntity(new Author('a', 'b'))).toBe(true);
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

  test('merge', () => {
    expect(Utils.merge({a: 'a', b: 'c'}, {a: 'b', b: 'c'})).toEqual({a: 'b', b: 'c'});
    expect(Utils.merge({a: 'a', b: 'c', c: {d: 'e', f: ['i', 'h']}}, {a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toEqual({a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}});
    expect(Utils.merge({a: 'a', b: 'c'}, {a: 'a', b: 'c'})).toEqual({a: 'a', b: 'c'});
    expect(Utils.merge({a: 'a', b: 'c', c: {a: 'u', f: ['g', 'h']}}, {a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toEqual({a: 'b', b: 'c', c: {a: 'u', d: 'e', f: ['g', 'h']}});
    expect(Utils.merge({a: 'a'}, {a: 'b', b: ['c']})).toEqual({a: 'b', b: ['c']});
    expect(Utils.merge({a: 'a', b: ['c']}, {b: []})).toEqual({a: 'a', b: []});
    expect(Utils.merge({a: 'a', b: ['c']}, {a: 'b'})).toEqual({a: 'b', b: ['c']});
    expect(Utils.merge({a: 'a', b: ['c']}, {a: undefined})).toEqual({a: undefined, b: ['c']});
    expect(Utils.merge('a', 'b')).toEqual('a');
  });

  test('diff', () => {
    expect(Utils.diff({a: 'a', b: 'c'}, {a: 'b', b: 'c'})).toEqual({a: 'b'});
    expect(Utils.diff({a: 'a', b: 'c', c: {d: 'e', f: ['i', 'h']}}, {a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toEqual({a: 'b', c: {d: 'e', f: ['g', 'h']}});
    expect(Utils.diff({a: 'a', b: 'c'}, {a: 'a', b: 'c'})).toEqual({});
    expect(Utils.diff({a: 'a', b: 'c', c: {d: 'e', f: ['g', 'h']}}, {a: 'b', b: 'c', c: {d: 'e', f: ['g', 'h']}})).toEqual({a: 'b'});
    expect(Utils.diff({a: 'a'}, {a: 'b', b: ['c']})).toEqual({a: 'b', b: ['c']});
    expect(Utils.diff({a: 'a', b: ['c']}, {b: []})).toEqual({b: []});
    expect(Utils.diff({a: 'a', b: ['c']}, {a: 'b'})).toEqual({a: 'b'});
    expect(Utils.diff({a: 'a', b: ['c']}, {a: undefined})).toEqual({a: undefined});
    expect(Utils.diff({a: new Date()}, {a: new Date('2018-01-01')})).toEqual({a: new Date('2018-01-01')});
    expect(Utils.diff({a: new ObjectID('00000001885f0a3cc37dc9f0')}, {a: new ObjectID('00000001885f0a3cc37dc9f0')})).toEqual({});
  });

  test('diffEntities ignores collections', () => {
    const author1 = new Author('Name 1', 'e-mail');
    author1.books = new Collection<Book>(author1);
    const author2 = new Author('Name 2', 'e-mail');
    author2.books = new Collection<Book>(author2);
    expect(Utils.diffEntities(author1, author2).books).toBeUndefined();
  });

  test('prepareEntity changes entity to string id', async () => {
    const author1 = new Author('Name 1', 'e-mail');
    const book = new Book('test', author1);
    const author2 = new Author('Name 2', 'e-mail');
    author2.favouriteBook = book;
    author2.version = 123;
    await orm.em.persist(author2);
    const diff = Utils.diffEntities(author1, author2);
    expect(diff).toMatchObject({ name: 'Name 2', favouriteBook: book._id });
    expect(diff.favouriteBook instanceof ObjectID).toBe(true);
  });

  test('prepareEntity ignores properties with `persist: false` flag', async () => {
    const author = new Author('Name 1', 'e-mail');
    author.version = 123;
    author.versionAsString = 'v123';
    const o = Utils.prepareEntity(author);
    expect(o.version).toBeUndefined();
    expect(o.versionAsString).toBeUndefined();
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
    expect(Utils.getParamNames(Test)).toEqual([]);
    expect(Utils.getParamNames('')).toEqual([]);

    const func = `function (email, organization, role=(cov_1a0rd1emyt.b[13][0]++, Test.TEST)) {}`;
    expect(Utils.getParamNames(func)).toEqual([ 'email', 'organization', 'role' ]);

    const func2 = `function toJSON(strict = true, strip = ['id', 'email'], a =1) {}`;
    expect(Utils.getParamNames(func2)).toEqual([ 'strict', 'strip', 'a' ]);

    const func3 = `function toJSON(strict = true, strip = { test: ['id', 'email'] }, a = 1) {}`;
    expect(Utils.getParamNames(func3)).toEqual([ 'strict', 'strip', 'a' ]);
  });

  test('extractPK with PK id/_id', () => {
    const meta = MetadataStorage.getMetadata(Author.name);
    expect(Utils.extractPK('abcd')).toBe('abcd');
    expect(Utils.extractPK(123)).toBe(123);
    const id = new ObjectID(1);
    expect(Utils.extractPK(id)).toBe(id);
    expect(Utils.extractPK({ id }, meta)).toBe(id);
    expect(Utils.extractPK({ _id: id }, meta)).toBe(id);
    expect(Utils.extractPK({ foo: 'bar' })).toBeNull();
    expect(Utils.extractPK(new Test())).toBeNull();
    expect(Utils.extractPK(true)).toBeNull();
  });

  test('extractPK with PK uuid', () => {
    const meta = MetadataStorage.getMetadata(Book2.name);
    expect(Utils.extractPK({ id: '...' }, meta)).toBeNull();
    expect(Utils.extractPK({ _id: '...' }, meta)).toBeNull();
    expect(Utils.extractPK({ foo: 'bar' }, meta)).toBeNull();
    expect(Utils.extractPK({ uuid: 'uuid-123' }, meta)).toBe('uuid-123');
  });

  test('lookup path from decorator', () => {
    // with tslib, compiled
    const stack1 = [
      '    at Function.lookupPathFromDecorator (/usr/local/var/www/my-project/node_modules/mikro-orm/dist/utils/Utils.js:170:23)',
      '    at /usr/local/var/www/my-project/node_modules/mikro-orm/dist/decorators/PrimaryKey.js:12:23',
      '    at DecorateProperty (/usr/local/var/www/my-project/node_modules/reflect-metadata/Reflect.js:553:33)',
      '    at Object.decorate (/usr/local/var/www/my-project/node_modules/reflect-metadata/Reflect.js:123:24)',
      '    at Object.__decorate (/usr/local/var/www/my-project/node_modules/tslib/tslib.js:92:96)',
      '    at Object.<anonymous> (/usr/local/var/www/my-project/dist/entities/Customer.js:20:9)',
      '    at Module._compile (internal/modules/cjs/loader.js:776:30)',
      '    at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)',
      '    at Module.load (internal/modules/cjs/loader.js:643:32)',
      '    at Function.Module._load (internal/modules/cjs/loader.js:556:12)',
    ];
    expect(Utils.lookupPathFromDecorator({} as any, stack1)).toBe('/usr/local/var/www/my-project/dist/entities/Customer.js');

    // no tslib, via ts-node
    const stack2 = [
      '    at Function.lookupPathFromDecorator (/usr/local/var/www/my-project/node_modules/mikro-orm/dist/utils/Utils.js:170:23)',
      '    at /usr/local/var/www/my-project/node_modules/mikro-orm/dist/decorators/PrimaryKey.js:12:23',
      '    at DecorateProperty (/usr/local/var/www/my-project/node_modules/reflect-metadata/Reflect.js:553:33)',
      '    at Object.decorate (/usr/local/var/www/my-project/node_modules/reflect-metadata/Reflect.js:123:24)',
      '    at __decorate (/usr/local/var/www/my-project/src/entities/Customer.ts:4:92)',
      '    at Object.<anonymous> (/usr/local/var/www/my-project/src/entities/Customer.ts:9:3)',
      '    at Module._compile (internal/modules/cjs/loader.js:776:30)',
      '    at Module.m._compile (/usr/local/var/www/my-project/node_modules/ts-node/src/index.ts:473:23)',
      '    at Module._extensions..js (internal/modules/cjs/loader.js:787:10)',
      '    at Object.require.extensions.<computed> [as .ts] (/usr/local/var/www/my-project/node_modules/ts-node/src/index.ts:476:12)',
    ];
    expect(Utils.lookupPathFromDecorator({} as any, stack2)).toBe('/usr/local/var/www/my-project/src/entities/Customer.ts');
  });

  test('lookup path from decorator on windows', () => {
    // with tslib, via ts-node
    const stack1 = [
      '    at Function.lookupPathFromDecorator (C:\\www\\my-project\\node_modules\\mikro-orm\\dist\\utils\\Utils.js:175:26)',
      '    at C:\\www\\my-project\\node_modules\\mikro-orm\\dist\\decorators\\PrimaryKey.js:12:23',
      '    at Object.__decorate (C:\\www\\my-project\\node_modules\\tslib\\tslib.js:93:114)',
      '    at Object.<anonymous> (C:\\www\\my-project\\src\\entities\\Customer.ts:7:5)',
      '    at Module._compile (internal/modules/cjs/loader.js:936:30)',
      '    at Module.m._compile (C:\\www\\my-project\\node_modules\\ts-node\\src\\index.ts:493:23)',
      '    at Module._extensions..js (internal/modules/cjs/loader.js:947:10)',
      '    at Object.require.extensions.<computed> [as .ts] (C:\\www\\my-project\\node_modules\\ts-node\\src\\index.ts:496:12)',
      '    at Module.load (internal/modules/cjs/loader.js:790:32)',
      '    at Function.Module._load (internal/modules/cjs/loader.js:703:12)',
    ];
    expect(Utils.lookupPathFromDecorator({} as any, stack1)).toBe('C:/www/my-project/src/entities/Customer.ts');
  });

  afterAll(async () => orm.close(true));

});
