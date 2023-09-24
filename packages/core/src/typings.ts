import type { Transaction } from './connections';
import { ReferenceType, type Cascade, type EventType, type LoadStrategy, type LockMode, type QueryOrderMap } from './enums';
import {
  EntityHelper,
  Reference,
  type AssignOptions,
  type Collection,
  type EntityFactory,
  type EntityIdentifier,
  type EntityLoaderOptions,
  type EntityRepository,
  type IdentifiedReference,
} from './entity';
import type { SerializationContext } from './serialization';
import type { EntitySchema, MetadataStorage } from './metadata';
import type { Type, types } from './types';
import type { Platform } from './platforms';
import type { Configuration } from './utils';
import { Utils } from './utils/Utils';
import { EntityComparator } from './utils/EntityComparator';
import type { EntityManager } from './EntityManager';
import type { EventSubscriber } from './events';
import type { FindOneOptions, FindOptions } from './drivers';

export type Constructor<T = unknown> = new (...args: any[]) => T;
export type Dictionary<T = any> = { [k: string]: T };
export type AsyncFunction<R = any, T = Dictionary> = (args: T) => Promise<T>;
// eslint-disable-next-line @typescript-eslint/ban-types
export type ExcludeFunctions<T, K extends keyof T> = T[K] extends Function ? never : (K extends symbol ? never : K);
export type Cast<T, R> = T extends R ? T : R;
export type IsUnknown<T> = T extends unknown ? unknown extends T ? true : never : never;
export type NoInfer<T> = [T][T extends any ? 0 : never];

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
export const OptionalProps = Symbol('OptionalProps');

type ReadonlyPrimary<T> = T extends any[] ? Readonly<T> : T;
export type Primary<T> = T extends { [PrimaryKeyType]?: infer PK }
  ? ReadonlyPrimary<PK> : T extends { _id?: infer PK }
  ? ReadonlyPrimary<PK> | string : T extends { uuid?: infer PK }
  ? ReadonlyPrimary<PK> : T extends { id?: infer PK }
  ? ReadonlyPrimary<PK> : never;
export type PrimaryProperty<T> = T extends { [PrimaryKeyProp]?: infer PK }
  ? PK : T extends { _id?: any }
  ? '_id' | string : T extends { uuid?: any }
  ? 'uuid' : T extends { id?: any }
  ? 'id' : never;
export type IPrimaryKeyValue = number | string | bigint | Date | { toHexString(): string };
export type IPrimaryKey<T extends IPrimaryKeyValue = IPrimaryKeyValue> = T;

export type Scalar = boolean | number | string | bigint | symbol | Date | RegExp | Uint8Array | { toHexString(): string };

export type ExpandScalar<T> = null | (T extends string
  ? T | RegExp
  : T extends Date
    ? Date | string
    : T);

export type OperatorMap<T> = {
  $and?: Query<T>[];
  $or?: Query<T>[];
  $eq?: ExpandScalar<T> | ExpandScalar<T>[];
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
  $fulltext?: string;
  $overlap?: string[];
  $contains?: string[];
  $contained?: string[];
  $exists?: boolean;
};

export type FilterValue2<T> = T | ExpandScalar<T> | Primary<T>;
export type FilterValue<T> = OperatorMap<FilterValue2<T>> | FilterValue2<T> | FilterValue2<T>[] | null;
type ExpandObject<T> = T extends object
  ? T extends Scalar
    ? never
    : { -readonly [K in keyof T as ExcludeFunctions<T, K>]?: Query<ExpandProperty<T[K]>> | FilterValue<ExpandProperty<T[K]>> | null }
  : never;

export type Query<T> = T extends object
  ? T extends Scalar
    ? never
    : FilterQuery<T>
  : FilterValue<T>;

export type EntityProps<T> = { -readonly [K in keyof T as ExcludeFunctions<T, K>]?: T[K] };
export type ObjectQuery<T> = ExpandObject<T> & OperatorMap<T>;
export type FilterQuery<T> =
  | ObjectQuery<T>
  | NonNullable<ExpandScalar<Primary<T>>>
  | NonNullable<EntityProps<T> & OperatorMap<T>>
  | FilterQuery<T>[];
export type QBFilterQuery<T = any> = ObjectQuery<T> | Dictionary;

