import type { EntityManager, CheckCallback, SerializeOptions, EntityMetadata, Cascade, LoadStrategy, DeferMode, ScalarReference, Reference, Opt, Hidden, EnumOptions, Dictionary } from '..';
import type { ColumnType, PropertyOptions, ManyToOneOptions, ReferenceOptions } from '../decorators';
import type { AnyString, GeneratedColumnCallback, Constructor } from '../typings';
import type { Type } from '../types';
import { EntitySchema } from '../metadata/EntitySchema.js';
import { types } from '../types/index.js';

class PropertyOptionsBuilder<Value> {

  '~options': PropertyOptions<any>;

  '~type'?: {
    value: Value;
  };

  constructor(options: PropertyOptionsBuilder<Value>['~options'] = {}) {
    this['~options'] = options;
  }

  /**
   * Alias for `fieldName`.
   */
  name(name: string): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], name });
  }

  /**
   * Specify database column name for this property.
   *
   * @see https://mikro-orm.io/docs/naming-strategy
   */
  fieldName(fieldName: string): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], fieldName });
  }

  /**
   * Specify database column names for this property.
   * Same as `fieldName` but for composite FKs.
   *
   * @see https://mikro-orm.io/docs/naming-strategy
   */
  fieldNames(...fieldNames: string[]): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], fieldNames });
  }

  /**
   * Specify an exact database column type for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. This option is only for simple properties represented by a single column. (SQL only)
   */
  columnType(columnType: ColumnType | AnyString): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], columnType });
  }

  /**
   * Specify an exact database column type for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. This option is suitable for composite keys, where one property is represented by multiple columns. (SQL only)
   */
  columnTypes(...columnTypes: (ColumnType | AnyString)[]): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], columnTypes });
  }

  /**
   * Explicitly specify the runtime type.
   *
   * @see https://mikro-orm.io/docs/metadata-providers
   * @see https://mikro-orm.io/docs/custom-types
   */
  type<TType extends PropertyValueType>(type: TType): PropertyOptionsBuilder<InferPropertyValueType<TType>> {
    return new PropertyOptionsBuilder({ ...this['~options'], type });
  }

  /**
   * Runtime type of the property. This is the JS type that your property is mapped to, e.g. `string` or `number`, and is normally inferred automatically via `reflect-metadata`.
   * In some cases, the inference won't work, and you might need to specify the `runtimeType` explicitly - the most common one is when you use a union type with null like `foo: number | null`.
   */
  runtimeType(runtimeType: string): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], runtimeType });
  }

  /**
   * Set length of database column, used for datetime/timestamp/varchar column types for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  length(length: number): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], length });
  }

  /**
   * Set precision of database column to represent the number of significant digits. (SQL only)
   */
  precision(precision: number): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], precision });
  }

  /**
   * Set scale of database column to represents the number of digits after the decimal point. (SQL only)
   */
  scale(scale: number): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], scale });
  }

  /**
   * Explicitly specify the auto increment of the primary key.
   */
  autoincrement(autoincrement = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], autoincrement });
  }

  /**
   * Add the property to the `returning` statement.
   */
  returning(returning = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], returning });
  }

  /**
   * Automatically set the property value when entity gets created, executed during flush operation.
   * @param entity
   */
  onCreate(onCreate: (entity: any, em: EntityManager) => Value): PropertyOptionsBuilder<Value & Opt> {
    return new PropertyOptionsBuilder({ ...this['~options'], onCreate });
  }

  /**
   * Automatically update the property value every time entity gets updated, executed during flush operation.
   * @param entity
   */
  onUpdate(onUpdate: (entity: any, em: EntityManager) => Value): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], onUpdate });
  }

  /**
   * Specify default column value for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}.
   * This is a runtime value, assignable to the entity property. (SQL only)
   */
  default(defaultValue: string | string[] | number | number[] | boolean | null): PropertyOptionsBuilder<Value & Opt> {
    return new PropertyOptionsBuilder({ ...this['~options'], default: defaultValue });
  }

  /**
   * Specify SQL functions for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   * Since v4 you should use defaultRaw for SQL functions. e.g. now()
   */
  defaultRaw(defaultRaw: string): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], defaultRaw });
  }

  /**
   * Set to map some SQL snippet for the entity.
   *
   * @see https://mikro-orm.io/docs/defining-entities#formulas Formulas
   */
  formula(formula: string | ((alias: string) => string)): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], formula });
  }

  /**
   * For generated columns. This will be appended to the column type after the `generated always` clause.
   */
  generated(generated: string | GeneratedColumnCallback<any>): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], generated });
  }

  /**
   * Set column as nullable for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}.
   */
  nullable<T extends boolean = true>(nullable: T = true as T): PropertyOptionsBuilder<T extends true ? Value | null | undefined : NonNullable<Value>> {
    return new PropertyOptionsBuilder({ ...this['~options'], nullable });
  }

  /**
   * Set column as unsigned for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  unsigned(unsigned = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], unsigned });
  }

  /**
   * Set false to define {@link https://mikro-orm.io/docs/serializing#shadow-properties Shadow Property}.
   */
  persist(persist = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], persist });
  }

  /**
   * Set false to disable hydration of this property. Useful for persisted getters.
   */
  hydrate(hydrate = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], hydrate });
  }

  /**
   * Enable `ScalarReference` wrapper for lazy values. Use this in combination with `lazy: true` to have a type-safe accessor object in place of the value.
   */
  ref<T extends boolean = true>(ref: T = true as T): PropertyOptionsBuilder<T extends true ? ScalarReference<Value> : UnwrapRef<Value>> {
    return new PropertyOptionsBuilder({ ...this['~options'], ref });
  }

  /**
   * Set false to disable change tracking on a property level.
   *
   * @see https://mikro-orm.io/docs/unit-of-work#change-tracking-and-performance-considerations
   */
  trackChanges(trackChanges = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], trackChanges });
  }

  /**
   * Set to true to omit the property when {@link https://mikro-orm.io/docs/serializing Serializing}.
   */
  hidden<T extends boolean = true>(hidden: T = true as T): PropertyOptionsBuilder<T extends true ? Hidden<Value> : Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], hidden });
  }

  /**
   * Set to true to enable {@link https://mikro-orm.io/docs/transactions#optimistic-locking Optimistic Locking} via version field. (SQL only)
   */
  version(version = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], version });
  }

  /**
   * Set to true to enable {@link https://mikro-orm.io/docs/transactions#optimistic-locking Optimistic Locking} via concurrency fields.
   */
  concurrencyCheck(concurrencyCheck = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], concurrencyCheck });
  }

  /**
   * Explicitly specify index on a property.
   */
  index(index: boolean | string): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], index });
  }

  /**
   * Set column as unique for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  unique(unique: boolean | string): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], unique });
  }

  /**
   * Specify column with check constraints. (Postgres driver only)
   *
   * @see https://mikro-orm.io/docs/defining-entities#check-constraints
   */
  check(check: string | CheckCallback<any>): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], check });
  }

  /**
   * Set to omit the property from the select clause for lazy loading.
   *
   * @see https://mikro-orm.io/docs/defining-entities#lazy-scalar-properties
   */
  lazy<T extends boolean = true>(lazy = true, ref: T = true as T): PropertyOptionsBuilder<T extends true ? ScalarReference<Value> : UnwrapRef<Value>> {
    return new PropertyOptionsBuilder({ ...this['~options'], lazy, ref });
  }

  /**
   * Set true to define entity's unique primary key identifier.
   *
   * @see https://mikro-orm.io/docs/decorators#primarykey
   */
  primary(primary = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], primary });
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
  setter(setter = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], setter });
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
  getter(getter = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], getter });
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
  getterName(getterName: string): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], getterName });
  }

  /**
   * Set to define serialized primary key for MongoDB. (virtual)
   * Alias for `@SerializedPrimaryKey()` decorator.
   *
   * @see https://mikro-orm.io/docs/decorators#serializedprimarykey
   */
  serializedPrimaryKey(serializedPrimaryKey = true): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], serializedPrimaryKey });
  }

  /**
   * Set to use serialize property. Allow to specify a callback that will be used when serializing a property.
   *
   * @see https://mikro-orm.io/docs/serializing#property-serializers
   */
  serializer(serializer: (value: Value, options?: SerializeOptions<any>) => any): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], serializer });
  }

  /**
   * Specify name of key for the serialized value.
   */
  serializedName(serializedName: string): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], serializedName });
  }

  /**
   * Specify serialization groups for `serialize()` calls. If a property does not specify any group, it will be included,
   * otherwise only properties with a matching group are included.
   */
  groups(...groups: string[]): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], groups });
  }

  /**
   * Specify a custom order based on the values. (SQL only)
   */
  customOrder(...customOrder: (string[] | number[] | boolean[])): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], customOrder });
  }

  /**
   * Specify comment of column for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  comment(comment: string): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], comment });
  }

  /** mysql only */
  extra(extra: string): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], extra });
  }

  /**
   * Set to avoid a perpetual diff from the {@link https://mikro-orm.io/docs/schema-generator Schema Generator} when columns are generated.
   *
   * @see https://mikro-orm.io/docs/defining-entities#sql-generated-columns
   */
  ignoreSchemaChanges(...ignoreSchemaChanges: ('type' | 'extra' | 'default')[]): PropertyOptionsBuilder<Value> {
    return new PropertyOptionsBuilder({ ...this['~options'], ignoreSchemaChanges });
  }

}

