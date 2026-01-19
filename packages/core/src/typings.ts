import type { Transaction } from './connections/Connection.js';
import {
  type Cascade,
  type DeferMode,
  type EmbeddedPrefixMode,
  type EventType,
  type LoadStrategy,
  type PopulatePath,
  type QueryOrderMap,
  ReferenceKind,
} from './enums.js';
import { type AssignOptions } from './entity/EntityAssigner.js';
import { type EntityIdentifier } from './entity/EntityIdentifier.js';
import { type EntityLoaderOptions } from './entity/EntityLoader.js';
import { type Collection } from './entity/Collection.js';
import { type EntityFactory } from './entity/EntityFactory.js';
import { type EntityRepository } from './entity/EntityRepository.js';
import { Reference, type ScalarReference } from './entity/Reference.js';
import { EntityHelper } from './entity/EntityHelper.js';
import type { SerializationContext } from './serialization/SerializationContext.js';
import type { SerializeOptions } from './serialization/EntitySerializer.js';
import type { MetadataStorage } from './metadata/MetadataStorage.js';
import type { EntitySchema } from './metadata/EntitySchema.js';
import type { Type, types } from './types/index.js';
import type { Platform } from './platforms/Platform.js';
import type { Configuration } from './utils/Configuration.js';
import type { Raw } from './utils/RawQueryFragment.js';
import { Utils } from './utils/Utils.js';
import { EntityComparator } from './utils/EntityComparator.js';
import type { EntityManager } from './EntityManager.js';
import type { EventSubscriber } from './events/EventSubscriber.js';
import type { FilterOptions, FindOneOptions, FindOptions, LoadHint } from './drivers/IDatabaseDriver.js';
import { BaseEntity } from './entity/BaseEntity.js';

export type Constructor<T = unknown> = new (...args: any[]) => T;
export type Dictionary<T = any> = { [k: string]: T };
// `EntityKey<T, true>` will skip scalar properties (and some other scalar like types like Date or Buffer)
export type EntityKey<T = unknown, B extends boolean = false> = string & { [K in keyof T]-?: CleanKeys<T, K, B> extends never ? never : K; }[keyof T];
export type EntityValue<T> = T[EntityKey<T>];
export type EntityDataValue<T> = EntityData<T>[EntityKey<T>];
export type FilterKey<T> = keyof FilterQuery<T>;
export type AsyncFunction<R = any, T = Dictionary> = (args: T) => Promise<T>;
export type Compute<T> = { [K in keyof T]: T[K] } & {};
type InternalKeys = 'EntityRepositoryType' | 'PrimaryKeyProp' | 'OptionalProps' | 'EagerProps' | 'HiddenProps' | '__selectedType' | '__loadedType';
export type CleanKeys<T, K extends keyof T, B extends boolean = false> = (T[K] & {}) extends Function
  ? never
  : K extends symbol | InternalKeys
    ? never
    : B extends true
      ? (T[K] & {}) extends Scalar
        ? never
        : K
      : K;
export type FunctionKeys<T, K extends keyof T> = T[K] extends Function ? K : never;
export type Cast<T, R> = T extends R ? T : R;
export type IsUnknown<T> = T extends unknown ? unknown extends T ? true : never : never;
export type IsAny<T> = 0 extends (1 & T) ? true : false;
export type IsNever<T, True = true, False = false> = [T] extends [never] ? True : False;
export type MaybePromise<T> = T | Promise<T>;
export type NoInfer<T> = [T][T extends any ? 0 : never];

export type DeepPartial<T> = T & {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends Readonly<infer U>[]
      ? Readonly<DeepPartial<U>>[]
      : DeepPartial<T[P]>
};

export const EntityRepositoryType = Symbol('EntityRepositoryType');
export const PrimaryKeyProp = Symbol('PrimaryKeyProp');
export const OptionalProps = Symbol('OptionalProps');
export const EagerProps = Symbol('EagerProps');
export const HiddenProps = Symbol('HiddenProps');
export const Config = Symbol('Config');

export type Opt<T = unknown> = T & Opt.Brand;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export declare namespace Opt {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __optional: unique symbol;
  export interface Brand {
      [__optional]?: 1;
  }
}

export type RequiredNullable<T = never> = (T & RequiredNullable.Brand) | null;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export declare namespace RequiredNullable {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __requiredNullable: unique symbol;
  export interface Brand {
      [__requiredNullable]?: 1;
  }
}

export type Hidden<T = unknown> = T & Hidden.Brand;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export declare namespace Hidden {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __hidden: unique symbol;
  export interface Brand {
      [__hidden]?: 1;
  }
}

export type DefineConfig<T extends TypeConfig> = T & DefineConfig.Brand;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export declare namespace DefineConfig {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __config: unique symbol;
  export interface Brand {
      [__config]?: 1;
  }
}

export type CleanTypeConfig<T> = Compute<Pick<T, Extract<keyof T, keyof TypeConfig>>>;

export interface TypeConfig {
  forceObject?: boolean;
}

export type UnwrapPrimary<T> = T extends Scalar
  ? T
  : T extends Reference<infer U>
    ? Primary<U>
    : Primary<T>;

type PrimaryPropToType<T, Keys extends (keyof T)[]> = {
  [Index in keyof Keys]: UnwrapPrimary<T[Keys[Index]]>;
};

type ReadonlyPrimary<T> = T extends any[] ? Readonly<T> : T;

export type Primary<T> = IsAny<T> extends true
  ? any
  : T extends { [PrimaryKeyProp]?: infer PK }
    ? PK extends undefined
      ? Omit<T, typeof PrimaryKeyProp>
      : PK extends keyof T
        ? ReadonlyPrimary<UnwrapPrimary<T[PK]>>
        : PK extends (keyof T)[]
          ? ReadonlyPrimary<PrimaryPropToType<T, PK>>
          : PK
    : T extends { _id?: infer PK }
      ? ReadonlyPrimary<PK> | string
      : T extends { id?: infer PK }
        ? ReadonlyPrimary<PK>
        : T extends { uuid?: infer PK }
          ? ReadonlyPrimary<PK>
          : T;

/** @internal */
export type PrimaryProperty<T> = T extends { [PrimaryKeyProp]?: infer PK }
  ? (PK extends keyof T ? PK : (PK extends any[] ? PK[number] : never))
  : T extends { _id?: any }
    ? (T extends { id?: any } ? 'id' | '_id' : '_id')
    : T extends { id?: any }
      ? 'id'
      : T extends { uuid?: any }
        ? 'uuid'
        : never;

export type IPrimaryKeyValue = number | string | bigint | Date | { toHexString(): string };
export type IPrimaryKey<T extends IPrimaryKeyValue = IPrimaryKeyValue> = T;

export type Scalar = boolean | number | string | bigint | symbol | Date | RegExp | Uint8Array | { toHexString(): string };

// Primitive types that don't extend object - used for Hidden brand detection
type Primitive = boolean | number | string | bigint | symbol;

