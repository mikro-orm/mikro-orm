import { pathToFileURL } from 'node:url';
import { EntityMetadata, MikroORM, sql, compareObjects, Utils, ObjectId } from '@mikro-orm/mongodb';
import { Author } from './entities/index.js';
import { initORMMongo } from './bootstrap.js';
import FooBar from './entities/FooBar.js';

class Test {}

describe('Utils', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORMMongo());
  beforeEach(async () => orm.schema.clearDatabase());

  test('isDefined', () => {
    let data;
    expect(Utils.isDefined(data)).toBe(false);
    data = null;
    expect(Utils.isDefined(data)).toBe(true);
    data = 0;
    expect(Utils.isDefined(data)).toBe(true);
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
    expect(Utils.isNotObject(new Date(), [Date])).toBe(false);
    expect(Utils.isObject(Test)).toBe(false);
    expect(Utils.isObjectID(Test)).toBe(false);
    expect(Utils.isObjectID(new ObjectId())).toBe(true);
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
    expect(Utils.equals(Buffer.from([1, 2, 3]), Buffer.from([1, 2, 3]))).toBe(true);
    expect(Utils.equals(Buffer.from([1, 2, 3, 4]), Buffer.from([1, 2, 3]))).toBe(false);
    expect(Utils.equals(Buffer.from([1, 2, 3, 4]), Buffer.from([1, 2, 3, 5]))).toBe(false);
    expect(Utils.equals({ a: 'a', b: 'c' }, { a: 'b', b: 'c' })).toBe(false);
    expect(Utils.equals({ a: 'a', b: 'b', c: 'c' }, { a: 'b', b: 'b' })).toBe(false);
    expect(Utils.equals({ a: 'a', b: 'b' }, { a: 'b', c: 'c' })).toBe(false);
    expect(Utils.equals({ a: 'a', b: 'c', c: { d: 'e', f: ['i', 'h'] } }, { a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toBe(false);
    expect(Utils.equals({ a: 'a', b: 'c' }, { a: 'a', b: 'c' })).toBe(true);
    expect(Utils.equals({ a: 'a', b: 'c', c: { d: 'e', f: ['g', 'h'] } }, { a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toBe(false);
    expect(Utils.equals({ a: 'a', b: 'c', c: { d: 'e', f: ['g', 'h'] } }, { a: 'a', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toBe(true);
    expect(compareObjects(null, undefined)).toBe(true);
    expect(compareObjects(Object.create(null), Object.create(null))).toBe(true);
    expect(compareObjects({}, Object.create(null))).toBe(true);
    expect(compareObjects(Object.create(null), {})).toBe(true);
    expect(compareObjects({ a: Object.create(null) }, { a: {} })).toBe(true);
    expect(compareObjects({}, Object.create(null))).toBe(true);
    expect(compareObjects(new Test(), new Author('n', 'e'))).toBe(false);
    expect(compareObjects(sql`select 1`, sql`select 1`)).toBe(true);
    expect(compareObjects(sql`select ${1}`, sql`select ${1}`)).toBe(true);
    expect(compareObjects(sql`select ${1}`, sql`select ${2}`)).toBe(false);
    expect(compareObjects(new Date('2024-10-01T08:54:48.651Z'), new Date('2024-10-01T08:54:48.651Z'))).toBe(true);
    expect(compareObjects(new Date('2024-10-01T08:54:48.651Z'), new Date('2024-10-01T08:54:48.676Z'))).toBe(false);
    expect(() => compareObjects(new Date('2024-10-01T08:54:48.651Z'), new Date(NaN))).toThrowError('Comparing invalid dates is not supported');
    expect(() => compareObjects(new Date(NaN), new Date(NaN))).toThrowError('Comparing invalid dates is not supported');
    expect(Utils.equals(NaN, NaN)).toBe(true);
  });

  test('merge', () => {
    expect(Utils.merge({ a: 'a', b: 'c' }, { a: 'b', b: 'c' })).toEqual({ a: 'b', b: 'c' });
    expect(Utils.merge({ a: 'a', b: 'c', c: { d: 'e', f: ['i', 'h'] } }, { a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toEqual({ a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } });
    expect(Utils.merge({ a: 'a', b: 'c' }, { a: 'a', b: 'c' })).toEqual({ a: 'a', b: 'c' });
    expect(Utils.merge({ a: 'a', b: 'c', c: { a: 'u', f: ['g', 'h'] } }, { a: 'b', b: 'c', c: { d: 'e', f: ['g', 'h'] } })).toEqual({ a: 'b', b: 'c', c: { a: 'u', d: 'e', f: ['g', 'h'] } });
    expect(Utils.merge({ a: 'a' }, { a: 'b', b: ['c'] })).toEqual({ a: 'b', b: ['c'] });
    expect(Utils.merge({ a: 'a', b: ['c'] }, { b: [] })).toEqual({ a: 'a', b: [] });
    expect(Utils.merge({ a: 'a', b: ['c'] }, { a: 'b' })).toEqual({ a: 'b', b: ['c'] });
    expect(Utils.merge({ a: 'a', b: ['c'] }, { a: null })).toEqual({ a: null, b: ['c'] });
    expect(Utils.merge({ a: 'a', b: ['c'] }, { a: undefined })).toEqual({ a: undefined, b: ['c'] });
    expect(Utils.merge('a', 'b')).toEqual('a');
    expect(Utils.mergeConfig({ a: 'a', b: ['c'] }, { a: undefined })).toEqual({ a: 'a', b: ['c'] });

    // GH #4101
    const source = {
      nestedData: { foo: 'bar' },
      moreDeep: { moreDeepData: { foo: 'bar' } },
    };

    expect(Utils.merge({ nestedData: null, moreDeep: { moreDeepData: null } }, source)).toEqual(source);
    expect(Utils.merge({ nestedData: 'test', moreDeep: { moreDeepData: 'test' } }, source)).toEqual(source);
    expect(Utils.merge({ nestedData: {}, moreDeep: { moreDeepData: {} } }, source)).toEqual(source);
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

  describe('copy', () => {
    test('should copy simple object', () => {
      const a = { a: 'a', b: 'c' };
      const b = Utils.copy(a);
      b.a = 'b';
      expect(a.a).toBe('a');
      expect(b.a).toBe('b');
      expect(Utils.copy(new Error('foo'))).toEqual(new Error('foo'));
      expect(Utils.copy(/abc/gim)).toEqual(/abc/gim);

      const re = /a/;
      re.lastIndex = 1;
      expect(Utils.copy(re)).toEqual(re);
      expect(Utils.copy(re).lastIndex).toEqual(re.lastIndex);

      const c = { a: 'a', b: 'c', inner: { foo: 'bar', p: Promise.resolve() } } as any;
      const d = Utils.copy(c);
      d.inner.lol = 'new';
      expect(c.inner.lol).toBeUndefined();
      expect(d.inner.lol).toBe('new');
      expect(c.inner.p).toBeInstanceOf(Promise);
    });

    it('should copy child object even though getter property is dynamically injected', () => {

      function NameDecorator<T extends { new (...args: any[]): {} }>(constructor: T) {

        return class extends constructor {

          name = constructor.name;

        };

      }

      class Parent {

        constructor(
          private readonly __name__: string,
        ) {}

        get name() {
          return this.__name__;
        }

      }

      @NameDecorator
      class Child extends Parent {}

      // given
      const expected = 'child_name';
      const child = new Child(expected);

      // when
      const copied = Utils.copy(child);

      // then
      expect(copied).toBeInstanceOf(Child);
      expect(copied.name).toBe(expected);

    });
  });

  describe('stripRelativePath', () => {
    test('Remove single leading dot (./)', () => {
      const path = './my/path';
      expect(Utils.stripRelativePath(path)).toEqual('/my/path');
    });
    test('Remove multiple leading dots (../)', () => {
      const path = '../my/path';
      expect(Utils.stripRelativePath(path)).toEqual('/my/path');
    });

    test('Remove multiple leading dots and slashes (../../)', () => {
      const path = '../../my/path';
      expect(Utils.stripRelativePath(path)).toEqual('/my/path');
    });

  });
  /**
   * regression test for running code coverage with nyc, mocha and ts-node and entity has default constructor value as enum parameter
   */
  test('getParamNames', () => {
    expect(Utils.getParamNames(Test, 'constructor')).toEqual([]);
    expect(Utils.getParamNames(FooBar, 'constructor')).toEqual([]);
    expect(Utils.getParamNames(Author, 'toJSON')).toEqual(['strict', 'strip']);
    expect(Utils.getParamNames('')).toEqual([]);
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
    const meta = orm.getMetadata(Author);
    expect(Utils.extractPK('abcd')).toBe('abcd');
    expect(Utils.extractPK(123)).toBe(123);
    const id = new ObjectId(1);
    expect(Utils.extractPK(id)).toBe(id);
    expect(Utils.extractPK({ id }, meta)).toBe(id);
    expect(Utils.extractPK({ _id: id }, meta)).toBe(id);
    expect(Utils.extractPK({ foo: 'bar' })).toBeNull();
    const t = new Test();
    expect(Utils.extractPK(t)).toBe(t);
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
    expect(Utils.normalizePath('./foo', '/test')).toBe('/test');
  });

  test('normalizePath [posix]', () => {
    const spy = vi.spyOn(Utils, 'fileURLToPath');
    spy.mockImplementation(() => '/test');
    expect(Utils.normalizePath('file:///test')).toBe('/test');
    expect(Utils.normalizePath('./foo', 'file:///test')).toBe('/test');
    spy.mockRestore();
  });

  test('normalizePath [windows]', () => {
    const spy = vi.spyOn(Utils, 'fileURLToPath');
    spy.mockImplementation(() => 'C:/test');
    expect(Utils.normalizePath('file:///C:/test')).toBe('C:/test');
    expect(Utils.normalizePath('./foo', 'file:///C:/test')).toBe('C:/test');
    spy.mockRestore();
  });

  test('relativePath', () => {
    expect(Utils.relativePath('./test', process.cwd())).toBe('./test');
    expect(Utils.relativePath('test', process.cwd())).toBe('./test');
    expect(Utils.relativePath(process.cwd() + '/tests/', process.cwd())).toBe('./tests');
    expect(Utils.relativePath(process.cwd() + '/tests/cli/', process.cwd())).toBe('./tests/cli');
    expect(Utils.relativePath(pathToFileURL(process.cwd() + '/tests/cli/').href, process.cwd())).toBe('./tests/cli');
    expect(Utils.relativePath(process.cwd() + '/tests/cli/', pathToFileURL(process.cwd()).href)).toBe('./tests/cli');
  });

  test('absolutePath', () => {
    expect(Utils.absolutePath('./test')).toBe(Utils.normalizePath(process.cwd() + '/test'));
    expect(Utils.absolutePath('test')).toBe(Utils.normalizePath(process.cwd() + '/test'));
    expect(Utils.absolutePath(process.cwd() + '/tests/')).toBe(Utils.normalizePath(process.cwd() + '/tests'));
    expect(Utils.absolutePath('./tests/cli')).toBe(Utils.normalizePath(process.cwd() + '/tests/cli'));
    expect(Utils.absolutePath('')).toBe(Utils.normalizePath(process.cwd()));
    expect(Utils.absolutePath(pathToFileURL(process.cwd() + '/tests/').href)).toBe(Utils.normalizePath(process.cwd() + '/tests'));
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
    expect(Utils.isPlainObject(Object.create(null))).toBe(true);
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

    enum Enum3 {
      Queued,
      Running,
      Failed,
      Cancelled,
    }

    expect(Utils.extractEnumValues(PublisherType)).toEqual(['local', 'global']);
    expect(Utils.extractEnumValues(PublisherType2)).toEqual(['LOCAL', 'GLOBAL']);
    expect(Utils.extractEnumValues(PublisherType3)).toEqual(['local', 'GLOBAL']);
    expect(Utils.extractEnumValues(Enum2)).toEqual([1, 2]);
    expect(Utils.extractEnumValues(Enum3)).toEqual([0, 1, 2, 3]);
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

    // with babel we search for `_applyDecoratedDescriptor`
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
    expect(Utils.lookupPathFromDecorator('Customer', stack4)).toBe('/usr/local/var/www/my-project/dist/entities/Customer.js');

    // using babel will ignore the path when there is no `__decorate` or `_applyDecoratedDescriptor`
    // @see https://github.com/mikro-orm/mikro-orm/issues/790
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

    // unknown type of stack trace fallback
    expect(Utils.lookupPathFromDecorator('Customer', [
      '    at Object.__decorate (/usr/local/var/www/my-project/node_modules/tslib/tslib.js:92:96)',
      '    at Object.<anonymous> ( ... )',
    ])).toBe('Customer');

    // no decorated line found
    expect(Utils.lookupPathFromDecorator('Customer')).toBe('Customer');

    // when the constructor name is used in place of `__decorate` then try `Reflect.decorate`
    expect(Utils.lookupPathFromDecorator('AuthorizationTokenEntity', [
      '    at Function.lookupPathFromDecorator (/opt/app/node_modules/@mikro-orm/core/utils/Utils.js:502:26)',
      '    at Function.getMetadataFromDecorator (/opt/app/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:33:36)',
      '    at /opt/app/node_modules/@mikro-orm/core/decorators/Entity.js:8:49',
      '    at DecorateConstructor (/opt/app/node_modules/reflect-metadata/Reflect.js:541:33)',
      '    at Reflect.decorate (/opt/app/node_modules/reflect-metadata/Reflect.js:130:24)',
      '    at AuthorizationTokenEntity (/opt/app/packages/entity/dist/node/entity/AuthorizationTokenEntity.js:19:92)',
      '    at Object.<anonymous> (/opt/app/packages/entity/src/entity/AuthorizationTokenEntity.ts:14:38)',
      '    at Module._compile (node:internal/modules/cjs/loader:1149:14)',
      '    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1203:10)',
      '    at Module.load (node:internal/modules/cjs/loader:1027:32)',
    ])).toBe('/opt/app/packages/entity/dist/node/entity/AuthorizationTokenEntity.js');

    // when both `__decorate` and `Reflect.decorator` exist in the stack (`__decorate` first)
    expect(Utils.lookupPathFromDecorator('AuthorizationTokenEntity', [
      '    at Function.lookupPathFromDecorator (/opt/app/node_modules/@mikro-orm/core/utils/Utils.js:502:26)',
      '    at Function.getMetadataFromDecorator (/opt/app/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:33:36)',
      '    at /opt/app/node_modules/@mikro-orm/core/decorators/Entity.js:8:49',
      '    at DecorateConstructor (/opt/app/node_modules/reflect-metadata/Reflect.js:541:33)',
      '    at __decorate (/opt/app/packages/entity/dist/node/entity/AuthorizationTokenEntityFromDecorate.js:14:38)',
      '    at Reflect.decorate (/opt/app/node_modules/reflect-metadata/Reflect.js:130:24)',
      '    at AuthorizationTokenEntity (/opt/app/packages/entity/dist/node/entity/AuthorizationTokenEntityFromReflectDecorate.js:19:92)',
      '    at Object.<anonymous> (/opt/app/packages/entity/src/entity/AuthorizationTokenEntity.ts:14:38)',
      '    at Module._compile (node:internal/modules/cjs/loader:1149:14)',
      '    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1203:10)',
      '    at Module.load (node:internal/modules/cjs/loader:1027:32)',
    ])).toBe('/opt/app/packages/entity/dist/node/entity/AuthorizationTokenEntityFromDecorate.js');

    // when both `__decorate` and `Reflect.decorator` exist in the stack (`__decorate` last)
    expect(Utils.lookupPathFromDecorator('AuthorizationTokenEntity', [
      '    at Function.lookupPathFromDecorator (/opt/app/node_modules/@mikro-orm/core/utils/Utils.js:502:26)',
      '    at Function.getMetadataFromDecorator (/opt/app/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:33:36)',
      '    at /opt/app/node_modules/@mikro-orm/core/decorators/Entity.js:8:49',
      '    at DecorateConstructor (/opt/app/node_modules/reflect-metadata/Reflect.js:541:33)',
      '    at Reflect.decorate (/opt/app/node_modules/reflect-metadata/Reflect.js:130:24)',
      '    at AuthorizationTokenEntity (/opt/app/packages/entity/dist/node/entity/AuthorizationTokenEntityFromReflectDecorate.js:19:92)',
      '    at __decorate (/opt/app/packages/entity/dist/node/entity/AuthorizationTokenEntityFromDecorate.js:14:38)',
      '    at Object.<anonymous> (/opt/app/packages/entity/src/entity/AuthorizationTokenEntity.ts:14:38)',
      '    at Module._compile (node:internal/modules/cjs/loader:1149:14)',
      '    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1203:10)',
      '    at Module.load (node:internal/modules/cjs/loader:1027:32)',
    ])).toBe('/opt/app/packages/entity/dist/node/entity/AuthorizationTokenEntityFromReflectDecorate.js');

    expect(Utils.lookupPathFromDecorator('Requirement', [
      'Error',
      '    at Function.lookupPathFromDecorator (/opt/app/node_modules/@mikro-orm/core/utils/Utils.js:508:26)',
      '    at Function.getMetadataFromDecorator (/opt/app/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:26:36)',
      '    at /opt/app/node_modules/@mikro-orm/core/decorators/Entity.js:8:49',
      '    at DecorateConstructor (/opt/app/node_modules/reflect-metadata/Reflect.js:541:33)',
      '    at Reflect.decorate (/opt/app/node_modules/reflect-metadata/Reflect.js:130:24)',
      '    at Object.__decorate (/opt/app/node_modules/tslib/tslib.js:99:96)',
      '    at Object.<anonymous> (/opt/app/entity/requirement.ts:23:23)',
      '    at Module._compile (node:internal/modules/cjs/loader:1159:14)',
      '    at Module.m._compile (/opt/app/node_modules/ts-node/src/index.ts:1618:23)',
      '    at Module.m._compile (/opt/app/node_modules/ts-node/src/index.ts:1618:23)',
    ])).toBe('/opt/app/entity/requirement.ts');
  });

  test('lookup path from decorator with bun', () => {
    // bun version < 1.2.7 (DecorateProperty)
    expect(Utils.lookupPathFromDecorator('Book', [
      'Error',
      '    at lookupPathFromDecorator (/opt/app/node_modules/@mikro-orm/core/utils/Utils.js:636:20)',
      '    at getMetadataFromDecorator (/opt/app/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:28:51)',
      '    at <anonymous> (/opt/app/node_modules/@mikro-orm/core/decorators/PrimaryKey.js:9:67)',
      '    at DecorateProperty (/opt/app/node_modules/reflect-metadata/Reflect.js:561:67)',
      '    at A (bun:wrap:1:2617)',
      '    at module code (/opt/app/src/entities/Book.ts:11:42)',
      '    at moduleEvaluation (:1:11)',
      '    at <anonymous> (:2:1)',
      '    at processTicksAndRejections (:12:39)',
    ])).toBe('/opt/app/src/entities/Book.ts');

    // bun version < 1.2.7 (DecorateConstructor)
    expect(Utils.lookupPathFromDecorator('Book', [
      'Error',
      '    at lookupPathFromDecorator (/opt/app/node_modules/@mikro-orm/core/utils/Utils.js:636:20)',
      '    at getMetadataFromDecorator (/opt/app/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:28:51)',
      '    at <anonymous> (/opt/app/node_modules/@mikro-orm/core/decorators/Entity.js:8:47)',
      '    at DecorateConstructor (/opt/app/node_modules/reflect-metadata/Reflect.js:549:67)',
      '    at A (bun:wrap:1:2617)',
      '    at module code (/opt/app/src/entities/Book.ts:9:8)',
      '    at moduleEvaluation (:1:11)',
      '    at <anonymous> (:2:1)',
      '    at processTicksAndRejections (:12:39)',
    ])).toBe('/opt/app/src/entities/Book.ts');

    // bun version >= 1.2.7 (DecorateProperty)
    expect(Utils.lookupPathFromDecorator('Book', [
      'Error',
      '    at lookupPathFromDecorator (/opt/app/node_modules/@mikro-orm/core/utils/Utils.js:657:30)',
      '    at getMetadataFromDecorator (/opt/app/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:30:95)',
      '    at <anonymous> (/opt/app/node_modules/@mikro-orm/core/decorators/PrimaryKey.js:10:49)',
      '    at DecorateProperty (/opt/app/node_modules/reflect-metadata/Reflect.js:561:33)',
      '    at decorate (/opt/app/node_modules/reflect-metadata/Reflect.js:136:24)',
      '    at d (bun:wrap:1:1558)',
      '    at /opt/app/src/entities/Book.ts:11:42',
      '    at moduleEvaluation (native:1:11)',
      '    at <anonymous> (native:2)',
      '    at processTicksAndRejections (native:7:39)',
    ])).toBe('/opt/app/src/entities/Book.ts');

    // bun version >= 1.2.7 (DecorateConstructor)
    expect(Utils.lookupPathFromDecorator('Book', [
      'Error',
      '    at lookupPathFromDecorator (/opt/app/node_modules/@mikro-orm/core/utils/Utils.js:657:30)',
      '    at getMetadataFromDecorator (/opt/app/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:30:95)',
      '    at <anonymous> (/opt/app/node_modules/@mikro-orm/core/decorators/Entity.js:8:49)',
      '    at DecorateConstructor (/opt/app/node_modules/reflect-metadata/Reflect.js:549:33)',
      '    at decorate (/opt/app/node_modules/reflect-metadata/Reflect.js:143:24)',
      '    at d (bun:wrap:1:1558)',
      '    at /opt/app/src/entities/Book.ts:9:8',
      '    at moduleEvaluation (native:1:11)',
      '    at <anonymous> (native:2)',
      '    at processTicksAndRejections (native:7:39)',
    ])).toBe('/opt/app/src/entities/Book.ts');

    // using bun build for generating a standalone binary will ignore the path as there is no reflect-metadata in the stack trace
    expect(Utils.lookupPathFromDecorator('Book', [
      'Error',
      '    at lookupPathFromDecorator (/$bunfs/root/app-build:40282:33)',
      '    at getMetadataFromDecorator (/$bunfs/root/app-build:52487:57)',
      '    at <anonymous> (/$bunfs/root/app-build:55177:71)',
      '    at DecorateProperty (/$bunfs/root/app-build:41850:36)',
      '    at __legacyDecorateClassTS (/$bunfs/root/app-build:50:25)',
      '    at module code (/$bunfs/root/app-build:284492:24)',
      '    at moduleEvaluation (:1:11)',
      '    at moduleEvaluation (:1:11)',
      '    at <anonymous> (:2:1)',
    ])).toBe('Book');

    // invalid stack trace - not complete
    expect(Utils.lookupPathFromDecorator('Book', [
      'Error',
      '    at lookupPathFromDecorator (/home/ruby/workspace/bun-playground/node_modules/@mikro-orm/core/utils/Utils.js:400:33)',
      '    at getMetadataFromDecorator (/home/ruby/workspace/bun-playground/node_modules/@mikro-orm/core/metadata/MetadataStorage.js:27:57)',
      '    at <anonymous> (/home/ruby/workspace/bun-playground/node_modules/@mikro-orm/core/decorators/Entity.js:4:71)',
      '    at DecorateConstructor (/home/ruby/workspace/bun-playground/node_modules/reflect-metadata/Reflect.js:171:61)',
      '    at A (bun:wrap:1:2617)',
    ])).toBe('Book');
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

  test('lookup path from decorator loaded from an ES module [posix]', () => {
    const spy = vi.spyOn(Utils, 'fileURLToPath');
    spy.mockImplementation(() => 'C:/test');
    // with tslib, via ts-node
    const stack1 = [
      '    at Function.lookupPathFromDecorator (/usr/local/var/www/my-project/node_modules/mikro-orm/dist/utils/Utils.js:170:23)',
      '    at /usr/local/var/www/my-project/node_modules/mikro-orm/dist/decorators/PrimaryKey.js:12:23',
      '    at DecorateProperty (/usr/local/var/www/my-project/node_modules/reflect-metadata/Reflect.js:553:33)',
      '    at Object.decorate (/usr/local/var/www/my-project/node_modules/reflect-metadata/Reflect.js:123:24)',
      '    at __decorate (file:///usr/local/var/www/my-project/src/entities/Customer.ts:4:92)',
      '    at Object.<anonymous> (/usr/local/var/www/my-project/src/entities/Customer.ts:9:3)',
      '    at Module._compile (internal/modules/cjs/loader.js:776:30)',
      '    at Module.m._compile (/usr/local/var/www/my-project/node_modules/ts-node/src/index.ts:473:23)',
      '    at Module._extensions.js (internal/modules/cjs/loader.js:787:10)',
      '    at Object.require.extensions.<computed> [as .ts] (/usr/local/var/www/my-project/node_modules/ts-node/src/index.ts:476:12)',
    ];
    spy.mockImplementation(() => '/usr/local/var/www/my-project/src/entities/Customer.ts');
    expect(Utils.lookupPathFromDecorator('Customer', stack1)).toBe('/usr/local/var/www/my-project/src/entities/Customer.ts');
    spy.mockRestore();
  });

  test('lookup path from decorator loaded from an ES module [windows]', () => {
    const spy = vi.spyOn(Utils, 'fileURLToPath');
    spy.mockImplementation(() => 'C:/test');
    // with tslib, via ts-node
    const stack1 = [
      '    at Function.lookupPathFromDecorator (C:\\www\\my-project\\node_modules\\mikro-orm\\dist\\utils\\Utils.js:175:26)',
      '    at C:\\www\\my-project\\node_modules\\mikro-orm\\dist\\decorators\\PrimaryKey.js:12:23',
      '    at Object.__decorate (C:\\www\\my-project\\node_modules\\tslib\\tslib.js:93:114)',
      '    at Object.<anonymous> (file:///C:/www/my-project/src/entities/Customer.ts:7:5)',
      '    at Module._compile (internal/modules/cjs/loader.js:936:30)',
      '    at Module.m._compile (C:\\www\\my-project\\node_modules\\ts-node\\src\\index.ts:493:23)',
      '    at Module._extensions.js (internal/modules/cjs/loader.js:947:10)',
      '    at Object.require.extensions.<computed> [as .ts] (C:\\www\\my-project\\node_modules\\ts-node\\src\\index.ts:496:12)',
      '    at Module.load (internal/modules/cjs/loader.js:790:32)',
      '    at Function.Module._load (internal/modules/cjs/loader.js:703:12)',
    ];
    spy.mockImplementation(() => 'C:/www/my-project/src/entities/Customer.ts');
    expect(Utils.lookupPathFromDecorator('Customer', stack1)).toBe('C:/www/my-project/src/entities/Customer.ts');
    spy.mockRestore();
  });

  test('tryRequire', () => {
    const warnSpy = vi.spyOn(console, 'warn');
    warnSpy.mockImplementationOnce(i => i);
    const ret = Utils.tryRequire({ module: 'not-existing-dep', warning: 'not found' });
    expect(ret).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith('not found');

    const requireFromSpy = vi.spyOn(Utils, 'requireFrom');
    requireFromSpy.mockImplementationOnce(() => { throw new Error('some other issue'); });
    expect(() => {
      return Utils.tryRequire({ module: 'not-existing-dep', warning: 'not found', allowError: 'Cannot find module' });
    }).toThrow('some other issue');
  });

  test('tryImport', async () => {
    const warnSpy = vi.spyOn(console, 'warn');
    warnSpy.mockImplementationOnce(i => i);
    const ret = await Utils.tryImport({ module: 'not-existing-dep', warning: 'not found' });
    expect(ret).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith('not found');
  });

  test('getPrimaryKeyCond', () => {
    // @ts-expect-error no PK so this correctly fails compilation
    expect(Utils.getPrimaryKeyCond({ a: null }, ['a'])).toBe(null);
  });

  test('asArray', () => {
    expect(Utils.asArray('a')).toEqual(['a']);
    expect(Utils.asArray(['a'])).toEqual(['a']);
    expect(Utils.asArray(new Set(['a']))).toEqual(['a']);
  });

  test('getObjectKeysSize', () => {
    expect(Utils.getObjectKeysSize({ a: 'a' })).toEqual(1);
    expect(Utils.getObjectKeysSize({ a: 'a', __proto__: null })).toEqual(1);
  });

  test('hasObjectKeys', () => {
    expect(Utils.hasObjectKeys({  })).toEqual(false);
    expect(Utils.hasObjectKeys({  __proto__: null })).toEqual(false);
    expect(Utils.hasObjectKeys({ a: 'a' })).toEqual(true);
    expect(Utils.hasObjectKeys({ a: 'a', __proto__: null })).toEqual(true);
  });

  test('removeDuplicates', () => {
    expect(Utils.removeDuplicates(['foo', 'bar', 'foo', 'bar2'])).toEqual(['foo', 'bar', 'bar2']);
    expect(Utils.removeDuplicates([{ v: 'foo' }, { v: 'bar' }, { v: 'foo' }, { v: 'bar2' }])).toEqual([{ v: 'foo' }, { v: 'bar' }, { v: 'bar2' }]);
  });

  afterAll(async () => orm.close(true));

});