export interface IWrappedEntity<
  T,
  PK extends keyof T | unknown = PrimaryProperty<T>,
  P extends string = string,
> {
  isInitialized(): boolean;
  isTouched(): boolean;
  populated(populated?: boolean): void;
  populate<Hint extends string = never>(populate: AutoPath<T, Hint>[] | boolean, options?: EntityLoaderOptions<T, Hint>): Promise<Loaded<T, Hint>>;
  init<P extends string = never>(populated?: boolean, populate?: Populate<T, P>, lockMode?: LockMode, connectionType?: ConnectionType): Promise<Loaded<T, P>>;
  toReference<PK2 extends PK | unknown = PrimaryProperty<T>, P2 extends string = string>(): IdentifiedReference<T, PK2> & LoadedReference<T>;
  toObject(ignoreFields?: string[]): EntityDTO<T>;
  toJSON(...args: any[]): EntityDTO<T>;
  toPOJO(): EntityDTO<T>;
  assign(data: EntityData<T> | Partial<EntityDTO<T>>, options?: AssignOptions | boolean): T;
  getSchema(): string | undefined;
  setSchema(schema?: string): void;
}

export interface IWrappedEntityInternal<
  T,
  PK extends keyof T | unknown = PrimaryProperty<T>,
  P extends string = string,
> extends IWrappedEntity<T, PK, P> {
  hasPrimaryKey(): boolean;
  getPrimaryKey(convertCustomTypes?: boolean): Primary<T> | null;
  getPrimaryKeys(convertCustomTypes?: boolean): Primary<T>[] | null;
  setPrimaryKey(val: Primary<T>): void;
  getSerializedPrimaryKey(): string & keyof T;
  __meta: EntityMetadata<T>;
  __data: Dictionary;
  __em?: any; // we cannot have `EntityManager` here as that causes a cycle
  __platform: Platform;
  __factory: EntityFactory; // internal factory instance that has its own global fork
  __hydrator: IHydrator;
  __initialized: boolean;
  __touched: boolean;
  __originalEntityData?: EntityData<T>;
  __loadedProperties: Set<string>;
  __identifier?: EntityIdentifier;
  __managed: boolean;
  __processing: boolean;
  __schema?: string;
  __populated: boolean;
  __onLoadFired: boolean;
  __reference?: Reference<T>;
  __lazyInitialized: boolean;
  __pk?: Primary<T>;
  __primaryKeys: Primary<T>[];
  __serializationContext: { root?: SerializationContext<T>; populate?: PopulateOptions<T>[] };
}

export type AnyEntity<T = any> = Partial<T>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type EntityClass<T> = Function & { prototype: T };
export type EntityClassGroup<T> = { entity: EntityClass<T>; schema: EntityMetadata<T> | EntitySchema<T> };
export type EntityName<T> = string | EntityClass<T> | EntitySchema<T, any>;

// we need to restrict the type in the generic argument, otherwise inference don't work, so we use two types here
export type GetRepository<Entity extends { [k: PropertyKey]: any }, Fallback> = Entity[typeof EntityRepositoryType] extends EntityRepository<Entity> | undefined ? NonNullable<Entity[typeof EntityRepositoryType]> : Fallback;

export type EntityDataPropValue<T> = T | Primary<T>;
type ExpandEntityProp<T> = T extends Record<string, any>
  ? { [K in keyof T]?: EntityDataProp<ExpandProperty<T[K]>> | EntityDataPropValue<ExpandProperty<T[K]>> | null } | EntityDataPropValue<ExpandProperty<T>>
  : T;

export type EntityDataProp<T> = T extends Date
  ? string | Date
  : T extends Scalar
    ? T
    : T extends Reference<infer U>
      ? EntityDataNested<U>
      : T extends Collection<infer U, any>
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

type ExplicitlyOptionalProps<T> = T extends { [OptionalProps]?: infer PK } ? PK : never;
type NullableKeys<T> = { [K in keyof T]: null extends T[K] ? K : never }[keyof T];
type ProbablyOptionalProps<T> = ExplicitlyOptionalProps<T> | 'id' | '_id' | 'uuid' | Defined<NullableKeys<T>>;