export type ExpandScalar<T> = null | (T extends string
  ? T | RegExp
  : T extends Date
    ? Date | string
    : T extends bigint
      ? bigint | string | number
      : T);

export type OperatorMap<T> = {
  $and?: ExpandQuery<T>[];
  $or?: ExpandQuery<T>[];
  $eq?: ExpandScalar<T> | readonly ExpandScalar<T>[];
  $ne?: ExpandScalar<T>;
  $in?: readonly ExpandScalar<T>[];
  $nin?: readonly ExpandScalar<T>[];
  $not?: ExpandQuery<T>;
  $none?: ExpandQuery<T>;
  $some?: ExpandQuery<T>;
  $every?: ExpandQuery<T>;
  $size?: number | { $eq?: number; $ne?: number; $gt?: number; $gte?: number; $lt?: number; $lte?: number };
  $gt?: ExpandScalar<T>;
  $gte?: ExpandScalar<T>;
  $lt?: ExpandScalar<T>;
  $lte?: ExpandScalar<T>;
  $like?: string;
  $re?: string;
  $ilike?: string;
  $fulltext?: string;
  $overlap?:  readonly string[] | string | object;
  $contains?: readonly string[] | string | object;
  $contained?: readonly string[] | string | object;
  $exists?: boolean;
  $hasKey?: string;
  $hasKeys?: readonly string[];
  $hasSomeKeys?: readonly string[];
};

export type FilterItemValue<T> = T | ExpandScalar<T> | Primary<T>;
export type FilterValue<T> = OperatorMap<FilterItemValue<T>> | FilterItemValue<T> | FilterItemValue<T>[] | null;
export type FilterObject<T> = { -readonly [K in EntityKey<T>]?: ExpandQuery<ExpandProperty<T[K]>> | FilterValue<ExpandProperty<T[K]>> | null };

export type ExpandQuery<T> = T extends object
  ? T extends Scalar
    ? never
    : FilterQuery<T>
  : FilterValue<T>;

export type EntityProps<T> = { -readonly [K in EntityKey<T>]?: T[K] };
export type ObjectQuery<T> = OperatorMap<T> & FilterObject<T>;
export type FilterQuery<T> =
  | ObjectQuery<T>
  | NonNullable<ExpandScalar<Primary<T>>>
  | NonNullable<EntityProps<T> & OperatorMap<T>>
  | FilterQuery<T>[];
export type QBFilterQuery<T = any> = ObjectQuery<T> | Dictionary;

export interface IWrappedEntity<Entity extends object> {
  isInitialized(): boolean;
  isManaged(): boolean;
  populated(populated?: boolean): void;
  populate<Hint extends string = never>(populate: readonly AutoPath<Entity, Hint, PopulatePath.ALL>[] | false, options?: EntityLoaderOptions<Entity>): Promise<Loaded<Entity, Hint>>;
  init<
    Hint extends string = never,
    Fields extends string = '*',
    Exclude extends string = never,
  >(options?: FindOneOptions<Entity, Hint, Fields, Exclude>): Promise<Loaded<Entity, Hint, Fields, Exclude> | null>;
  toReference(): Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>>;
  toObject(): EntityDTO<Entity>;
  toObject(ignoreFields: never[]): EntityDTO<Entity>;
  toObject<Ignored extends EntityKey<Entity>>(ignoreFields: Ignored[]): Omit<EntityDTO<Entity>, Ignored>;
  toJSON(...args: any[]): EntityDTO<Entity>;
  toPOJO(): EntityDTO<Entity>;
  serialize<
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Hint extends string = never,
    Exclude extends string = never,
  >(options?: SerializeOptions<Naked, Hint, Exclude>): EntityDTO<Loaded<Naked, Hint>>;
  setSerializationContext<
    Hint extends string = never,
    Fields extends string = '*',
    Exclude extends string = never,
  >(options: LoadHint<Entity, Hint, Fields, Exclude>): void;
  assign<
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Convert extends boolean = false,
    Data extends EntityData<Naked, Convert> | Partial<EntityDTO<Naked>> = EntityData<Naked, Convert> | Partial<EntityDTO<Naked>>,
  >(data: Data & IsSubset<EntityData<Naked, Convert>, Data>, options?: AssignOptions<Convert>): MergeSelected<Entity, Naked, keyof Data & string>;
  getSchema(): string | undefined;
  setSchema(schema?: string): void;
}

export interface IWrappedEntityInternal<Entity extends object> extends IWrappedEntity<Entity> {
  hasPrimaryKey(): boolean;
  getPrimaryKey(convertCustomTypes?: boolean): Primary<Entity> | null;
  getPrimaryKeys(convertCustomTypes?: boolean): Primary<Entity>[] | null;
  setPrimaryKey(val: Primary<Entity>): void;
  getSerializedPrimaryKey(): string & keyof Entity;
  __meta: EntityMetadata<Entity>;
  __data: Dictionary;
  __em?: EntityManager;
  __platform: Platform;
  __config: Configuration;
  __factory: EntityFactory; // internal factory instance that has its own global fork
  __hydrator: IHydrator;
  __initialized: boolean;
  __originalEntityData?: EntityData<Entity>;
  __loadedProperties: Set<string>;
  __identifier?: EntityIdentifier | EntityIdentifier[];
  __managed: boolean;
  __processing: boolean;
  __schema?: string;
  __populated: boolean;
  __onLoadFired: boolean;
  __reference?: Ref<Entity>;
  __pk?: Primary<Entity>;
  __primaryKeys: Primary<Entity>[];
  __serializationContext: {
    root?: SerializationContext<Entity>;
    populate?: PopulateOptions<Entity>[];
    fields?: Set<string>;
    exclude?: string[];
  };
}

export type AnyEntity<T = any> = Partial<T>;
export type EntityClass<T = any> = Function & { prototype: T };
export type EntityName<T = any> = EntityClass<T> | EntityCtor<T> | EntitySchema<T, any>;

// we need to restrict the type in the generic argument, otherwise inference don't work, so we use two types here
export type GetRepository<Entity extends { [k: PropertyKey]: any }, Fallback> = Entity[typeof EntityRepositoryType] extends EntityRepository<any> | undefined ? NonNullable<Entity[typeof EntityRepositoryType]> : Fallback;

export type EntityDataPropValue<T> = T | Primary<T>;
type ExpandEntityProp<T, C extends boolean = false> = T extends Record<string, any>
  ? { [K in keyof T as CleanKeys<T, K>]?: EntityDataProp<ExpandProperty<T[K]>, C> | EntityDataPropValue<ExpandProperty<T[K]>> | null } | EntityDataPropValue<ExpandProperty<T>>
  : T;
type ExpandRequiredEntityProp<T, I, C extends boolean> = T extends Record<string, any>
  ? ExpandRequiredEntityPropObject<T, I, C> | EntityDataPropValue<ExpandProperty<T>>
  : T;

