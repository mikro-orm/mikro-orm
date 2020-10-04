import {
  AnyEntity,
  Collection,
  Dictionary,
  Entity,
  EntityData,
  EntityProperty,
  MetadataStorage,
  MikroORM,
  Platform,
  PrimaryKey,
  Property,
  ReferenceType,
  Utils,
} from '@mikro-orm/core';
import { Address2, Author2, Book2, BookTag2, Configuration2, FooBar2, FooBaz2, Publisher2, Test2 } from './entities-sql';
import { BaseEntity2 } from './entities-sql/BaseEntity2';
import { BaseEntity22 } from './entities-sql/BaseEntity22';

export class EntityComparatorOld {

  prepareEntity<T extends AnyEntity<T>>(entity: T, metadata: MetadataStorage, platform: Platform): EntityData<T> {
    const meta = metadata.get<T>(entity.constructor.name);
    const ret = {} as EntityData<T>;

    if (meta.discriminatorValue) {
      ret[meta.root.discriminatorColumn as keyof T] = meta.discriminatorValue as unknown as EntityData<T>[keyof T];
    }

    // copy all comparable props, ignore collections and references, process custom types
    meta.comparableProps.forEach(prop => {
      if (this.shouldIgnoreProperty(entity, prop)) {
        return;
      }

      if (prop.reference === ReferenceType.EMBEDDED) {
        return meta.props.filter(p => p.embedded?.[0] === prop.name).forEach(childProp => {
          ret[childProp.name as keyof T] = Utils.copy(entity[prop.name][childProp.embedded![1]]);
        });
      }

      if (Utils.isEntity(entity[prop.name], true)) {
        ret[prop.name] = Utils.getPrimaryKeyValues(entity[prop.name], metadata.find(prop.type)!.primaryKeys, true);

        if (prop.customType) {
          return ret[prop.name] = Utils.copy(prop.customType.convertToDatabaseValue(ret[prop.name], platform));
        }

        return;
      }

      if (prop.customType) {
        return ret[prop.name] = Utils.copy(prop.customType.convertToDatabaseValue(entity[prop.name], platform));
      }

      if (prop.type.toLowerCase() === 'date') {
        return ret[prop.name] = Utils.copy(platform.processDateProperty(entity[prop.name]));
      }

      ret[prop.name] = Utils.copy(entity[prop.name]);
    });

    return ret;
  }

  /**
   * should be used only for `meta.comparableProps` that are defined based on the static `isComparable` helper
   */
  private shouldIgnoreProperty<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>) {
    if (!(prop.name in entity)) {
      return true;
    }

    const value = entity[prop.name];
    const noPkRef = Utils.isEntity<T>(value, true) && !value.__helper!.hasPrimaryKey();
    const noPkProp = prop.primary && !Utils.isDefined(value, true);

    // bidirectional 1:1 and m:1 fields are defined as setters, we need to check for `undefined` explicitly
    const isSetter = [ReferenceType.ONE_TO_ONE, ReferenceType.MANY_TO_ONE].includes(prop.reference) && (prop.inversedBy || prop.mappedBy);
    const emptyRef = isSetter && value === undefined;

    return noPkProp || noPkRef || emptyRef || prop.version;
  }

}

/**
 * Computes difference between two objects, ignoring items missing in `b`.
 * Old version without JIT compilation, just for comparison.
 */
function diffOld(a: Dictionary, b: Dictionary): Record<keyof (typeof a & typeof b), any> {
  const ret: Dictionary = {};

  Object.keys(b).forEach(k => {
    if (Utils.equals(a[k], b[k])) {
      return;
    }

    ret[k] = b[k];
  });

  return ret;
}

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  id2!: number;

  @Property()
  ready?: boolean;

  @Property()
  priority: number = 0;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