type IsOptional<T, K extends keyof T> = T[K] extends Collection<any, any>
  ? true
  // eslint-disable-next-line @typescript-eslint/ban-types
  : T[K] extends Function
    ? true
    : K extends symbol
      ? true
      : K extends ProbablyOptionalProps<T>
        ? true
        : false;
type RequiredKeys<T, K extends keyof T> = IsOptional<T, K> extends false ? K : never;
export type EntityData<T> = { [K in keyof T as ExcludeFunctions<T, K>]?: EntityDataItem<T[K]> };
export type RequiredEntityData<T> = EntityData<T> & { [K in keyof T as RequiredKeys<T, K>]: T[K] | EntityDataProp<T[K]> };
export type EntityDictionary<T> = EntityData<T> & Dictionary;

type Relation<T> = {
  [P in keyof T as T[P] extends unknown[] | Record<string | number | symbol, unknown> ? P : never]?: T[P]
};

/** Identity type that can be used to get around issues with cycles in bidirectional relations. */
export type Rel<T> = T;

/** Shortcut for `IdentifiedReference`. */
export type Ref<T, PK extends keyof T | unknown = PrimaryProperty<T>> = IdentifiedReference<T, PK>;

export type EntityDTOProp<T> = T extends Scalar
  ? T
  : T extends LoadedReference<infer U>
    ? EntityDTO<U>
    : T extends Reference<infer U>
      ? Primary<U>
      : T extends { getItems(check?: boolean): infer U }
        ? (U extends readonly (infer V)[] ? EntityDTO<V>[] : EntityDTO<U>)
        : T extends { $: infer U }
          ? (U extends readonly (infer V)[] ? EntityDTO<V>[] : EntityDTO<U>)
          : T extends readonly (infer U)[]
            ? (T extends readonly [infer U, ...infer V] ? T : U[])
            : T extends Relation<T>
              ? EntityDTO<T>
              : T;
export type EntityDTO<T> = { [K in keyof T as ExcludeFunctions<T, K>]: EntityDTOProp<T[K]> };

export type CheckCallback<T> = (columns: Record<keyof T, string>) => string;

export interface CheckConstraint<T = any> {
  name?: string;
  property?: string;
  expression: string | CheckCallback<T>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type AnyString = string & {};

export interface EntityProperty<T = any> {
  name: string & keyof T;
  entity: () => EntityName<T>;
  type: keyof typeof types | AnyString;
  targetMeta?: EntityMetadata;
  columnTypes: string[];
  customType: Type<any>;
  hasConvertToJSValueSQL: boolean;
  hasConvertToDatabaseValueSQL: boolean;
  autoincrement?: boolean;
  returning?: boolean;
  primary?: boolean;
  serializedPrimaryKey: boolean;
  lazy?: boolean;
  array?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  reference: ReferenceType;
  /** @deprecated use `ref` instead, `wrappedReference` option will be removed in v6 */
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
  discriminatorColumn?: string; // only for poly embeddables currently
  object?: boolean;
  index?: boolean | string;
  unique?: boolean | string;
  nullable?: boolean;
  inherited?: boolean;
  unsigned?: boolean;
  mapToPk?: boolean;
  persist?: boolean;
  hydrate?: boolean;
  trackChanges?: boolean;
  hidden?: boolean;
  enum?: boolean;
  items?: (number | string)[];
  version?: boolean;
  concurrencyCheck?: boolean;
  eager?: boolean;
  setter?: boolean;
  getter?: boolean;
  getterName?: keyof T;
  cascade: Cascade[];
  orphanRemoval?: boolean;
  onCreate?: (entity: T) => any;
  onUpdate?: (entity: T) => any;
  onDelete?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
  onUpdateIntegrity?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
  strategy?: LoadStrategy;
  owner: boolean;
  inversedBy: string;
  mappedBy: string;
  orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[];
  customOrder?: string[] | number[] | boolean[];
  fixedOrder?: boolean;
  fixedOrderColumn?: string;
  pivotTable: string;
  pivotEntity: string;
  joinColumns: string[];
  inverseJoinColumns: string[];
  referencedColumnNames: string[];
  referencedTableName: string;
  referencedPKs: string[];
  serializer?: (value: any) => any;
  serializedName?: string;
  comment?: string;
  /** mysql only */
  extra?: string;
  userDefined?: boolean;
  optional?: boolean; // for ts-morph
  ignoreSchemaChanges?: ('type' | 'extra')[];
}

export class EntityMetadata<T = any> {