type ExpandRequiredEntityPropObject<T, I = never, C extends boolean = false> = {
  [K in keyof T as RequiredKeys<T, K, I>]: RequiredEntityDataProp<ExpandProperty<T[K]>, T, C> | EntityDataPropValue<ExpandProperty<T[K]>>;
} & {
  [K in keyof T as OptionalKeys<T, K, I>]?: RequiredEntityDataProp<ExpandProperty<T[K]>, T, C> | EntityDataPropValue<ExpandProperty<T[K]>> | null | undefined;
};

type NonArrayObject = object & { [Symbol.iterator]?: never };

export type EntityDataProp<T, C extends boolean> = T extends Date
  ? string | Date
  : T extends Scalar
    ? T
    : T extends { __runtime?: infer Runtime; __raw?: infer Raw }
      ? (C extends true ? Raw : Runtime)
      : T extends Reference<infer U>
        ? EntityDataNested<U, C>
        : T extends ScalarReference<infer U>
          ? EntityDataProp<U, C>
          : T extends Collection<infer U, any>
            ? U | U[] | EntityDataNested<U, C> | EntityDataNested<U, C>[]
            : T extends readonly (infer U)[]
              ? U extends NonArrayObject
                ? U | U[] | EntityDataNested<U, C> | EntityDataNested<U, C>[]
                : U[] | EntityDataNested<U, C>[]
              : EntityDataNested<T, C>;

export type RequiredEntityDataProp<T, O, C extends boolean> = T extends Date
  ? string | Date
    : Exclude<T, null> extends RequiredNullable.Brand
    ? T | null
      : T extends Scalar
      ? T
      : T extends { __runtime?: infer Runtime; __raw?: infer Raw }
        ? (C extends true ? Raw : Runtime)
        : T extends Reference<infer U>
          ? RequiredEntityDataNested<U, O, C>
          : T extends ScalarReference<infer U>
            ? RequiredEntityDataProp<U, O, C>
            : T extends Collection<infer U, any>
              ? U | U[] | RequiredEntityDataNested<U, O, C> | RequiredEntityDataNested<U, O, C>[]
              : T extends readonly (infer U)[]
                ? U extends NonArrayObject
                  ? U | U[] | RequiredEntityDataNested<U, O, C> | RequiredEntityDataNested<U, O, C>[]
                  : U[] | RequiredEntityDataNested<U, O, C>[]
                : RequiredEntityDataNested<T, O, C>;

export type EntityDataNested<T, C extends boolean = false> = T extends undefined
  ? never
  : T extends any[]
    ? Readonly<T>
    : EntityData<T, C> | ExpandEntityProp<T, C>;
type EntityDataItem<T, C extends boolean> = C extends false
  ? T | EntityDataProp<T, C> | null
  : EntityDataProp<T, C> | null;

export type RequiredEntityDataNested<T, O, C extends boolean> = T extends any[]
  ? Readonly<T>
  : RequiredEntityData<T, O> | ExpandRequiredEntityProp<T, O, C>;

type ExplicitlyOptionalProps<T> = (T extends { [OptionalProps]?: infer K } ? K : never) | ({ [K in keyof T]: T[K] extends Opt ? K : never }[keyof T] & {});
type NullableKeys<T, V = null> = { [K in keyof T]: V extends T[K] ? K : never }[keyof T];
type RequiredNullableKeys<T> = { [K in keyof T]: Exclude<T[K], null> extends RequiredNullable.Brand ? K : never }[keyof T];
type ProbablyOptionalProps<T> = PrimaryProperty<T> | ExplicitlyOptionalProps<T> | Exclude<NonNullable<NullableKeys<T, null | undefined>>, RequiredNullableKeys<T>>;

type IsOptional<T, K extends keyof T, I> = T[K] extends Collection<any, any>
  ? true
  : ExtractType<T[K]> extends I
    ? true
    : K extends ProbablyOptionalProps<T>
      ? true
      : false;
type RequiredKeys<T, K extends keyof T, I> = IsOptional<T, K, I> extends false ? CleanKeys<T, K> : never;
type OptionalKeys<T, K extends keyof T, I> = IsOptional<T, K, I> extends false ? never : CleanKeys<T, K>;
export type EntityData<T, C extends boolean = false> = { [K in EntityKey<T>]?: EntityDataItem<T[K] & {}, C> };
export type RequiredEntityData<T, I = never, C extends boolean = false> = {
  [K in keyof T as RequiredKeys<T, K, I>]: T[K] | RequiredEntityDataProp<T[K], T, C> | Primary<T[K]>
} & {
  [K in keyof T as OptionalKeys<T, K, I>]?: T[K] | RequiredEntityDataProp<T[K], T, C> | Primary<T[K]> | null
};
export type EntityDictionary<T> = EntityData<T> & Record<any, any>;

type ExtractEagerProps<T> = T extends { [EagerProps]?: infer PK } ? PK : never;

type Relation<T> = {
  [P in keyof T as T[P] extends unknown[] | Record<string | number | symbol, unknown> ? P : never]?: T[P]
};

/** Identity type that can be used to get around issues with cycles in bidirectional relations. It will disable reflect-metadata inference. */
export type Rel<T> = T;

/** Alias for `ScalarReference` (see {@apilink Ref}). */
export type ScalarRef<T> = ScalarReference<T>;

/** Alias for `Reference<T> & { id: number }` (see {@apilink Ref}). */
export type EntityRef<T extends object> = true extends IsUnknown<PrimaryProperty<T>>
  ? Reference<T>
  : IsAny<T> extends true
    ? Reference<T>
    : ({ [K in PrimaryProperty<T> & keyof T]: T[K] } & Reference<T>);

/**
 * Ref type represents a `Reference` instance, and adds the primary keys to its prototype automatically, so you can do
 * `ref.id` instead of `ref.unwrap().id`. It resolves to either `ScalarRef` or `EntityRef`, based on the type argument.
 */
export type Ref<T> = T extends any // we need this to get around `Ref<boolean>` expansion to `Ref<true> | Ref<false>`
  ? IsAny<T> extends true
    ? Reference<T & object>
    : T extends Scalar
      ? ScalarReference<T>
      : EntityRef<T & object>
  : never;

type ExtractHiddenProps<T> = (T extends { [HiddenProps]?: infer K } ? K : never) | ({ [K in keyof T]: T[K] extends Primitive ? (T[K] extends Hidden ? K : never) : never }[keyof T] & {});
type ExcludeHidden<T, K extends keyof T> = K extends ExtractHiddenProps<T> ? never : K;
type ExtractConfig<T> = T extends { [Config]?: infer K } ? (K & TypeConfig) : TypeConfig;
type PreferExplicitConfig<E, I> = IsNever<E, I, E>;
type PrimaryOrObject<T, U, C extends TypeConfig> =
  PreferExplicitConfig<C, ExtractConfig<T>>['forceObject'] extends true
    ? { [K in PrimaryProperty<U> & keyof U]: U[K] }
    : Primary<U>;