describe('EntityComparator', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await MikroORM.init({
    type: 'sqlite',
    dbName: ':memory:',
    entities: [Author2, Book2, BookTag2, Publisher2, Address2, Test2, Configuration2, FooBar2, FooBaz2, BaseEntity2, BaseEntity22, User],
  }, false));

  test('prepareEntity changes entity to number id', async () => {
    const author1 = new Author2('Name 1', 'e-mail1');
    author1.id = 1;
    const book = new Book2('test', author1);
    book.uuid = '123';
    const author2 = new Author2('Name 2', 'e-mail2');
    author2.id = 2;
    author2.favouriteBook = book;
    author2.version = 123;
    const a1 = orm.em.getComparator().prepareEntity(author1);
    const a2 = orm.em.getComparator().prepareEntity(author2);
    const diff = orm.em.getComparator().diffEntities('Author2', a1, a2);
    expect(diff).toMatchObject({ name: 'Name 2', favouriteBook: book.uuid });
    expect(typeof diff.favouriteBook).toBe('string');
    expect(diff.favouriteBook).toBe(book.uuid);
  });

  test('diffEntities ignores collections', () => {
    const author1 = new Author2('Name 1', 'e-mail1');
    author1.books = new Collection<Book2>(author1);
    const author2 = new Author2('Name 2', 'e-mail2');
    author2.books = new Collection<Book2>(author2);

    const a1 = orm.em.getComparator().prepareEntity(author1);
    const a2 = orm.em.getComparator().prepareEntity(author2);
    const diff = orm.em.getComparator().diffEntities('Author2', a1, a2);
    expect(diff.books).toBeUndefined();
  });

  test('prepareEntity ignores properties with `persist: false` flag', async () => {
    const author = new Author2('Name 1', 'e-mail');
    author.version = 123;
    author.versionAsString = 'v123';
    const o = orm.em.getComparator().prepareEntity(author);
    expect(o.version).toBeUndefined();
    expect(o.versionAsString).toBeUndefined();
  });

  test('prepareEntity clones object properties', async () => {
    const author = new Author2('Name 1', 'e-mail');
    author.updatedAt = new Date();
    const o = orm.em.getComparator().prepareEntity(author);
    expect(o.updatedAt).not.toBe(author.updatedAt);
  });

  test('diffing performance', async () => {
    const comparator = orm.em.getComparator();

    const u1 = new User('b1');
    u1.id2 = 123;
    u1.ready = true;
    u1.priority = 5;

    const b0 = {
      id: 1,
      name: 'b1',
      id2: 123,
      ready: true,
      priority: 5,
    };
    const b1 = {
      name: 'b1',
      id2: 123,
      ready: true,
      priority: 5,
    };
    const b2 = {
      name: 'b2',
      id2: 123,
      ready: true,
      priority: 5,
    };
    const diff = comparator.getEntityComparator('User');
    const gen = comparator.getSnapshotGenerator('User');
    const entityFactory = orm.em.getEntityFactory();

    const now = performance.now();
    for (let i = 0; i < 1_000_000; i++) {
      const d1 = diff(b1, b2);
      // const d2 = gen(u1);
      // const d3 = entityFactory.create('User', b0, { merge: true });
    }
    // const d1 = performance.now() - now;
    // process.stdout.write(`compare test took ${d1}\n`);
    //
    // const now2 = performance.now();
    // const comparatorOld = new EntityComparatorOld();
    // const metadata = orm.em.getMetadata();
    // const platform = orm.em.getDriver().getPlatform();
    // for (let i = 0; i < 1_000_000; i++) {
    //   const d1 = diffOld(b1, b2);
    //   // const d2 = comparatorOld.prepareEntity(u1, metadata, platform);
    //   // const d3 = entityFactory.createOld('User', b0, { merge: true });
    // }
    // const d2 = performance.now() - now2;
    // process.stdout.write(`old compare test took ${d2}\n`);
    // console.log(d2 / d1);
  });

  afterAll(async () => orm.close(true));

});
