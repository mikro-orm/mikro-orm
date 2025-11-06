import type { EntityManager } from '../EntityManager';
import type { ColumnType, PropertyOptions, ReferenceOptions } from '../decorators/Property';
import type { EnumOptions } from '../decorators/Enum';
import type { EmbeddedOptions, EmbeddedPrefixMode } from '../decorators/Embedded';
import type { ManyToOneOptions } from '../decorators/ManyToOne';
import type { OneToManyOptions } from '../decorators/OneToMany';
import type { OneToOneOptions } from '../decorators/OneToOne';
import type { ManyToManyOptions } from '../decorators/ManyToMany';
import type {
  AnyString,
  GeneratedColumnCallback,
  Constructor,
  CheckCallback,
  FilterQuery,
  EntityName,
  Dictionary,
  EntityMetadata,
  PrimaryKeyProp,
  Hidden,
  Opt,
  Primary,
  EntityClass,
  Ref,
} from '../typings';
import type { ScalarReference } from './Reference';
import type { SerializeOptions } from '../serialization/EntitySerializer';
import type { Cascade, DeferMode, EventType, LoadStrategy, QueryOrderMap } from '../enums';
import type { IType, Type } from '../types/Type';
import { types } from '../types';
import { EntitySchema } from '../metadata/EntitySchema';
import type { Collection } from './Collection';
import type { EventSubscriber } from '../events';
import type { FilterOptions } from '../drivers/IDatabaseDriver';

export type UniversalPropertyKeys =
  | keyof PropertyOptions<any>
  | keyof EnumOptions<any>
  | keyof EmbeddedOptions<any, any>
  | keyof ReferenceOptions<any, any>
  | keyof ManyToOneOptions<any, any>
  | keyof OneToManyOptions<any, any>
  | keyof OneToOneOptions<any, any>
  | keyof ManyToManyOptions<any, any>;

type BuilderExtraKeys = '~options' | '~type' | '$type';
type ExcludeKeys = 'entity' | 'items';
type BuilderKeys = Exclude<UniversalPropertyKeys, ExcludeKeys> | BuilderExtraKeys;

type IncludeKeysForProperty = Exclude<keyof PropertyOptions<any>, ExcludeKeys> | BuilderExtraKeys;
type IncludeKeysForEnumOptions = Exclude<keyof EnumOptions<any>, ExcludeKeys> | BuilderExtraKeys;
type IncludeKeysForEmbeddedOptions = Exclude<keyof EmbeddedOptions<any, any>, ExcludeKeys> | BuilderExtraKeys;
type IncludeKeysForManyToOneOptions = Exclude<keyof ManyToOneOptions<any, any>, ExcludeKeys> | BuilderExtraKeys;
type IncludeKeysForOneToManyOptions = Exclude<keyof OneToManyOptions<any, any>, ExcludeKeys> | BuilderExtraKeys;
type IncludeKeysForOneToOneOptions = Exclude<keyof OneToOneOptions<any, any>, ExcludeKeys> | BuilderExtraKeys;
type IncludeKeysForManyToManyOptions = Exclude<keyof ManyToManyOptions<any, any>, ExcludeKeys> | BuilderExtraKeys;

/** @internal */
export class UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys extends BuilderKeys> implements Record<Exclude<UniversalPropertyKeys, ExcludeKeys>, any> {

  '~options': Options;

  '~type'?: {
    value: Value;
  };

  constructor(options: any) {
    this['~options'] = options;
  }

  protected assignOptions(options: EmptyOptions): any {
    return new UniversalPropertyOptionsBuilder({ ...this['~options'], ...options });
  }

  /**
   * Set the TypeScript type of the property.
   */
  $type<T>(): UniversalPropertyOptionsBuilder<T, Options, IncludeKeys>;