export type EntityDTOProp<E, T, C extends TypeConfig = never> = T extends Scalar
  ? T
  : T extends { __serialized?: infer U }
    ? (IsUnknown<U> extends false ? U : T)
    : T extends LoadedReference<infer U>
      ? EntityDTO<U, C>
      : T extends Reference<infer U>
        ? PrimaryOrObject<E, U, C>
        : T extends ScalarReference<infer U>
          ? U
          : T extends LoadedCollection<infer U>
            ? EntityDTO<U, C>[]
            : T extends Collection<infer U>
              ? PrimaryOrObject<E, U, C>[]
              : T extends readonly (infer U)[]
                ? (T extends readonly any[] ? T : U[])
                : T extends Relation<T>
                  ? EntityDTO<T, C>
                  : T;

// ideally this should also mark not populated collections as optional, but that would be breaking
type DTOProbablyOptionalProps<T> = NonNullable<NullableKeys<T, undefined>>;
type DTOIsOptional<T, K extends keyof T> = T[K] extends LoadedCollection<any>
  ? false
  : K extends PrimaryProperty<T>
    ? false
    : K extends DTOProbablyOptionalProps<T>
      ? true
      : false;
type DTORequiredKeys<T, K extends keyof T> = DTOIsOptional<T, K> extends false ? ExcludeHidden<T, K> & CleanKeys<T, K> : never;
type DTOOptionalKeys<T, K extends keyof T> = DTOIsOptional<T, K> extends false ? never : ExcludeHidden<T, K> & CleanKeys<T, K>;

export type EntityDTO<T, C extends TypeConfig = never> = {
  [K in keyof T as DTORequiredKeys<T, K>]: EntityDTOProp<T, T[K], C> | AddOptional<T[K]>
} & {
  [K in keyof T as DTOOptionalKeys<T, K>]?: EntityDTOProp<T, T[K], C> | AddOptional<T[K]>
};

type TargetKeys<T> = T extends EntityClass<infer P> ? keyof P : keyof T;
type PropertyName<T> = IsUnknown<T> extends false ? TargetKeys<T> : string;
type TableName = { name: string; schema?: string; toString: () => string };
export type FormulaTable = { alias: string; name: string; schema?: string; qualifiedName: string; toString: () => string };

export type IndexCallback<T> = (table: TableName, columns: Record<PropertyName<T>, string>, indexName: string) => string | Raw;
export type FormulaCallback<T> = (table: FormulaTable, columns: Record<PropertyName<T>, string>) => string;

export type CheckCallback<T> = (columns: Record<PropertyName<T>, string>) => string;
export type GeneratedColumnCallback<T> = (columns: Record<keyof T, string>) => string;

export interface CheckConstraint<T = any> {
  name?: string;
  property?: string;
  expression: string | CheckCallback<T>;
}

export type AnyString = string & {};

export interface EntityProperty<Owner = any, Target = any> {
  name: EntityKey<Owner>;
  entity: () => EntityName<Owner>;
  target: EntityClass<Target>;
  type: keyof typeof types | AnyString;
  runtimeType: 'number' | 'string' | 'boolean' | 'bigint' | 'Buffer' | 'Date' | 'object' | 'any' | AnyString;
  targetMeta?: EntityMetadata<Target>;
  columnTypes: string[];
  generated?: string | GeneratedColumnCallback<Owner>;
  customType?: Type<any>;
  customTypes: (Type<any> | undefined)[];
  hasConvertToJSValueSQL: boolean;
  hasConvertToDatabaseValueSQL: boolean;
  autoincrement?: boolean;
  returning?: boolean;
  primary?: boolean;
  serializedPrimaryKey: boolean;
  groups?: string[];
  lazy?: boolean;
  array?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  kind: ReferenceKind;
  ref?: boolean;
  fieldNames: string[];
  fieldNameRaw?: string;
  default?: string | number | boolean | null;
  defaultRaw?: string;
  formula?: FormulaCallback<Owner>;
  filters?: FilterOptions;
  prefix?: string | boolean;
  prefixMode?: EmbeddedPrefixMode;
  embedded?: [EntityKey<Owner>, EntityKey<Owner>];
  embeddedPath?: string[];
  embeddable: EntityClass<Owner>;
  embeddedProps: Dictionary<EntityProperty>;
  discriminatorColumn?: string; // only for poly embeddables currently
  object?: boolean;
  index?: boolean | string;
  unique?: boolean | string;
  nullable?: boolean;
  inherited?: boolean;
  renamedFrom?: string; // Original property name for STI conflict resolution
  stiFieldNames?: string[]; // All field names for STI with conflicting columns (flattened)
  stiFieldNameMap?: Dictionary<string>; // Maps discriminator value to field name
  unsigned?: boolean;
  mapToPk?: boolean;
  persist?: boolean;
  hydrate?: boolean;
  hidden?: boolean;
  enum?: boolean;
  items?: (number | string)[];
  nativeEnumName?: string; // for postgres, by default it uses text column with check constraint
  version?: boolean;
  concurrencyCheck?: boolean;
  eager?: boolean;
  setter?: boolean;
  getter?: boolean;
  getterName?: keyof Owner;
  accessor?: EntityKey<Owner>;
  cascade: Cascade[];
  orphanRemoval?: boolean;
  onCreate?: (entity: Owner, em: EntityManager) => any;
  onUpdate?: (entity: Owner, em: EntityManager) => any;
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
  strategy?: LoadStrategy;
  owner: boolean;
  inversedBy: EntityKey<Target>;
  mappedBy: EntityKey<Target>;
  where?: FilterQuery<Target>; // only for 1:M and M:N
  orderBy?: QueryOrderMap<Owner> | QueryOrderMap<Owner>[];
  customOrder?: string[] | number[] | boolean[];
  fixedOrder?: boolean;
  fixedOrderColumn?: string;
  pivotTable: string;
  pivotEntity: EntityClass<Target>;
  joinColumns: string[];
  ownColumns: string[];
  inverseJoinColumns: string[];
  referencedColumnNames: string[];
  referencedTableName: string;
  referencedPKs: EntityKey<Owner>[];
  targetKey?: string;
  serializer?: (value: any, options?: SerializeOptions<any>) => any;
  serializedName?: string;
  comment?: string;
  /** mysql only */
  extra?: string;
  userDefined?: boolean;
  optional?: boolean; // for ts-morph
  ignoreSchemaChanges?: ('type' | 'extra' | 'default')[];
  deferMode?: DeferMode;
  createForeignKeyConstraint: boolean; // To enable/disable foreign-key constraint creation, per relation
  foreignKeyName?: string;
}

export class EntityMetadata<Entity = any, Class extends EntityCtor<Entity> = EntityCtor<Entity>> {

  private static counter = 0;
  readonly _id = 1000 * EntityMetadata.counter++; // keep the id >= 1000 to allow computing cache keys by simple addition
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
    this.referencingProperties = [];
    this.concurrencyCheckKeys = new Set();
    Object.assign(this, meta);
    const name = meta.className ?? meta.name;

