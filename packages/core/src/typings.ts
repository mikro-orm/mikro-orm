import type { Cascade, EventType, LoadStrategy, LockMode, QueryOrderMap } from './enums';
import { ReferenceType } from './enums';
import type { AssignOptions, Collection, EntityFactory, EntityIdentifier, EntityRepository, IdentifiedReference, Reference, SerializationContext } from './entity';
import type { EntitySchema, MetadataStorage } from './metadata';
import type { Type } from './types';
import type { Platform } from './platforms';
import type { Configuration } from './utils';
import { EntityComparator, Utils } from './utils';
import type { EntityManager } from './EntityManager';

export type Constructor<T = unknown> = new (...args: any[]) => T;
export type Dictionary<T = any> = { [k: string]: T };
// eslint-disable-next-line @typescript-eslint/ban-types
export type ExcludeFunctions<T, K extends keyof T> = T[K] extends Function ? never : K;
export type Cast<T, R> = T extends R ? T : R;
export type IsUnknown<T> = T extends unknown ? unknown extends T ? true : never : never;

export type DeepPartial<T> = T & {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends Readonly<infer U>[]
      ? Readonly<DeepPartial<U>>[]
      : DeepPartial<T[P]>
};

export const EntityRepositoryType = Symbol('EntityRepositoryType');
export const PrimaryKeyType = Symbol('PrimaryKeyType');
export const PrimaryKeyProp = Symbol('PrimaryKeyProp');

type ReadonlyPrimary<T> = T extends any[] ? Readonly<T> : T;
export type Primary<T> = T extends { [PrimaryKeyType]: infer PK } // TODO `PrimaryKeyType` should be optional
  ? ReadonlyPrimary<PK> : T extends { _id: infer PK }
  ? ReadonlyPrimary<PK> | string : T extends { uuid: infer PK }
  ? ReadonlyPrimary<PK> : T extends { id: infer PK }
  ? ReadonlyPrimary<PK> : never;
export type PrimaryProperty<T> = T extends { [PrimaryKeyProp]?: infer PK }
  ? PK : T extends { _id: any }
  ? '_id' | string : T extends { uuid: any }
  ? 'uuid' : T extends { id: any }
  ? 'id' : never;
export type IPrimaryKeyValue = number | string | bigint | Date | { toHexString(): string };
export type IPrimaryKey<T extends IPrimaryKeyValue = IPrimaryKeyValue> = T;

export type Scalar = boolean | number | string | bigint | symbol | Date | RegExp | Buffer | { toHexString(): string };

export type ExpandScalar<T> = null | (T extends string
  ? string | RegExp
  : T extends Date
    ? Date | string
    : T);

export type OperatorMap<T> = {
  $and?: Query<T>[];
  $or?: Query<T>[];
  $eq?: ExpandScalar<T>;
  $ne?: ExpandScalar<T>;
  $in?: ExpandScalar<T>[];
  $nin?: ExpandScalar<T>[];
  $not?: Query<T>;
  $gt?: ExpandScalar<T>;
  $gte?: ExpandScalar<T>;
  $lt?: ExpandScalar<T>;
  $lte?: ExpandScalar<T>;
  $like?: string;
  $re?: string;
  $ilike?: string;
  $overlap?: string[];
  $contains?: string[];
  $contained?: string[];
};

export type FilterValue2<T> = T | ExpandScalar<T> | Primary<T>;
export type FilterValue<T> = OperatorMap<FilterValue2<T>> | FilterValue2<T> | FilterValue2<T>[] | null;
// eslint-disable-next-line @typescript-eslint/ban-types
type ExpandObject<T> = T extends object
  ? T extends Scalar
    ? never
    : { [K in keyof T]?: Query<ExpandProperty<T[K]>> | FilterValue<ExpandProperty<T[K]>> | null }
  : never;

// eslint-disable-next-line @typescript-eslint/ban-types
export type Query<T> = T extends object
  ? T extends Scalar
    ? never
    : FilterQuery<T>
  : FilterValue<T>;