  /**
   * Set the TypeScript type for custom types that map to objects.
   * This method provides type safety for custom types by specifying the runtime type,
   * raw database value type, and optional serialized type.
   *
   * @template Runtime - The runtime type that the property will have in JavaScript
   * @template Raw - The raw value type as stored in the database
   * @template Serialized - The type when serialized (defaults to Raw)
   * @returns PropertyOptionsBuilder with IType wrapper for type safety
   */
  $type<Runtime, Raw, Serialized = Raw>(): UniversalPropertyOptionsBuilder<IType<Runtime, Raw, Serialized>, Options, IncludeKeys>;


  $type(): UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys> {
    return this.assignOptions({});
  }

  /**
   * Alias for `fieldName`.
   */
  name(name: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ name });
  }

  /**
   * Specify database column name for this property.
   *
   * @see https://mikro-orm.io/docs/naming-strategy
   */
  fieldName(fieldName: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ fieldName });
  }

  /**
   * Specify database column names for this property.
   * Same as `fieldName` but for composite FKs.
   *
   * @see https://mikro-orm.io/docs/naming-strategy
   */
  fieldNames(...fieldNames: string[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ fieldNames });
  }

  /**
   * Specify an exact database column type for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. This option is only for simple properties represented by a single column. (SQL only)
   */
  columnType(columnType: ColumnType | AnyString): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ columnType });
  }

  /**
   * Specify an exact database column type for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. This option is suitable for composite keys, where one property is represented by multiple columns. (SQL only)
   */
  columnTypes(...columnTypes: (ColumnType | AnyString)[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ columnTypes });
  }

  /**
   * Explicitly specify the runtime type.
   *
   * @see https://mikro-orm.io/docs/metadata-providers
   * @see https://mikro-orm.io/docs/custom-types
   */
  type<TType extends PropertyValueType>(type: TType): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ type });
  }

  /**
   * Runtime type of the property. This is the JS type that your property is mapped to, e.g. `string` or `number`, and is normally inferred automatically via `reflect-metadata`.
   * In some cases, the inference won't work, and you might need to specify the `runtimeType` explicitly - the most common one is when you use a union type with null like `foo: number | null`.
   */
  runtimeType(runtimeType: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ runtimeType });
  }

  /**
   * Set length of database column, used for datetime/timestamp/varchar column types for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  length(length: number): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ length });
  }

  /**
   * Set precision of database column to represent the number of significant digits. (SQL only)
   */
  precision(precision: number): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ precision });
  }

  /**
   * Set scale of database column to represents the number of digits after the decimal point. (SQL only)
   */
  scale(scale: number): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ scale });
  }

  /**
   * Explicitly specify the auto increment of the primary key.
   */
  autoincrement<T extends boolean = true>(autoincrement = true as T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'autoincrement'> & { autoincrement: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ autoincrement }) as any;
  }

  /**
   * Add the property to the `returning` statement.
   */
  returning(returning = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ returning });
  }

  /**
   * Automatically set the property value when entity gets created, executed during flush operation.
   * @param entity
   */
  onCreate(onCreate: (entity: any, em: EntityManager) => Value): Pick<UniversalPropertyOptionsBuilder<Value, Options & { onCreate: (...args: any[]) => any }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ onCreate }) as any;
  }

  /**
   * Automatically update the property value every time entity gets updated, executed during flush operation.
   * @param entity
   */
  onUpdate(onUpdate: (entity: any, em: EntityManager) => Value): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ onUpdate }) as any;
  }

  /**
   * Specify default column value for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}.
   * This is a runtime value, assignable to the entity property. (SQL only)
   */
  default<T extends string | string[] | number | number[] | boolean | null>(defaultValue: T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'default'> & { default: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ default: defaultValue }) as any;
  }

  /**
   * Specify SQL functions for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   * Since v4 you should use defaultRaw for SQL functions. e.g. now()
   */
  defaultRaw(defaultRaw: string): Pick<UniversalPropertyOptionsBuilder<Value, Options & { defaultRaw: string }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ defaultRaw }) as any;
  }

  /**
   * Allow controlling `filters` option. This will be overridden with `em.fork` or `FindOptions` if provided.
   */
  filters(filters: FilterOptions): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ filters }) as any;
  }

  /**
   * Set to map some SQL snippet for the entity.
   *
   * @see https://mikro-orm.io/docs/defining-entities#formulas Formulas
   */
  formula<T extends string | ((alias: string) => string)>(formula: T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'formula'> & { formula: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ formula }) as any;
  }

  /**
   * For generated columns. This will be appended to the column type after the `generated always` clause.
   */
  generated(generated: string | GeneratedColumnCallback<any>): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ generated });
  }

  /**
   * Set column as nullable for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}.
   */
  nullable<T extends boolean = true>(nullable: T = true as T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'nullable'> & { nullable: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ nullable }) as any;
  }

  /**
   * Set column as unsigned for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  unsigned(unsigned = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ unsigned });
  }

  /**
   * Set false to define {@link https://mikro-orm.io/docs/serializing#shadow-properties Shadow Property}.
   */
  persist<T extends boolean = true>(persist = true as T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'persist'> & { persist: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ persist }) as any;
  }

  /**
   * Set false to disable hydration of this property. Useful for persisted getters.
   */
  hydrate(hydrate = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ hydrate });
  }

  /**
   * Enable `ScalarReference` wrapper for lazy values. Use this in combination with `lazy: true` to have a type-safe accessor object in place of the value.
   */
  ref<T extends boolean = true>(ref: T = true as T): UniversalPropertyOptionsBuilder<Value, Omit<Options, 'ref'> & { ref: T }, IncludeKeys> {
    return this.assignOptions({ ref }) as any;
  }

  /**
   * Set false to disable change tracking on a property level.
   *
   * @see https://mikro-orm.io/docs/unit-of-work#change-tracking-and-performance-considerations
   */
  trackChanges(trackChanges = true): UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys> {
    return this.assignOptions({ trackChanges });
  }

  /**
   * Set to true to omit the property when {@link https://mikro-orm.io/docs/serializing Serializing}.
   */
  hidden<T extends boolean = true>(hidden: T = true as T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'hidden'> & { hidden: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ hidden }) as any;
  }

  /**
   * Set to true to enable {@link https://mikro-orm.io/docs/transactions#optimistic-locking Optimistic Locking} via version field. (SQL only)
   */
  version<T extends boolean = true>(version = true as T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'version'> & { version: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ version }) as any;
  }

  /**
   * Set to true to enable {@link https://mikro-orm.io/docs/transactions#optimistic-locking Optimistic Locking} via concurrency fields.
   */
  concurrencyCheck(concurrencyCheck = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ concurrencyCheck });
  }

  /**
   * Explicitly specify index on a property.
   */
  index(index: boolean | string = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ index });
  }

  /**
   * Set column as unique for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  unique(unique: boolean | string = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ unique });
  }

  /**
   * Specify column with check constraints. (Postgres driver only)
   *
   * @see https://mikro-orm.io/docs/defining-entities#check-constraints
   */
  check(check: string | CheckCallback<any>): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ check });
  }

  /**
   * Set to omit the property from the select clause for lazy loading.
   *
   * @see https://mikro-orm.io/docs/defining-entities#lazy-scalar-properties
   */
  lazy<T extends boolean = true>(lazy = true, ref: T = true as T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'ref'> & { ref: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ lazy, ref }) as any;
  }

  /**
   * Set true to define entity's unique primary key identifier.
   *
   * @see https://mikro-orm.io/docs/decorators#primarykey
   */
  primary<T extends boolean = true>(primary = true as T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'primary'> & { primary: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ primary }) as any;
  }

  /**
   * Set true to define the properties as setter. (virtual)
   *
   * @example
   * ```
   * @Property({ setter: true })
   * set address(value: string) {
   *     this._address = value.toLocaleLowerCase();
   * }
   * ```
   */
  setter(setter = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ setter });
  }

  /**
   * Set true to define the properties as getter. (virtual)
   *
   * @example
   * ```
   * @Property({ getter: true })
   * get fullName() {
   *   return this.firstName + this.lastName;
   * }
   * ```
   */
  getter(getter = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ getter });
  }

  /**
   * When defining a property over a method (not a getter, a regular function), you can use this option to point
   * to the method name.
   *
   * @example
   * ```
   * @Property({ getter: true })
   * getFullName() {
   *   return this.firstName + this.lastName;
   * }
   * ```
   */
  getterName(getterName: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ getterName });
  }

  /**
   * Set to define serialized primary key for MongoDB. (virtual)
   * Alias for `@SerializedPrimaryKey()` decorator.
   *
   * @see https://mikro-orm.io/docs/decorators#serializedprimarykey
   */
  serializedPrimaryKey(serializedPrimaryKey = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ serializedPrimaryKey });
  }

  /**
   * Set to use serialize property. Allow to specify a callback that will be used when serializing a property.
   *
   * @see https://mikro-orm.io/docs/serializing#property-serializers
   */
  serializer(serializer: (value: Value, options?: SerializeOptions<any>) => any): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ serializer });
  }

  /**
   * Specify name of key for the serialized value.
   */
  serializedName(serializedName: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ serializedName });
  }

  /**
   * Specify serialization groups for `serialize()` calls. If a property does not specify any group, it will be included,
   * otherwise only properties with a matching group are included.
   */
  groups(...groups: string[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ groups });
  }

  /**
   * Specify a custom order based on the values. (SQL only)
   */
  customOrder(...customOrder: (string[] | number[] | boolean[])): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ customOrder });
  }

  /**
   * Specify comment of column for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  comment(comment: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ comment });
  }

  /** mysql only */
  extra(extra: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ extra });
  }

  /**
   * Set to avoid a perpetual diff from the {@link https://mikro-orm.io/docs/schema-generator Schema Generator} when columns are generated.
   *
   * @see https://mikro-orm.io/docs/defining-entities#sql-generated-columns
   */
  ignoreSchemaChanges(...ignoreSchemaChanges: ('type' | 'extra' | 'default')[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ ignoreSchemaChanges });
  }

  array<T extends boolean = true>(array: T = true as T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'array'> & { array: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ array });
  }

  /** for postgres, by default it uses text column with check constraint */
  nativeEnumName(nativeEnumName: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ nativeEnumName });
  }

  prefix(prefix: string | boolean): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ prefix });
  }

  prefixMode(prefixMode: EmbeddedPrefixMode): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ prefixMode });
  }

  object(object = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ object });
  }

  /** Set what actions on owning entity should be cascaded to the relationship. Defaults to [Cascade.PERSIST, Cascade.MERGE] (see {@doclink cascading}). */
  cascade(...cascade: Cascade[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ cascade });
  }

  /** Always load the relationship. Discouraged for use with to-many relations for performance reasons. */
  eager(eager = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ eager });
  }

  /** Override the default loading strategy for this property. This option has precedence over the global `loadStrategy`, but can be overridden by `FindOptions.strategy`. */
  strategy(strategy: LoadStrategy | `${LoadStrategy}`): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ strategy });
  }

  /** Set this side as owning. Owning side is where the foreign key is defined. This option is not required if you use `inversedBy` or `mappedBy` to distinguish owning and inverse side. */
  owner(owner = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ owner });
  }

  /** Point to the inverse side property name. */
  inversedBy(inversedBy: keyof Value | ((e: Value) => any)): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ inversedBy });
  }

  /** Point to the owning side property name. */
  mappedBy(mappedBy: keyof Value | ((e: Value) => any)): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ mappedBy });
  }

  /** Condition for {@doclink collections#declarative-partial-loading | Declarative partial loading}. */
  where(...where: FilterQuery<object>[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ where });
  }

  /** Set default ordering. */
  orderBy(...orderBy: QueryOrderMap<object>[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ orderBy });
  }

  /** Force stable insertion order of items in the collection (see {@doclink collections | Collections}). */
  fixedOrder(fixedOrder = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ fixedOrder });
  }

  /** Override default order column name (`id`) for fixed ordering. */
  fixedOrderColumn(fixedOrderColumn: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ fixedOrderColumn });
  }

  /** Override default name for pivot table (see {@doclink naming-strategy | Naming Strategy}). */
  pivotTable(pivotTable: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ pivotTable });
  }

  /** Set pivot entity for this relation (see {@doclink collections#custom-pivot-table-entity | Custom pivot table entity}). */
  pivotEntity(pivotEntity: string | (() => EntityName<any>)): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ pivotEntity });
  }

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  joinColumn(joinColumn: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ joinColumn });
  }

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  joinColumns(...joinColumns: string[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ joinColumns });
  }

  /** Override the default database column name on the inverse side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  inverseJoinColumn(inverseJoinColumn: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ inverseJoinColumn });
  }

  /** Override the default database column name on the inverse side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  inverseJoinColumns(...inverseJoinColumns: string[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ inverseJoinColumns });
  }

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  referenceColumnName(referenceColumnName: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ referenceColumnName });
  }

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  referencedColumnNames(...referencedColumnNames: string[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ referencedColumnNames });
  }

  /** What to do when the target entity gets deleted. */
  deleteRule(deleteRule: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ deleteRule });
  }

  /** What to do when the reference to the target entity gets updated. */
  updateRule(updateRule: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ updateRule });
  }

  /** Map this relation to the primary key value instead of an entity. */
  mapToPk<T extends boolean = true>(mapToPk = true as T): Pick<UniversalPropertyOptionsBuilder<Value, Omit<Options, 'mapToPk'> & { mapToPk: T }, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ mapToPk }) as any;
  }

  /** Set the constraint type. Immediate constraints are checked for each statement, while deferred ones are only checked at the end of the transaction. Only for postgres unique constraints. */
  deferMode(deferMode: DeferMode | `${DeferMode}`): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ deferMode });
  }

  /** When a part of a composite column is shared in other properties, use this option to specify what columns are considered as owned by this property. This is useful when your composite property is nullable, but parts of it are not. */
  ownColumns(...ownColumns: string[]): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ ownColumns });
  }

  /** Enable/disable foreign key constraint creation on this relation */
  createForeignKeyConstraint(createForeignKeyConstraint = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ createForeignKeyConstraint });
  }

  /** Set a custom foreign key constraint name, overriding NamingStrategy.indexName(). */
  foreignKeyName(foreignKeyName: string): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ foreignKeyName });
  }

  /** Remove the entity when it gets disconnected from the relationship (see {@doclink cascading | Cascading}). */
  orphanRemoval(orphanRemoval = true): Pick<UniversalPropertyOptionsBuilder<Value, Options, IncludeKeys>, IncludeKeys> {
    return this.assignOptions({ orphanRemoval });
  }

}