    if (!this.class && name) {
      const Class = this.extends === BaseEntity
        ? ({ [name]: class extends BaseEntity {} })[name]
        : ({ [name]: class {} })[name];
      this.class = Class as any;
    }
  }

  addProperty(prop: Partial<EntityProperty<Entity>>) {
    this.properties[prop.name!] = prop as EntityProperty<Entity>;
    this.propertyOrder.set(prop.name!, this.props.length);
    this.sync();
  }

  removeProperty(name: string, sync = true) {
    delete this.properties[name as EntityKey<Entity>];
    this.propertyOrder.delete(name);

    if (sync) {
      this.sync();
    }
  }

  getPrimaryProps(flatten = false): EntityProperty<Entity>[] {
    const pks = this.primaryKeys.map(pk => this.properties[pk]);

    if (flatten) {
      return pks.flatMap(pk => {
        if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(pk.kind)) {
          return pk.targetMeta!.getPrimaryProps(true);
        }

        return [pk];
      });
    }

    return pks;
  }

  getPrimaryProp(): EntityProperty<Entity> {
    return this.properties[this.primaryKeys[0]];
  }

  createColumnMappingObject(): Record<PropertyName<Entity>, string> {
    return Object.values<EntityProperty>(this.properties).reduce((o, prop) => {
      if (prop.fieldNames) {
        o[prop.name as PropertyName<Entity>] = prop.fieldNames[0];
      }

      return o;
    }, {} as Record<PropertyName<Entity>, string>);
  }

  get tableName(): string {
    return this.collection;
  }

  set tableName(name: string) {
    this.collection = name;
  }

  get uniqueName(): string {
    return this.tableName + '_' + this._id;
  }

  sync(initIndexes = false, config?: Configuration) {
    this.root ??= this;
    const props = Object.values<EntityProperty<Entity>>(this.properties).sort((a, b) => this.propertyOrder.get(a.name)! - this.propertyOrder.get(b.name)!);
    this.props = [...props.filter(p => p.primary), ...props.filter(p => !p.primary)];
    this.relations = this.props.filter(prop => typeof prop.kind !== 'undefined' && prop.kind !== ReferenceKind.SCALAR && prop.kind !== ReferenceKind.EMBEDDED);
    this.bidirectionalRelations = this.relations.filter(prop => prop.mappedBy || prop.inversedBy);
    this.uniqueProps = this.props.filter(prop => prop.unique);
    this.getterProps = this.props.filter(prop => prop.getter);
    this.comparableProps = this.props.filter(prop => EntityComparator.isComparable(prop, this));
    this.validateProps = this.props.filter(prop => {
      if (prop.inherited || (prop.persist === false && prop.userDefined !== false)) {
        return false;
      }

      return prop.kind === ReferenceKind.SCALAR && ['string', 'number', 'boolean', 'Date'].includes(prop.type);
    });
    this.hydrateProps = this.props.filter(prop => {
      // `prop.userDefined` is either `undefined` or `false`
      const discriminator = this.root.discriminatorColumn === prop.name && prop.userDefined === false;
      // even if we don't have a setter, do not ignore value from database!
      const onlyGetter = prop.getter && !prop.setter && prop.persist === false;
      return !prop.inherited && prop.hydrate !== false && !discriminator && !prop.embedded && !onlyGetter;
    });
    this.trackingProps = this.hydrateProps.filter(prop => {
      return !prop.getter && !prop.setter && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind);
    });
    this.selfReferencing = this.relations.some(prop => {
      return this.root.uniqueName === prop.targetMeta?.root.uniqueName;
    });
    this.hasUniqueProps = this.uniques.length + this.uniqueProps.length > 0;
    this.virtual = !!this.expression;

    if (config) {
      for (const prop of this.props) {
        if (prop.enum && !prop.nativeEnumName && prop.items?.every(item => typeof item === 'string')) {
          const name = config.getNamingStrategy().indexName(this.tableName, prop.fieldNames, 'check');
          const exists = this.checks.findIndex(check => check.name === name);

          if (exists !== -1) {
            this.checks.splice(exists, 1);
          }

          this.checks.push({
            name,
            property: prop.name,
            expression: `${config.getPlatform().quoteIdentifier(prop.fieldNames[0])} in ('${prop.items.join("', '")}')`,
          });
        }
      }
    }

    this.checks = Utils.removeDuplicates(this.checks);
    this.indexes = Utils.removeDuplicates(this.indexes);
    this.uniques = Utils.removeDuplicates(this.uniques);

    for (const hook of Utils.keys(this.hooks)) {
      this.hooks[hook] = Utils.removeDuplicates(this.hooks[hook] as any);
    }

    if (this.virtual) {
      this.readonly = true;
    }

    if (initIndexes && this.name) {
      this.props.forEach(prop => this.initIndexes(prop));
    }

    this.definedProperties = this.trackingProps.reduce((o, prop) => {
      const isReference = (prop.inversedBy || prop.mappedBy) && !prop.mapToPk;

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

            if (old && old !== entity && prop.kind === ReferenceKind.MANY_TO_ONE && prop.inversedBy && old[prop.inversedBy]) {
              old[prop.inversedBy].removeWithoutPropagation(this);
            }

            wrapped.__data[prop.name] = Reference.wrapReference(val, prop as EntityProperty);

            // when propagation from inside hydration, we set the FK to the entity data immediately
            if (val && hydrator.isRunning() && wrapped.__originalEntityData && prop.owner) {
              wrapped.__originalEntityData[prop.name] = Utils.getPrimaryKeyValues(val, prop.targetMeta!, true);
            }

            EntityHelper.propagate(meta, entity, this, prop, Reference.unwrapReference(val), old);
          },
          enumerable: true,
          configurable: true,
        };
      }

      return o;
    }, { __gettersDefined: { value: true, enumerable: false } } as Dictionary);
  }

  private initIndexes(prop: EntityProperty<Entity>): void {
    const simpleIndex = this.indexes.find(index => index.properties === prop.name && !index.options && !index.type && !index.expression);
    const simpleUnique = this.uniques.find(index => index.properties === prop.name && !index.options);
    const owner = prop.kind === ReferenceKind.MANY_TO_ONE;

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

    /* v8 ignore next */
    if (owner && prop.fieldNames.length > 1 && prop.unique) {
      this.uniques.push({ properties: prop.name });
      prop.unique = false;
    }
  }

  /** @internal */
  clone() {
    return this;
  }

  /** @ignore */
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return `[${this.constructor.name}<${this.className}>]`;
  }

}

export interface SimpleColumnMeta {
  name: string;
  type: string;
}

export type EntityCtor<T = any> = abstract new (...args: any[]) => T;

