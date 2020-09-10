import path from 'path';
import { ObjectId } from 'mongodb';
import { Collection, EntityMetadata, MikroORM, Utils } from '@mikro-orm/core';
import { Author, Book } from './entities';
import { initORMMongo, wipeDatabase, BASE_DIR } from './bootstrap';
import FooBar from './entities/FooBar';

class Test {}

describe('Utils', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => wipeDatabase(orm.em));

  test('isDefined', () => {
    let data;
    expect(Utils.isDefined(data)).toBe(false);
    data = null;
    expect(Utils.isDefined(data)).toBe(true);
    expect(Utils.isDefined(data, true)).toBe(false);
    data = 0;
    expect(Utils.isDefined(data)).toBe(true);
    expect(Utils.isDefined(data, true)).toBe(true);
  });

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
    expect(Utils.isObject(new Date(), [Date])).toBe(false);
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
    expect(Utils.equals({ a: 'a', b: 'c' }, { a: 'b', b: 'c' })).toBe(false);
    expect(Utils.equals({ a: 'a', b: 'c', c: { d: 'e', f: ['i', 'h'] } }, { a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toBe(false);
    expect(Utils.equals({ a: 'a', b: 'c' }, { a: 'a', b: 'c' })).toBe(true);
    expect(Utils.equals({ a: 'a', b: 'c', c: { d: 'e', f: ['g', 'h'] } }, { a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toBe(false);
    expect(Utils.equals({ a: 'a', b: 'c', c: { d: 'e', f: ['g', 'h'] } }, { a: 'a', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toBe(true);
  });

  test('merge', () => {
    expect(Utils.merge({ a: 'a', b: 'c' }, { a: 'b', b: 'c' })).toEqual({ a: 'b', b: 'c' });
    expect(Utils.merge({ a: 'a', b: 'c', c: { d: 'e', f: ['i', 'h'] } }, { a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toEqual({ a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } });
    expect(Utils.merge({ a: 'a', b: 'c' }, { a: 'a', b: 'c' })).toEqual({ a: 'a', b: 'c' });
    expect(Utils.merge({ a: 'a', b: 'c', c: { a: 'u', f: ['g', 'h'] } }, { a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toEqual({ a: 'b', b: 'c', c: { a: 'u', d: 'e', f: ['g', 'h'] } });
    expect(Utils.merge({ a: 'a' }, { a: 'b', b: ['c'] })).toEqual({ a: 'b', b: ['c'] });
    expect(Utils.merge({ a: 'a', b: ['c'] }, { b: [] })).toEqual({ a: 'a', b: [] });
    expect(Utils.merge({ a: 'a', b: ['c'] }, { a: 'b' })).toEqual({ a: 'b', b: ['c'] });
    expect(Utils.merge({ a: 'a', b: ['c'] }, { a: undefined })).toEqual({ a: undefined, b: ['c'] });
    expect(Utils.merge('a', 'b')).toEqual('a');
  });

  test('merge Buffers', () => {
    const buffer = Buffer.from('Test buffer');
    expect(Utils.merge({}, { a: buffer })).toEqual({ a: buffer });
  });

  test('diff', () => {
    expect(Utils.diff({ a: 'a', b: 'c' }, { a: 'b', b: 'c' })).toEqual({ a: 'b' });
    expect(Utils.diff({ a: 'a', b: 'c', c: { d: 'e', f: ['i', 'h'] } }, { a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toEqual({ a: 'b', c: { d: 'e', f: ['g', 'h'] } });
    expect(Utils.diff({ a: 'a', b: 'c' }, { a: 'a', b: 'c' })).toEqual({});
    expect(Utils.diff({ a: 'a', b: 'c', c: { d: 'e', f: ['g', 'h'] } }, { a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toEqual({ a: 'b' });
    expect(Utils.diff({ a: 'a' }, { a: 'b', b: ['c'] })).toEqual({ a: 'b', b: ['c'] });
    expect(Utils.diff({ a: 'a', b: ['c'] }, { b: [] })).toEqual({ b: [] });
    expect(Utils.diff({ a: 'a', b: ['c'] }, { a: 'b' })).toEqual({ a: 'b' });
    expect(Utils.diff({ a: 'a', b: ['c'] }, { a: undefined })).toEqual({ a: undefined });
    expect(Utils.diff({ a: new Date() }, { a: new Date('2018-01-01') })).toEqual({ a: new Date('2018-01-01') });
    expect(Utils.diff({ a: new ObjectId('00000001885f0a3cc37dc9f0') }, { a: new ObjectId('00000001885f0a3cc37dc9f0') })).toEqual({});
  });

  test('diffEntities ignores collections', () => {
    const author1 = new Author('Name 1', 'e-mail1');
    author1.books = new Collection<Book>(author1);
    const author2 = new Author('Name 2', 'e-mail2');
    author2.books = new Collection<Book>(author2);

    expect(orm.em.getComparator().diffEntities(author1, author2).books).toBeUndefined();
  });

  test('prepareEntity changes entity to string id', async () => {
    const author1 = new Author('Name 1', 'e-mail1');
    const book = new Book('test', author1);
    const author2 = new Author('Name 2', 'e-mail2');
    author2.favouriteBook = book;
    author2.version = 123;
    await orm.em.persistAndFlush(author2);
    const diff = orm.em.getComparator().diffEntities(author1, author2);
    expect(diff).toMatchObject({ name: 'Name 2', favouriteBook: book._id });
    expect(diff.favouriteBook instanceof ObjectId).toBe(true);
  });

  test('prepareEntity ignores properties with `persist: false` flag', async () => {
    const author = new Author('Name 1', 'e-mail');
    author.version = 123;
    author.versionAsString = 'v123';
    const o = orm.em.getComparator().prepareEntity(author);
    expect(o.version).toBeUndefined();
    expect(o.versionAsString).toBeUndefined();
  });

  test('prepareEntity clones object properties', async () => {
    const author = new Author('Name 1', 'e-mail');
    author.updatedAt = new Date();
    const o = orm.em.getComparator().prepareEntity(author);
    expect(o.updatedAt).not.toBe(author.updatedAt);
  });

  test('copy', () => {
    const a = { a: 'a', b: 'c' };
    const b = Utils.copy(a);
    b.a = 'b';
    expect(a.a).toBe('a');
    expect(b.a).toBe('b');

    const c = { a: 'a', b: 'c', inner: { foo: 'bar' } } as any;
    const d = Utils.copy(c);
    d.inner.lol = 'new';
    expect(c.inner.lol).toBeUndefined();
    expect(d.inner.lol).toBe('new');
  });

  /**
   * regression test for running code coverage with nyc, mocha and ts-node and entity has default constructor value as enum parameter
   */
  test('getParamNames', () => {
    expect(Utils.getParamNames(Test, 'constructor')).toEqual([]);
    expect(Utils.getParamNames(FooBar, 'constructor')).toEqual([]);
    expect(Utils.getParamNames(Author, 'toJSON')).toEqual(['strict', 'strip', '...args']);
    expect(Utils.getParamNames('')).toEqual([]);

    const func = `function (email, organization, role=(cov_1a0rd1emyt.b[13][0]++, Test.TEST)) {}`;
    expect(Utils.getParamNames(func)).toEqual([ 'email', 'organization', 'role' ]);

    const func2 = `function toJSON(strict = true, strip = ['id', 'email'], a =1) {}`;
    expect(Utils.getParamNames(func2)).toEqual([ 'strict', 'strip', 'a' ]);

    const func3 = `function toJSON(strict = true, strip = { test: ['id', 'email'] }, a = 1) {}`;
    expect(Utils.getParamNames(func3)).toEqual([ 'strict', 'strip', 'a' ]);
  });

  test('defaultValue', () => {
    const prop1 = {} as any;
    Utils.defaultValue(prop1, 'test', 'default');
    expect(prop1.test).toBe('default');
    const prop2 = { test: 'foo' } as any;
    Utils.defaultValue(prop2, 'test', 'default');
    expect(prop2.test).toBe('foo');
  });

  test('extractPK with PK id/_id', () => {
    const meta = orm.getMetadata().get(Author.name);
    expect(Utils.extractPK('abcd')).toBe('abcd');
    expect(Utils.extractPK(123)).toBe(123);
    const id = new ObjectId(1);
    expect(Utils.extractPK(id)).toBe(id);
    expect(Utils.extractPK({ id }, meta)).toBe(id);
    expect(Utils.extractPK({ _id: id }, meta)).toBe(id);
    expect(Utils.extractPK({ foo: 'bar' })).toBeNull();
    expect(Utils.extractPK(new Test())).toBeNull();
    expect(Utils.extractPK(true)).toBeNull();
  });

  test('extractPK with PK uuid', () => {
    const meta = { primaryKeys: ['uuid'] } as EntityMetadata;
    expect(Utils.extractPK({ id: '...' }, meta)).toBeNull();
    expect(Utils.extractPK({ _id: '...' }, meta)).toBeNull();
    expect(Utils.extractPK({ foo: 'bar' }, meta)).toBeNull();
    expect(Utils.extractPK({ uuid: 'uuid-123' }, meta)).toBe('uuid-123');
  });

  test('normalizePath', () => {
    expect(Utils.normalizePath()).toBe('.');
    expect(Utils.normalizePath('./test')).toBe('./test');
    expect(Utils.normalizePath('./test/foo/bar/')).toBe('./test/foo/bar');
    expect(Utils.normalizePath('test/')).toBe('./test');
    expect(Utils.normalizePath('/test')).toBe('/test');
  });

  test('relativePath', () => {
    expect(Utils.relativePath('./test', process.cwd())).toBe('./test');
    expect(Utils.relativePath('test', process.cwd())).toBe('./test');
    expect(Utils.relativePath(process.cwd() + '/tests/', process.cwd())).toBe('./tests');
    expect(Utils.relativePath(process.cwd() + '/tests/cli/', process.cwd())).toBe('./tests/cli');
  });

  test('absolutePath', () => {
    expect(Utils.absolutePath('./test')).toBe(Utils.normalizePath(process.cwd() + '/test'));
    expect(Utils.absolutePath('test')).toBe(Utils.normalizePath(process.cwd() + '/test'));
    expect(Utils.absolutePath(process.cwd() + '/tests/')).toBe(Utils.normalizePath(process.cwd() + '/tests'));
    expect(Utils.absolutePath('./tests/cli')).toBe(Utils.normalizePath(process.cwd() + '/tests/cli'));
    expect(Utils.absolutePath('')).toBe(Utils.normalizePath(process.cwd()));
  });

  test('pathExists wrapper', async () => {
    await expect(Utils.pathExists('LIC*')).resolves.toEqual(true);
    await expect(Utils.pathExists('tests')).resolves.toEqual(true);
    await expect(Utils.pathExists('tests/**/*.ts')).resolves.toEqual(true);
    await expect(Utils.pathExists('**/tests', { onlyDirectories: true })).resolves.toEqual(true);
  });

  test('isPlainObject', async () => {
    expect(Utils.isPlainObject({ foo: 'bar' })).toBe(true);
    class Foo { }
    expect(Utils.isPlainObject(new Foo())).toBe(false);
    expect(Utils.isPlainObject(Object.create(null))).toBe(false);
  });

  test('extractEnumKeys', async () => {
    enum PublisherType {
      LOCAL = 'local',
      GLOBAL = 'global',
    }

    enum PublisherType2 {
      LOCAL = 'LOCAL',
      GLOBAL = 'GLOBAL',
    }

    enum PublisherType3 {
      LOCAL = 'local',
      GLOBAL = 'GLOBAL',
    }

    enum Enum2 {
      PROP1 = 1,
      PROP2 = 2,
    }

    expect(Utils.extractEnumValues(PublisherType)).toEqual(['local', 'global']);
    expect(Utils.extractEnumValues(PublisherType2)).toEqual(['LOCAL', 'GLOBAL']);
    expect(Utils.extractEnumValues(PublisherType3)).toEqual(['local', 'GLOBAL']);
    expect(Utils.extractEnumValues(Enum2)).toEqual([1, 2]);
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
      '    at Object.Module._extensions.js (internal/modules/cjs/loader.js:787:10)',
      '    at Module.load (internal/modules/cjs/loader.js:643:32)',
      '    at Function.Module._load (internal/modules/cjs/loader.js:556:12)',
    ];
    expect(Utils.lookupPathFromDecorator('Customer', stack1)).toBe('/usr/local/var/www/my-project/dist/entities/Customer.js');

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
      '    at Module._extensions.js (internal/modules/cjs/loader.js:787:10)',
      '    at Object.require.extensions.<computed> [as .ts] (/usr/local/var/www/my-project/node_modules/ts-node/src/index.ts:476:12)',
    ];
    expect(Utils.lookupPathFromDecorator('Customer', stack2)).toBe('/usr/local/var/www/my-project/src/entities/Customer.ts');

    // no parens
    const stack3 = [
      '    at Function.lookupPathFromDecorator (/usr/local/var/www/my-project/node_modules/mikro-orm/dist/utils/Utils.js:170:23)',
      '    at /usr/local/var/www/my-project/node_modules/mikro-orm/dist/decorators/PrimaryKey.js:12:23',
      '    at DecorateProperty (/usr/local/var/www/my-project/node_modules/reflect-metadata/Reflect.js:553:33)',
      '    at Object.decorate (/usr/local/var/www/my-project/node_modules/reflect-metadata/Reflect.js:123:24)',
      '    at Object.__decorate (/usr/local/var/www/my-project/node_modules/tslib/tslib.js:92:96)',
      '    at /usr/local/var/www/my-project/dist/entities/Customer.js:20:9',
      '    at Module._compile (internal/modules/cjs/loader.js:776:30)',
      '    at Object.Module._extensions.js (internal/modules/cjs/loader.js:787:10)',
      '    at Module.load (internal/modules/cjs/loader.js:643:32)',
      '    at Function.Module._load (internal/modules/cjs/loader.js:556:12)',
    ];
    expect(Utils.lookupPathFromDecorator('Customer', stack3)).toBe('/usr/local/var/www/my-project/dist/entities/Customer.js');

    // using babel will ignore the path, as there is no `__decorate` and there can be other issues too
    // @see https://github.com/mikro-orm/mikro-orm/issues/790
    const stack4 = [
      '    at Function.lookupPathFromDecorator (/usr/local/var/www/my-project/node_modules/@mikro-orm/core/utils/Utils.js:360:26)',
      '    at Function.getMetadataFromDecorator (/usr/local/var/www/my-project/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:21:36)',
      '    at /usr/local/var/www/my-project/node_modules/@mikro-orm/core/decorators/PrimaryKey.js:8:49',
      '    at /usr/local/var/www/my-project/dist/entities/Customer.js:20:9',
      '    at Array.reduce (<anonymous>)',
      '    at _applyDecoratedDescriptor (/usr/local/var/www/my-project/dist/entities/Customer.js:20:9)',
      '    at Object.<anonymous> (/usr/local/var/www/my-project/dist/entities/Customer.js:20:9)',
      '    at Module._compile (internal/modules/cjs/loader.js:1138:30)',
      '    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1158:10)',
      '    at Module.load (internal/modules/cjs/loader.js:986:32)',
    ];
    expect(Utils.lookupPathFromDecorator('Customer', stack4)).toBe('Customer');

    // using babel will ignore the path, as there is no `__decorate`
    const stack5 = [
      '    at Function.lookupPathFromDecorator (/usr/local/var/www/my-project/node_modules/@mikro-orm/core/utils/Utils.js:360:26)',
      '    at Function.getMetadataFromDecorator (/usr/local/var/www/my-project/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:21:36)',
      '    at /usr/local/var/www/my-project/node_modules/@mikro-orm/core/decorators/Entity.js:8:49',
      '    at Object.<anonymous> (/usr/local/var/www/my-project/dist/entities/Customer.js:20:9)',
      '    at Module._compile (internal/modules/cjs/loader.js:1138:30)',
      '    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1158:10)',
      '    at Module.load (internal/modules/cjs/loader.js:986:32)',
      '    at Function.Module._load (internal/modules/cjs/loader.js:879:14)',
      '    at Module.require (internal/modules/cjs/loader.js:1026:19)',
      '    at require (internal/modules/cjs/helpers.js:72:18)',
    ];
    expect(Utils.lookupPathFromDecorator('Customer', stack5)).toBe('Customer');

    // no decorated line found
    expect(Utils.lookupPathFromDecorator('Customer')).toBe('Customer');
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
      '    at Module._extensions.js (internal/modules/cjs/loader.js:947:10)',
      '    at Object.require.extensions.<computed> [as .ts] (C:\\www\\my-project\\node_modules\\ts-node\\src\\index.ts:496:12)',
      '    at Module.load (internal/modules/cjs/loader.js:790:32)',
      '    at Function.Module._load (internal/modules/cjs/loader.js:703:12)',
    ];
    expect(Utils.lookupPathFromDecorator('Customer', stack1)).toBe('C:/www/my-project/src/entities/Customer.ts');
  });

  test('requireFrom can require a package.json file', () => {
    const { name } = Utils.requireFrom('', path.join(BASE_DIR, '..', 'package.json'));
    expect(name).toEqual('mikro-orm-root');
  });

  afterAll(async () => orm.close(true));

});