class EnumOptionsBuilder<Value> extends PropertyOptionsBuilder<Value> {

  declare '~options': { enum: true } & EnumOptions<any>;

  constructor(options: EnumOptionsBuilder<Value>['~options']) {
    super(options);
    this['~options'] = options;
  }

  array<T extends boolean = true>(array: T = true as T): EnumOptionsBuilder<T extends true ? Value[] : UnwrapArray<Value>> {
    return new EnumOptionsBuilder({ ...this['~options'], array });
  }

  /** for postgres, by default it uses text column with check constraint */
  nativeEnumName(nativeEnumName: string): EnumOptionsBuilder<Value> {
    return new EnumOptionsBuilder({ ...this['~options'], nativeEnumName });
  }

}

class ReferenceOptionsBuilder<Target extends object> extends PropertyOptionsBuilder<Target> {

  declare '~options': ReferenceOptions<any, Target>;

  constructor(options: ReferenceOptionsBuilder<Target>['~options']) {
    super(options);
    this['~options'] = options;
  }

  /** Set what actions on owning entity should be cascaded to the relationship. Defaults to [Cascade.PERSIST, Cascade.MERGE] (see {@doclink cascading}). */
  cascade(cascade: Cascade[]): ReferenceOptionsBuilder<Target> {
    return new ReferenceOptionsBuilder({ ...this['~options'], cascade });
  }