export interface EmptyOptions extends Partial<Record<UniversalPropertyKeys, unknown>> {}


/** @internal */
export class OneToManyOptionsBuilderOnlyMappedBy<Value extends object> extends UniversalPropertyOptionsBuilder<Value, EmptyOptions & { kind: '1:m' }, IncludeKeysForOneToManyOptions> {

  /** Point to the owning side property name. */
  override mappedBy(mappedBy: (AnyString & keyof Value) | ((e: Value) => any)): Pick<UniversalPropertyOptionsBuilder<Value, EmptyOptions & { kind: '1:m' }, IncludeKeysForOneToManyOptions>, IncludeKeysForOneToManyOptions> {
    return new UniversalPropertyOptionsBuilder({ ...this['~options'], mappedBy });
  }

}


function createPropertyBuilders<Types extends Record<string, any>>(
  options: Types,
): {
  [K in keyof Types]: () => UniversalPropertyOptionsBuilder<InferPropertyValueType<Types[K]>, EmptyOptions, IncludeKeysForProperty>;
} {
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [key, () => new UniversalPropertyOptionsBuilder({ type: value })]),
  ) as any;
}

const propertyBuilders = {
  ...createPropertyBuilders(types),

  bigint: <Mode extends 'bigint' | 'number' | 'string' = 'bigint'>(mode?: Mode) =>
    new UniversalPropertyOptionsBuilder<InferPropertyValueType<typeof types.bigint<Mode>>, EmptyOptions, IncludeKeysForProperty>({ type: new types.bigint(mode) }),

  array: <T = string>(toJsValue: (i: string) => T = i => i as T, toDbValue: (i: T) => string = i => i as string) =>
    new UniversalPropertyOptionsBuilder<InferPropertyValueType<typeof types.array<T>>, EmptyOptions, IncludeKeysForProperty>({ type: new types.array(toJsValue, toDbValue) }),

  decimal: <Mode extends 'number' | 'string' = 'string'>(mode?: Mode) =>
    new UniversalPropertyOptionsBuilder<InferPropertyValueType<typeof types.decimal<Mode>>, EmptyOptions, IncludeKeysForProperty>({ type: new types.decimal(mode) }),

  json: <T>() => new UniversalPropertyOptionsBuilder<T, EmptyOptions, IncludeKeysForProperty>({ type: types.json }),

  formula: <T>(formula: string | ((alias: string) => string)) =>
    new UniversalPropertyOptionsBuilder<T, EmptyOptions, IncludeKeysForProperty>({ formula }),

  datetime: (length?: number) => new UniversalPropertyOptionsBuilder<InferPropertyValueType<typeof types.datetime>, EmptyOptions, IncludeKeysForProperty>({ type: types.datetime, length }),

  time: (length?: number) => new UniversalPropertyOptionsBuilder<InferPropertyValueType<typeof types.time>, EmptyOptions, IncludeKeysForProperty>({ type: types.time, length }),

  type: <T extends PropertyValueType>(type: T) =>
    new UniversalPropertyOptionsBuilder<InferPropertyValueType<T>, EmptyOptions, IncludeKeysForProperty>({ type }),

  enum: <const T extends (number | string)[] | (() => Dictionary)>(items?: T) =>
    new UniversalPropertyOptionsBuilder<T extends () => Dictionary ? ValueOf<ReturnType<T>> : T extends (infer Value)[] ? Value : T, EmptyOptions, IncludeKeysForEnumOptions>({
      enum: true,
      items,
    }),

  embedded: <Target extends EntitySchema<any, any> | EntityClass<any> | EntitySchema<any, any>[] | EntityClass<any>[]>(target: Target) =>
    new UniversalPropertyOptionsBuilder<InferEntity<Target extends (infer T)[] ? T : Target>, EmptyOptions, IncludeKeysForEmbeddedOptions>({
      entity: () => target as any,
      kind: 'embedded',
    }),

  manyToMany: <Target extends EntitySchema<any, any> | EntityClass<any>>(target: Target) =>
    new UniversalPropertyOptionsBuilder<InferEntity<Target>, EmptyOptions & { kind: 'm:n' }, IncludeKeysForManyToManyOptions>({
      entity: () => target as any,
      kind: 'm:n',
    }),

  manyToOne: <Target extends EntitySchema<any, any> | EntityClass<any>>(target: Target) =>
    new UniversalPropertyOptionsBuilder<InferEntity<Target>, EmptyOptions & { kind: 'm:1' }, IncludeKeysForManyToOneOptions>({
      entity: () => target as any,
      kind: 'm:1',
    }),

  oneToMany: <Target extends EntitySchema<any, any> | EntityClass<any>>(target: Target) =>
    new OneToManyOptionsBuilderOnlyMappedBy<InferEntity<Target>>({
      entity: () => target as any,
      kind: '1:m',
    }),

  oneToOne: <Target extends EntitySchema<any, any> | EntityClass<any>>(target: Target) =>
    new UniversalPropertyOptionsBuilder<InferEntity<Target>, EmptyOptions & { kind: '1:1' }, IncludeKeysForOneToOneOptions>({
      entity: () => target as any,
      kind: '1:1',
    }),
};

