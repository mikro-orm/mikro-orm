import type { Transaction } from './connections';
import {
  type Cascade,
  type EventType,
  type LoadStrategy,
  type LockMode,
  type QueryOrderMap,
  ReferenceKind,
} from './enums';
import {
  type AssignOptions,
  type Collection,
  type EntityFactory,
  EntityHelper,
  type EntityIdentifier,
  type EntityLoaderOptions,
  type EntityRepository,
  Reference,
  type ScalarReference,
} from './entity';
import type { SerializationContext, SerializeOptions } from './serialization';
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
export type EntityKey<T = unknown> = string & keyof { [K in keyof T as ExcludeFunctions<T, K>]?: unknown };
export type EntityValue<T> = T[EntityKey<T>];
export type FilterKey<T> = keyof FilterQuery<T>;
export type AsyncFunction<R = any, T = Dictionary> = (args: T) => Promise<T>;
export type Compute<T> = { [K in keyof T]: T[K] } & {};
export type ExcludeFunctions<T, K extends keyof T> = T[K] extends Function ? never : (K extends symbol ? never : K);
export type Cast<T, R> = T extends R ? T : R;
export type IsUnknown<T> = T extends unknown ? unknown extends T ? true : never : never;
export type IsAny<T> = 0 extends (1 & T) ? true : false;
export type IsNever<T, True = true, False = false> = [T] extends [never] ? True : False;
export type NoInfer<T> = [T][T extends any ? 0 : never];
export type MaybePromise<T> = T | Promise<T>;

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

export type Opt<T = unknown> = T & { __optional?: 1 };

export type UnwrapPrimary<T> = T extends Scalar
  ? T
  : T extends Reference<infer U>
    ? Primary<U>
    : Primary<T>;

type PrimaryPropToType<T, Keys extends (keyof T)[]> = {
  [Index in keyof Keys]: UnwrapPrimary<T[Keys[Index]]>;
};

type ReadonlyPrimary<T> = T extends any[] ? Readonly<T> : T;
export type Primary<T> = T extends { [PrimaryKeyProp]?: infer PK }
  ? (PK extends keyof T ? ReadonlyPrimary<UnwrapPrimary<T[PK]>> : (PK extends (keyof T)[] ? ReadonlyPrimary<PrimaryPropToType<T, PK>> : PK)) : T extends { _id?: infer PK }
  ? ReadonlyPrimary<PK> | string : T extends { uuid?: infer PK }
  ? ReadonlyPrimary<PK> : T extends { id?: infer PK }
  ? ReadonlyPrimary<PK> : T;
export type PrimaryProperty<T> = T extends { [PrimaryKeyProp]?: infer PK }
  ? (PK extends keyof T ? PK : (PK extends any[] ? PK[number] : never)) : T extends { _id?: any }
  ? (T extends { id?: any } ? 'id' | '_id' : '_id') : T extends { uuid?: any }
  ? 'uuid' : T extends { id?: any }
  ? 'id' : never;
export type IPrimaryKeyValue = number | string | bigint | Date | { toHexString(): string };
export type IPrimaryKey<T extends IPrimaryKeyValue = IPrimaryKeyValue> = T;

export type Scalar = boolean | number | string | bigint | symbol | Date | RegExp | Uint8Array | { toHexString(): string };

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
  $eq?: ExpandScalar<T> | ExpandScalar<T>[];
  $ne?: ExpandScalar<T>;
  $in?: ExpandScalar<T>[];
  $nin?: ExpandScalar<T>[];
  $not?: ExpandQuery<T>;
  $none?: ExpandQuery<T>;
  $some?: ExpandQuery<T>;
  $every?: ExpandQuery<T>;
  $gt?: ExpandScalar<T>;
  $gte?: ExpandScalar<T>;
  $lt?: ExpandScalar<T>;
  $lte?: ExpandScalar<T>;
  $like?: string;
  $re?: string;
  $ilike?: string;
  $fulltext?: string;
  $overlap?: string[] | object;
  $contains?: string[] | object;
  $contained?: string[] | object;
  $exists?: boolean;
};

export type FilterItemValue<T> = T | ExpandScalar<T> | Primary<T>;
export type FilterValue<T> = OperatorMap<FilterItemValue<T>> | FilterItemValue<T> | FilterItemValue<T>[] | null;
export type FilterObject<T> = { -readonly [K in EntityKey<T>]?: ExpandQuery<ExpandProperty<T[K]>> | FilterValue<ExpandProperty<T[K]>> | null };
export type ExpandObject<T> = T extends object
  ? T extends Scalar
    ? never
    : FilterObject<T>
  : never;

