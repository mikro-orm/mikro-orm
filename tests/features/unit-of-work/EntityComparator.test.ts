import {
  AnyEntity,
  Collection,
  Dictionary,
  Entity, EntityAssigner,
  EntityData, EntityFactory, EntityMetadata,
  EntityProperty,
  MetadataStorage,
  MikroORM,
  Platform, Primary,
  PrimaryKey,
  Property, Reference,
  ReferenceType,
  Utils,
} from '@mikro-orm/core';
import { performance } from 'perf_hooks';
import { Address2, Author2, Book2, BookTag2, Configuration2, FooBar2, FooBaz2, Publisher2, Test2 } from '../../entities-sql';
import { BaseEntity2 } from '../../entities-sql/BaseEntity2';
import { BaseEntity22 } from '../../entities-sql/BaseEntity22';

export class ObjectHydratorOld {

  constructor(protected readonly metadata: MetadataStorage,
              protected readonly platform: Platform) { }

  /**
   * @inheritDoc
   */
  hydrate<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, newEntity = false, convertCustomTypes = false, returning = false): void {
    const props = this.getProperties(meta, entity, returning);

    for (const prop of props) {
      this.hydrateProperty(entity, prop, data, factory, newEntity, convertCustomTypes);
    }
  }

  /**
   * @inheritDoc
   */
  hydrateReference<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, convertCustomTypes = false): void {
    meta.primaryKeys.forEach(pk => {
      this.hydrateProperty<T>(entity, meta.properties[pk], data, factory, false, convertCustomTypes);
    });
  }

  protected getProperties<T extends AnyEntity<T>>(meta: EntityMetadata<T>, entity: T, returning?: boolean, reference?: boolean): EntityProperty<T>[] {
    if (reference) {
      return meta.primaryKeys.map(pk => meta.properties[pk]);
    }

    if (meta.root.discriminatorColumn) {
      meta = this.metadata.find(entity.constructor.name)!;
    }

    if (returning) {
      return meta.hydrateProps.filter(prop => prop.primary || prop.defaultRaw);
    }

    return meta.hydrateProps;
  }

  protected hydrateProperty<T>(entity: T, prop: EntityProperty, data: EntityData<T>, factory: EntityFactory, newEntity: boolean, convertCustomTypes: boolean): void {
    if (prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE) {
      this.hydrateToOne(data[prop.name], entity, prop, factory);
    } else if (prop.reference === ReferenceType.ONE_TO_MANY || prop.reference === ReferenceType.MANY_TO_MANY) {
      this.hydrateToMany(entity, prop, data[prop.name], factory, newEntity);
    } else if (prop.reference === ReferenceType.EMBEDDED) {
      this.hydrateEmbeddable(entity, prop, data);
    } else { // ReferenceType.SCALAR
      this.hydrateScalar(entity, prop, data, convertCustomTypes);
    }
  }

  private hydrateScalar<T>(entity: T, prop: EntityProperty<T>, data: EntityData<T>, convertCustomTypes: boolean): void {
    let value = data[prop.name as any];

    if (typeof value === 'undefined') {
      return;
    }

    if (prop.customType && convertCustomTypes) {
      value = prop.customType.convertToJSValue(value, this.platform);
      data[prop.name as any] = prop.customType.convertToDatabaseValue(value, this.platform); // make sure the value is comparable
    }

    if (value && prop.type.toLowerCase() === 'date') {
      entity[prop.name] = new Date(value as string) as unknown as T[keyof T & string];
    } else {
      entity[prop.name] = value as any;
    }
  }

  private hydrateEmbeddable<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, data: EntityData<T>): void {
    const value: Dictionary = {};

    entity.__meta!.props.filter(p => p.embedded?.[0] === prop.name).forEach(childProp => {
      value[childProp.embedded![1]] = data[childProp.name as any];
    });

    entity[prop.name] = Object.create(prop.embeddable.prototype);
    Object.keys(value).forEach(k => entity[prop.name][k] = value[k]);
  }

  private hydrateToMany<T>(entity: T, prop: EntityProperty<T>, value: any, factory: EntityFactory, newEntity?: boolean): void {
    if (Array.isArray(value)) {
      const items = value.map((value: Primary<T> | EntityData<T>) => this.createCollectionItem(prop, value, factory, newEntity));
      const coll = Collection.create<AnyEntity>(entity, prop.name, items, !!newEntity);
      coll.setDirty(!!newEntity);
    } else if (!entity[prop.name]) {
      const items = this.platform.usesPivotTable() || !prop.owner ? undefined : [];
      const coll = Collection.create<AnyEntity>(entity, prop.name, items, !!(value || newEntity));
      coll.setDirty(false);
    }
  }

  private hydrateToOne<T>(value: any, entity: T, prop: EntityProperty, factory: EntityFactory): void {
    if (typeof value === 'undefined') {
      return;
    }

    if (Utils.isPrimaryKey<T[keyof T]>(value, true)) {
      entity[prop.name] = Reference.wrapReference(factory.createReference<T[keyof T]>(prop.type, value, { merge: true }), prop) as T[keyof T];
    } else if (Utils.isObject<EntityData<T[keyof T]>>(value)) {
      entity[prop.name] = Reference.wrapReference(factory.create(prop.type, value, { initialized: true, merge: true }), prop) as T[keyof T];
    } else if (value === null) {
      entity[prop.name] = null;
    }

    if (entity[prop.name]) {
      EntityAssigner.autoWireOneToOne(prop, entity);
    }
  }

  private createCollectionItem<T>(prop: EntityProperty, value: Primary<T> | EntityData<T> | T, factory: EntityFactory, newEntity?: boolean): T {
    const meta = this.metadata.find(prop.type)!;

    if (Utils.isPrimaryKey(value, meta.compositePK)) {
      return factory.createReference<T>(prop.type, value, { merge: true });
    }

    if (Utils.isEntity<T>(value)) {
      return value;
    }

    return factory.create(prop.type, value as EntityData<T>, { newEntity, merge: true });
  }

}