function getBuilderOptions(builder: any) {
  return '~options' in builder ? builder['~options'] : builder;
}

export function defineEntity<Properties extends Record<string, any>, const PK extends (keyof Properties)[] | undefined = undefined, Base = never>(
  meta: Omit<Partial<EntityMetadata<InferEntityFromProperties<Properties, PK>>>, 'properties' | 'extends' | 'primaryKeys' | 'hooks'> & {
    name: string;
    extends?: EntityName<Base>;
    properties: Properties | ((properties: typeof propertyBuilders) => Properties);
    primaryKeys?: PK & InferPrimaryKey<Properties>[];
    hooks?: DefineEntityHooks<InferEntityFromProperties<Properties, PK>>;
  },
): EntitySchema<InferEntityFromProperties<Properties, PK>, Base>;

export function defineEntity<Entity = any, Base = never>(
  meta: Omit<Partial<EntityMetadata<Entity>>, 'properties' | 'extends'> & {
    class: EntityClass<Entity>;
    extends?: EntityName<Base>;
    properties: Record<string, any> | ((properties: typeof propertyBuilders) => Record<string, any>);
  },
): EntitySchema<Entity, Base>;

export function defineEntity(
  meta: Omit<Partial<EntityMetadata>, 'properties' | 'extends'> & {
    extends?: EntityName<any>;
    properties: Record<string, any> | ((properties: typeof propertyBuilders) => Record<string, any>);
  },
): EntitySchema<any, any> {
  const { properties: propertiesOrGetter, ...options } = meta;
  const propertyOptions = typeof propertiesOrGetter === 'function' ? propertiesOrGetter(propertyBuilders) : propertiesOrGetter;
  const properties = {};
  const values = new Map<string, any>();
  for (const [key, builder] of Object.entries(propertyOptions)) {
    if (typeof builder === 'function') {
      Object.defineProperty(properties, key, {
        get: () => {
          let value = values.get(key);
          if (value === undefined) {
            value = getBuilderOptions(builder());
            values.set(key, value);
          }
          return value;
        },
        set: (value: any) => {
          values.set(key, value);
        },
        enumerable: true,
      });
    } else {
      Object.defineProperty(properties, key, {
        value: getBuilderOptions(builder),
        writable: true,
        enumerable: true,
      });
    }
  }
  return new EntitySchema({ properties, ...options } as any);
}

