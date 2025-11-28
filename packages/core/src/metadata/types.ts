import type {
  AnyEntity,
  Constructor,
  EntityName,
  AnyString,
  CheckCallback,
  GeneratedColumnCallback,
  FilterQuery,
  Dictionary,
  AutoPath,
  EntityClass,
  IndexCallback,
  ObjectQuery,
} from '../typings.js';
import type { Cascade, LoadStrategy, DeferMode, QueryOrderMap, EmbeddedPrefixMode } from '../enums.js';
import type { Type, types } from '../types/index.js';
import type { EntityManager } from '../EntityManager.js';
import type { FilterOptions, FindOptions } from '../drivers/IDatabaseDriver.js';
import type { SerializeOptions } from '../serialization/EntitySerializer.js';

export type EntityOptions<T, E = T extends EntityClass<infer P> ? P : T> = {
  /** Override default collection/table name. Alias for `collection`. */
  tableName?: string;
  /** Sets the schema name. */
  schema?: string;
  /** Override default collection/table name. Alias for `tableName`. */
  collection?: string;
  /** For {@doclink inheritance-mapping#single-table-inheritance | Single Table Inheritance}. */
  discriminatorColumn?: (T extends EntityClass<infer P> ? keyof P : string) | AnyString;
  /** For {@doclink inheritance-mapping#single-table-inheritance | Single Table Inheritance}. */
  discriminatorMap?: Dictionary<string>;
  /** For {@doclink inheritance-mapping#single-table-inheritance | Single Table Inheritance}. */
  discriminatorValue?: number | string;
  /**	Enforce use of constructor when creating managed entity instances. */
  forceConstructor?: boolean;
  /** Specify constructor parameters to be used in `em.create` or when `forceConstructor` is enabled. Those should be names of declared entity properties in the same order as your constructor uses them. The ORM tries to infer those automatically, use this option in case the inference fails. */
  constructorParams?: (T extends EntityClass<infer P> ? keyof P : string)[];
  /** Specify comment to table. (SQL only) */
  comment?: string;
  /**	Marks entity as abstract, such entities are inlined during discovery. */
  abstract?: boolean;
  /** Disables change tracking - such entities are ignored during flush. */
  readonly?: boolean;
  /** Marks entity as {@doclink virtual-entities | virtual}. This is set automatically when you use `expression` option. */
  virtual?: boolean;
  /** Used to make ORM aware of externally defined triggers. This is needed for MS SQL Server multi inserts, ignored in other dialects. */
  hasTriggers?: boolean;
  // we need to use `em: any` here otherwise an expression would not be assignable with more narrow type like `SqlEntityManager`
  // also return type is unknown as it can be either QB instance (which we cannot type here) or array of POJOs (e.g. for mongodb)
  /** SQL query that maps to a {@doclink virtual-entities | virtual entity}. */
  expression?: string | ((em: any, where: ObjectQuery<E>, options: FindOptions<E, any, any, any>, stream?: boolean) => object);
  /** Set {@doclink repositories#custom-repository | custom repository class}. */
  repository?: () => Constructor;
};