export type ExpandQuery<T> = T extends object
  ? T extends Scalar
    ? never
    : FilterQuery<T>
  : FilterValue<T>;

export type EntityProps<T> = { -readonly [K in EntityKey<T>]?: T[K] };
export type ObjectQuery<T> = OperatorMap<T> & ExpandObject<T>;
export type FilterQuery<T> =
  | ObjectQuery<T>
  | NonNullable<ExpandScalar<Primary<T>>>
  | NonNullable<EntityProps<T> & OperatorMap<T>>
  | FilterQuery<T>[];
export type QBFilterQuery<T = any> = ObjectQuery<T> | Dictionary;

export interface IWrappedEntity<Entity> {
  isInitialized(): boolean;
  isTouched(): boolean;
  populated(populated?: boolean): void;
  populate<Hint extends string = never>(populate: AutoPath<Entity, Hint>[] | false, options?: EntityLoaderOptions<Entity>): Promise<Loaded<Entity, Hint>>;
  init<Hint extends string = never>(populated?: boolean, populate?: Populate<Entity, Hint>, lockMode?: LockMode, connectionType?: ConnectionType): Promise<Loaded<Entity, Hint>>;
  toReference(): Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>>;
  toObject(): EntityDTO<Entity>;
  toObject(ignoreFields: never[]): EntityDTO<Entity>;
  toObject<Ignored extends EntityKey<Entity>>(ignoreFields: Ignored[]): Omit<EntityDTO<Entity>, Ignored>;
  toJSON(...args: any[]): EntityDTO<Entity>;
  toPOJO(): EntityDTO<Entity>;
  serialize<Hint extends string = never, Exclude extends string = never>(options?: SerializeOptions<Entity, Hint, Exclude>): EntityDTO<Loaded<Entity, Hint>>;
  assign<
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Data extends EntityData<Naked> | Partial<EntityDTO<Naked>> = EntityData<Naked> | Partial<EntityDTO<Naked>>,
  >(data: Data & IsSubset<EntityData<Naked>, Data>, options?: AssignOptions): MergeSelected<Entity, Naked, keyof Data & string>;
  getSchema(): string | undefined;
  setSchema(schema?: string): void;
}

export interface IWrappedEntityInternal<Entity> extends IWrappedEntity<Entity> {
  hasPrimaryKey(): boolean;
  getPrimaryKey(convertCustomTypes?: boolean): Primary<Entity> | null;
  getPrimaryKeys(convertCustomTypes?: boolean): Primary<Entity>[] | null;
  setPrimaryKey(val: Primary<Entity>): void;
  getSerializedPrimaryKey(): string & keyof Entity;
  __meta: EntityMetadata<Entity>;
  __data: Dictionary;
  __em?: any; // we cannot have `EntityManager` here as that causes a cycle
  __platform: Platform;
  __config: Configuration;
  __factory: EntityFactory; // internal factory instance that has its own global fork
  __hydrator: IHydrator;
  __initialized: boolean;
  __touched: boolean;
  __originalEntityData?: EntityData<Entity>;
  __loadedProperties: Set<string>;
  __identifier?: EntityIdentifier;
  __managed: boolean;
  __processing: boolean;
  __schema?: string;
  __populated: boolean;
  __onLoadFired: boolean;
  __reference?: Ref<Entity>;
  __pk?: Primary<Entity>;
  __primaryKeys: Primary<Entity>[];
  __serializationContext: { root?: SerializationContext<Entity>; populate?: PopulateOptions<Entity>[]; fields?: string[] };
}

export type AnyEntity<T = any> = Partial<T>;

export type EntityClass<T> = Function & { prototype: T };
export type EntityClassGroup<T> = { entity: EntityClass<T>; schema: EntityMetadata<T> | EntitySchema<T> };
export type EntityName<T> = string | EntityClass<T> | EntitySchema<T, any> | { name: string };

// we need to restrict the type in the generic argument, otherwise inference don't work, so we use two types here
export type GetRepository<Entity extends { [k: PropertyKey]: any }, Fallback> = Entity[typeof EntityRepositoryType] extends EntityRepository<Entity> | undefined ? NonNullable<Entity[typeof EntityRepositoryType]> : Fallback;