  readonly propertyOrder = new Map<string, number>();

  constructor(meta: Partial<EntityMetadata> = {}) {
    this.properties = {} as any;
    this.props = [];
    this.primaryKeys = [];
    this.filters = {};
    this.hooks = {};
    this.indexes = [];
    this.uniques = [];
    this.checks = [];
    this.concurrencyCheckKeys = new Set();
    Object.assign(this, meta);
  }

  addProperty(prop: EntityProperty<T>, sync = true) {
    if (prop.pivotTable && !prop.pivotEntity) {
      prop.pivotEntity = prop.pivotTable;
    }

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

  get tableName(): string {
    return this.collection;
  }

  set tableName(name: string) {
    this.collection = name;
  }

  set repository(repo: () => Constructor<EntityRepository<any>>) {
    this.customRepository = repo;
  }

  sync(initIndexes = false) {
    this.root ??= this;
    const props = Object.values<EntityProperty<T>>(this.properties).sort((a, b) => this.propertyOrder.get(a.name)! - this.propertyOrder.get(b.name)!);
    this.props = [...props.filter(p => p.primary), ...props.filter(p => !p.primary)];
    this.relations = this.props.filter(prop => prop.reference !== ReferenceType.SCALAR && prop.reference !== ReferenceType.EMBEDDED);
    this.bidirectionalRelations = this.relations.filter(prop => prop.mappedBy || prop.inversedBy);
    this.uniqueProps = this.props.filter(prop => prop.unique);
    this.comparableProps = this.props.filter(prop => EntityComparator.isComparable(prop, this.root));
    this.hydrateProps = this.props.filter(prop => {
      // `prop.userDefined` is either `undefined` or `false`
      const discriminator = this.root.discriminatorColumn === prop.name && prop.userDefined === false;
      // even if we don't have a setter, do not ignore value from database!
      const onlyGetter = prop.getter && !prop.setter && prop.persist === false;
      return !prop.inherited && prop.hydrate !== false && !discriminator && !prop.embedded && !onlyGetter;
    });
    this.selfReferencing = this.relations.some(prop => [this.className, this.root.className].includes(prop.type));
    this.hasUniqueProps = this.uniques.length + this.uniqueProps.length > 0;
    this.virtual = !!this.expression;

    if (this.virtual) {
      this.readonly = true;
    }

    if (initIndexes && this.name) {
      this.props.forEach(prop => this.initIndexes(prop));
    }

    this.definedProperties = this.props.reduce((o, prop) => {
      const isCollection = [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference);
      const isReference = [ReferenceType.ONE_TO_ONE, ReferenceType.MANY_TO_ONE].includes(prop.reference) && (prop.inversedBy || prop.mappedBy) && !prop.mapToPk;

      if (isReference) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const meta = this;
        o[prop.name] = {
          get() {
            return this.__helper.__data[prop.name];
          },
          set(val: AnyEntity) {
            const wrapped = this.__helper;
            const hydrator = wrapped.hydrator as IHydrator;
            const entity = Reference.unwrapReference(val ?? wrapped.__data[prop.name]);
            const old = Reference.unwrapReference(wrapped.__data[prop.name]);
            wrapped.__data[prop.name] = Reference.wrapReference(val, prop as EntityProperty);

            // when propagation from inside hydration, we set the FK to the entity data immediately
            if (val && hydrator.isRunning() && wrapped.__originalEntityData && prop.owner) {
              wrapped.__originalEntityData[prop.name as string] = val.__helper.getPrimaryKey(true);
            } else {
              wrapped.__touched = true;
            }

            EntityHelper.propagate(meta, entity, this, prop, Reference.unwrapReference(val), old);
          },
          enumerable: true,
          configurable: true,
        };
      }

      if (prop.inherited || prop.primary || isCollection || prop.persist === false || prop.trackChanges === false || isReference || prop.embedded) {
        return o;
      }

      o[prop.name] = {
        get() {
          return this.__helper.__data[prop.name];
        },
        set(val: unknown) {
          this.__helper.__data[prop.name] = val;
          this.__helper.__touched = true;
        },
        enumerable: true,
        configurable: true,
      };

      return o;
    }, { __gettersDefined: { value: true, enumerable: false } } as Dictionary);
  }