  /** Always load the relationship. Discouraged for use with to-many relations for performance reasons. */
  eager(eager = true): ReferenceOptionsBuilder<Target> {
    return new ReferenceOptionsBuilder({ ...this['~options'], eager });
  }

  /** Override the default loading strategy for this property. This option has precedence over the global `loadStrategy`, but can be overridden by `FindOptions.strategy`. */
  strategy(strategy: LoadStrategy | `${LoadStrategy}`): ReferenceOptionsBuilder<Target> {
    return new ReferenceOptionsBuilder({ ...this['~options'], strategy });
  }

}

class ManyToOneOptionsBuilder<Target extends object> extends ReferenceOptionsBuilder<Target> {

  declare '~options': ({ kind: 'm:1'; entity: () => Target } & ManyToOneOptions<any, Target>);

  constructor(options: ManyToOneOptionsBuilder<Target>['~options']) {
    super(options);
    this['~options'] = options;
  }

  /** Point to the inverse side property name. */
  inversedBy(inversedBy: (string & keyof Target) | ((e: Target) => any)): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], inversedBy });
  }

  /** Wrap the entity in {@apilink Reference} wrapper. */
  override ref<T extends boolean = true>(ref: T = true as T): ManyToOneOptionsBuilder<T extends true ? ScalarReference<Target> : UnwrapRef<Target>> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], ref }) as any;
  }

  /** Use this relation as a primary key. */
  override primary(primary = true): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], primary });
  }

  /** Map this relation to the primary key value instead of an entity. */
  mapToPk(mapToPk = true): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], mapToPk });
  }

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  joinColumn(joinColumn: string): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], joinColumn });
  }

  /** Override the default database column name on the owning side (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  joinColumns(joinColumns: string[]): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], joinColumns });
  }

  /** When a part of a composite column is shared in other properties, use this option to specify what columns are considered as owned by this property. This is useful when your composite property is nullable, but parts of it are not. */
  ownColumns(ownColumns: string[]): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], ownColumns });
  }

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is only for simple properties represented by a single column. */
  referenceColumnName(referenceColumnName: string): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], referenceColumnName });
  }

  /** Override the default database column name on the target entity (see {@doclink naming-strategy | Naming Strategy}). This option is suitable for composite keys, where one property is represented by multiple columns. */
  referencedColumnNames(referencedColumnNames: string[]): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], referencedColumnNames });
  }

  /** What to do when the target entity gets deleted. */
  deleteRule(deleteRule: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], deleteRule });
  }

  /** What to do when the reference to the target entity gets updated. */
  updateRule(updateRule: 'cascade' | 'no action' | 'set null' | 'set default' | AnyString): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], updateRule });
  }

  /** Set the constraint type. Immediate constraints are checked for each statement, while deferred ones are only checked at the end of the transaction. Only for postgres unique constraints. */
  deferMode(deferMode: DeferMode | `${DeferMode}`): ManyToOneOptionsBuilder<Target> {
    return new ManyToOneOptionsBuilder({ ...this['~options'], deferMode });
  }

}