export type ObjectQuery<T> = ExpandObject<T> & OperatorMap<T>;
export type FilterQuery<T> = ObjectQuery<T> | NonNullable<ExpandScalar<Primary<T>>> | T | FilterQuery<T>[];
export type QBFilterQuery<T = any> = FilterQuery<T> | Dictionary;

export interface IWrappedEntity<T extends AnyEntity<T>, PK extends keyof T | unknown = PrimaryProperty<T>, P extends string = string> {
  isInitialized(): boolean;
  populated(populated?: boolean): void;
  init<P extends Populate<T> = Populate<T>>(populated?: boolean, populate?: P, lockMode?: LockMode): Promise<T>;
  toReference<PK2 extends PK | unknown = PrimaryProperty<T>, P2 extends string = string>(): IdentifiedReference<T, PK2> & LoadedReference<T>;
  toObject(ignoreFields?: string[]): EntityDTO<T>;
  toJSON(...args: any[]): EntityDTO<T>;
  toPOJO(): EntityDTO<T>;
  assign(data: EntityData<T> | Partial<EntityDTO<T>>, options?: AssignOptions | boolean): T;
}

export interface IWrappedEntityInternal<T, PK extends keyof T | unknown = PrimaryProperty<T>, P extends string = string> extends IWrappedEntity<T, PK, P> {
  hasPrimaryKey(): boolean;
  getPrimaryKey(convertCustomTypes?: boolean): Primary<T> | null;
  getPrimaryKeys(convertCustomTypes?: boolean): Primary<T>[] | null;
  setPrimaryKey(val: Primary<T>): void;
  getSerializedPrimaryKey(): string & keyof T;
  __meta: EntityMetadata<T>;
  __data: Dictionary;
  __em?: any; // we cannot have `EntityManager` here as that causes a cycle
  __platform: Platform;
  __initialized: boolean;
  __originalEntityData?: EntityData<T>;
  __identifier?: EntityIdentifier;
  __managed: boolean;
  __populated: boolean;
  __lazyInitialized: boolean;
  __primaryKeys: Primary<T>[];
  __primaryKeyCond: Primary<T> | Primary<T>[];
  __serializationContext: { root?: SerializationContext<T>; populate?: PopulateOptions<T>[] };
}