export interface PropertyOptions<Owner> {
  /**
   * Alias for `fieldName`.
   */
  name?: string;
  /**
   * Specify database column name for this property.
   *
   * @see https://mikro-orm.io/docs/naming-strategy
   */
  fieldName?: string;
  /**
   * Specify database column names for this property.
   * Same as `fieldName` but for composite FKs.
   *
   * @see https://mikro-orm.io/docs/naming-strategy
   */
  fieldNames?: string[];
  /**
   * Specify an exact database column type for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. This option is only for simple properties represented by a single column. (SQL only)
   */
  columnType?: ColumnType | AnyString;
  /**
   * Specify an exact database column type for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. This option is suitable for composite keys, where one property is represented by multiple columns. (SQL only)
   */
  columnTypes?: (ColumnType | AnyString)[];
  /**
   * Explicitly specify the runtime type.
   *
   * @see https://mikro-orm.io/docs/metadata-providers
   * @see https://mikro-orm.io/docs/custom-types
   */
  type?: keyof typeof types | 'ObjectId' | Date | Constructor<AnyEntity> | Constructor<Type<any>> | Type<any> | (() => unknown) | ColumnType | AnyString;
  /**
   * Runtime type of the property. This is the JS type that your property is mapped to, e.g. `string` or `number`, and is normally inferred automatically via `reflect-metadata`.
   * In some cases, the inference won't work, and you might need to specify the `runtimeType` explicitly - the most common one is when you use a union type with null like `foo: number | null`.
   */
  runtimeType?: string;
  /**
   * Set length of database column, used for datetime/timestamp/varchar column types for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  length?: number;
  /**
   * Set precision of database column to represent the number of significant digits. (SQL only)
   */
  precision?: number;
  /**
   * Set scale of database column to represents the number of digits after the decimal point. (SQL only)
   */
  scale?: number;
  /**
   * Explicitly specify the auto increment of the primary key.
   */
  autoincrement?: boolean;
  /**
   * Add the property to the `returning` statement.
   */
  returning?: boolean;
  /**
   * Automatically set the property value when entity gets created, executed during flush operation.
   * @param entity
   */
  onCreate?: (entity: Owner, em: EntityManager) => any;
  /**
   * Automatically update the property value every time entity gets updated, executed during flush operation.
   * @param entity
   */
  onUpdate?: (entity: Owner, em: EntityManager) => any;
  /**
   * Specify default column value for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}.
   * This is a runtime value, assignable to the entity property. (SQL only)
   */
  default?: string | string[] | number | number[] | boolean | null;
  /**
   * Specify SQL functions for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   * Since v4 you should use defaultRaw for SQL functions. e.g. now()
   */
  defaultRaw?: string;
  /**
   * Set to map some SQL snippet for the entity.
   *
   * @see https://mikro-orm.io/docs/defining-entities#formulas Formulas
   */
  formula?: string | ((alias: string) => string);
  /**
   * For generated columns. This will be appended to the column type after the `generated always` clause.
   */
  generated?: string | GeneratedColumnCallback<Owner>;
  /**
   * Set column as nullable for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}.
   */
  nullable?: boolean;
  /**
   * Set column as unsigned for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  unsigned?: boolean;
  /**
   * Set false to define {@link https://mikro-orm.io/docs/serializing#shadow-properties Shadow Property}.
   */
  persist?: boolean;
  /**
   * Set false to disable hydration of this property. Useful for persisted getters.
   */
  hydrate?: boolean;
  /**
   * Enable `ScalarReference` wrapper for lazy values. Use this in combination with `lazy: true` to have a type-safe accessor object in place of the value.
   */
  ref?: boolean;
  /**
   * Set to true to omit the property when {@link https://mikro-orm.io/docs/serializing Serializing}.
   */
  hidden?: boolean;
  /**
   * Set to true to enable {@link https://mikro-orm.io/docs/transactions#optimistic-locking Optimistic Locking} via version field. (SQL only)
   */
  version?: boolean;
  /**
   * Set to true to enable {@link https://mikro-orm.io/docs/transactions#optimistic-locking Optimistic Locking} via concurrency fields.
   */
  concurrencyCheck?: boolean;
  /**
   * Explicitly specify index on a property.
   */
  index?: boolean | string;
  /**
   * Set column as unique for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  unique?: boolean | string;
  /**
   * Specify column with check constraints. (Postgres driver only)
   *
   * @see https://mikro-orm.io/docs/defining-entities#check-constraints
   */
  check?: string | CheckCallback<Owner>;
  /**
   * Set to omit the property from the select clause for lazy loading.
   *
   * @see https://mikro-orm.io/docs/defining-entities#lazy-scalar-properties
   */
  lazy?: boolean;
  /**
   * Set true to define entity's unique primary key identifier.
   * Alias for `@PrimaryKey()` decorator
   *
   * @see https://mikro-orm.io/docs/decorators#primarykey
   */
  primary?: boolean;
  /**
   * Set true to define the properties as setter. (virtual)
   *
   * @example
   * ```ts
   * @Property({ setter: true })
   * set address(value: string) {
   *     this._address = value.toLocaleLowerCase();
   * }
   * ```
   */
  setter?: boolean;
  /**
   * Set true to define the properties as getter. (virtual)
   *
   * @example
   * ```ts
   * @Property({ getter: true })
   * get fullName() {
   *   return this.firstName + this.lastName;
   * }
   * ```
   */
  getter?: boolean;
  /**
   * When defining a property over a method (not a getter, a regular function), you can use this option to point
   * to the method name.
   *
   * @example
   * ```ts
   * @Property({ getter: true })
   * getFullName() {
   *   return this.firstName + this.lastName;
   * }
   * ```
   */
  getterName?: keyof Owner;
  /**
   * When using a private property backed by a public get/set pair, use the `accessor` option to point to the other side.
   *
   * > The `fieldName` will be inferred based on the accessor name unless specified explicitly.
   *
   * If the `accessor` option points to something, the ORM will use the backing property directly.
   *
   * @example
   * ```ts
   * @Entity()
   * export class User {
   *   // the ORM will use the backing field directly
   *   @Property({ accessor: 'email' })
   *   private _email: string;
   *
   *   get email() {
   *     return this._email;
   *   }
   *
   *   set email() {
   *     return this._email;
   *   }
   * }
   *```
   *
   * If you want to the ORM to use your accessor internally too, use `accessor: true` on the get/set property instead.
   * This is handy if you want to use a native private property for the backing field.
   *
   * @example
   * ```ts
   * @Entity({ forceConstructor: true })
   * export class User {
   *   #email: string;
   *
   *   // the ORM will use the accessor internally
   *   @Property({ accessor: true })
   *   get email() {
   *     return this.#email;
   *   }
   *
   *   set email() {
   *     return this.#email;
   *   }
   * }
   * ```
   */
  accessor?: keyof Owner | AnyString | boolean;
  /**
   * Set to define serialized primary key for MongoDB. (virtual)
   * Alias for `@SerializedPrimaryKey()` decorator.
   *
   * @see https://mikro-orm.io/docs/decorators#serializedprimarykey
   */
  serializedPrimaryKey?: boolean;
  /**
   * Set to use serialize property. Allow to specify a callback that will be used when serializing a property.
   *
   * @see https://mikro-orm.io/docs/serializing#property-serializers
   */
  serializer?: (value: any, options?: SerializeOptions<any>) => any;
  /**
   * Specify name of key for the serialized value.
   */
  serializedName?: string;
  /**
   * Specify serialization groups for `serialize()` calls. If a property does not specify any group, it will be included,
   * otherwise only properties with a matching group are included.
   */
  groups?: string[];
  /**
   * Specify a custom order based on the values. (SQL only)
   */
  customOrder?: string[] | number[] | boolean[];
  /**
   * Specify comment of column for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  comment?: string;
  /** mysql only */
  extra?: string;
  /**
   * Set to avoid a perpetual diff from the {@link https://mikro-orm.io/docs/schema-generator Schema Generator} when columns are generated.
   *
   * @see https://mikro-orm.io/docs/defining-entities#sql-generated-columns
   */
  ignoreSchemaChanges?: ('type' | 'extra' | 'default')[];
}