export type EntityDataPropValue<T> = T | Primary<T>;
type ExpandEntityProp<T> = T extends Record<string, any>
  ? { [K in keyof T as ExcludeFunctions<T, K>]?: EntityDataProp<ExpandProperty<T[K]>> | EntityDataPropValue<ExpandProperty<T[K]>> | null } | EntityDataPropValue<ExpandProperty<T>>
  : T;
type ExpandRequiredEntityProp<T, I> = T extends Record<string, any>
  ? ExpandRequiredEntityPropObject<T, I> | EntityDataPropValue<ExpandProperty<T>>
  : T;

type ExpandRequiredEntityPropObject<T, I = never> = {
  [K in keyof T as RequiredKeys<T, K, I>]: RequiredEntityDataProp<ExpandProperty<T[K]>, T> | EntityDataPropValue<ExpandProperty<T[K]>>;
} & {
  [K in keyof T as OptionalKeys<T, K, I>]?: RequiredEntityDataProp<ExpandProperty<T[K]>, T> | EntityDataPropValue<ExpandProperty<T[K]>> | null | undefined;
};

export type EntityDataProp<T> = T extends Date
  ? string | Date
  : T extends Scalar
    ? T
    : T extends Reference<infer U>
      ? EntityDataNested<U>
      : T extends ScalarReference<infer U>
        ? EntityDataProp<U>
        : T extends Collection<infer U, any>
            ? U | U[] | EntityDataNested<U> | EntityDataNested<U>[]
            : T extends readonly (infer U)[]
                ? U | U[] | EntityDataNested<U> | EntityDataNested<U>[]
                : EntityDataNested<T>;

export type RequiredEntityDataProp<T, O> = T extends Date
  ? string | Date
  : T extends Scalar
    ? T
    : T extends Reference<infer U>
      ? RequiredEntityDataNested<U, O>
      : T extends ScalarReference<infer U>
        ? RequiredEntityDataProp<U, O>
        : T extends Collection<infer U, any>
          ? U | U[] | RequiredEntityDataNested<U, O> | RequiredEntityDataNested<U, O>[]
          : T extends readonly (infer U)[]
            ? U | U[] | RequiredEntityDataNested<U, O> | RequiredEntityDataNested<U, O>[]
            : RequiredEntityDataNested<T, O>;

export type EntityDataNested<T> = T extends undefined
  ? never
  : T extends any[]
    ? Readonly<T>
    : EntityData<T> | ExpandEntityProp<T>;
type EntityDataItem<T> = T | EntityDataProp<T> | null;

export type RequiredEntityDataNested<T, O> = T extends any[]
    ? Readonly<T>
    : RequiredEntityData<T, O> | ExpandRequiredEntityProp<T, O>;

type ExplicitlyOptionalProps<T> = (T extends { [OptionalProps]?: infer K } ? K : never) | ({ [K in keyof T]: T[K] extends Opt ? K : never }[keyof T] & {});
type NullableKeys<T> = { [K in keyof T]: null extends T[K] ? K : never }[keyof T];
type ProbablyOptionalProps<T> = ExplicitlyOptionalProps<T> | 'id' | '_id' | 'uuid' | Defined<NullableKeys<T>>;

type IsOptional<T, K extends keyof T, I> = T[K] extends Collection<any, any>
  ? true
  : ExtractType<T[K]> extends I
    ? true
    : K extends ProbablyOptionalProps<T>
      ? true
      : false;