export type AnyEntity<T = any> = Partial<T> & {
  [PrimaryKeyType]?: unknown;
  [EntityRepositoryType]?: unknown;
  __helper?: IWrappedEntityInternal<T, keyof T>;
  __meta?: EntityMetadata<T>;
  __platform?: Platform;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type EntityClass<T extends AnyEntity<T>> = Function & { prototype: T };
export type EntityClassGroup<T extends AnyEntity<T>> = { entity: EntityClass<T>; schema: EntityMetadata<T> | EntitySchema<T> };
export type EntityName<T extends AnyEntity<T>> = string | EntityClass<T> | EntitySchema<T, any>;
export type GetRepository<T extends AnyEntity<T>, U> = T[typeof EntityRepositoryType] extends EntityRepository<any> | undefined ? NonNullable<T[typeof EntityRepositoryType]> : U;

export type EntityDataPropValue<T> = T | Primary<T>;
type ExpandEntityProp<T> = T extends Record<string, any>
  ? { [K in keyof T]?: EntityDataProp<ExpandProperty<T[K]>> | EntityDataPropValue<ExpandProperty<T[K]>> | null } | EntityDataPropValue<ExpandProperty<T>>
  : T;

export type EntityDataProp<T> = T extends Scalar
  ? T
  : T extends Reference<infer U>
    ? EntityDataNested<U>
    : T extends Collection<infer U>
        ? U | U[] | EntityDataNested<U> | EntityDataNested<U>[]
        : T extends readonly (infer U)[]
            ? U | U[] | EntityDataNested<U> | EntityDataNested<U>[]
            : EntityDataNested<T>;

export type EntityDataNested<T> = T extends undefined
  ? never
  : T extends any[]
    ? Readonly<T>
    : EntityData<T> | ExpandEntityProp<T>;
type EntityDataItem<T> = T | EntityDataProp<T> | null;
export type EntityData<T> = { [K in keyof T]?: EntityDataItem<T[K]> };
export type EntityDictionary<T> = EntityData<T> & Dictionary;

type Relation<T> = {
  [P in keyof T as T[P] extends unknown[] | Record<string | number | symbol, unknown> ? P : never]?: T[P]
};
export type EntityDTOProp<T> = T extends Scalar
  ? T
  : T extends Reference<infer U>
    ? EntityDTO<U>
    : T extends Collection<infer U>
      ? EntityDTO<U>[]
      : T extends { $: infer U }
        ? (U extends readonly (infer V)[] ? EntityDTO<V>[] : EntityDTO<U>)
        : T extends readonly (infer U)[]
          ? U[]
          : T extends Relation<T>
            ? EntityDTO<T>
            : T;
export type EntityDTO<T> = { [K in keyof T as ExcludeFunctions<T, K>]: EntityDTOProp<T[K]> };

export interface EntityProperty<T extends AnyEntity<T> = any> {
  name: string & keyof T;
  entity: () => EntityName<T>;
  type: string;
  targetMeta?: EntityMetadata;
  columnTypes: string[];
  customType: Type<any>;
  autoincrement?: boolean;
  primary?: boolean;
  serializedPrimaryKey: boolean;
  lazy?: boolean;
  array?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  reference: ReferenceType;
  wrappedReference?: boolean;
  fieldNames: string[];
  fieldNameRaw?: string;
  default?: string | number | boolean | null;
  defaultRaw?: string;
  formula?: (alias: string) => string;
  prefix?: string | boolean;
  embedded?: [string, string];
  embeddable: Constructor<T>;
  embeddedProps: Dictionary<EntityProperty>;
  object?: boolean;
  index?: boolean | string;
  unique?: boolean | string;
  nullable?: boolean;
  inherited?: boolean;
  unsigned?: boolean;
  mapToPk?: boolean;
  persist?: boolean;
  hidden?: boolean;
  enum?: boolean;
  items?: (number | string)[];
  version?: boolean;
  eager?: boolean;
  setter?: boolean;
  getter?: boolean;
  getterName?: keyof T;
  cascade: Cascade[];
  orphanRemoval?: boolean;
  onCreate?: (entity: T) => any;
  onUpdate?: (entity: T) => any;
  onDelete?: 'cascade' | 'no action' | 'set null' | 'set default' | string;
  onUpdateIntegrity?: 'cascade' | 'no action' | 'set null' | 'set default' | string;
  strategy?: LoadStrategy;
  owner: boolean;
  inversedBy: string;
  mappedBy: string;
  orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[];
  fixedOrder?: boolean;
  fixedOrderColumn?: string;
  pivotTable: string;
  joinColumns: string[];
  inverseJoinColumns: string[];
  referencedColumnNames: string[];
  referencedTableName: string;
  referencedPKs: string[];
  serializer?: (value: any) => any;
  serializedName?: string;
  comment?: string;
  userDefined?: boolean;
}

export class EntityMetadata<T extends AnyEntity<T> = any> {

  readonly propertyOrder = new Map<string, number>();

  constructor(meta: Partial<EntityMetadata> = {}) {
    this.properties = {} as any;
    this.props = [];
    this.primaryKeys = [];
    this.filters = {};
    this.hooks = {};
    this.indexes = [];
    this.uniques = [];
    Object.assign(this, meta);
  }

  addProperty(prop: EntityProperty<T>, sync = true) {
    this.properties[prop.name] = prop;
    this.propertyOrder.set(prop.name, this.props.length);

    /* istanbul ignore next */
    if (sync) {
      this.sync();
    }
  }

  removeProperty(name: string, sync = true) {
    delete this.properties[name];
    this.propertyOrder.delete(name);

    /* istanbul ignore next */
    if (sync) {
      this.sync();
    }
  }

  getPrimaryProps(): EntityProperty<T>[] {
    return this.primaryKeys.map(pk => this.properties[pk]);
  }

  sync(initIndexes = false) {
    this.root = this.root ?? this;
    const props = Object.values(this.properties).sort((a, b) => this.propertyOrder.get(a.name)! - this.propertyOrder.get(b.name)!);
    this.props = [...props.filter(p => p.primary), ...props.filter(p => !p.primary)];
    this.relations = this.props.filter(prop => prop.reference !== ReferenceType.SCALAR && prop.reference !== ReferenceType.EMBEDDED);
    this.comparableProps = this.props.filter(prop => EntityComparator.isComparable(prop, this.root));
    this.hydrateProps = this.props.filter(prop => {
      // `prop.userDefined` is either `undefined` or `false`
      const discriminator = this.root.discriminatorColumn === prop.name && prop.userDefined === false;
      const onlyGetter = prop.getter && !prop.setter;
      return !prop.inherited && !discriminator && !prop.embedded && !onlyGetter;
    });
    this.selfReferencing = this.relations.some(prop => [this.className, this.root.className].includes(prop.type));

    if (initIndexes && this.name) {
      this.props.forEach(prop => this.initIndexes(prop));
    }
  }

  private initIndexes(prop: EntityProperty<T>): void {
    const simpleIndex = this.indexes.find(index => index.properties === prop.name && !index.options && !index.type && !index.expression);
    const simpleUnique = this.uniques.find(index => index.properties === prop.name && !index.options);
    const owner = prop.reference === ReferenceType.MANY_TO_ONE || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);

    if (!prop.index && simpleIndex) {
      Utils.defaultValue(simpleIndex, 'name', true);
      prop.index = simpleIndex.name;
      this.indexes.splice(this.indexes.indexOf(simpleIndex), 1);
    }

    if (!prop.unique && simpleUnique) {
      Utils.defaultValue(simpleUnique, 'name', true);
      prop.unique = simpleUnique.name;
      this.uniques.splice(this.uniques.indexOf(simpleUnique), 1);
    }

    if (owner && prop.fieldNames.length > 1) {
      this.indexes.push({ properties: prop.name });
      prop.index = false;
    }

    if (owner && prop.fieldNames.length > 1 && prop.unique) {
      this.uniques.push({ properties: prop.name });
      prop.unique = false;
    }
  }

}