export interface EntityMetadata<Entity = any, Class extends EntityCtor<Entity> = EntityCtor<Entity>> {
  name?: string; // abstract classes do not have a name, but once discovery ends, we have only non-abstract classes stored
  className: string;
  tableName: string;
  schema?: string;
  pivotTable?: boolean;
  virtual?: boolean;
  // we need to use `em: any` here otherwise an expression would not be assignable with more narrow type like `SqlEntityManager`
  // also return type is unknown as it can be either QB instance (which we cannot type here) or array of POJOs (e.g. for mongodb)
  expression?: string | ((em: any, where: ObjectQuery<Entity>, options: FindOptions<Entity, any, any, any>, stream?: boolean) => MaybePromise<Raw | object | string>);
  discriminatorColumn?: EntityKey<Entity> | AnyString;
  discriminatorValue?: number | string;
  discriminatorMap?: Dictionary<EntityClass>;
  embeddable: boolean;
  constructorParams?: (keyof Entity)[];
  forceConstructor: boolean;
  extends?: EntityName<Entity>;
  collection: string;
  path: string;
  primaryKeys: EntityKey<Entity>[];
  simplePK: boolean; // whether the PK can be compared via `===`, e.g. simple scalar without a custom mapped type
  compositePK: boolean;
  versionProperty: EntityKey<Entity>;
  concurrencyCheckKeys: Set<EntityKey<Entity>>;
  serializedPrimaryKey?: EntityKey<Entity>;
  properties: { [K in EntityKey<Entity>]: EntityProperty<Entity> };
  props: EntityProperty<Entity>[];
  relations: EntityProperty<Entity>[];
  bidirectionalRelations: EntityProperty<Entity>[];
  referencingProperties: { meta: EntityMetadata<Entity>; prop: EntityProperty<Entity> }[];
  comparableProps: EntityProperty<Entity>[]; // for EntityComparator
  trackingProps: EntityProperty<Entity>[]; // for change-tracking and propagation
  hydrateProps: EntityProperty<Entity>[]; // for Hydrator
  validateProps: EntityProperty<Entity>[]; // for entity validation
  uniqueProps: EntityProperty<Entity>[];
  getterProps: EntityProperty<Entity>[];
  indexes: { properties?: EntityKey<Entity> | EntityKey<Entity>[]; name?: string; type?: string; options?: Dictionary; expression?: string | IndexCallback<Entity> }[];
  uniques: { properties?: EntityKey<Entity> | EntityKey<Entity>[]; name?: string; options?: Dictionary; expression?: string | IndexCallback<Entity>; deferMode?: DeferMode | `${DeferMode}` }[];
  checks: CheckConstraint<Entity>[];
  repositoryClass?: string; // for EntityGenerator
  repository: () => EntityClass<EntityRepository<any>>;
  hooks: { [K in EventType]?: (keyof Entity | EventSubscriber<Entity>[EventType])[] };
  prototype: Entity;
  class: Class;
  abstract: boolean;
  filters: Dictionary<FilterDef>;
  comment?: string;
  selfReferencing?: boolean;
  hasUniqueProps?: boolean;
  readonly?: boolean;
  polymorphs?: EntityMetadata[];
  root: EntityMetadata<Entity>;
  definedProperties: Dictionary;
  // used to make ORM aware of externally defined triggers, can change resulting SQL in some condition like when inserting in mssql
  hasTriggers?: boolean;
  /** @internal can be used for computed numeric cache keys */
  readonly _id: number;
}

export interface CreateSchemaOptions {
  wrap?: boolean;
  schema?: string;
}

export interface ClearDatabaseOptions {
  schema?: string;
  truncate?: boolean;
  clearIdentityMap?: boolean;
}

export interface EnsureDatabaseOptions extends CreateSchemaOptions, ClearDatabaseOptions {
  clear?: boolean;
  create?: boolean;
  forceCheck?: boolean;
}

export interface DropSchemaOptions {
  wrap?: boolean;
  dropMigrationsTable?: boolean;
  dropForeignKeys?: boolean;
  dropDb?: boolean;
  schema?: string;
}

export interface UpdateSchemaOptions<DatabaseSchema = unknown> {
  wrap?: boolean;
  safe?: boolean;
  dropDb?: boolean;
  dropTables?: boolean;
  schema?: string;
  fromSchema?: DatabaseSchema;
}

export interface RefreshDatabaseOptions extends CreateSchemaOptions {
  ensureIndexes?: boolean;
  dropDb?: boolean;
  createSchema?: boolean;
}

export interface ISchemaGenerator {
  create(options?: CreateSchemaOptions): Promise<void>;
  update(options?: UpdateSchemaOptions): Promise<void>;
  drop(options?: DropSchemaOptions): Promise<void>;
  refresh(options?: RefreshDatabaseOptions): Promise<void>;
  clear(options?: ClearDatabaseOptions): Promise<void>;
  execute(sql: string, options?: { wrap?: boolean }): Promise<void>;
  getCreateSchemaSQL(options?: CreateSchemaOptions): Promise<string>;
  getDropSchemaSQL(options?: Omit<DropSchemaOptions, 'dropDb'>): Promise<string>;
  getUpdateSchemaSQL(options?: UpdateSchemaOptions): Promise<string>;
  getUpdateSchemaMigrationSQL(options?: UpdateSchemaOptions): Promise<{ up: string; down: string }>;
  ensureDatabase(options?: EnsureDatabaseOptions): Promise<boolean>;
  createDatabase(name?: string): Promise<void>;
  dropDatabase(name?: string): Promise<void>;
  ensureIndexes(): Promise<void>;
}

export type ImportsResolver = (alias: string, basePath: string, extension: '.js' | '', originFileName: string) => { path: string; name: string } | undefined;

export interface GenerateOptions {
  path?: string;
  save?: boolean;
  schema?: string;
  takeTables?: (RegExp | string)[];
  skipTables?: (RegExp | string)[];
  skipColumns?: Dictionary<(RegExp | string)[]>;
  forceUndefined?: boolean;
  undefinedDefaults?: boolean;
  bidirectionalRelations?: boolean;
  identifiedReferences?: boolean;
  entityDefinition?: 'decorators' | 'defineEntity' | 'entitySchema';
  decorators?: 'es' | 'legacy';
  inferEntityType?: boolean;
  enumMode?: 'ts-enum' | 'union-type' | 'dictionary';
  esmImport?: boolean;
  scalarTypeInDecorator?: boolean;
  scalarPropertiesForRelations?: 'always' | 'never' | 'smart';
  fileName?: (className: string) => string;
  onImport?: ImportsResolver;
  extraImports?: (basePath: string, originFileName: string) => string[] | undefined;
  onlyPurePivotTables?: boolean;
  outputPurePivotTables?: boolean;
  readOnlyPivotTables?: boolean;
  customBaseEntityName?: string;
  useCoreBaseEntity?: boolean;
  coreImportsPrefix?: string;
  onInitialMetadata?: MetadataProcessor;
  onProcessedMetadata?: MetadataProcessor;
}

export interface IEntityGenerator {
  generate(options?: GenerateOptions): Promise<string[]>;
}