export class EntityComparatorOld {

  prepareEntity<T extends AnyEntity<T>>(entity: T, metadata: MetadataStorage, platform: Platform): EntityData<T> {
    const meta = metadata.get<T>(entity.constructor.name);
    const ret = {} as EntityData<T>;

    if (meta.discriminatorValue) {
      ret[meta.root.discriminatorColumn as any] = meta.discriminatorValue as any;
    }

    // copy all comparable props, ignore collections and references, process custom types
    meta.comparableProps.forEach(prop => {
      if (this.shouldIgnoreProperty(entity, prop)) {
        return;
      }

      if (prop.reference === ReferenceType.EMBEDDED) {
        return meta.props.filter(p => p.embedded?.[0] === prop.name).forEach(childProp => {
          ret[childProp.name as any] = Utils.copy(entity[prop.name][childProp.embedded![1]]);
        });
      }

      if (Utils.isEntity(entity[prop.name], true)) {
        ret[prop.name as any] = Utils.getPrimaryKeyValues(entity[prop.name], metadata.find(prop.type)!.primaryKeys, true);

        if (prop.customType) {
          return ret[prop.name as any] = Utils.copy(prop.customType.convertToDatabaseValue(ret[prop.name as any], platform));
        }

        return;
      }

      if (prop.customType) {
        return ret[prop.name as any] = Utils.copy(prop.customType.convertToDatabaseValue(entity[prop.name], platform));
      }

      if (prop.type.toLowerCase() === 'date') {
        return ret[prop.name as any] = Utils.copy(platform.processDateProperty(entity[prop.name])) as any;
      }

      ret[prop.name as any] = Utils.copy(entity[prop.name]);
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
    const hydrator = orm.config.getHydrator(orm.getMetadata());

    const now = performance.now();
    for (let i = 0; i < 1_000_000; i++) {
      // const d0 = hydrator.hydrate(u1, (u1 as AnyEntity).__meta!, {
      //   name: 'b222',
      //   id2: 12345,
      //   ready: false,
      //   priority: 500,
      // }, orm.em.getEntityFactory());
      const d1 = diff(b1, b2);
      // const d2 = gen(u1);
      // const d3 = entityFactory.create('User', b0, { merge: true });
    }
    // const d1 = performance.now() - now;
    // process.stdout.write(`compare test took ${d1}\n`);
    //
    // const now2 = performance.now();
    // const comparatorOld = new EntityComparatorOld();
    // const hydratorOld = new ObjectHydratorOld(orm.getMetadata(), orm.em.getDriver().getPlatform());
    // const metadata = orm.em.getMetadata();
    // const platform = orm.em.getDriver().getPlatform();
    // for (let i = 0; i < 1_000_000; i++) {
    //   // const d0 = hydratorOld.hydrate(u1, (u1 as AnyEntity).__meta!, {
    //   //   name: 'b222',
    //   //   id2: 12345,
    //   //   ready: false,
    //   //   priority: 500,
    //   // }, orm.em.getEntityFactory());
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