export interface EntityMetadata<T extends AnyEntity<T> = any> {
  name?: string; // abstract classes do not have a name, but once discovery ends, we have only non-abstract classes stored
  className: string;
  tableName: string;
  schema?: string;
  pivotTable: boolean;
  discriminatorColumn?: string;
  discriminatorValue?: string;
  discriminatorMap?: Dictionary<string>;
  embeddable: boolean;
  constructorParams: string[];
  forceConstructor: boolean;
  toJsonParams: string[];
  extends: string;
  collection: string;
  path: string;
  primaryKeys: (keyof T & string)[];
  compositePK: boolean;
  versionProperty: keyof T & string;
  serializedPrimaryKey: keyof T & string;
  properties: { [K in keyof T & string]: EntityProperty<T> };
  props: EntityProperty<T>[];
  relations: EntityProperty<T>[];
  comparableProps: EntityProperty<T>[]; // for EntityComparator
  hydrateProps: EntityProperty<T>[]; // for Hydrator
  indexes: { properties: (keyof T & string) | (keyof T & string)[]; name?: string; type?: string; options?: Dictionary; expression?: string }[];
  uniques: { properties: (keyof T & string) | (keyof T & string)[]; name?: string; options?: Dictionary }[];
  customRepository: () => Constructor<EntityRepository<T>>;
  hooks: Partial<Record<keyof typeof EventType, (string & keyof T)[]>>;
  prototype: T;
  class: Constructor<T>;
  abstract: boolean;
  useCache: boolean;
  filters: Dictionary<FilterDef<T>>;
  comment?: string;
  selfReferencing?: boolean;
  readonly?: boolean;
  root: EntityMetadata<T>;
}