  private initIndexes(prop: EntityProperty<T>): void {
    const simpleIndex = this.indexes.find(index => index.properties === prop.name && !index.options && !index.type && !index.expression);
    const simpleUnique = this.uniques.find(index => index.properties === prop.name && !index.options);
    const owner = prop.reference === ReferenceType.MANY_TO_ONE;

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

    if (prop.index && owner && prop.fieldNames.length > 1) {
      this.indexes.push({ properties: prop.name });
      prop.index = false;
    }

    /* istanbul ignore next */
    if (owner && prop.fieldNames.length > 1 && prop.unique) {
      this.uniques.push({ properties: prop.name });
      prop.unique = false;
    }
  }

  /** @internal */
  clone() {
    return this;
  }

}

export interface SimpleColumnMeta {
  name: string;
  type: string;
}

export interface EntityMetadata<T = any> {
  name?: string; // abstract classes do not have a name, but once discovery ends, we have only non-abstract classes stored
  className: string;
  tableName: string;
  schema?: string;
  pivotTable?: boolean;
  virtual?: boolean;
  // we need to use `em: any` here otherwise an expression would not be assignable with more narrow type like `SqlEntityManager`
  // also return type is unknown as it can be either QB instance (which we cannot type here) or array of POJOs (e.g. for mongodb)
  expression?: string | ((em: any, where: FilterQuery<T>, options: FindOptions<T, any>) => object | string);
  discriminatorColumn?: string;
  discriminatorValue?: number | string;
  discriminatorMap?: Dictionary<string>;
  embeddable: boolean;
  constructorParams: string[];
  forceConstructor: boolean;
  toJsonParams: string[];
  extends: string;
  collection: string;
  path: string;
  primaryKeys: (keyof T & string)[];
  simplePK: boolean; // whether the PK can be compared via `===`, e.g. simple scalar without a custom mapped type
  compositePK: boolean;
  versionProperty: keyof T & string;
  concurrencyCheckKeys: Set<keyof T & string>;
  serializedPrimaryKey: keyof T & string;
  properties: { [K in keyof T & string]: EntityProperty<T> };
  props: EntityProperty<T>[];
  relations: EntityProperty<T>[];
  bidirectionalRelations: EntityProperty<T>[];
  comparableProps: EntityProperty<T>[]; // for EntityComparator
  hydrateProps: EntityProperty<T>[]; // for Hydrator
  uniqueProps: EntityProperty<T>[];
  indexes: { properties: (keyof T & string) | (keyof T & string)[]; name?: string; type?: string; options?: Dictionary; expression?: string }[];
  uniques: { properties: (keyof T & string) | (keyof T & string)[]; name?: string; options?: Dictionary }[];
  checks: CheckConstraint<T>[];
  customRepository: () => Constructor<EntityRepository<any>>;
  hooks: { [K in EventType]?: (keyof T | EventSubscriber<T>[EventType])[] };
  prototype: T;
  class: Constructor<T>;
  abstract: boolean;
  useCache: boolean;
  filters: Dictionary<FilterDef>;
  comment?: string;
  selfReferencing?: boolean;
  hasUniqueProps?: boolean;
  readonly?: boolean;
  polymorphs?: EntityMetadata[];
  root: EntityMetadata<T>;
  definedProperties: Dictionary;
}

export interface ISchemaGenerator {
  /** @deprecated use `dropSchema` and `createSchema` commands respectively */
  generate(): Promise<string>;
  createSchema(options?: { wrap?: boolean; schema?: string }): Promise<void>;
  ensureDatabase(): Promise<boolean>;
  getCreateSchemaSQL(options?: { wrap?: boolean; schema?: string }): Promise<string>;
  dropSchema(options?: { wrap?: boolean; dropMigrationsTable?: boolean; dropDb?: boolean; schema?: string }): Promise<void>;
  getDropSchemaSQL(options?: { wrap?: boolean; dropMigrationsTable?: boolean; schema?: string }): Promise<string>;
  updateSchema(options?: { wrap?: boolean; safe?: boolean; dropDb?: boolean; dropTables?: boolean; schema?: string }): Promise<void>;
  getUpdateSchemaSQL(options?: { wrap?: boolean; safe?: boolean; dropDb?: boolean; dropTables?: boolean; schema?: string }): Promise<string>;
  getUpdateSchemaMigrationSQL(options?: { wrap?: boolean; safe?: boolean; dropDb?: boolean; dropTables?: boolean }): Promise<{ up: string; down: string }>;
  createDatabase(name: string): Promise<void>;
  dropDatabase(name?: string): Promise<void>;
  execute(sql: string, options?: { wrap?: boolean }): Promise<void>;
  ensureIndexes(): Promise<void>;
  refreshDatabase(): Promise<void>;
  clearDatabase(options?: { schema?: string }): Promise<void>;
}

export interface GenerateOptions {
  baseDir?: string;
  save?: boolean;
  schema?: string;
  skipTables?: string[];
  skipColumns?: Record<string, string[]>;
}

export interface IEntityGenerator {
  generate(options?: GenerateOptions): Promise<string[]>;
}

type UmzugMigration = { name: string; path?: string };
type MigrateOptions = { from?: string | number; to?: string | number; migrations?: string[]; transaction?: Transaction };
type MigrationResult = { fileName: string; code: string; diff: MigrationDiff };
type MigrationRow = { name: string; executed_at: Date };

/**
 * @internal
 */
export interface IMigratorStorage {
  executed(): Promise<string[]>;
  logMigration(params: Dictionary): Promise<void>;
  unlogMigration(params: Dictionary): Promise<void>;
  getExecutedMigrations(): Promise<MigrationRow[]>;
  ensureTable?(): Promise<void>;
  setMasterMigration(trx: Transaction): void;
  unsetMasterMigration(): void;
  getMigrationName(name: string): string;
  getTableName?(): { schemaName?: string; tableName: string };
}

export interface IMigrator {
  /**
   * Checks current schema for changes, generates new migration if there are any.
   */
  createMigration(path?: string, blank?: boolean, initial?: boolean, name?: string): Promise<MigrationResult>;