defineEntity.properties = propertyBuilders;
export { propertyBuilders as p };

export interface DefineEntityHooks<T> extends Partial<MapToArray<Pick<EventSubscriber<T>, keyof typeof EventType>>> {}

type MapToArray<T extends Record<string, any>> = {
  [K in keyof T]: NonNullable<T[K]>[];
};

type PropertyValueType = PropertyOptions<any>['type'];

type InferPropertyValueType<T extends PropertyValueType> =
  T extends string ? InferTypeByString<T> :
  T extends NumberConstructor ? number :
  T extends StringConstructor ? string :
  T extends BooleanConstructor ? boolean :
  T extends DateConstructor ? Date :
  T extends ArrayConstructor ? string[] :
  T extends Constructor<infer TType> ?
  TType extends Type<infer TValue, any> ? NonNullable<TValue> : TType :
  T extends Type<infer TValue, any> ? NonNullable<TValue> :
  any;

type InferTypeByString<T extends string> =
  T extends keyof typeof types ? InferJSType<typeof types[T]> :
  InferColumnType<T>;

type InferJSType<T> = T extends typeof Type<infer TValue, any> ? NonNullable<TValue> : never;

type InferColumnType<T extends string> =
  T extends 'int' | 'int4' | 'integer' | 'bigint' | 'int8' | 'int2' | 'tinyint' | 'smallint' | 'mediumint' ? number :
  T extends 'double' | 'double precision' | 'real' | 'float8' | 'decimal' | 'numeric' | 'float' | 'float4' ? number :
  T extends 'datetime' | 'time' | 'time with time zone' | 'timestamp' | 'timestamp with time zone' | 'timetz' | 'timestamptz' | 'date' | 'interval' ? Date :
  T extends 'ObjectId' | 'objectId' | 'character varying' | 'varchar' | 'char' | 'character' | 'uuid' | 'text' | 'tinytext' | 'mediumtext' | 'longtext' | 'enum' ? string :
  T extends 'boolean' | 'bool' | 'bit' ? boolean :
  T extends 'blob' | 'tinyblob' | 'mediumblob' | 'longblob' | 'bytea' ? Buffer :
  T extends 'point' | 'line' | 'lseg' | 'box' | 'circle' | 'path' | 'polygon' | 'geometry' ? number[] :
  T extends 'tsvector' | 'tsquery' ? string[] :
  T extends 'json' | 'jsonb' ? any :
  any;