export interface ReferenceOptions<Owner, Target> extends PropertyOptions<Owner> {
  /** Set target entity type. */
  entity?: string | (() => EntityName<Target>);

  /** Set what actions on owning entity should be cascaded to the relationship. Defaults to [Cascade.PERSIST, Cascade.MERGE] (see {@doclink cascading}). */
  cascade?: Cascade[];

  /** Always load the relationship. Discouraged for use with to-many relations for performance reasons. */
  eager?: boolean;

  /** Override the default loading strategy for this property. This option has precedence over the global `loadStrategy`, but can be overridden by `FindOptions.strategy`. */
  strategy?: LoadStrategy | `${LoadStrategy}`;

  /** Control filter parameters for the relation. This will serve as a default value when processing filters on this relation. It's value can be overridden via `em.fork()` or `FindOptions`. */
  filters?: FilterOptions;
}

/**
 * Inspired by https://github.com/typeorm/typeorm/blob/941b584ba135617e55d6685caef671172ec1dc03/src/driver/types/ColumnTypes.ts
 * @ignore
 */
export type ColumnType =
  | 'int' | 'int4' | 'integer' | 'bigint' | 'int8' | 'int2' | 'tinyint' | 'smallint' | 'mediumint'
  | 'double' | 'double precision' | 'real' | 'float8' | 'decimal' | 'numeric' | 'float' | 'float4'
  | 'datetime' | 'time' | 'time with time zone' | 'timestamp' | 'timestamp with time zone' | 'timetz' | 'timestamptz' | 'date' | 'interval'
  | 'character varying' | 'varchar' | 'char' | 'character' | 'uuid' | 'text' | 'tinytext' | 'mediumtext' | 'longtext'
  | 'boolean' | 'bool' | 'bit' | 'enum'
  | 'blob' | 'tinyblob' | 'mediumblob' | 'longblob' | 'bytea'
  | 'point' | 'line' | 'lseg' | 'box' | 'circle' | 'path' | 'polygon' | 'geometry'
  | 'tsvector' | 'tsquery'
  | 'json' | 'jsonb';