  /**
   * Checks current schema for changes.
   */
  checkMigrationNeeded(): Promise<boolean>;

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

  /**
   * @internal
   */
  getStorage(): IMigratorStorage;
}

export interface MigrationDiff {
  up: string[];
  down: string[];
}

export interface IMigrationGenerator {
  /**
   * Generates the full contents of migration file. Uses `generateMigrationFile` to get the file contents.
   */
  generate(diff: MigrationDiff, path?: string, name?: string): Promise<[string, string]>;

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

export type FilterDef = {
  name: string;
  cond: Dictionary | ((args: Dictionary, type: 'read' | 'update' | 'delete', em: any, options?: FindOptions<any, any> | FindOneOptions<any, any>) => Dictionary | Promise<Dictionary>);
  default?: boolean;
  entity?: string[];
  args?: boolean;
};

export type Populate<T, P extends string = never> = AutoPath<T, P>[] | boolean;

export type PopulateOptions<T> = {
  field: string;
  strategy?: LoadStrategy;
  all?: boolean;
  children?: PopulateOptions<T[keyof T]>[];
};

type Loadable<T extends object> = Collection<T, any> | Reference<T> | readonly T[]; // we need to support raw arrays in embeddables too to allow population
type ExtractType<T> = T extends Loadable<infer U> ? U : T;

type StringKeys<T, E extends string = never> = T extends Collection<any, any>
  ? `${Exclude<keyof ExtractType<T> | E, symbol>}`
  : T extends Reference<any>
    ? `${Exclude<keyof ExtractType<T> | E, symbol>}`
    : T extends object
      ? `${Exclude<keyof ExtractType<T> | E, symbol>}`
      : never;
type GetStringKey<T, K extends StringKeys<T, string>, E extends string> = K extends keyof T ? ExtractType<T[K]> : (K extends E ? keyof T : never);

// limit depth of the recursion to 5 (inspired by https://www.angularfix.com/2022/01/why-am-i-getting-instantiation-is.html)
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export type AutoPath<O, P extends string, E extends string = never, D extends Prev[number] = 5> =
  [D] extends [never] ? string :
  P extends any ?
    (P & `${string}.` extends never ? P : P & `${string}.`) extends infer Q
      ? Q extends `${infer A}.${infer B}`
        ? A extends StringKeys<O, E>
          ? `${A}.${AutoPath<Defined<GetStringKey<O, A, E>>, B, E, Prev[D]>}`
          : never
        : Q extends StringKeys<O, E>
          ? (Defined<GetStringKey<O, Q, E>> extends unknown ? Exclude<P, `${string}.`> : never) | (StringKeys<Defined<GetStringKey<O, Q, E>>, E> extends never ? never : `${Q}.`)
          : StringKeys<O, E>
      : never
    : never;

export type ExpandProperty<T> = T extends Reference<infer U>
  ? NonNullable<U>
  : T extends Collection<infer U, any>
    ? NonNullable<U>
    : T extends (infer U)[]
      ? NonNullable<U>
      : NonNullable<T>;

type LoadedLoadable<T, E extends object> = T extends Collection<any, any>
  ? T & LoadedCollection<E>
  : (T extends Reference<any> ? T & LoadedReference<E> : T & E);

type Prefix<K> = K extends `${infer S}.${string}` ? S : K;
type IsPrefixed<K, L extends string> = K extends Prefix<L> ? K : never;
type Suffix<K> = K extends `${string}.${infer S}` ? S : never;
type Defined<T> = Exclude<T, null | undefined>;

// For each property on T check if it is included in prefix of keys to load L:
//   1. It yes, mark the collection or reference loaded and resolve its inner type recursively (passing suffix).
//   2. If no, just return it as-is (scalars will be included, loadables too but not loaded).
export type Loaded<T, L extends string = never> = T & {
  // this feels more correct, but breaks serialization methods on base entity, see #3865
  // [K in keyof T as IsPrefixed<K, L>]: LoadedLoadable<T[K], Loaded<ExtractType<T[K]>, Suffix<L>>>;
  [K in keyof T]: K extends Prefix<L>
    ? LoadedLoadable<T[K], Loaded<ExtractType<T[K]>, Suffix<L>>>
    : T[K]
};

export interface LoadedReference<T> extends Reference<Defined<T>> {
  $: Defined<T>;
  get(): Defined<T>;
}

export interface LoadedCollection<T extends object> extends Collection<T> {
  $: Collection<T>;
  get(): Collection<T>;
  getItems(check?: boolean): T[];
}

export type New<T, P extends string = string> = Loaded<T, P>;

export interface Highlighter {
  highlight(text: string): string;
}

export interface IMetadataStorage {
  getAll(): Dictionary<EntityMetadata>;
  get<T = any>(entity: string, init?: boolean, validate?: boolean): EntityMetadata<T>;
  find<T = any>(entity: string): EntityMetadata<T> | undefined;
  has(entity: string): boolean;
  set(entity: string, meta: EntityMetadata): EntityMetadata;
  reset(entity: string): void;
}

export interface IHydrator {

  /**
   * Hydrates the whole entity. This process handles custom type conversions, creating missing Collection instances,
   * mapping FKs to entity instances, as well as merging those entities.
   */
  hydrate<T extends object>(
    entity: T,
    meta: EntityMetadata<T>,
    data: EntityData<T>,
    factory: EntityFactory,
    type: 'full' | 'reference',
    newEntity?: boolean,
    convertCustomTypes?: boolean,
    schema?: string,
  ): void;

  /**
   * Hydrates primary keys only
   */
  hydrateReference<T extends object>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, convertCustomTypes?: boolean, schema?: string): void;

  isRunning(): boolean;

}

export interface HydratorConstructor {
  new (metadata: MetadataStorage, platform: Platform, config: Configuration): IHydrator;
}

export interface ISeedManager {
  seed(...classNames: Constructor<Seeder>[]): Promise<void>;
  /** @internal */
  seedString(...classNames: string[]): Promise<void>;
  createSeeder(className: string): Promise<string>;
}

export interface Seeder<T extends Dictionary = Dictionary> {
  run(em: EntityManager, context?: T): void | Promise<void>;
}

export type MaybePromise<T> = T | Promise<T>;

export type ConnectionType = 'read' | 'write';