export type InferEntityFromProperties<Properties extends Record<string, any>, PK extends (keyof Properties)[] | undefined = undefined> = {
  -readonly [K in keyof Properties]: InferBuilderValue<MaybeReturnType<Properties[K]>>;
} & {
  [PrimaryKeyProp]?: PK extends undefined
    ? InferPrimaryKey<Properties> extends never
      ? never
      : IsUnion<InferPrimaryKey<Properties>> extends true
        ? InferPrimaryKey<Properties>[]
        : InferPrimaryKey<Properties>
    : PK;
};

export type InferPrimaryKey<Properties extends Record<string, any>> = {
  [K in keyof Properties]: MaybeReturnType<Properties[K]> extends { '~options': { primary: true } } ? K : never;
}[keyof Properties];

type MaybeReturnType<T> = T extends (...args: any[]) => infer R ? R : T;

type InferBuilderValue<Builder> = Builder extends { '~type'?: { value: infer Value }; '~options'?: infer Options } ? MaybeHidden<MaybeOpt<MaybeScalarRef<MaybeNullable<MaybeRelationRef<MaybeMapToPk<MaybeArray<Value, Options>, Options>, Options>, Options>, Options>, Options>, Options> : never;

type MaybeArray<Value, Options> = Options extends { array: true } ? Value[] : Value;