export interface ISchemaGenerator {
  generate(): Promise<string>;
  createSchema(options?: { wrap?: boolean }): Promise<void>;
  ensureDatabase(): Promise<void>;
  getCreateSchemaSQL(options?: { wrap?: boolean }): Promise<string>;
  dropSchema(options?: { wrap?: boolean; dropMigrationsTable?: boolean; dropDb?: boolean }): Promise<void>;
  getDropSchemaSQL(options?: { wrap?: boolean; dropMigrationsTable?: boolean }): Promise<string>;
  updateSchema(options?: { wrap?: boolean; safe?: boolean; dropDb?: boolean; dropTables?: boolean }): Promise<void>;
  getUpdateSchemaSQL(options?: { wrap?: boolean; safe?: boolean; dropDb?: boolean; dropTables?: boolean }): Promise<string>;
  getUpdateSchemaMigrationSQL(options?: { wrap?: boolean; safe?: boolean; dropDb?: boolean; dropTables?: boolean }): Promise<{ up: string; down: string }>;
  createDatabase(name: string): Promise<void>;
  dropDatabase(name: string): Promise<void>;
  execute(sql: string, options?: { wrap?: boolean }): Promise<void>;
}

export interface IEntityGenerator {
  generate(options?: { baseDir?: string; save?: boolean }): Promise<string[]>;
}

type UmzugMigration = { path?: string; file: string };
type MigrateOptions = { from?: string | number; to?: string | number; migrations?: string[]; transaction?: Transaction };
type MigrationResult = { fileName: string; code: string; diff: MigrationDiff };
type MigrationRow = { name: string; executed_at: Date };

export interface IMigrator {
  /**
   * Checks current schema for changes, generates new migration if there are any.
   */
  createMigration(path?: string, blank?: boolean, initial?: boolean): Promise<MigrationResult>;

  /**
   * Creates initial migration. This generates the schema based on metadata, and checks whether all the tables
   * are already present. If yes, it will also automatically log the migration as executed.
   * Initial migration can be created only if the schema is already aligned with the metadata, or when no schema
   * is present - in such case regular migration would have the same effect.
   */
  createInitialMigration(path?: string): Promise<MigrationResult>;

  /**
   * Returns list of already executed migrations.
   */
  getExecutedMigrations(): Promise<MigrationRow[]>;

  /**
   * Returns list of pending (not yet executed) migrations found in the migration directory.
   */
  getPendingMigrations(): Promise<UmzugMigration[]>;

  /**
   * Executes specified migrations. Without parameter it will migrate up to the latest version.
   */
  up(options?: string | string[] | MigrateOptions): Promise<UmzugMigration[]>;

  /**
   * Executes down migrations to the given point. Without parameter it will migrate one version down.
   */
  down(options?: string | string[] | MigrateOptions): Promise<UmzugMigration[]>;
}

export interface MigrationDiff {
  up: string[];
  down: string[];
}

export interface IMigrationGenerator {
  /**
   * Generates the full contents of migration file. Uses `generateMigrationFile` to get the file contents.
   */
  generate(diff: MigrationDiff, path?: string): Promise<[string, string]>;

  /**
   * Creates single migration statement. By default adds `this.addSql(sql);` to the code.
   */
  createStatement(sql: string, padLeft: number): string;

  /**
   * Returns the file contents of given migration.
   */
  generateMigrationFile(className: string, diff: MigrationDiff): string;
}

export interface Migration {
  up(): Promise<void>;
  down(): Promise<void>;
}

export interface MigrationObject {
  name: string;
  class: Constructor<Migration>;
}

export type FilterDef<T extends AnyEntity<T>> = {
  name: string;
  cond: FilterQuery<T> | ((args: Dictionary, type: 'read' | 'update' | 'delete', em: any) => FilterQuery<T> | Promise<FilterQuery<T>>);
  default?: boolean;
  entity?: string[];
  args?: boolean;
};

export type Populate<T, P extends string = never> = readonly AutoPath<T, P>[] | boolean;

export type PopulateOptions<T> = {
  field: string;
  strategy?: LoadStrategy;
  all?: boolean;
  children?: PopulateOptions<T[keyof T]>[];
};

type Loadable<T> = Collection<T> | Reference<T> | readonly T[]; // we need to support raw arrays in embeddables too to allow population
type ExtractType<T> = T extends Loadable<infer U> ? U : T;