type RequiredKeys<T, K extends keyof T, I> = IsOptional<T, K, I> extends false ? ExcludeFunctions<T, K> : never;
type OptionalKeys<T, K extends keyof T, I> = IsOptional<T, K, I> extends false ? never : ExcludeFunctions<T, K>;
export type EntityData<T> = { [K in EntityKey<T>]?: EntityDataItem<T[K]> };
export type RequiredEntityData<T, I = never> = {
  [K in keyof T as RequiredKeys<T, K, I>]: T[K] | RequiredEntityDataProp<T[K], T> | Primary<T[K]>
} & {
  [K in keyof T as OptionalKeys<T, K, I>]?: T[K] | RequiredEntityDataProp<T[K], T> | Primary<T[K]> | null
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
export type EntityRef<T> = true extends IsUnknown<PrimaryProperty<T>>
  ? Reference<T>
  : ({ [K in PrimaryProperty<T> & keyof T]: T[K] } & Reference<T>);

/**
 * Ref type represents a `Reference` instance, and adds the primary keys to its prototype automatically, so you can do
 * `ref.id` instead of `ref.unwrap().id`. It resolves to either `ScalarRef` or `EntityRef`, based on the type argument.
 */
export type Ref<T> = T extends Scalar ? ScalarReference<T> : EntityRef<T>;

type EntityDTONested<T> = T extends undefined | null ? T : EntityDTO<T>;
export type EntityDTOProp<T> = T extends Scalar
  ? T
  : T extends LoadedReference<infer U>
    ? EntityDTONested<U>
    : T extends Reference<infer U>
      ? Primary<U>
      : T extends ScalarReference<infer U>
        ? U
        : T extends { getItems(check?: boolean): infer U }
          ? (U extends readonly (infer V)[] ? EntityDTONested<V>[] : EntityDTONested<U>)
          : T extends { $: infer U }
            ? (U extends readonly (infer V)[] ? EntityDTONested<V>[] : EntityDTONested<U>)
            : T extends readonly (infer U)[]
              ? (T extends readonly [infer U, ...infer V] ? T : U[])
              : T extends Relation<T>
                ? EntityDTONested<T>
                : T;
type ExtractHiddenProps<T> = T extends { [HiddenProps]?: infer Prop } ? Prop : never;
type ExcludeHidden<T, K extends keyof T> = K extends ExtractHiddenProps<T> ? never : K;
export type EntityDTO<T> = { [K in EntityKey<T> as ExcludeHidden<T, K>]: EntityDTOProp<T[K]> };

export type CheckCallback<T> = (columns: Record<keyof T, string>) => string;
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
  type: keyof typeof types | AnyString;
  runtimeType: 'number' | 'string' | 'boolean' | 'bigint' | 'Buffer' | 'Date';
  targetMeta?: EntityMetadata<Target>;
  columnTypes: string[];
  generated?: string | GeneratedColumnCallback<Owner>;
  customType: Type<any>;
  customTypes: Type<any>[];
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
  kind: ReferenceKind;
  ref?: boolean;
  fieldNames: string[];
  fieldNameRaw?: string;
  default?: string | number | boolean | null;
  defaultRaw?: string;
  formula?: (alias: string) => string;
  prefix?: string | boolean;
  embedded?: [EntityKey<Owner>, EntityKey<Owner>];
  embeddedPath?: string[];
  embeddable: Constructor<Owner>;
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
  nativeEnumName?: string; // for postgres, by default it uses text column with check constraint
  version?: boolean;
  concurrencyCheck?: boolean;
  eager?: boolean;
  setter?: boolean;
  getter?: boolean;
  getterName?: keyof Owner;
  cascade: Cascade[];
  orphanRemoval?: boolean;
  onCreate?: (entity: Owner) => any;
  onUpdate?: (entity: Owner) => any;
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;
  strategy?: LoadStrategy;
  owner: boolean;
  inversedBy: EntityKey<Target>;
  mappedBy: EntityKey<Target>;
  orderBy?: QueryOrderMap<Owner> | QueryOrderMap<Owner>[];
  customOrder?: string[] | number[] | boolean[];
  fixedOrder?: boolean;
  fixedOrderColumn?: string;
  pivotTable: string;
  pivotEntity: string;
  joinColumns: string[];
  inverseJoinColumns: string[];
  referencedColumnNames: string[];
  referencedTableName: string;
  referencedPKs: EntityKey<Owner>[];
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
  }

  addProperty(prop: Partial<EntityProperty<T>>, sync = true) {
    if (prop.pivotTable && !prop.pivotEntity) {
      prop.pivotEntity = prop.pivotTable;
    }

    this.properties[prop.name!] = prop as EntityProperty<T>;
    this.propertyOrder.set(prop.name!, this.props.length);

    /* istanbul ignore next */
    if (sync) {
      this.sync();
    }
  }

  removeProperty(name: string, sync = true) {
    delete this.properties[name as EntityKey<T>];
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

  sync(initIndexes = false) {
    this.root ??= this;
    const props = Object.values<EntityProperty<T>>(this.properties).sort((a, b) => this.propertyOrder.get(a.name)! - this.propertyOrder.get(b.name)!);
    this.props = [...props.filter(p => p.primary), ...props.filter(p => !p.primary)];
    this.relations = this.props.filter(prop => prop.kind !== ReferenceKind.SCALAR && prop.kind !== ReferenceKind.EMBEDDED);
    this.bidirectionalRelations = this.relations.filter(prop => prop.mappedBy || prop.inversedBy);
    this.uniqueProps = this.props.filter(prop => prop.unique);
    this.comparableProps = this.props.filter(prop => EntityComparator.isComparable(prop, this));
    this.hydrateProps = this.props.filter(prop => {
      // `prop.userDefined` is either `undefined` or `false`
      const discriminator = this.root.discriminatorColumn === prop.name && prop.userDefined === false;
      // even if we don't have a setter, do not ignore value from database!
      const onlyGetter = prop.getter && !prop.setter;
      return !prop.inherited && prop.hydrate !== false && !discriminator && !prop.embedded && !onlyGetter;
    });
    this.trackingProps = this.hydrateProps
      .filter(prop => !prop.getter && !prop.setter)
      .filter(prop => ![ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind))
      .filter(prop => !prop.serializedPrimaryKey);
    this.selfReferencing = this.relations.some(prop => [this.className, this.root.className].includes(prop.type));
    this.hasUniqueProps = this.uniques.length + this.uniqueProps.length > 0;
    this.virtual = !!this.expression;
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
      const isCollection = [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind);
      const isReference = [ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(prop.kind) && (prop.inversedBy || prop.mappedBy) && !prop.mapToPk;

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
          if (typeof val === 'object' && !!val && '__raw' in val) {
            (val as Dictionary).use();
          }

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
  expression?: string | ((em: any, where: FilterQuery<T>, options: FindOptions<T, any, any>) => object | string);
  discriminatorColumn?: EntityKey<T>;
  discriminatorValue?: number | string;
  discriminatorMap?: Dictionary<string>;
  embeddable: boolean;
  constructorParams: EntityKey<T>[];
  forceConstructor: boolean;
  toJsonParams: string[];
  extends: string;
  collection: string;
  path: string;
  primaryKeys: EntityKey<T>[];
  simplePK: boolean; // whether the PK can be compared via `===`, e.g. simple scalar without a custom mapped type
  compositePK: boolean;
  versionProperty: EntityKey<T>;
  concurrencyCheckKeys: Set<EntityKey<T>>;
  serializedPrimaryKey: EntityKey<T>;
  properties: { [K in EntityKey<T>]: EntityProperty<T> };
  props: EntityProperty<T>[];
  relations: EntityProperty<T>[];
  bidirectionalRelations: EntityProperty<T>[];
  referencingProperties: { meta: EntityMetadata<T>; prop: EntityProperty<T> }[];
  comparableProps: EntityProperty<T>[]; // for EntityComparator
  trackingProps: EntityProperty<T>[]; // for change-tracking and propagation
  hydrateProps: EntityProperty<T>[]; // for Hydrator
  uniqueProps: EntityProperty<T>[];
  indexes: { properties: EntityKey<T> | EntityKey<T>[]; name?: string; type?: string; options?: Dictionary; expression?: string }[];
  uniques: { properties: EntityKey<T> | EntityKey<T>[]; name?: string; options?: Dictionary; expression?: string }[];
  checks: CheckConstraint<T>[];
  repository: () => Constructor<EntityRepository<any>>;
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
  /** @internal can be used for computed numeric cache keys */
  readonly _id: number;
}

export interface ISchemaGenerator {
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
  refreshDatabase(options?: { ensureIndexes?: boolean }): Promise<void>;
  clearDatabase(options?: { schema?: string }): Promise<void>;
}

export interface GenerateOptions {
  path?: string;
  save?: boolean;
  schema?: string;
  skipTables?: string[];
  skipColumns?: Record<string, string[]>;
  bidirectionalRelations?: boolean;
  identifiedReferences?: boolean;
  entitySchema?: boolean;
  esmImport?: boolean;
  scalarTypeInDecorator?: boolean;
  scalarPropertiesForRelations?: 'always' | 'never' | 'smart';
}

export interface IEntityGenerator {
  generate(options?: GenerateOptions): Promise<string[]>;
}

export type UmzugMigration = { name: string; path?: string };
export type MigrateOptions = { from?: string | number; to?: string | number; migrations?: string[]; transaction?: Transaction };
export type MigrationResult = { fileName: string; code: string; diff: MigrationDiff };
export type MigrationRow = { name: string; executed_at: Date };

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
  cond: Dictionary | ((args: Dictionary, type: 'read' | 'update' | 'delete', em: any, options?: FindOptions<any, any, any> | FindOneOptions<any, any, any>) => Dictionary | Promise<Dictionary>);
  default?: boolean;
  entity?: string[];
  args?: boolean;
};

export type Populate<T, P extends string = never> = readonly AutoPath<T, P, '*' | '$infer'>[] | false;

export type PopulateOptions<T> = {
  field: EntityKey<T>;
  strategy?: LoadStrategy;
  all?: boolean;
  children?: PopulateOptions<T[keyof T]>[];
};

type Loadable<T extends object> = Collection<T, any> | Reference<T> | Ref<T> | readonly T[]; // we need to support raw arrays in embeddables too to allow population
type ExtractType<T> = T extends Loadable<infer U> ? U : T;

type ExtractStringKeys<T> = { [K in keyof T]: ExcludeFunctions<T, K> }[keyof T] & {};
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
    [K in keyof T]: T[K] extends Collection<any>
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
      ? any
      : P extends any
        ? P extends string
          ? (P & `${string}.` extends never ? P : P & `${string}.`) extends infer Q
            ? Q extends `${infer A}.${infer B}`
              ? A extends StringKeys<O, E>
                ? `${A}.${AutoPath<Defined<GetStringKey<O, A, E>>, B, E, Prev[D]>}`
                : never
              : Q extends StringKeys<O, E>
                ? (Defined<GetStringKey<O, Q, E>> extends unknown ? Exclude<P, `${string}.`> : never) | (StringKeys<Defined<GetStringKey<O, Q, E>>, E> extends never ? never : `${Q}.`)
                : StringKeys<O, E> | `${CollectionKeys<O>}:ref`
              : never
            : never
          : never;

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
    ? LoadedReference<E>
    : T extends ScalarReference<infer U>
      ? LoadedScalarReference<U>
      : T extends Scalar | Scalar[]
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
export type IsPrefixed<T, K extends keyof T, L extends string> = K extends symbol
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

type Defined<T> = T & {};

export type IsSubset<T, U> = keyof U extends keyof T
  ? {}
  : Dictionary extends U
    ? {}
    : { [K in keyof U as K extends keyof T ? never : ExcludeFunctions<U, K>]: never; };

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __selectedType: unique symbol;

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __loadedType: unique symbol;

export type MergeSelected<T, U, F extends string> =
  T extends { [__selectedType]?: [U, infer P, infer FF] } // Selected<U, infer P, infer FF>
    ? string extends FF
      ? T
      : string extends P
        ? Selected<U, never, F | (FF & string)>
        : Selected<U, P & string, F | (FF & string)>
    : T;

type AddOptional<T> = undefined | null extends T ? null | undefined : null extends T ? null : undefined extends T ? undefined : never;
type LoadedProp<T, L extends string = never, F extends string = '*'> = LoadedLoadable<T, Loaded<ExtractType<T>, L, F>>;
export type AddEager<T> = ExtractEagerProps<T> & string;

export type Selected<T, L extends string = never, F extends string = '*'> = {
  [K in keyof T as IsPrefixed<T, K, L | F | AddEager<T>>]: LoadedProp<Defined<T[K]>, Suffix<K, L, true>, Suffix<K, F, true>> | AddOptional<T[K]>;
} & { [__selectedType]?: [T, L, F] };

export type EntityType<T> = T | { [__loadedType]?: T } | { [__selectedType]?: [T, any, any] };
export type FromEntityType<T> = T extends EntityType<infer U> ? U : T;

/**
 * Represents entity with its loaded relations (`populate` hint) and selected properties (`fields` hint).
 */
export type Loaded<T, L extends string = never, F extends string = '*'> = ([F] extends ['*'] ? (T & {
  [K in keyof T as IsPrefixed<T, K, L | AddEager<T>>]: LoadedProp<Defined<T[K]>, Suffix<K, L>> | AddOptional<T[K]>;
}) : Selected<T, L, F>) & { [__loadedType]?: T };

export interface LoadedReference<T> extends Reference<Defined<T>> {
  $: Defined<T>;
  get(): Defined<T>;
}

export interface LoadedScalarReference<T> extends ScalarReference<Defined<T>> {
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

export type ConnectionType = 'read' | 'write';