type MaybeMapToPk<Value, Options> = Options extends { mapToPk: true } ? Primary<Value> : Value;

type MaybeNullable<Value, Options> = Options extends { nullable: true } ? Value | null | undefined : Value;

type MaybeRelationRef<Value, Options> =
  Options extends { mapToPk: true } ? Value :
  Options extends { ref: false } ? Value :
  Options extends { ref: true; kind: '1:1' } ? Value extends object ? Ref<Value> : never :
  Options extends { ref: true; kind: 'm:1' } ? Value extends object ? Ref<Value> : never :
  Options extends { kind: '1:m' } ? Value extends object ? Collection<Value> : never :
  Options extends { kind: 'm:n' } ? Value extends object ? Collection<Value> : never :
    Value;

type MaybeScalarRef<Value, Options> =
  Options extends { ref: false } ? Value :
  Options extends { kind: '1:1' | 'm:1' | '1:m' | 'm:n' } ? Value :
  Options extends { ref: true } ? ScalarReference<Value> :
    Value;

type MaybeOpt<Value, Options> =
  Options extends { mapToPk: true } ? Value extends Opt<infer OriginalValue> ? OriginalValue : Value :
  Options extends { autoincrement: true } ? Opt<Value> :
  Options extends { onCreate: Function } ? Opt<Value> :
  Options extends { default: string | string[] | number | number[] | boolean | null } ? Opt<Value> :
  Options extends { defaultRaw: string } ? Opt<Value> :
  Options extends { persist: false } ? Opt<Value> :
  Options extends { version: true } ? Opt<Value> :
  Options extends { formula: string | (() => string) } ? Opt<Value> :
    Value;

type MaybeHidden<Value, Options> = Options extends { hidden: true } ? Hidden<Value> : Value;

type ValueOf<T extends Dictionary> = T[keyof T];

type IsUnion<T, U = T> = T extends U ? ([U] extends [T] ? false : true) : false;

export type InferEntity<Schema> = Schema extends EntitySchema<infer Entity, any>
  ? Entity
  : Schema extends EntityClass<infer Entity>
    ? Entity
    : Schema;