type StringKeys<T> = T extends Collection<any>
  ? `${Exclude<keyof ExtractType<T>, symbol>}`
  : T extends Reference<any>
    ? `${Exclude<keyof ExtractType<T>, symbol>}`
    // eslint-disable-next-line @typescript-eslint/ban-types
    : T extends object
      ? `${Exclude<keyof ExtractType<T>, symbol>}`
      : never;
type GetStringKey<T, K extends StringKeys<T>> = K extends keyof T ? ExtractType<T[K]> : never;

export type AutoPath<O, P extends string> =
  P extends any ?
    (P & `${string}.` extends never ? P : P & `${string}.`) extends infer Q
      ? Q extends `${infer A}.${infer B}`
        ? A extends StringKeys<O>
          ? `${A}.${AutoPath<Defined<GetStringKey<O, A>>, B>}`
          : never
        : Q extends StringKeys<O>
          ? (Defined<GetStringKey<O, Q>> extends unknown ? Exclude<P, `${string}.`> : never) | (StringKeys<Defined<GetStringKey<O, Q>>> extends never ? never : `${Q}.`)
          : StringKeys<O>
      : never
    : never;

export type ExpandProperty<T> = T extends Reference<infer U>
  ? NonNullable<U>
  : T extends Collection<infer U>
    ? NonNullable<U>
    : T extends (infer U)[]
      ? NonNullable<U>
      : NonNullable<T>;

type LoadedLoadable<T, E> = T extends Collection<any>
  ? T & LoadedCollection<E>
  : (T extends Reference<any> ? T & LoadedReference<E> : T & E);

type Prefix<K> = K extends `${infer S}.${string}` ? S : K;
type Suffix<K> = K extends `${string}.${infer S}` ? S : never;
type Defined<T> = Exclude<T, undefined>;

// For each property on T check if it is included in prefix of keys to load L:
//   1. It yes, mark the collection or reference loaded and resolve its inner type recursively (passing suffix).
//   2. If no, just return it as-is (scalars will be included, loadables too but not loaded).
export type Loaded<T, L extends string = never> = {
  [K in keyof T]: K extends Prefix<L>
    ? LoadedLoadable<Defined<T[K]>, Loaded<ExtractType<Defined<T[K]>>, Suffix<L>>>
    : T[K]
};

export interface LoadedReference<T> extends Reference<T> {
  $: T;
  get(): T;
}

export interface LoadedCollection<T> extends Collection<T> {
  $: readonly T[];
  get(): readonly T[];
}

export type New<T extends AnyEntity<T>, P extends string = string> = Loaded<T, P>;

export interface Highlighter {
  highlight(text: string): string;
}

export interface IMetadataStorage {
  getAll(): Dictionary<EntityMetadata>;
  get<T extends AnyEntity<T> = any>(entity: string, init?: boolean, validate?: boolean): EntityMetadata<T>;
  find<T extends AnyEntity<T> = any>(entity: string): EntityMetadata<T> | undefined;
  has(entity: string): boolean;
  set(entity: string, meta: EntityMetadata): EntityMetadata;
  reset(entity: string): void;
}

export interface IHydrator {

  /**
   * Hydrates the whole entity. This process handles custom type conversions, creating missing Collection instances,
   * mapping FKs to entity instances, as well as merging those entities.
   */
  hydrate<T extends AnyEntity<T>>(
    entity: T,
    meta: EntityMetadata<T>,
    data: EntityData<T>,
    factory: EntityFactory,
    type: 'full' | 'returning' | 'reference',
    newEntity?: boolean,
    convertCustomTypes?: boolean,
  ): void;

  /**
   * Hydrates primary keys only
   */
  hydrateReference<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, convertCustomTypes?: boolean): void;

}

export interface HydratorConstructor {
  new (metadata: MetadataStorage, platform: Platform, config: Configuration): IHydrator;
}

export interface ISeedManager {
  refreshDatabase(): Promise<void>;
  seed(...seederClasses: { new(): Seeder }[]): Promise<void>;
  seedString(...seederClasses: string[]): Promise<void>;
  createSeeder(seederClass: string): Promise<void>;
}

export interface Seeder {
  run(em: EntityManager): Promise<void>;
}

export abstract class PlainObject {
}

export type MaybePromise<T> = T | Promise<T>;