export type UmzugMigration = { name: string; path?: string };
export type MigrateOptions = { from?: string | number; to?: string | number; migrations?: string[]; transaction?: Transaction };
export type MigrationResult = { fileName: string; code: string; diff: MigrationDiff };
export type MigrationRow = { id: number; name: string; executed_at: Date };

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
  create(path?: string, blank?: boolean, initial?: boolean, name?: string): Promise<MigrationResult>;

  /**
   * Checks current schema for changes.
   */
  checkSchema(): Promise<boolean>;

  /**
   * Creates initial migration. This generates the schema based on metadata, and checks whether all the tables
   * are already present. If yes, it will also automatically log the migration as executed.
   * Initial migration can be created only if the schema is already aligned with the metadata, or when no schema
   * is present - in such case regular migration would have the same effect.
   */
  createInitial(path?: string): Promise<MigrationResult>;

  /**
   * Returns list of already executed migrations.
   */
  getExecuted(): Promise<MigrationRow[]>;

  /**
   * Returns list of pending (not yet executed) migrations found in the migration directory.
   */
  getPending(): Promise<UmzugMigration[]>;

  /**
   * Executes specified migrations. Without parameter it will migrate up to the latest version.
   */
  up(options?: string | string[] | MigrateOptions): Promise<UmzugMigration[]>;

  /**
   * Executes down migrations to the given point. Without parameter it will migrate one version down.
   */
  down(options?: string | string[] | MigrateOptions): Promise<UmzugMigration[]>;

  /**
   * Registers event handler.
   */
  on(event: MigratorEvent, listener: (event: UmzugMigration) => MaybePromise<void>): IMigrator;

  /**
   * Removes event handler.
   */
  off(event: MigratorEvent, listener: (event: UmzugMigration) => MaybePromise<void>): IMigrator;

  /**
   * @internal
   */
  getStorage(): IMigratorStorage;
}

export type MigratorEvent = 'migrating' | 'migrated' | 'reverting' | 'reverted';

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
  generateMigrationFile(className: string, diff: MigrationDiff): MaybePromise<string>;
}

export interface Migration {
  up(): Promise<void> | void;
  down(): Promise<void> | void;
}

export interface MigrationObject {
  name: string;
  class: Constructor<Migration>;
}

type EntityFromInput<T> = T extends readonly EntityName<infer U>[]
  ? U
  : T extends EntityName<infer U>
    ? U
    : never;

type FilterDefResolved<T extends object = any> = {
  name: string;
  cond: FilterQuery<T> | ((args: Dictionary, type: 'read' | 'update' | 'delete', em: any, options?: FindOptions<T, any, any, any> | FindOneOptions<T, any, any, any>, entityName?: string) => MaybePromise<FilterQuery<T>>);
  default?: boolean;
  entity?: EntityName<T> | EntityName<T>[];
  args?: boolean;
  strict?: boolean;
};

export type FilterDef<T extends EntityName | readonly EntityName[] = any> = FilterDefResolved<EntityFromInput<T>> & {
  entity?: T;
};

export type Populate<T, P extends string = never> = readonly AutoPath<T, P, `${PopulatePath}`>[] | false;

export type PopulateOptions<T> = {
  field: EntityKey<T>;
  strategy?: LoadStrategy;
  all?: boolean;
  filter?: boolean;
  joinType?: 'inner join' | 'left join';
  children?: PopulateOptions<T[keyof T]>[];
};

type Loadable<T extends object> = Collection<T, any> | Reference<T> | Ref<T> | readonly T[]; // we need to support raw arrays in embeddables too to allow population
type ExtractType<T> = T extends Loadable<infer U> ? U : T;

type ExtractStringKeys<T> = { [K in keyof T]-?: CleanKeys<T, K> }[keyof T] & {};
type StringKeys<T, E extends string = never> = T extends Collection<any, any>
  ? ExtractStringKeys<ExtractType<T>> | E
  : T extends Reference<any>
    ? ExtractStringKeys<ExtractType<T>> | E
    : T extends object
      ? ExtractStringKeys<ExtractType<T>> | E
      : never;
type GetStringKey<T, K extends StringKeys<T, string>, E extends string> = K extends keyof T ? ExtractType<T[K]> : (K extends E ? keyof T : never);

// limit depth of the recursion to 5 (inspired by https://www.angularfix.com/2022/01/why-am-i-getting-instantiation-is.html)
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// for pivot joining via populate hint, e.g. `tags:ref`
type CollectionKeys<T> = T extends object
  ? {
    [K in keyof T]-?: T[K] extends Collection<any>
      ? IsAny<T[K]> extends true
        ? never
        : K & string
      : never
  }[keyof T] & {}
  : never;

export type AutoPath<O, P extends string | boolean, E extends string = never, D extends Prev[number] = 9> =
  P extends boolean
    ? P
    : [D] extends [never]
      ? never
      : P extends any
        ? P extends string
          ? (P & `${string}.` extends never ? P : P & `${string}.`) extends infer Q
            ? Q extends `${infer A}.${infer B}`
              ? A extends StringKeys<O, E>
                ? `${A}.${AutoPath<NonNullable<GetStringKey<O, A, E>>, B, E, Prev[D]>}`
                : never
              : Q extends StringKeys<O, E>
                ? (NonNullable<GetStringKey<O, Q, E>> extends unknown ? Exclude<P, `${string}.`> : never) | (StringKeys<NonNullable<GetStringKey<O, Q, E>>, E> extends never ? never : `${Q & string}.`)
                : StringKeys<O, E> | `${CollectionKeys<O>}:ref`
              : never
            : never
          : never;

export type UnboxArray<T> = T extends any[] ? ArrayElement<T> : T;
export type ArrayElement<ArrayType extends unknown[]> = ArrayType extends (infer ElementType)[] ? ElementType : never;

export type ExpandProperty<T> = T extends Reference<infer U>
  ? NonNullable<U>
  : T extends Collection<infer U, any>
    ? NonNullable<U>
    : T extends (infer U)[]
      ? NonNullable<U>
      : NonNullable<T>;

type LoadedLoadable<T, E extends object> =
  T extends Collection<any, any>
  ? LoadedCollection<E>
  : T extends Reference<any>
    ? T & LoadedReference<E> // intersect with T (which is `Ref`) to include the PK props
    : T extends ScalarReference<infer U>
      ? LoadedScalarReference<U>
      : T extends Scalar | any[]
          ? T
          : E;

type IsTrue<T> = IsNever<T> extends true
  ? false
  : T extends boolean
    ? T extends true
      ? true
      : false
    : false;
type StringLiteral<T> = T extends string ? string extends T ? never : T : never;
type Prefix<T, K> = K extends `${infer S}.${string}` ? S : (K extends '*' ? keyof T : K);
type IsPrefixedExclude<T, K extends keyof T, E extends string> =
  K extends E
    ? never
    : K;
export type IsPrefixed<T, K extends keyof T, L extends string, E extends string = never> =
  IsNever<E> extends false
    ? IsPrefixedExclude<T, K, E>
    : K extends symbol
      ? never
      : IsTrue<L> extends true
        ? (T[K] & {} extends Loadable<any> ? K : never)
        : IsNever<StringLiteral<L>> extends true
          ? never
          : K extends Prefix<T, L>
            ? K
            : K extends PrimaryProperty<T>
              ? K
              : never;