export interface ManyToOneOptions<Owner, Target> extends ReferenceOptions<Owner, Target> {
  /** Point to the inverse side property name. */
  inversedBy?: (string & keyof Target) | ((e: Target) => any);

  /** Wrap the entity in {@apilink Reference} wrapper. */
  ref?: boolean;

  /** Use this relation as a primary key. */
  primary?: boolean;

  /** Map this relation to the primary key value instead of an entity. */
  mapToPk?: boolean;

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  joinColumn?: string;

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  joinColumns?: string[];

  /** When a part of a composite column is shared in other properties, use this option to specify what columns are considered as owned by this property. This is useful when your composite property is nullable, but parts of it are not. */
  ownColumns?: string[];

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  referenceColumnName?: string;

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  referencedColumnNames?: string[];

  /** What to do when the target entity gets deleted. */
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** What to do when the reference to the target entity gets updated. */
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** Set the constraint type. Immediate constraints are checked for each statement, while deferred ones are only checked at the end of the transaction. Only for postgres unique constraints. */
  deferMode?: DeferMode | `${DeferMode}`;

  /** Enable/disable foreign key constraint creation on this relation */
  createForeignKeyConstraint?: boolean;

  /** Set a custom foreign key constraint name, overriding NamingStrategy.indexName(). */
  foreignKeyName?: string;
}

export interface OneToManyOptions<Owner, Target> extends ReferenceOptions<Owner, Target> {
  /** Remove the entity when it gets disconnected from the relationship (see {@doclink cascading | Cascading}). */
  orphanRemoval?: boolean;

  /** Set default ordering. */
  orderBy?: QueryOrderMap<Target> | QueryOrderMap<Target>[];

  /** Condition for {@doclink collections#declarative-partial-loading | Declarative partial loading}. */
  where?: FilterQuery<Target>;

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  joinColumn?: string;

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  joinColumns?: string[];

  /** Override the default database column name on the inverse side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  inverseJoinColumn?: string;

  /** Override the default database column name on the inverse side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  inverseJoinColumns?: string[];

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  referenceColumnName?: string;

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  referencedColumnNames?: string[];

  /** Point to the owning side property name. */
  mappedBy: (string & keyof Target) | ((e: Target) => any);
}

export interface OneToOneOptions<Owner, Target> extends Partial<Omit<OneToManyOptions<Owner, Target>, 'orderBy'>> {
  /** Set this side as owning. Owning side is where the foreign key is defined. This option is not required if you use `inversedBy` or `mappedBy` to distinguish owning and inverse side. */
  owner?: boolean;

  /** Point to the inverse side property name. */
  inversedBy?: (string & keyof Target) | ((e: Target) => any);

  /** Wrap the entity in {@apilink Reference} wrapper. */
  ref?: boolean;

  /** Use this relation as a primary key. */
  primary?: boolean;