function createPropertyBuilders<Types extends Record<string, any>>(options: Types): {
  [K in keyof Types]: () => PropertyOptionsBuilder<InferPropertyValueType<Types[K]>>;
} {
  return Object.fromEntries(Object.entries(options).map(([key, value]) => [key, () => new PropertyOptionsBuilder(value)])) as any;
}

const propertyBuilders = {
	...createPropertyBuilders(types),
	json: <T,>() => new PropertyOptionsBuilder<T>({ type: 'json' }),

	type: <T extends PropertyValueType>(type: T) =>
		new PropertyOptionsBuilder<InferPropertyValueType<T>>({ type }),

	enum: <const T extends (number | string)[] | (() => Dictionary)>(items?: T) =>
		new EnumOptionsBuilder<T extends () => Dictionary ? ValueOf<ReturnType<T>> : T extends (infer Value)[] ? Value : T>({
			enum: true,
			items,
		}),

	manyToOne: <Target extends EntitySchema<any, any>>(target: Target) =>
		new ManyToOneOptionsBuilder<Reference<InferEntity<Target>>>({
			entity: () => target as any,
			kind: 'm:1',
			ref: true,
		}),
};

function getBuilderOptions(builder: any) {
  return '~options' in builder ? builder['~options'] : builder;
}

export function defineEntity<Properties extends Record<string, any>>(
  meta: Omit<Partial<EntityMetadata<InferEntityFromProperties<Properties>>>, 'properties' | 'extends'> & {
    name: string;
    properties: ((properties: typeof propertyBuilders) => Properties);
  }): EntitySchema<InferEntityFromProperties<Properties>, never> {
  const { properties: getProperties, ...options } = meta;
  const propertyEntries = getProperties(propertyBuilders);
  const properties = Object.fromEntries(Object.entries(propertyEntries)
    .filter(([_, builder]) => typeof builder === 'object')
    .map(([key, builder]) => [key, getBuilderOptions(builder)]),
  );
  for (const [key, builder] of Object.entries(properties)) {
    if (typeof builder === 'function') {
      Object.defineProperty(properties, key, {
        get: () => getBuilderOptions(builder()),
      });
    }
  }
  return new EntitySchema({ properties, ...options } as any);
}


type PropertyValueType = PropertyOptions<any>['type'];

type InferPropertyValueType<T extends PropertyValueType> = T extends string ? InferTypeByString<T> :
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
  T extends ColumnType ? InferColumnType<T> :
  any;

type InferJSType<T> = T extends typeof Type<infer TValue, any> ? NonNullable<TValue> : never;

type InferColumnType<T extends ColumnType> =
  T extends 'int' | 'int4' | 'integer' | 'bigint' | 'int8' | 'int2' | 'tinyint' | 'smallint' | 'mediumint' ? number :
  T extends 'double' | 'double precision' | 'real' | 'float8' | 'decimal' | 'numeric' | 'float' | 'float4' ? number :
  T extends 'datetime' | 'time' | 'time with time zone' | 'timestamp' | 'timestamp with time zone' | 'timetz' | 'timestamptz' | 'date' | 'interval' ? Date :
  T extends 'character varying' | 'varchar' | 'char' | 'character' | 'uuid' | 'text' | 'tinytext' | 'mediumtext' | 'longtext' | 'enum' ? string :
  T extends 'boolean' | 'bool' | 'bit' ? boolean :
  T extends 'blob' | 'tinyblob' | 'mediumblob' | 'longblob' | 'bytea' ? Buffer :
  T extends 'point' | 'line' | 'lseg' | 'box' | 'circle' | 'path' | 'polygon' | 'geometry' ? number[] :
  T extends 'tsvector' | 'tsquery' ? string[] :
  T extends 'json' | 'jsonb' ? any :
  never;

type InferEntityFromProperties<Properties extends Record<string, any>> = {
  [K in keyof Properties]: Properties[K] extends (() => any) ? InferBuilderValue<ReturnType<Properties[K]>> :
  InferBuilderValue<Properties[K]>;
};

type InferBuilderValue<Builder> = Builder extends { '~type'?: { value: infer T } } ? T : never;

export type InferEntity<Schema> = Schema extends EntitySchema<infer Entity, any> ? Entity : never;

type UnwrapRef<T> = T extends ScalarReference<any> ? UnwrapScalarReference<T> :
  T extends Reference<any> ? UnwrapReference<T> :
  T;

type UnwrapScalarReference<T extends ScalarReference<any>> = T extends ScalarReference<infer Value> ? Value : T;

type UnwrapReference<T extends Reference<any>> = T extends Reference<infer Value> ? Value : T;

type UnwrapArray<T> = T extends (infer Value)[] ? Value : T;

type ValueOf<T extends Dictionary> = T[keyof T];