// filter by prefix and map to suffix
type Suffix<Key, Hint extends string, All = true | '*'> = Hint extends `${infer Pref}.${infer Suf}`
  ? (Pref extends Key ? Suf : never)
  : Hint extends All
    ? Hint
    : never;

export type IsSubset<T, U> = keyof U extends keyof T
  ? {}
  : Dictionary extends U
    ? {}
    : { [K in keyof U as K extends keyof T ? never : CleanKeys<U, K>]: never; };

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __selectedType: unique symbol;

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __loadedType: unique symbol;

type AnyStringToNever<T> = string extends T ? never : T;

export type MergeSelected<T, U, F extends string> =
  T extends Loaded<infer TT, infer P, infer FF, infer E>
    ? IsNever<Exclude<E, F>> extends true
      ? Loaded<TT, P, AnyStringToNever<F> | AnyStringToNever<FF>> // no excludes, we want to merge the partial hints
      : Loaded<TT, AnyStringToNever<P>, AnyStringToNever<FF>, AnyStringToNever<Exclude<E, F>>> // with excludes, we only remove the property from it
    : T;

// merge partial loading hints, and propagate populate: '*' to it
type MergeFields<F1 extends string, F2 extends string, P1, P2> =
  P1 | P2 extends '*'
    ? '*'
    : F1 | F2;

type MergeExcludes<F extends string, E extends string> =
  F extends E
    ? never
    : Exclude<E, F>;

// used for `em.populate` and `em.refresh`, allows ignoring the previous Excluded hint, which is used for refreshing as thats the default behaviour
export type MergeLoaded<T, U, P extends string, F extends string, E extends string, R extends boolean = false> =
  T extends Loaded<U, infer PP, infer FF, infer EE>
    ? string extends FF
      ? Loaded<T, P, F, AnyStringToNever<EE> | E>
      : string extends P
        ? Loaded<U, never, F | (FF & string), MergeExcludes<F | (FF & string), EE | E>>
        : Loaded<U, P | AnyStringToNever<PP>, MergeFields<F, AnyStringToNever<FF>, P, PP>, MergeExcludes<MergeFields<F, AnyStringToNever<FF>, P, PP>, (R extends true ? never : EE) | E>>
    : Loaded<T, P, F>;

export type AddOptional<T> = undefined | null extends T ? null | undefined : null extends T ? null : undefined extends T ? undefined : never;
type LoadedProp<T, L extends string = never, F extends string = '*', E extends string = never> = LoadedLoadable<T, Loaded<ExtractType<T>, L, F, E>>;
export type AddEager<T> = ExtractEagerProps<T> & string;
export type ExpandHint<T, L extends string> = L | AddEager<T>;

export type Selected<T, L extends string = never, F extends string = '*'> = {
  [K in keyof T as IsPrefixed<T, K, L | F | AddEager<T>>]: LoadedProp<NonNullable<T[K]>, Suffix<K, L, true>, Suffix<K, F, true>> | AddOptional<T[K]>;
} & {
  [K in keyof T as FunctionKeys<T, K>]: T[K];
} & { [__selectedType]?: T };

type LoadedEntityType<T> = { [__loadedType]?: T } | { [__selectedType]?: T };
export type EntityType<T> = T | LoadedEntityType<T>;
export type FromEntityType<T> = T extends LoadedEntityType<infer U> ? U : T;

type LoadedInternal<T, L extends string = never, F extends string = '*', E extends string = never> =
  [F] extends ['*']
    ? IsNever<E> extends true
      ? T & { [K in keyof T as IsPrefixed<T, K, ExpandHint<T, L>>]: LoadedProp<NonNullable<T[K]>, Suffix<K, L>, Suffix<K, F>, Suffix<K, E>> | AddOptional<T[K]>; }
      : { [K in keyof T as IsPrefixed<T, K, ExpandHint<T, L>, E>]: LoadedProp<NonNullable<T[K]>, Suffix<K, L>, Suffix<K, F>, Suffix<K, E>> | AddOptional<T[K]>; }
    : Selected<T, L, F>;

/**
 * Represents entity with its loaded relations (`populate` hint) and selected properties (`fields` hint).
 */
export type Loaded<T, L extends string = never, F extends string = '*', E extends string = never> = LoadedInternal<T, L, F, E> & { [__loadedType]?: T };

export interface LoadedReference<T> extends Reference<NonNullable<T>> {
  $: NonNullable<T>;
  get(): NonNullable<T>;
}

export interface LoadedScalarReference<T> extends ScalarReference<T> {
  $: T;
  get(): T;
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
  getAll(): Map<EntityName, EntityMetadata>;
  get<T = any>(entity: EntityName<T>, init?: boolean, validate?: boolean): EntityMetadata<T>;
  find<T = any>(entity: EntityName<T>): EntityMetadata<T> | undefined;
  has<T>(entity: EntityName<T>): boolean;
  set<T>(entity: EntityName<T>, meta: EntityMetadata): EntityMetadata;
  reset<T>(entity: EntityName<T>): void;
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
    parentSchema?: string,
    normalizeAccessors?: boolean,
  ): void;

  /**
   * Hydrates primary keys only
   */
  hydrateReference<T extends object>(entity: T, meta: EntityMetadata<T>, data: EntityData<T>, factory: EntityFactory, convertCustomTypes?: boolean, schema?: string, parentSchema?: string, normalizeAccessors?: boolean): void;

  isRunning(): boolean;

}

export interface HydratorConstructor {
  new (metadata: MetadataStorage, platform: Platform, config: Configuration): IHydrator;
}

export interface ISeedManager {
  seed(...classNames: Constructor<Seeder>[]): Promise<void>;
  /** @internal */
  seedString(...classNames: string[]): Promise<void>;
  create(className: string): Promise<string>;
}

export interface Seeder<T extends Dictionary = Dictionary> {
  run(em: EntityManager, context?: T): void | Promise<void>;
}

export type ConnectionType = 'read' | 'write';

export type MetadataProcessor = (metadata: EntityMetadata[], platform: Platform) => MaybePromise<void>;

export type MaybeReturnType<T> = T extends (...args: any[]) => infer R ? R : T;

export interface EntitySchemaWithMeta<TName extends string = string, TTableName extends string = string, TEntity = any, TBase = never, TProperties extends Record<string, any> = Record<string, any>, TClass extends EntityCtor = EntityCtor<TEntity>> extends EntitySchema<TEntity, TBase, TClass> {
  readonly name: TName;
  readonly properties: TProperties;
  readonly tableName: TTableName;
  /** @internal Direct entity type access - avoids expensive pattern matching */
  readonly '~entity': TEntity;
}

// Fast path: direct property access avoids pattern matching against 6-parameter generic
export type InferEntity<Schema> =
  Schema extends { '~entity': infer E } ? E :
  Schema extends EntitySchema<infer Entity> ? Entity :
  Schema extends EntityClass<infer Entity> ? Entity :
  Schema;