  /** Map this relation to the primary key value instead of an entity. */
  mapToPk?: boolean;

  /** When a part of a composite column is shared in other properties, use this option to specify what columns are considered as owned by this property. This is useful when your composite property is nullable, but parts of it are not. */
  ownColumns?: string[];

  /** What to do when the target entity gets deleted. */
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** What to do when the reference to the target entity gets updated. */
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** Set the constraint type. Immediate constraints are checked for each statement, while deferred ones are only checked at the end of the transaction. Only for postgres unique constraints. */
  deferMode?: DeferMode | `${DeferMode}`;

  /** Set a custom foreign key constraint name, overriding NamingStrategy.indexName(). */
  foreignKeyName?: string;

  /** Enable/disable foreign key constraint creation on this relation */
  createForeignKeyConstraint?: boolean;
}

export interface ManyToManyOptions<Owner, Target> extends ReferenceOptions<Owner, Target> {
  /** Set this side as owning. Owning side is where the foreign key is defined. This option is not required if you use `inversedBy` or `mappedBy` to distinguish owning and inverse side. */
  owner?: boolean;

  /** Point to the inverse side property name. */
  inversedBy?: (string & keyof Target) | ((e: Target) => any);

  /** Point to the owning side property name. */
  mappedBy?: (string & keyof Target) | ((e: Target) => any);

  /** Condition for {@doclink collections#declarative-partial-loading | Declarative partial loading}. */
  where?: FilterQuery<Target>;

  /** Set default ordering. */
  orderBy?: QueryOrderMap<Target> | QueryOrderMap<Target>[];

  /** Force stable insertion order of items in the collection (see {@doclink collections | Collections}). */
  fixedOrder?: boolean;

  /** Override default order column name (`id`) for fixed ordering. */
  fixedOrderColumn?: string;

  /** Override default name for pivot table (see {@doclink naming-strategy | Naming Strategy}). */
  pivotTable?: string;

  /** Set pivot entity for this relation (see {@doclink collections#custom-pivot-table-entity | Custom pivot table entity}). */
  pivotEntity?: string | (() => EntityName<any>);

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  joinColumn?: string;

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  joinColumns?: string[];

  /** Override the default database column name on the inverse side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  inverseJoinColumn?: string;

  /** Override the default database column name on the inverse side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  inverseJoinColumns?: string[];

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  referenceColumnName?: string;

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  referencedColumnNames?: string[];

  /** What to do when the target entity gets deleted. */
  deleteRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** What to do when the reference to the target entity gets updated. */
  updateRule?: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString;

  /** Enable/disable foreign key constraint creation on this relation */
  createForeignKeyConstraint?: boolean;
}

export interface EmbeddedOptions<Owner, Target> extends PropertyOptions<Owner> {
  entity?: string | (() => EntityName<Target> | EntityName<Target>[]);
  prefix?: string | boolean;
  prefixMode?: EmbeddedPrefixMode;
  object?: boolean;
  array?: boolean;
}

export interface EnumOptions<T> extends PropertyOptions<T> {
  items?: (number | string)[] | (() => Dictionary);
  array?: boolean;
  /** for postgres, by default it uses text column with check constraint */
  nativeEnumName?: string;
}

export interface PrimaryKeyOptions<T> extends PropertyOptions<T> { }

export interface SerializedPrimaryKeyOptions<T> extends PropertyOptions<T> {
  type?: any;
}

type MaybeArray<T> = T | T[];
type Properties<T, H extends string> = MaybeArray<AutoPath<T, H>>;

interface BaseOptions<T, H extends string> {
  name?: string;
  properties?: (T extends EntityClass<infer P> ? Properties<P, H> : Properties<T, H>);
  options?: Dictionary;
  expression?: string | (T extends EntityClass<infer P> ? IndexCallback<P> : IndexCallback<T>);
}

export interface UniqueOptions<T, H extends string = string> extends BaseOptions<T, H> {
  deferMode?: DeferMode | `${DeferMode}`;
}

export interface IndexOptions<T, H extends string = string> extends BaseOptions<T, H> {
  type?: string;
}
