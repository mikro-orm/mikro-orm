import {
  type AnyEntity,
  type AutoPath,
  type Collection,
  type ConnectionType,
  type Dictionary,
  type EntityData,
  type EntityDTO,
  type EntityDTOFlat,
  type EntityDTOProp,
  type EntityKey,
  type EntityManager,
  type EntityMetadata,
  type EntityName,
  type EntityProperty,
  type ExpandProperty,
  type FilterObject,
  type FilterOptions,
  type FilterQuery,
  type FilterValue,
  type FlatQueryOrderMap,
  type FlushMode,
  type GroupOperator,
  helper,
  inspect,
  isRaw,
  type Loaded,
  LoadStrategy,
  LockMode,
  type LoggingOptions,
  type MetadataStorage,
  type PrimaryProperty,
  type ObjectQuery,
  PopulateHint,
  type PopulateOptions,
  type PopulatePath,
  QueryFlag,
  QueryHelper,
  type QueryOrderKeysFlat,
  type QueryOrderMap,
  type QueryResult,
  raw,
  RawQueryFragment,
  Reference,
  ReferenceKind,
  type Raw,
  type RequiredEntityData,
  type Scalar,
  serialize,
  type SerializeDTO,
  type Subquery,
  type Transaction,
  Utils,
  ValidationError,
} from '@mikro-orm/core';
import { JoinType, QueryType } from './enums.js';
import type { AbstractSqlDriver } from '../AbstractSqlDriver.js';
import { type Alias, type OnConflictClause, QueryBuilderHelper } from './QueryBuilderHelper.js';
import type { SqlEntityManager } from '../SqlEntityManager.js';
import { CriteriaNodeFactory } from './CriteriaNodeFactory.js';
import type { ICriteriaNodeProcessOptions, InternalField, IQueryBuilder, JoinOptions } from '../typings.js';
import type { AbstractSqlPlatform } from '../AbstractSqlPlatform.js';
import { NativeQueryBuilder } from './NativeQueryBuilder.js';
import type { AbstractSqlConnection } from '../AbstractSqlConnection.js';

export interface ExecuteOptions {
  mapResults?: boolean;
  mergeResults?: boolean;
}

export interface QBStreamOptions {
  /**
   * Results are mapped to entities, if you set `mapResults: false` you will get POJOs instead.
   *
   * @default true
   */
  mapResults?: boolean;

  /**
   * When populating to-many relations, the ORM streams fully merged entities instead of yielding every row.
   * You can opt out of this behavior by specifying `mergeResults: false`. This will yield every row from
   * the SQL result, but still mapped to entities, meaning that to-many collections will contain at most
   * one item, and you will get duplicate root entities when they have multiple items in the populated
   * collection.
   *
   * @default true
   */
  mergeResults?: boolean;

  /**
   * When enabled, the driver will return the raw database results without renaming the fields to match the entity property names.
   *
   * @default false
   */
  rawResults?: boolean;
}

type IsNever<T, True = true, False = false> = [T] extends [never] ? True : False;
type GetAlias<T extends string> = T extends `${infer A}.${string}` ? A : never;
type GetPropName<T extends string> = T extends `${string}.${infer P}` ? P : T;
type AppendToHint<Parent extends string, Child extends string> = `${Parent}.${Child}`;

/**
 * Context tuple format: [Path, Alias, Type, Select]
 * - Path: The relation path from root entity (e.g., 'books', 'books.author')
 * - Alias: The SQL alias used in the query (e.g., 'b', 'a1')
 * - Type: The entity type of the joined relation
 * - Select: Whether this join was created via joinAndSelect (affects Fields tracking)
 *
 * Example: After `qb.leftJoin('a.books', 'b')`, Context becomes:
 * { b: ['books', 'b', Book, false] }
 */
type AddToContext<Type extends object, Context, Field extends string, Alias extends string, Select extends boolean> = {
  [K in Alias]: [GetPath<Context, Field>, K, ExpandProperty<Type[GetPropName<Field> & keyof Type]>, Select];
};

type GetPath<Context, Field extends string> =
  GetAlias<Field> extends infer Alias
    ? IsNever<Alias> extends true
      ? GetPropName<Field>
      : Alias extends keyof Context
        ? Context[Alias] extends [infer Path, ...any[]]
          ? AppendToHint<Path & string, GetPropName<Field>>
          : GetPropName<Field>
        : GetPropName<Field>
    : GetPropName<Field>;

type GetType<Type extends object, Context, Field extends string> =
  GetAlias<Field> extends infer Alias
    ? IsNever<Alias> extends true
      ? Type
      : [Context] extends [never]
        ? Type
        : Alias extends keyof Context
          ? Context[Alias] extends [string, string, infer PropType, any]
            ? PropType & object
            : Type
          : Type
    : Type;

type AddToHint<RootAlias, Context, Field extends string, Select extends boolean = false> = Select extends true
  ? GetAlias<Field> extends infer Alias
    ? IsNever<Alias> extends true
      ? GetPropName<Field>
      : Alias extends RootAlias
        ? GetPropName<Field>
        : Alias extends keyof Context
          ? Context[Alias] extends [infer Path, ...any[]]
            ? AppendToHint<Path & string, GetPropName<Field>>
            : GetPropName<Field>
          : GetPropName<Field>
    : GetPropName<Field>
  : never;

export type ModifyHint<RootAlias, Context, Hint extends string, Field extends string, Select extends boolean = false> =
  | Hint
  | AddToHint<RootAlias, Context, Field, Select>;

// Simplified ModifyContext - removed depth tracking for performance
// Depth limiting is handled by TypeScript's own recursion limits
export type ModifyContext<Entity extends object, Context, Field extends string, Alias extends string, Select extends boolean = false> =
  IsNever<Context> extends true
    ? AddToContext<GetType<Entity, object, Field>, object, Field, Alias, Select>
    : Context & AddToContext<GetType<Entity, Context, Field>, Context, Field, Alias, Select>;

// ============================================
// Fields tracking helper types
// ============================================

// Strip root alias prefix from a field path
// - 'a.name' with RootAlias='a' -> 'name'
// - 'a.identity.foo' with RootAlias='a' -> 'identity.foo'
// - 'b.title' with RootAlias='a' and 'b' in Context -> never (joined entity field)
// - 'identity.foo' with RootAlias='a' (embedded path, 'identity' not an alias) -> 'identity.foo'
// - 'name' (no dots) -> 'name'
type StripRootAlias<F extends string, RootAlias extends string, Context = never> = F extends `${RootAlias}.${infer Field}`
  ? Field
  : F extends `${infer Alias}.${string}`
    ? // Check if the first segment is a known joined alias
      Alias extends AliasNames<Context>
      ? never
      : // Otherwise it's an embedded property path on root entity
        F
    : F;

// Strip ' as alias' suffix from a field path
type StripFieldAlias<F extends string> = F extends `${infer Path} as ${string}` ? Path : F;

// Extract root entity fields from selected fields
// Context is needed to distinguish between joined alias paths and embedded property paths
type ExtractRootFields<Fields, RootAlias extends string, Context = never> = [Fields] extends ['*']
  ? '*'
  : Fields extends `${RootAlias}.*`
    ? '*'
    : Fields extends string
      ? StripRootAlias<StripFieldAlias<Fields>, RootAlias, Context>
      : never;

// Prefix field with relation path: ('books', 'title') -> 'books.title'
type PrefixWithPath<Path extends string, Field extends string> = `${Path}.${Field}`;

// Strip alias prefix from join field: ('b.title', 'b') -> 'title', ('title', 'b') -> 'title'
type StripJoinAlias<F extends string, Alias extends string> = F extends `${Alias}.${infer Field}` ? Field : F;

// Valid field names for joinAndSelect partial loading: plain key or alias-prefixed key
// Uses `keyof` instead of EntityKey for performance (O(1) vs O(n)), consistent with ContextFieldKeys
export type JoinSelectField<JoinedEntity, Alias extends string> =
  | (keyof JoinedEntity & string)
  | `${Alias}.${keyof JoinedEntity & string}`;

// Add fields from joinAndSelect to the Fields hint
// Uses AddToHint to compute the correct path based on Context
// Strips the alias prefix from fields before adding the property path
type AddJoinFields<
  RootAlias,
  Context,
  Field extends string,
  Alias extends string,
  JoinFields extends readonly string[],
> = JoinFields extends readonly (infer F)[]
  ? F extends string
    ? PrefixWithPath<AddToHint<RootAlias, Context, Field, true> & string, StripJoinAlias<F, Alias>>
    : never
  : never;

// Modify Fields by adding join fields (when fields param is provided to joinAndSelect)
export type ModifyFields<
  CurrentFields extends string,
  RootAlias,
  Context,
  Field extends string,
  Alias extends string,
  JoinFields extends readonly string[] | undefined,
> = JoinFields extends readonly string[] ? CurrentFields | AddJoinFields<RootAlias, Context, Field, Alias, JoinFields> : CurrentFields;

type EntityRelations<T> = EntityKey<T, true>;

// Extract the joined entity type from a field path (e.g., 'f.user' -> User type)
type JoinedEntityType<Entity extends object, Context, Field extends string> = ExpandProperty<
  GetType<Entity, Context, Field>[GetPropName<Field> & keyof GetType<Entity, Context, Field>]
>;

// Get Context keys (all keys are valid now that depth tracking is removed)
type ContextKeys<C> = keyof C;

// Extract alias names from Context
type AliasNames<Context> = Context[keyof Context] extends infer Join
  ? Join extends any
    ? Join extends [string, infer Alias, any, any]
      ? Alias & string
      : never
    : never
  : never;

// Extract relation keys from Context for autocomplete
// Uses EntityRelations which filters to only relation properties
type ContextRelationKeys<Context> = Context[keyof Context] extends infer Join
  ? Join extends any
    ? Join extends [string, infer Alias, infer Type, any]
      ? `${Alias & string}.${EntityRelations<Type & object>}`
      : never
    : never
  : never;

// For JOIN methods - provides autocomplete for relation fields from entity and context
export type QBField<Entity, RootAlias extends string, Context> =
  | EntityRelations<Entity>
  | `${RootAlias}.${EntityRelations<Entity>}`
  | ([Context] extends [never] ? never : ContextRelationKeys<Context>);

// Extract all 'alias.key' patterns from Context for autocomplete in Field
// Uses keyof instead of EntityKey for performance (O(1) vs O(n))
type ContextFieldKeys<Context> = Context[keyof Context] extends infer Join
  ? Join extends any
    ? Join extends [string, infer Alias, infer Type, any]
      ? `${Alias & string}.${keyof Type & string}`
      : never
    : never
  : never;

// Helper type to add ' as alias' variants
type WithAlias<T extends string> = T | `${T} as ${string}`;

// Field type for select/where/etc. - provides autocomplete and validates
export type Field<Entity, RootAlias extends string = never, Context = never> =
  // Autocomplete hints (computed union for IDE support)
  | WithAlias<EntityKey<Entity>>
  | (IsNever<RootAlias> extends true ? never : WithAlias<`${RootAlias}.${EntityKey<Entity>}`> | `${RootAlias}.*`)
  | ([Context] extends [never] ? never : WithAlias<ContextFieldKeys<Context>> | `${AliasNames<Context>}.*`)
  | '*'
  | QueryBuilder<any>
  | NativeQueryBuilder
  | RawQueryFragment<any>
  | (RawQueryFragment & symbol);

// Split mapped types for orderBy (better caching)
type RootAliasOrderKeys<RootAlias extends string, Entity> = { [K in `${RootAlias}.${EntityKey<Entity>}`]?: QueryOrderKeysFlat };
type ContextOrderKeys<Context> = { [K in ContextFieldKeys<Context>]?: QueryOrderKeysFlat };

// Context-aware orderBy map that supports aliased keys
// Uses split mapped types for better TypeScript caching
type RawOrderKeys<RawAliases extends string> = { [K in RawAliases]?: QueryOrderKeysFlat };

export type ContextOrderByMap<Entity, RootAlias extends string = never, Context = never, RawAliases extends string = never> =
  | QueryOrderMap<Entity>
  | ((IsNever<RootAlias> extends true ? {} : RootAliasOrderKeys<RootAlias, Entity>) & ([Context] extends [never] ? {} : ContextOrderKeys<Context>) & (IsNever<RawAliases> extends true ? {} : string extends RawAliases ? {} : RawOrderKeys<RawAliases>));

// Validate aliased paths like 'f.address.city' or 'f.*'
type AliasedPath<Alias extends string, Type, P extends string> = P extends `${Alias}.*`
  ? P
  : P extends `${Alias}.${infer Rest}`
    ? `${Alias}.${AutoPath<Type & object, Rest, `${PopulatePath.ALL}`>}`
    : never;

// Extract and validate paths from Context
type ContextAliasedPath<Context, P extends string> = Context[keyof Context] extends infer Join
  ? Join extends any
    ? Join extends [string, infer Alias, infer Type, any]
      ? AliasedPath<Alias & string, Type, P>
      : never
    : never
  : never;

// Validate nested paths: 'foo', 'f.foo', 'u.foo', '*', 'f.*', 'u.*'
// Note: '*' is handled by AutoPath via PopulatePath.ALL
// Excludes ':ref' patterns which are only valid for populate hints, not select fields
type NestedAutoPath<Entity, RootAlias extends string, Context, P extends string> = P extends `${string}:ref`
  ? never
  : P extends `${infer Path} as ${string}`
    ? (AliasedPath<RootAlias, Entity, Path> | ContextAliasedPath<Context, Path> | AutoPath<Entity, Path, `${PopulatePath.ALL}`>) extends never ? never : P
    : AliasedPath<RootAlias, Entity, P> | ContextAliasedPath<Context, P> | AutoPath<Entity, P, `${PopulatePath.ALL}`>;

// Aliased object query that maps 'alias.property' keys to their filter values
type AliasedObjectQuery<Entity extends object, Alias extends string> = {
  [K in EntityKey<Entity> as `${Alias}.${K}`]?: ObjectQuery<Entity>[K];
};

// Join condition type - supports both direct properties and aliased properties
// Overrides $not/$or/$and to accept aliased keys at all nesting levels
type JoinCondition<JoinedEntity extends object, Alias extends string> = (ObjectQuery<JoinedEntity> | AliasedObjectQuery<JoinedEntity, Alias>) & {
  $not?: JoinCondition<JoinedEntity, Alias>;
  $or?: JoinCondition<JoinedEntity, Alias>[];
  $and?: JoinCondition<JoinedEntity, Alias>[];
};

// Condition type for raw/subquery joins where we don't know the entity type
// Uses string keys with filter values instead of permissive Dictionary
type RawJoinCondition = {
  [key: string]: FilterValue<Scalar> | RawQueryFragment;
};

// Extract raw aliases from a field type (for sql`...`.as('alias') or 'prop as alias')
type ExtractRawAliasFromField<F> =
  F extends RawQueryFragment<infer A> ? (A extends string ? A : never) :
  F extends `${string} as ${infer A}` ? A :
  never;

// Extract all raw aliases from a tuple of fields (preserves literal types)
type ExtractRawAliasesFromTuple<T extends readonly unknown[]> = T extends readonly [infer Head, ...infer Tail]
  ? ExtractRawAliasFromField<Head> | ExtractRawAliasesFromTuple<Tail>
  : never;

// Extract all raw aliases from an array of fields
type ExtractRawAliases<Fields> = Fields extends readonly unknown[] ? ExtractRawAliasesFromTuple<Fields> : ExtractRawAliasFromField<Fields>;

// Flat operator map for aliased keys - no recursive $and/$or/$not (those are handled by GroupOperators)
// This is significantly cheaper to instantiate than full OperatorMap<T> which has recursive types
type FlatOperatorMap = {
  $eq?: Scalar | readonly Scalar[] | Subquery | null;
  $ne?: Scalar | readonly Scalar[] | Subquery | null;
  $in?: readonly Scalar[] | Raw | Subquery;
  $nin?: readonly Scalar[] | Raw | Subquery;
  $gt?: Scalar | Subquery;
  $gte?: Scalar | Subquery;
  $lt?: Scalar | Subquery;
  $lte?: Scalar | Subquery;
  $like?: string;
  $re?: string;
  $ilike?: string;
  $fulltext?: string;
  $overlap?: readonly string[] | string | object;
  $contains?: readonly string[] | string | object;
  $contained?: readonly string[] | string | object;
  $exists?: boolean;
  $hasKey?: string;
  $hasKeys?: readonly string[];
  $hasSomeKeys?: readonly string[];
};

// Filter value for aliased keys - simpler than FilterValue<Scalar> (no recursive operators)
// Accepts: scalar values, operator maps, arrays, null, and subqueries
type AliasedFilterValue = Scalar | FlatOperatorMap | readonly Scalar[] | null | QueryBuilder<any> | NativeQueryBuilder;

// Type-aware filter value that uses the property type for better validation
// Uses ExpandProperty to unwrap Collection/Reference types
type TypedAliasedFilterValue<T> = FilterValue<ExpandProperty<T>> | QueryBuilder<any> | NativeQueryBuilder;

// Filter value that can include subqueries (QueryBuilder, NativeQueryBuilder)
// Used for record-based where() overloads
type QBFilterValue = FilterValue<Scalar> | QueryBuilder<any> | NativeQueryBuilder;

// Split mapped types for better TypeScript caching
// Each part can be cached independently
// Plain entity keys are NOT included here - they go through ObjectQuery<Entity> in the union

// Root alias keys are type-aware: 'a.name' validates against the actual property type
type RootAliasFilterKeys<RootAlias extends string, Entity> = {
  [K in EntityKey<Entity> as `${RootAlias}.${K}`]?: TypedAliasedFilterValue<Entity[K]>;
};

// Context keys use simpler AliasedFilterValue for performance
// (type-aware version would require expensive conditional type inference)
type ContextFilterKeys<Context> = { [K in ContextFieldKeys<Context>]?: AliasedFilterValue };
type RawFilterKeys<RawAliases extends string> = { [K in RawAliases]?: AliasedFilterValue };

// Internal type for nested filter conditions in group operators ($and, $or, $not)
// Uses intersection to ensure unknown aliased keys are caught by excess property checking
type NestedFilterCondition<Entity, RootAlias extends string, Context, RawAliases extends string> =
  ObjectQuery<Entity> &
  (IsNever<RootAlias> extends true ? {} : string extends RootAlias ? {} : RootAliasFilterKeys<RootAlias, Entity>) &
  ([Context] extends [never] ? {} : ContextFilterKeys<Context>) &
  (IsNever<RawAliases> extends true ? {} : string extends RawAliases ? {} : RawFilterKeys<RawAliases>);

// Group operators type that accepts both plain entity keys and aliased keys
type GroupOperators<RootAlias extends string, Context, Entity, RawAliases extends string> = {
  $and?: NestedFilterCondition<Entity, RootAlias, Context, RawAliases>[];
  $or?: NestedFilterCondition<Entity, RootAlias, Context, RawAliases>[];
  $not?: NestedFilterCondition<Entity, RootAlias, Context, RawAliases>;
};

// Aliased keys filter condition - split into separate intersected parts for better caching
// Guards against widened `string` types for RootAlias/RawAliases to prevent string index signatures
export type AliasedFilterCondition<RootAlias extends string, Context, Entity, RawAliases extends string = never> =
  (IsNever<RootAlias> extends true ? {} : string extends RootAlias ? {} : RootAliasFilterKeys<RootAlias, Entity>) &
  ([Context] extends [never] ? {} : ContextFilterKeys<Context>) &
  (IsNever<RawAliases> extends true ? {} : string extends RawAliases ? {} : RawFilterKeys<RawAliases>) &
  GroupOperators<RootAlias, Context, Entity, RawAliases>;

// Context-aware filter query for QueryBuilder
// Uses intersection (not union) so that unknown aliased keys trigger excess property errors
export type QBFilterQuery<Entity, RootAlias extends string = never, Context = never, RawAliases extends string = never> =
  FilterObject<Entity> & AliasedFilterCondition<RootAlias, Context, Entity, RawAliases>;

/** Matches 'path as alias' — safe because ORM property names are JS identifiers (no spaces). */
const FIELD_ALIAS_RE = /^(.+?)\s+as\s+(\w+)$/i;

/**
 * SQL query builder with fluent interface.
 *
 * ```ts
 * const qb = orm.em.createQueryBuilder(Publisher);
 * qb.select('*')
 *   .where({
 *     name: 'test 123',
 *     type: PublisherType.GLOBAL,
 *   })
 *   .orderBy({
 *     name: QueryOrder.DESC,
 *     type: QueryOrder.ASC,
 *   })
 *   .limit(2, 1);
 *
 * const publisher = await qb.getSingleResult();
 * ```
 */
export class QueryBuilder<
  Entity extends object = AnyEntity,
  RootAlias extends string = never,
  Hint extends string = never,
  Context extends object = never,
  RawAliases extends string = never,
  Fields extends string = '*',
> implements Subquery {
  declare readonly __subquery: true;

  get mainAlias(): Alias<Entity> {
    this.ensureFromClause();
    return this._mainAlias!;
  }

  get alias(): string {
    return this.mainAlias.aliasName;
  }

  get helper(): QueryBuilderHelper {
    this.ensureFromClause();
    return this._helper!;
  }

  get type(): QueryType {
    return this._type ?? QueryType.SELECT;
  }

  /** @internal */
  declare _type?: QueryType;
  /** @internal */
  declare _fields?: InternalField<Entity>[];
  /** @internal */
  _populate: PopulateOptions<Entity>[] = [];
  /** @internal */
  declare _populateWhere?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`;
  /** @internal */
  declare _populateFilter?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`;
  /** @internal */
  declare __populateWhere?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`;
  /** @internal */
  _populateMap: Dictionary<string> = {};

  protected aliasCounter = 0;
  protected flags: Set<QueryFlag> = new Set([QueryFlag.CONVERT_CUSTOM_TYPES]);
  protected finalized = false;
  protected populateHintFinalized = false;
  protected _joins: Dictionary<JoinOptions> = {};
  protected _explicitAlias = false;
  protected _schema?: string;
  protected _cond: Dictionary = {};
  protected _data!: Dictionary;
  protected _orderBy: QueryOrderMap<Entity>[] = [];
  protected _groupBy: InternalField<Entity>[] = [];
  protected _having: Dictionary = {};
  protected _returning?: InternalField<Entity>[];
  protected _onConflict?: OnConflictClause<Entity>[];
  protected _limit?: number;
  protected _offset?: number;
  protected _distinctOn?: string[];
  protected _joinedProps = new Map<string, PopulateOptions<any>>();
  protected _cache?: boolean | number | [string, number];
  protected _indexHint?: string;
  protected _collation?: string;
  protected _comments: string[] = [];
  protected _hintComments: string[] = [];
  protected flushMode?: FlushMode;
  protected lockMode?: LockMode;
  protected lockTables?: string[];
  protected subQueries: Dictionary<string> = {};
  protected _mainAlias?: Alias<Entity>;
  protected _aliases: Dictionary<Alias<any>> = {};
  protected _tptAlias: Dictionary<string> = {}; // maps entity className to alias for TPT parent tables
  protected _helper?: QueryBuilderHelper;
  protected _query?: { sql?: string; params?: readonly unknown[]; qb: NativeQueryBuilder };
  protected _unionQuery?: { sql: string; params: readonly unknown[] };
  protected readonly platform: AbstractSqlPlatform;
  private tptJoinsApplied = false;
  private readonly autoJoinedPaths: string[] = [];

  /**
   * @internal
   */
  constructor(
    entityName: EntityName<Entity> | QueryBuilder<Entity, any, any, any>,
    protected readonly metadata: MetadataStorage,
    protected readonly driver: AbstractSqlDriver,
    protected readonly context?: Transaction,
    alias?: string,
    protected connectionType?: ConnectionType,
    protected em?: SqlEntityManager,
    protected loggerContext?: LoggingOptions & Dictionary,
  ) {
    this.platform = this.driver.getPlatform();

    if (alias) {
      this.aliasCounter++;
      this._explicitAlias = true;
    }

    // @ts-expect-error union type does not match the overloaded method signature
    this.from(entityName, alias);
  }

  /**
   * Creates a SELECT query, specifying the fields to retrieve.
   *
   * @example
   * ```ts
   * // Select specific fields
   * const qb = em.createQueryBuilder(User, 'u');
   * qb.select(['u.id', 'u.name', 'u.email']);
   *
   * // Select with raw expressions
   * qb.select([raw('count(*) as total')]);
   *
   * // Select with aliases (works for regular and formula properties)
   * qb.select(['id', 'fullName as displayName']);
   * qb.select(['id', sql.ref('fullName').as('displayName')]);
   *
   * // Select with distinct
   * qb.select('*', true);
   * ```
   */
  select<const F extends readonly Field<Entity, RootAlias, Context>[]>(
    fields: F,
    distinct?: boolean,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases | ExtractRawAliases<F>, ExtractRootFields<F[number] & string, RootAlias, Context>>;
  /**
   * Creates a SELECT query, specifying the fields to retrieve.
   *
   * @example
   * ```ts
   * // Select specific fields
   * const qb = em.createQueryBuilder(User, 'u');
   * qb.select(['u.id', 'u.name', 'u.email']);
   *
   * // Select with raw expressions
   * qb.select([raw('count(*) as total')]);
   *
   * // Select with distinct
   * qb.select('*', true);
   * ```
   */
  select<const P extends string>(
    fields: readonly NestedAutoPath<Entity, RootAlias, Context, P>[],
    distinct?: boolean,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, ExtractRootFields<P, RootAlias, Context>>;
  /**
   * Creates a SELECT query, specifying the fields to retrieve.
   *
   * @example
   * ```ts
   * // Select specific fields with nested paths (e.g., for embedded properties)
   * const qb = em.createQueryBuilder(User, 'u');
   * qb.select('address.city');
   * ```
   */
  select<const P extends string>(
    fields: NestedAutoPath<Entity, RootAlias, Context, P>,
    distinct?: boolean,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, ExtractRootFields<P, RootAlias, Context>>;
  /**
   * Creates a SELECT query, specifying the fields to retrieve.
   *
   * @example
   * ```ts
   * // Select specific fields
   * const qb = em.createQueryBuilder(User, 'u');
   * qb.select(['u.id', 'u.name', 'u.email']);
   *
   * // Select with raw expressions
   * qb.select([raw('count(*) as total')]);
   *
   * // Select with distinct
   * qb.select('*', true);
   * ```
   */
  select<const F extends Field<Entity, RootAlias, Context>>(
    fields: F,
    distinct?: boolean,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases | ExtractRawAliases<readonly [F]>, ExtractRootFields<F & string, RootAlias, Context>>;
  select(fields: unknown, distinct = false): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, any> {
    this.ensureNotFinalized();
    this._fields = Utils.asArray(fields as Field<Entity, RootAlias, Context>[]).flatMap(f => {
      if (typeof f !== 'string') {
        // Normalize sql.ref('prop') and sql.ref('prop').as('alias') to string form
        if (isRaw(f) && f.sql === '??' && f.params.length === 1) {
          return this.resolveNestedPath(String(f.params[0]));
        }

        if (isRaw(f) && f.sql === '?? as ??' && f.params.length === 2) {
          return `${this.resolveNestedPath(String(f.params[0]))} as ${String(f.params[1])}`;
        }

        return f;
      }

      const asMatch = f.match(FIELD_ALIAS_RE);

      if (asMatch) {
        return `${this.resolveNestedPath(asMatch[1].trim())} as ${asMatch[2]}`;
      }

      return this.resolveNestedPath(f);
    }) as any;

    if (distinct) {
      this.flags.add(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.SELECT) as any;
  }

  /**
   * Adds fields to an existing SELECT query.
   */
  addSelect<const F extends Field<Entity, RootAlias, Context> | readonly Field<Entity, RootAlias, Context>[]>(
    fields: F,
  ): SelectQueryBuilder<
    Entity,
    RootAlias,
    Hint,
    Context,
    RawAliases | ExtractRawAliases<F extends readonly unknown[] ? F : [F]>,
    Fields | ExtractRootFields<F extends readonly (infer U)[] ? U & string : F & string, RootAlias, Context>
  > {
    this.ensureNotFinalized();

    if (this._type && this._type !== QueryType.SELECT) {
      return this as any;
    }

    return this.select([...Utils.asArray(this._fields), ...Utils.asArray(fields as string)] as any) as any;
  }

  distinct(): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    this.ensureNotFinalized();
    return this.setFlag(QueryFlag.DISTINCT) as SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  }

  /** postgres only */
  distinctOn<const F extends readonly Field<Entity, RootAlias, Context>[]>(fields: F): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  /** postgres only */
  distinctOn<F extends Field<Entity, RootAlias, Context>>(fields: F): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  distinctOn(fields: unknown): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    this.ensureNotFinalized();
    this._distinctOn = Utils.asArray(fields as string);
    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  }

  /**
   * Creates an INSERT query with the given data.
   *
   * @example
   * ```ts
   * await em.createQueryBuilder(User)
   *   .insert({ name: 'John', email: 'john@example.com' })
   *   .execute();
   *
   * // Bulk insert
   * await em.createQueryBuilder(User)
   *   .insert([{ name: 'John' }, { name: 'Jane' }])
   *   .execute();
   * ```
   */
  insert(data: RequiredEntityData<Entity> | RequiredEntityData<Entity>[]): InsertQueryBuilder<Entity, RootAlias, Context> {
    return this.init(QueryType.INSERT, data) as InsertQueryBuilder<Entity, RootAlias, Context>;
  }

  /**
   * Creates an UPDATE query with the given data.
   * Use `where()` to specify which rows to update.
   *
   * @example
   * ```ts
   * await em.createQueryBuilder(User)
   *   .update({ name: 'John Doe' })
   *   .where({ id: 1 })
   *   .execute();
   * ```
   */
  update(data: EntityData<Entity>): UpdateQueryBuilder<Entity, RootAlias, Context> {
    return this.init(QueryType.UPDATE, data) as UpdateQueryBuilder<Entity, RootAlias, Context>;
  }

  /**
   * Creates a DELETE query.
   * Use `where()` to specify which rows to delete.
   *
   * @example
   * ```ts
   * await em.createQueryBuilder(User)
   *   .delete()
   *   .where({ id: 1 })
   *   .execute();
   *
   * // Or pass the condition directly
   * await em.createQueryBuilder(User)
   *   .delete({ isActive: false })
   *   .execute();
   * ```
   */
  delete(cond?: QBFilterQuery<Entity, RootAlias, Context, RawAliases>): DeleteQueryBuilder<Entity, RootAlias, Context> {
    return this.init(QueryType.DELETE, undefined, cond) as DeleteQueryBuilder<Entity, RootAlias, Context>;
  }

  /**
   * Creates a TRUNCATE query to remove all rows from the table.
   */
  truncate(): TruncateQueryBuilder<Entity> {
    return this.init(QueryType.TRUNCATE) as TruncateQueryBuilder<Entity>;
  }

  /**
   * Creates a COUNT query to count matching rows.
   *
   * @example
   * ```ts
   * const count = await em.createQueryBuilder(User)
   *   .count()
   *   .where({ isActive: true })
   *   .execute('get');
   * ```
   */
  count<F extends Field<Entity, RootAlias, Context>>(field?: F | F[], distinct = false): CountQueryBuilder<Entity> {
    if (field) {
      this._fields = Utils.asArray(field as string);
    } else if (distinct || this.hasToManyJoins()) {
      this._fields = this.mainAlias.meta!.primaryKeys;
    } else {
      this._fields = [raw('*')];
    }

    if (distinct) {
      this.flags.add(QueryFlag.DISTINCT);
    }

    return this.init(QueryType.COUNT) as CountQueryBuilder<Entity>;
  }

  /**
   * Adds a JOIN clause to the query for an entity relation.
   *
   * @example
   * ```ts
   * const qb = em.createQueryBuilder(Book, 'b');
   * qb.select('*')
   *   .join('b.author', 'a')
   *   .where({ 'a.name': 'John' });
   * ```
   */
  join<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field,
    alias: Alias,
    cond?: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias>,
    type?: JoinType,
    path?: string,
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field> & {}, ModifyContext<Entity, Context, Field, Alias>, RawAliases>;

  /**
   * Adds a JOIN clause to the query for a subquery.
   */
  join<Alias extends string>(
    field: RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond?: RawJoinCondition,
    type?: JoinType,
    path?: string,
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, ModifyContext<Entity, Context, string, Alias>, RawAliases>;

  join<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field | RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias> | RawJoinCondition = {},
    type: JoinType = JoinType.innerJoin,
    path?: string,
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field> & {}, ModifyContext<Entity, Context, Field, Alias>, RawAliases> {
    this.joinReference(field, alias, cond, type, path, schema);
    return this as any;
  }

  /**
   * Adds an INNER JOIN clause to the query for an entity relation.
   */
  innerJoin<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field,
    alias: Alias,
    cond?: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias>,
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field> & {}, ModifyContext<Entity, Context, Field, Alias>, RawAliases>;

  /**
   * Adds an INNER JOIN clause to the query for a subquery.
   */
  innerJoin<Alias extends string>(
    field: RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond?: RawJoinCondition,
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, ModifyContext<Entity, Context, string, Alias>, RawAliases>;

  innerJoin<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field | RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias> | RawJoinCondition = {},
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field> & {}, ModifyContext<Entity, Context, Field, Alias>, RawAliases> {
    this.join(field as any, alias, cond as any, JoinType.innerJoin, undefined, schema);
    return this as any;
  }

  innerJoinLateral<Alias extends string>(
    field: RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond: RawJoinCondition = {},
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, ModifyContext<Entity, Context, string, Alias>, RawAliases> {
    return this.join(field, alias, cond as any, JoinType.innerJoinLateral, undefined, schema) as any;
  }

  /**
   * Adds a LEFT JOIN clause to the query for an entity relation.
   */
  leftJoin<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field,
    alias: Alias,
    cond?: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias>,
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field> & {}, ModifyContext<Entity, Context, Field, Alias>, RawAliases>;

  /**
   * Adds a LEFT JOIN clause to the query for a subquery.
   */
  leftJoin<Alias extends string>(
    field: RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond?: RawJoinCondition,
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, ModifyContext<Entity, Context, string, Alias>, RawAliases>;

  leftJoin<Field extends QBField<Entity, RootAlias, Context>, Alias extends string>(
    field: Field | RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias> | RawJoinCondition = {},
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, ModifyHint<RootAlias, Context, Hint, Field> & {}, ModifyContext<Entity, Context, Field, Alias>, RawAliases> {
    return this.join(field as any, alias, cond as any, JoinType.leftJoin, undefined, schema);
  }

  leftJoinLateral<Alias extends string>(
    field: RawQueryFragment | QueryBuilder<any>,
    alias: Alias,
    cond: RawJoinCondition = {},
    schema?: string,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, ModifyContext<Entity, Context, string, Alias>, RawAliases> {
    return this.join(field, alias, cond as any, JoinType.leftJoinLateral, undefined, schema) as any;
  }

  /**
   * Adds a JOIN clause and automatically selects the joined entity's fields.
   * This is useful for eager loading related entities.
   *
   * @example
   * ```ts
   * const qb = em.createQueryBuilder(Book, 'b');
   * qb.select('*')
   *   .joinAndSelect('b.author', 'a')
   *   .where({ 'a.name': 'John' });
   * ```
   */
  joinAndSelect<Field extends QBField<Entity, RootAlias, Context>, Alias extends string, const JoinFields extends readonly [JoinSelectField<JoinedEntityType<Entity, Context, Field & string>, Alias>, ...JoinSelectField<JoinedEntityType<Entity, Context, Field & string>, Alias>[]] | undefined = undefined>(
    field: Field | [Field, RawQueryFragment | QueryBuilder<any>],
    alias: Alias,
    cond: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias> = {} as JoinCondition<
      JoinedEntityType<Entity, Context, Field & string>,
      Alias
    >,
    type = JoinType.innerJoin,
    path?: string,
    fields?: JoinFields,
    schema?: string,
  ): SelectQueryBuilder<
    Entity,
    RootAlias,
    ModifyHint<RootAlias, Context, Hint, Field, true> & {},
    ModifyContext<Entity, Context, Field, Alias, true>,
    RawAliases,
    ModifyFields<Fields, RootAlias, Context, Field, Alias, JoinFields>
  > {
    if (!this._type) {
      this.select('*');
    }

    let subquery: string | undefined;

    if (Array.isArray(field)) {
      const rawFragment = field[1] instanceof QueryBuilder ? field[1].toRaw() : field[1];
      subquery = this.platform.formatQuery(rawFragment.sql, rawFragment.params);
      field = field[0];
    }

    const { prop, key } = this.joinReference(field as string, alias, cond, type, path, schema, subquery);
    const [fromAlias] = this.helper.splitField(field as string as EntityKey<Entity>);

    if (subquery) {
      this._joins[key].subquery = subquery;
    }

    const populate = this._joinedProps.get(fromAlias);
    const item = { field: prop.name, strategy: LoadStrategy.JOINED, children: [] };

    if (populate) {
      populate.children!.push(item);
    } else { // root entity
      this._populate.push(item);
    }

    this._joinedProps.set(alias, item);
    this.addSelect(this.getFieldsForJoinedLoad(prop, alias, fields) as any);

    return this as any;
  }

  leftJoinAndSelect<
    Field extends QBField<Entity, RootAlias, Context>,
    Alias extends string,
    const JoinFields extends readonly [JoinSelectField<JoinedEntityType<Entity, Context, Field & string>, Alias>, ...JoinSelectField<JoinedEntityType<Entity, Context, Field & string>, Alias>[]] | undefined = undefined,
  >(
    field: Field | [Field, RawQueryFragment | QueryBuilder<any>],
    alias: Alias,
    cond: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias> = {} as JoinCondition<
      JoinedEntityType<Entity, Context, Field & string>,
      Alias
    >,
    fields?: JoinFields,
    schema?: string,
  ): SelectQueryBuilder<
    Entity,
    RootAlias,
    ModifyHint<RootAlias, Context, Hint, Field, true> & {},
    ModifyContext<Entity, Context, Field, Alias, true>,
    RawAliases,
    ModifyFields<Fields, RootAlias, Context, Field, Alias, JoinFields>
  > {
    return this.joinAndSelect(field, alias, cond, JoinType.leftJoin, undefined, fields, schema);
  }

  leftJoinLateralAndSelect<
    Field extends QBField<Entity, RootAlias, Context>,
    Alias extends string,
    const JoinFields extends readonly [JoinSelectField<JoinedEntityType<Entity, Context, Field & string>, Alias>, ...JoinSelectField<JoinedEntityType<Entity, Context, Field & string>, Alias>[]] | undefined = undefined,
  >(
    field: [Field, RawQueryFragment | QueryBuilder<any>],
    alias: Alias,
    cond: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias> = {} as JoinCondition<
      JoinedEntityType<Entity, Context, Field & string>,
      Alias
    >,
    fields?: JoinFields,
    schema?: string,
  ): SelectQueryBuilder<
    Entity,
    RootAlias,
    ModifyHint<RootAlias, Context, Hint, Field, true> & {},
    ModifyContext<Entity, Context, Field, Alias, true>,
    RawAliases,
    ModifyFields<Fields, RootAlias, Context, Field, Alias, JoinFields>
  > {
    this.joinAndSelect(field as any, alias, cond as any, JoinType.leftJoinLateral, undefined, fields as any, schema);
    return this as any;
  }

  innerJoinAndSelect<
    Field extends QBField<Entity, RootAlias, Context>,
    Alias extends string,
    const JoinFields extends readonly [JoinSelectField<JoinedEntityType<Entity, Context, Field & string>, Alias>, ...JoinSelectField<JoinedEntityType<Entity, Context, Field & string>, Alias>[]] | undefined = undefined,
  >(
    field: Field | [Field, RawQueryFragment | QueryBuilder<any>],
    alias: Alias,
    cond: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias> = {} as JoinCondition<
      JoinedEntityType<Entity, Context, Field & string>,
      Alias
    >,
    fields?: JoinFields,
    schema?: string,
  ): SelectQueryBuilder<
    Entity,
    RootAlias,
    ModifyHint<RootAlias, Context, Hint, Field, true> & {},
    ModifyContext<Entity, Context, Field, Alias, true>,
    RawAliases,
    ModifyFields<Fields, RootAlias, Context, Field, Alias, JoinFields>
  > {
    return this.joinAndSelect(field, alias, cond, JoinType.innerJoin, undefined, fields as any, schema) as any;
  }

  innerJoinLateralAndSelect<
    Field extends QBField<Entity, RootAlias, Context>,
    Alias extends string,
    const JoinFields extends readonly [JoinSelectField<JoinedEntityType<Entity, Context, Field & string>, Alias>, ...JoinSelectField<JoinedEntityType<Entity, Context, Field & string>, Alias>[]] | undefined = undefined,
  >(
    field: [Field, RawQueryFragment | QueryBuilder<any>],
    alias: Alias,
    cond: JoinCondition<JoinedEntityType<Entity, Context, Field & string>, Alias> = {} as JoinCondition<
      JoinedEntityType<Entity, Context, Field & string>,
      Alias
    >,
    fields?: JoinFields,
    schema?: string,
  ): SelectQueryBuilder<
    Entity,
    RootAlias,
    ModifyHint<RootAlias, Context, Hint, Field, true> & {},
    ModifyContext<Entity, Context, Field, Alias, true>,
    RawAliases,
    ModifyFields<Fields, RootAlias, Context, Field, Alias, JoinFields>
  > {
    this.joinAndSelect(field as any, alias, cond as any, JoinType.innerJoinLateral, undefined, fields as any, schema);
    return this as any;
  }

  protected getFieldsForJoinedLoad(prop: EntityProperty<Entity>, alias: string, explicitFields?: readonly string[]): InternalField<Entity>[] {
    const fields: InternalField<Entity>[] = [];
    const populate: PopulateOptions<Entity>[] = [];
    const joinKey = Object.keys(this._joins).find(join => join.endsWith(`#${alias}`));
    const targetMeta = prop.targetMeta!;
    const schema = this._schema ?? (targetMeta.schema !== '*' ? targetMeta.schema : undefined);

    if (joinKey) {
      const path = this._joins[joinKey].path!.split('.').slice(1);
      let children = this._populate;

      for (let i = 0; i < path.length; i++) {
        const child = children.filter(hint => {
          const [propName] = hint.field.split(':', 2) as [EntityKey<Entity>];
          return propName === path[i];
        });

        children = child.flatMap(c => c.children) as any;
      }

      populate.push(...children);
    }

    for (const p of targetMeta.getPrimaryProps()) {
      fields.push(...this.driver.mapPropToFieldNames<Entity>(this, p, alias, targetMeta, schema));
    }

    if (explicitFields && explicitFields.length > 0) {
      for (const field of explicitFields) {
        const [a, f] = this.helper.splitField(field as EntityKey<Entity>);
        const p = targetMeta.properties[f];

        if (p) {
          fields.push(...this.driver.mapPropToFieldNames<Entity>(this, p, alias, targetMeta, schema));
        } else {
          fields.push(`${a}.${f} as ${a}__${f}`);
        }
      }
    }

    targetMeta.props
      .filter(prop => {
        if (!explicitFields || explicitFields.length === 0) {
          return this.platform.shouldHaveColumn(prop, populate);
        }

        return prop.primary && !explicitFields.includes(prop.name) && !explicitFields.includes(`${alias}.${prop.name}`);
      })
      .forEach(prop => fields.push(...this.driver.mapPropToFieldNames<Entity>(this, prop, alias, targetMeta, schema)));

    return fields;
  }

  /**
   * Apply filters to the QB where condition.
   */
  async applyFilters(filterOptions: FilterOptions = {}): Promise<void> {
    /* v8 ignore next */
    if (!this.em) {
      throw new Error('Cannot apply filters, this QueryBuilder is not attached to an EntityManager');
    }

    const cond = await this.em.applyFilters(this.mainAlias.entityName, {}, filterOptions, 'read');
    this.andWhere(cond as any);
  }

  /**
   * @internal
   */
  scheduleFilterCheck(path: string): void {
    this.autoJoinedPaths.push(path);
  }

  /**
   * @internal
   */
  async applyJoinedFilters(em: EntityManager, filterOptions: FilterOptions | undefined): Promise<void> {
    for (const path of this.autoJoinedPaths) {
      const join = this.getJoinForPath(path)!;

      if (join.type === JoinType.pivotJoin) {
        continue;
      }

      filterOptions = QueryHelper.mergePropertyFilters(join.prop.filters, filterOptions);
      let cond = await em.applyFilters(join.prop.targetMeta!.class, join.cond, filterOptions, 'read');
      const criteriaNode = CriteriaNodeFactory.createNode<Entity>(this.metadata, join.prop.targetMeta!.class, cond);
      cond = criteriaNode.process(this as IQueryBuilder<Entity>, {
        matchPopulateJoins: true,
        filter: true,
        alias: join.alias,
        ignoreBranching: true,
        parentPath: join.path,
      });

      if (Utils.hasObjectKeys(cond) || RawQueryFragment.hasObjectFragments(cond)) {
        // remove nested filters, we only care about scalars here, nesting would require another join branch
        for (const key of Object.keys(cond)) {
          if (Utils.isPlainObject(cond[key]) && Object.keys(cond[key]).every(k => !(Utils.isOperator(k) && !['$some', '$none', '$every', '$size'].includes(k)))) {
            delete cond[key];
          }
        }

        if (Utils.hasObjectKeys(join.cond) || RawQueryFragment.hasObjectFragments(join.cond)) {
          /* v8 ignore next */
          join.cond = { $and: [join.cond, cond] };
        } else {
          join.cond = { ...cond };
        }
      }
    }
  }

  withSubQuery(subQuery: RawQueryFragment | NativeQueryBuilder, alias: string): this {
    this.ensureNotFinalized();

    if (isRaw(subQuery)) {
      this.subQueries[alias] = this.platform.formatQuery(subQuery.sql, subQuery.params);
    } else {
      this.subQueries[alias] = subQuery.toString();
    }

    return this;
  }

  /**
   * Adds a WHERE clause to the query using an object condition.
   *
   * Supports filtering by:
   * - Direct entity properties: `{ name: 'John' }`
   * - Nested relations/embedded: `{ author: { name: 'John' } }`
   * - Aliased properties after joins: `{ 'a.name': 'John' }` or `{ 'b.title': 'test' }`
   * - Filter operators: `{ age: { $gte: 18 } }`
   * - Logical operators: `{ $or: [{ name: 'John' }, { name: 'Jane' }] }`
   *
   * @example
   * ```ts
   * // Filter by entity properties
   * qb.where({ name: 'John', age: { $gte: 18 } });
   *
   * // Filter by nested relation
   * qb.where({ author: { name: 'John' } });
   *
   * // Filter by aliased properties after join
   * qb.leftJoin('a.books', 'b').where({ 'b.title': 'test' });
   *
   * // Combine with logical operators
   * qb.where({ $or: [{ status: 'active' }, { role: 'admin' }] });
   * ```
   */
  where(cond: QBFilterQuery<Entity, RootAlias, Context, RawAliases>, operator?: keyof typeof GroupOperator): this;
  /**
   * Adds a WHERE clause to the query using a raw SQL string or fragment.
   *
   * @example
   * ```ts
   * // Raw SQL with parameters
   * qb.where('name = ? AND age >= ?', ['John', 18]);
   *
   * // Using raw() helper
   * qb.where(raw('lower(name) = ?', ['john']));
   * ```
   */
  where(cond: string | RawQueryFragment, params?: any[], operator?: keyof typeof GroupOperator): this;
  where(
    cond: QBFilterQuery<Entity, RootAlias, Context, RawAliases> | string | RawQueryFragment,
    params?: keyof typeof GroupOperator | any[],
    operator?: keyof typeof GroupOperator,
  ): this {
    this.ensureNotFinalized();
    let processedCond: FilterQuery<Entity>;

    if (isRaw(cond)) {
      const sql = this.platform.formatQuery(cond.sql, cond.params);
      processedCond = { [raw(`(${sql})`)]: Utils.asArray(params) } as FilterQuery<Entity>;
      operator ??= '$and';
    } else if (typeof cond === 'string') {
      processedCond = { [raw(`(${cond})`, Utils.asArray(params))]: [] } as FilterQuery<Entity>;
      operator ??= '$and';
    } else {
      processedCond = QueryHelper.processWhere({
        where: cond as FilterQuery<Entity>,
        entityName: this.mainAlias.entityName,
        metadata: this.metadata,
        platform: this.platform,
        aliasMap: this.getAliasMap(),
        aliased: [QueryType.SELECT, QueryType.COUNT].includes(this.type),
        convertCustomTypes: this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES),
      }) as FilterQuery<Entity>;
    }

    const op = operator || params as keyof typeof GroupOperator;
    const topLevel = !op || !(Utils.hasObjectKeys(this._cond) || RawQueryFragment.hasObjectFragments(this._cond));
    const criteriaNode = CriteriaNodeFactory.createNode<Entity>(this.metadata, this.mainAlias.entityName, processedCond);
    const ignoreBranching = this.__populateWhere === 'infer';

    if ([QueryType.UPDATE, QueryType.DELETE].includes(this.type) && criteriaNode.willAutoJoin(this as IQueryBuilder<Entity>, undefined, { ignoreBranching })) {
      // use sub-query to support joining
      this.setFlag(this.type === QueryType.UPDATE ? QueryFlag.UPDATE_SUB_QUERY : QueryFlag.DELETE_SUB_QUERY);
      this.select(this.mainAlias.meta!.primaryKeys, true);
    }

    if (topLevel) {
      this._cond = criteriaNode.process(this as IQueryBuilder<Entity>, { ignoreBranching });
    } else if (Array.isArray(this._cond[op])) {
      this._cond[op].push(criteriaNode.process(this as IQueryBuilder<Entity>, { ignoreBranching }));
    } else {
      const cond1 = [this._cond, criteriaNode.process(this as IQueryBuilder<Entity>, { ignoreBranching })];
      this._cond = { [op]: cond1 };
    }

    if (this._onConflict) {
      this._onConflict[this._onConflict.length - 1].where = this.helper.processOnConflictCondition(this._cond, this._schema);
      this._cond = {};
    }

    return this;
  }

  /**
   * Adds an AND WHERE clause to the query using an object condition.
   *
   * @example
   * ```ts
   * qb.where({ status: 'active' }).andWhere({ role: 'admin' });
   * qb.where({ name: 'John' }).andWhere({ 'b.title': 'test' });
   * ```
   */
  andWhere(cond: QBFilterQuery<Entity, RootAlias, Context, RawAliases>): this;
  /**
   * Adds an AND WHERE clause to the query using a raw SQL string or fragment.
   *
   * @example
   * ```ts
   * qb.where({ status: 'active' }).andWhere('age >= ?', [18]);
   * ```
   */
  andWhere(cond: string | RawQueryFragment, params?: any[]): this;
  andWhere(cond: QBFilterQuery<Entity, RootAlias, Context, RawAliases> | string | RawQueryFragment, params?: any[]): this {
    return this.where(cond as any, params, '$and');
  }

  /**
   * Adds an OR WHERE clause to the query using an object condition.
   *
   * @example
   * ```ts
   * qb.where({ status: 'active' }).orWhere({ role: 'admin' });
   * qb.where({ name: 'John' }).orWhere({ name: 'Jane' });
   * ```
   */
  orWhere(cond: QBFilterQuery<Entity, RootAlias, Context, RawAliases>): this;
  /**
   * Adds an OR WHERE clause to the query using a raw SQL string or fragment.
   *
   * @example
   * ```ts
   * qb.where({ status: 'active' }).orWhere('role = ?', ['admin']);
   * ```
   */
  orWhere(cond: string | RawQueryFragment, params?: any[]): this;
  orWhere(cond: QBFilterQuery<Entity, RootAlias, Context, RawAliases> | string | RawQueryFragment, params?: any[]): this {
    return this.where(cond as any, params, '$or');
  }

  /**
   * Adds an ORDER BY clause to the query, replacing any existing order.
   *
   * @example
   * ```ts
   * qb.orderBy({ name: 'asc', createdAt: 'desc' });
   * qb.orderBy([{ name: 'asc' }, { createdAt: 'desc' }]);
   * qb.orderBy({ profile: { bio: 'asc' } }); // nested via object
   * qb.orderBy({ 'profile.bio': 'asc' }); // nested via dot notation
   * ```
   */
  orderBy(
    orderBy: ContextOrderByMap<Entity, RootAlias, Context, RawAliases> | ContextOrderByMap<Entity, RootAlias, Context, RawAliases>[],
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  /**
   * Adds an ORDER BY clause to the query, replacing any existing order.
   *
   * @example
   * ```ts
   * qb.orderBy({ name: 'asc', createdAt: 'desc' });
   * qb.orderBy([{ name: 'asc' }, { createdAt: 'desc' }]);
   * qb.orderBy({ profile: { bio: 'asc' } }); // nested via object
   * qb.orderBy({ 'profile.bio': 'asc' }); // nested via dot notation
   * ```
   */
  orderBy<const T extends Record<string, QueryOrderKeysFlat>>(
    orderBy: T & { [K in keyof T]: K extends NestedAutoPath<Entity, RootAlias, Context, K & string> ? T[K] : (K extends RawAliases ? T[K] : never) },
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  orderBy(orderBy: unknown): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    return this.processOrderBy(orderBy as QueryOrderMap<Entity>, true);
  }

  /**
   * Adds additional ORDER BY clause without replacing existing order.
   */
  andOrderBy(
    orderBy: ContextOrderByMap<Entity, RootAlias, Context, RawAliases> | ContextOrderByMap<Entity, RootAlias, Context, RawAliases>[],
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  /**
   * Adds additional ORDER BY clause without replacing existing order.
   */
  andOrderBy<const T extends Record<string, QueryOrderKeysFlat>>(
    orderBy: T & { [K in keyof T]: K extends NestedAutoPath<Entity, RootAlias, Context, K & string> ? T[K] : (K extends RawAliases ? T[K] : never) },
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  andOrderBy(orderBy: unknown): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    return this.processOrderBy(orderBy as QueryOrderMap<Entity>, false);
  }

  private processOrderBy(
    orderBy: QueryOrderMap<Entity> | QueryOrderMap<Entity>[],
    reset = true,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    this.ensureNotFinalized();

    if (reset) {
      this._orderBy = [];
    }

    const selectAliases = this.getSelectAliases();

    Utils.asArray<QueryOrderMap<Entity>>(orderBy).forEach(orig => {
      // Shallow clone to avoid mutating the caller's object — safe because the clone
      // is only used within this loop iteration and `orig` is not referenced afterward.
      const o = { ...orig } as Dictionary;

      // Wrap known select aliases in raw() so they bypass property validation and alias prefixing
      for (const key of Object.keys(o)) {
        if (selectAliases.has(key)) {
          o[raw('??', [key]) as any] = o[key];
          delete o[key];
        }
      }

      this.helper.validateQueryOrder(o);
      const processed = QueryHelper.processWhere({
        where: o as FilterQuery<Entity>,
        entityName: this.mainAlias.entityName,
        metadata: this.metadata,
        platform: this.platform,
        aliasMap: this.getAliasMap(),
        aliased: [QueryType.SELECT, QueryType.COUNT].includes(this.type),
        convertCustomTypes: false,
        type: 'orderBy',
      })!;
      this._orderBy.push(
        CriteriaNodeFactory.createNode<Entity>(this.metadata, this.mainAlias.entityName, processed).process(this as IQueryBuilder<Entity>, {
          matchPopulateJoins: true,
          type: 'orderBy',
        }),
      );
    });

    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  }

  /** Collect custom aliases from select fields (stored as 'resolved as alias' strings by select()). */
  private getSelectAliases(): Set<string> {
    const aliases = new Set<string>();

    for (const field of this._fields ?? []) {
      if (typeof field === 'string') {
        const m = field.match(FIELD_ALIAS_RE);

        if (m) {
          aliases.add(m[2]);
        }
      }
    }

    return aliases;
  }

  /**
   * Adds a GROUP BY clause to the query.
   *
   * @example
   * ```ts
   * qb.select([raw('count(*) as count'), 'status'])
   *   .groupBy('status');
   * ```
   */
  groupBy<const F extends readonly Field<Entity, RootAlias, Context>[]>(fields: F): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  /**
   * Adds a GROUP BY clause to the query.
   *
   * @example
   * ```ts
   * qb.select([raw('count(*) as count'), 'status'])
   *   .groupBy('status');
   * ```
   */
  groupBy<F extends Field<Entity, RootAlias, Context>>(fields: F): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  /**
   * Adds a GROUP BY clause to the query.
   *
   * @example
   * ```ts
   * qb.select([raw('count(*) as count'), 'status'])
   *   .groupBy('status');
   * ```
   */
  groupBy<const P extends string>(
    fields: NestedAutoPath<Entity, RootAlias, Context, P> | readonly NestedAutoPath<Entity, RootAlias, Context, P>[],
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  groupBy(fields: unknown): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    this.ensureNotFinalized();
    this._groupBy = Utils.asArray(fields as Field<Entity, RootAlias, Context> | readonly Field<Entity, RootAlias, Context>[]).flatMap(f => {
      if (typeof f !== 'string') {
        // Normalize sql.ref('prop') to string for proper formula resolution
        if (isRaw(f) && f.sql === '??' && f.params.length === 1) {
          return this.resolveNestedPath(String(f.params[0]));
        }

        return f;
      }
      return this.resolveNestedPath(f);
    }) as any;

    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  }

  /**
   * Adds a HAVING clause to the query, typically used with GROUP BY.
   *
   * @example
   * ```ts
   * qb.select([raw('count(*) as count'), 'status'])
   *   .groupBy('status')
   *   .having({ count: { $gt: 5 } });
   * ```
   */
  having(
    cond: QBFilterQuery<Entity, RootAlias, Context, RawAliases> | string = {},
    params?: any[],
    operator?: keyof typeof GroupOperator,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    this.ensureNotFinalized();

    if (typeof cond === 'string') {
      cond = { [raw(`(${cond})`, params)]: [] } as QBFilterQuery<Entity, RootAlias, Context, RawAliases>;
    }

    const processed = CriteriaNodeFactory.createNode<Entity>(
      this.metadata,
      this.mainAlias.entityName,
      cond as FilterQuery<Entity>,
      undefined,
      undefined,
      false,
    ).process(this as IQueryBuilder<Entity>, { type: 'having' });

    if (!this._having || !operator) {
      this._having = processed as FilterQuery<Entity>;
    } else {
      const cond1 = [this._having, processed];
      this._having = { [operator]: cond1 };
    }

    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  }

  andHaving(
    cond?: QBFilterQuery<Entity, RootAlias, Context, RawAliases> | string,
    params?: any[],
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    return this.having(cond!, params, '$and');
  }

  orHaving(
    cond?: QBFilterQuery<Entity, RootAlias, Context, RawAliases> | string,
    params?: any[],
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    return this.having(cond!, params, '$or');
  }

  onConflict<F extends Field<Entity, RootAlias, Context>>(fields: F | F[] | RawQueryFragment = [] as F[]): InsertQueryBuilder<Entity, RootAlias, Context> {
    const meta = this.mainAlias.meta as EntityMetadata<Entity>;
    this.ensureNotFinalized();
    this._onConflict ??= [];
    this._onConflict.push({
      fields: isRaw(fields)
        ? fields
        : Utils.asArray(fields as string).flatMap(f => {
          const key = f.toString() as EntityKey<Entity>;
          /* v8 ignore next */
          return meta.properties[key]?.fieldNames ?? [key];
        }),
    });
    return this as InsertQueryBuilder<Entity, RootAlias, Context>;
  }

  ignore(): this {
    if (!this._onConflict) {
      throw new Error('You need to call `qb.onConflict()` first to use `qb.ignore()`');
    }

    this._onConflict[this._onConflict.length - 1].ignore = true;
    return this;
  }

  merge<const P extends string>(data: readonly NestedAutoPath<Entity, RootAlias, Context, P>[]): this;
  merge<F extends Field<Entity, RootAlias, Context>>(data?: EntityData<Entity> | F[]): this;
  merge(data?: EntityData<Entity> | readonly string[]): this {
    if (!this._onConflict) {
      throw new Error('You need to call `qb.onConflict()` first to use `qb.merge()`');
    }

    if (Array.isArray(data) && data.length === 0) {
      return this.ignore();
    }

    this._onConflict[this._onConflict.length - 1].merge = data as EntityData<Entity> | InternalField<Entity>[];
    return this;
  }

  returning<F extends Field<Entity, RootAlias, Context>>(fields?: F | F[]): this {
    this._returning = Utils.asArray(fields as string);
    return this;
  }

  /**
   * @internal
   */
  populate(
    populate: PopulateOptions<Entity>[],
    populateWhere?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`,
    populateFilter?: ObjectQuery<Entity> | PopulateHint | `${PopulateHint}`,
  ): this {
    this.ensureNotFinalized();
    this._populate = populate;
    this._populateWhere = populateWhere;
    this._populateFilter = populateFilter;

    return this;
  }

  /**
   * Sets a LIMIT clause to restrict the number of results.
   *
   * @example
   * ```ts
   * qb.select('*').limit(10);        // First 10 results
   * qb.select('*').limit(10, 20);    // 10 results starting from offset 20
   * ```
   */
  limit(limit?: number, offset = 0): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    this.ensureNotFinalized();
    this._limit = limit;

    if (offset) {
      this.offset(offset);
    }

    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  }

  /**
   * Sets an OFFSET clause to skip a number of results.
   *
   * @example
   * ```ts
   * qb.select('*').limit(10).offset(20);  // Results 21-30
   * ```
   */
  offset(offset?: number): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    this.ensureNotFinalized();
    this._offset = offset;
    return this as SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  }

  withSchema(schema?: string): this {
    this.ensureNotFinalized();
    this._schema = schema;

    return this;
  }

  setLockMode(mode?: LockMode, tables?: string[]): this {
    this.ensureNotFinalized();

    if (mode != null && ![LockMode.OPTIMISTIC, LockMode.NONE].includes(mode) && !this.context) {
      throw ValidationError.transactionRequired();
    }

    this.lockMode = mode;
    this.lockTables = tables;

    return this;
  }

  setFlushMode(flushMode?: FlushMode): this {
    this.ensureNotFinalized();
    this.flushMode = flushMode;
    return this;
  }

  setFlag(flag: QueryFlag): this {
    this.ensureNotFinalized();
    this.flags.add(flag);
    return this;
  }

  unsetFlag(flag: QueryFlag): this {
    this.ensureNotFinalized();
    this.flags.delete(flag);
    return this;
  }

  hasFlag(flag: QueryFlag): boolean {
    return this.flags.has(flag);
  }

  cache(config: boolean | number | [string, number] = true): this {
    this.ensureNotFinalized();
    this._cache = config;
    return this;
  }

  /**
   * Adds index hint to the FROM clause.
   */
  indexHint(sql: string | undefined): this {
    this.ensureNotFinalized();
    this._indexHint = sql;
    return this;
  }

  /**
   * Adds COLLATE clause to ORDER BY expressions.
   */
  collation(collation: string | undefined): this {
    this.ensureNotFinalized();
    this._collation = collation;
    return this;
  }

  /**
   * Prepend comment to the sql query using the syntax `/* ... *&#8205;/`. Some characters are forbidden such as `/*, *&#8205;/` and `?`.
   */
  comment(comment: string | string[] | undefined): this {
    this.ensureNotFinalized();
    this._comments.push(...Utils.asArray(comment));
    return this;
  }

  /**
   * Add hints to the query using comment-like syntax `/*+ ... *&#8205;/`. MySQL and Oracle use this syntax for optimizer hints.
   * Also various DB proxies and routers use this syntax to pass hints to alter their behavior. In other dialects the hints
   * are ignored as simple comments.
   */
  hintComment(comment: string | string[] | undefined): this {
    this.ensureNotFinalized();
    this._hintComments.push(...Utils.asArray(comment));
    return this;
  }

  /**
   * Specifies FROM which entity's table select/update/delete will be executed, removing all previously set FROM-s.
   * Allows setting a main string alias of the selection data.
   */
  from<Entity extends object>(target: QueryBuilder<Entity>, aliasName?: string): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  /**
   * Specifies FROM which entity's table select/update/delete will be executed, removing all previously set FROM-s.
   * Allows setting a main string alias of the selection data.
   */
  from<Entity extends object>(target: EntityName<Entity>): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  from<Entity extends object>(
    target: EntityName<Entity> | QueryBuilder<Entity>,
    aliasName?: string,
  ): SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    this.ensureNotFinalized();

    if (target instanceof QueryBuilder) {
      this.fromSubQuery(target as any, aliasName);
    } else {
      if (aliasName && this._mainAlias && Utils.className(target) !== this._mainAlias.aliasName) {
        throw new Error(`Cannot override the alias to '${aliasName}' since a query already contains references to '${this._mainAlias.aliasName}'`);
      }

      this.fromEntityName(target as any, aliasName);
    }

    return this as unknown as SelectQueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>;
  }

  getNativeQuery(processVirtualEntity = true): NativeQueryBuilder {
    if (this._unionQuery) {
      if (!this._query?.qb) {
        this._query = {} as any;
        const nqb = this.platform.createNativeQueryBuilder();
        nqb.select('*');
        nqb.from(raw(`(${this._unionQuery.sql})`, this._unionQuery.params));
        this._query!.qb = nqb;
      }

      return this._query!.qb;
    }

    if (this._query?.qb) {
      return this._query.qb;
    }

    this._query = {} as any;
    this.finalize();
    const qb = this.getQueryBase(processVirtualEntity);
    const schema = this.getSchema(this.mainAlias);
    const isNotEmptyObject = (obj: Dictionary) => Utils.hasObjectKeys(obj) || RawQueryFragment.hasObjectFragments(obj);

    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(this.type, this._cond, qb), this._cond && !this._onConflict);
    Utils.runIfNotEmpty(() => qb.groupBy(this.prepareFields(this._groupBy, 'groupBy', schema)), isNotEmptyObject(this._groupBy));
    Utils.runIfNotEmpty(() => this.helper.appendQueryCondition(this.type, this._having, qb, undefined, 'having'), isNotEmptyObject(this._having));
    Utils.runIfNotEmpty(() => {
      const queryOrder = this.helper.getQueryOrder(this.type, this._orderBy as FlatQueryOrderMap[], this._populateMap, this._collation);

      if (queryOrder.length > 0) {
        const sql = Utils.unique(queryOrder).join(', ');
        qb.orderBy(sql);
        return;
      }
    }, isNotEmptyObject(this._orderBy));
    Utils.runIfNotEmpty(() => qb.limit(this._limit!), this._limit != null);
    Utils.runIfNotEmpty(() => qb.offset(this._offset!), this._offset);
    Utils.runIfNotEmpty(() => qb.comment(this._comments), this._comments);
    Utils.runIfNotEmpty(() => qb.hintComment(this._hintComments), this._hintComments);
    Utils.runIfNotEmpty(() => this.helper.appendOnConflictClause(QueryType.UPSERT, this._onConflict!, qb), this._onConflict);

    if (this.lockMode) {
      this.helper.getLockSQL(qb, this.lockMode, this.lockTables, this._joins);
    }

    this.helper.finalize(this.type, qb, this.mainAlias.meta, this._data, this._returning);

    return this._query!.qb = qb;
  }

  /**
   * Returns the query with parameters as wildcards.
   */
  getQuery(): string {
    return this.toQuery().sql;
  }

  /**
   * Returns raw fragment representation of this QueryBuilder.
   */
  toRaw(): RawQueryFragment {
    const { sql, params } = this.toQuery();
    return raw(sql, params);
  }

  toQuery(): { sql: string; params: readonly unknown[] } {
    if (this._unionQuery) {
      return this._unionQuery;
    }

    if (this._query?.sql) {
      return { sql: this._query.sql, params: this._query.params! };
    }

    const query = this.getNativeQuery().compile();
    this._query!.sql = query.sql;
    this._query!.params = query.params;

    return { sql: this._query!.sql, params: this._query!.params };
  }

  /**
   * Returns the list of all parameters for this query.
   */
  getParams(): readonly unknown[] {
    return this.toQuery().params;
  }

  /**
   * Returns raw interpolated query string with all the parameters inlined.
   */
  getFormattedQuery(): string {
    const query = this.toQuery();
    return this.platform.formatQuery(query.sql, query.params);
  }

  /**
   * @internal
   */
  getAliasForJoinPath(path?: string | JoinOptions, options?: ICriteriaNodeProcessOptions): string | undefined {
    if (!path || path === Utils.className(this.mainAlias.entityName)) {
      return this.mainAlias.aliasName;
    }

    const join = typeof path === 'string' ? this.getJoinForPath(path, options) : path;

    if (join?.path?.endsWith('[pivot]')) {
      return join.alias;
    }

    return join?.inverseAlias || join?.alias;
  }

  /**
   * @internal
   */
  getJoinForPath(path: string, options?: ICriteriaNodeProcessOptions): JoinOptions | undefined {
    const joins = Object.values(this._joins);

    if (joins.length === 0) {
      return undefined;
    }

    let join = joins.find(j => j.path === path);

    if (options?.preferNoBranch) {
      join = joins.find(j => {
        return j.path?.replace(/\[\d+]|\[populate]/g, '') === path.replace(/\[\d+]|\[populate]/g, '');
      });
    }

    if (!join && options?.ignoreBranching) {
      join = joins.find(j => {
        return j.path?.replace(/\[\d+]/g, '') === path.replace(/\[\d+]/g, '');
      });
    }

    if (!join && options?.matchPopulateJoins && options?.ignoreBranching) {
      join = joins.find(j => {
        return j.path?.replace(/\[\d+]|\[populate]/g, '') === path.replace(/\[\d+]|\[populate]/g, '');
      });
    }

    if (!join && options?.matchPopulateJoins) {
      join = joins.find(j => {
        return j.path?.replace(/\[populate]/g, '') === path.replace(/\[populate]/g, '');
      });
    }

    return join;
  }

  /**
   * @internal
   */
  getNextAlias(entityName: string | EntityName = 'e'): string {
    entityName = Utils.className(entityName);
    return this.driver.config.getNamingStrategy().aliasName(entityName, this.aliasCounter++);
  }

  /**
   * Registers a join for a specific polymorphic target type.
   * Used by the driver to create per-target LEFT JOINs for JOINED loading.
   * @internal
   */
  addPolymorphicJoin(prop: EntityProperty, targetMeta: EntityMetadata, ownerAlias: string, alias: string, type: JoinType, path: string, schema?: string): void {
    // Override referencedColumnNames to use the specific target's PK columns
    // (polymorphic targets may have different PK column names, e.g. org_id vs user_id)
    const referencedColumnNames = targetMeta.getPrimaryProps().flatMap(pk => pk.fieldNames);
    const targetProp = { ...prop, targetMeta, referencedColumnNames } as EntityProperty;
    const aliasedName = `${ownerAlias}.${prop.name}[${targetMeta.className}]#${alias}`;
    this._joins[aliasedName] = this.helper.joinManyToOneReference(targetProp, ownerAlias, alias, type, {}, schema);
    this._joins[aliasedName].path = path;
    this.createAlias(targetMeta.class, alias);
  }

  /**
   * @internal
   */
  getAliasMap(): Dictionary<EntityName> {
    return Object.fromEntries(Object.entries(this._aliases).map(([key, value]: [string, Alias<any>]) => [key, value.entityName]));
  }

  /**
   * Executes this QB and returns the raw results, mapped to the property names (unless disabled via last parameter).
   * Use `method` to specify what kind of result you want to get (array/single/meta).
   */
  async execute<U = any>(method?: 'all' | 'get' | 'run', options?: ExecuteOptions | boolean): Promise<U> {
    options = typeof options === 'boolean' ? { mapResults: options } : (options ?? {});
    options.mergeResults ??= true;
    options.mapResults ??= true;
    const isRunType = [QueryType.INSERT, QueryType.UPDATE, QueryType.DELETE, QueryType.TRUNCATE].includes(this.type);
    method ??= isRunType ? 'run' : 'all';

    if (!this.connectionType && (isRunType || this.context)) {
      this.connectionType = 'write';
    }

    if (!this.finalized && method === 'get' && this.type === QueryType.SELECT) {
      this.limit(1);
    }

    const query = this.toQuery();
    const cached = await this.em?.tryCache<Entity, U>(this.mainAlias.entityName, this._cache, ['qb.execute', query.sql, query.params, method]);

    if (cached?.data !== undefined) {
      return cached.data as unknown as U;
    }

    const loggerContext = { id: this.em?.id, ...this.loggerContext };
    const res = await this.getConnection().execute(query.sql, query.params, method, this.context, loggerContext);
    const meta = this.mainAlias.meta;

    if (!options.mapResults || !meta) {
      await this.em?.storeCache(this._cache, cached!, res);
      return res as unknown as U;
    }

    if (method === 'run') {
      return res as U;
    }

    const joinedProps = this.driver.joinedProps(meta, this._populate);
    let mapped: EntityData<Entity>[];

    if (Array.isArray(res)) {
      const map: Dictionary = {};
      mapped = res.map(r => this.driver.mapResult<Entity>(r as Entity, meta, this._populate, this as any, map)!);

      if (options.mergeResults && joinedProps.length > 0) {
        mapped = this.driver.mergeJoinedResult(mapped, this.mainAlias.meta!, joinedProps);
      }
    } else {
      mapped = [this.driver.mapResult<Entity>(res, meta, joinedProps, this as any)!];
    }

    if (method === 'get') {
      await this.em?.storeCache(this._cache, cached!, mapped[0]);
      return mapped[0] as U;
    }

    await this.em?.storeCache(this._cache, cached!, mapped);

    return mapped as U;
  }

  private getConnection(): AbstractSqlConnection {
    const write = !this.platform.getConfig().get('preferReadReplicas');
    const type = this.connectionType || (write ? 'write' : 'read');
    return this.driver.getConnection(type);
  }

  /**
   * Executes the query and returns an async iterable (async generator) that yields results one by one.
   * By default, the results are merged and mapped to entity instances, without adding them to the identity map.
   * You can disable merging and mapping by passing the options `{ mergeResults: false, mapResults: false }`.
   * This is useful for processing large datasets without loading everything into memory at once.
   *
   * ```ts
   * const qb = em.createQueryBuilder(Book, 'b');
   * qb.select('*').where({ title: '1984' }).leftJoinAndSelect('b.author', 'a');
   *
   * for await (const book of qb.stream()) {
   *   // book is an instance of Book entity
   *   console.log(book.title, book.author.name);
   * }
   * ```
   */
  async *stream(options?: QBStreamOptions): AsyncIterableIterator<Loaded<Entity, Hint, Fields>> {
    options ??= {};
    options.mergeResults ??= true;
    options.mapResults ??= true;

    const query = this.toQuery();
    const loggerContext = { id: this.em?.id, ...this.loggerContext };
    const res = this.getConnection().stream(query.sql, query.params, this.context, loggerContext);
    const meta = this.mainAlias.meta;

    if (options.rawResults || !meta) {
      yield* res as AsyncIterableIterator<Loaded<Entity, Hint, Fields>>;
      return;
    }

    const joinedProps = this.driver.joinedProps(meta, this._populate);
    const stack = [] as EntityData<Entity>[];
    const hash = (data: EntityData<Entity>) => {
      return Utils.getPrimaryKeyHash(meta.primaryKeys.map(pk => data[pk as EntityKey]));
    };

    for await (const row of res) {
      const mapped = this.driver.mapResult<Entity>(row as Entity, meta, this._populate, this as any)!;

      if (!options.mergeResults || joinedProps.length === 0) {
        yield this.mapResult(mapped, options.mapResults);
        continue;
      }

      if (stack.length > 0 && hash(stack[stack.length - 1]) !== hash(mapped)) {
        const res = this.driver.mergeJoinedResult(stack, this.mainAlias.meta!, joinedProps);

        for (const row of res) {
          yield this.mapResult(row as EntityData<Entity>, options.mapResults);
        }

        stack.length = 0;
      }

      stack.push(mapped);
    }

    if (stack.length > 0) {
      const merged = this.driver.mergeJoinedResult(stack, this.mainAlias.meta!, joinedProps);
      yield this.mapResult(merged[0] as EntityData<Entity>, options.mapResults);
    }
  }

  /**
   * Alias for `qb.getResultList()`
   */
  async getResult(): Promise<Loaded<Entity, Hint, Fields>[]> {
    return this.getResultList();
  }

  /**
   * Executes the query, returning array of results mapped to entity instances.
   */
  async getResultList(limit?: number): Promise<Loaded<Entity, Hint, Fields>[]> {
    await this.em!.tryFlush(this.mainAlias.entityName, { flushMode: this.flushMode });
    const res = await this.execute<EntityData<Entity>[]>('all', true);
    return this.mapResults(res, limit);
  }

  private propagatePopulateHint<U extends object>(entity: U, hint: PopulateOptions<U>[]) {
    helper(entity).__serializationContext.populate = hint.concat(helper(entity).__serializationContext.populate ?? []);
    hint.forEach(hint => {
      const [propName] = hint.field.split(':', 2) as [EntityKey<Entity>];
      const value = Reference.unwrapReference(entity[propName as never] as object);

      if (Utils.isEntity<U>(value)) {
        this.propagatePopulateHint<any>(value, hint.children ?? []);
      } else if (Utils.isCollection(value)) {
        value.populated();
        value.getItems(false).forEach(item => this.propagatePopulateHint<any>(item, hint.children ?? []));
      }
    });
  }

  private mapResult(row: EntityData<Entity>, map = true): Loaded<Entity, Hint, Fields> {
    if (!map) {
      return row as Loaded<Entity, Hint, Fields>;
    }

    const entity = this.em!.map<Entity>(this.mainAlias.entityName, row, { schema: this._schema }) as Loaded<Entity, Hint, Fields>;
    this.propagatePopulateHint(entity as Entity, this._populate);

    return entity;
  }

  private mapResults(res: EntityData<Entity>[], limit?: number): Loaded<Entity, Hint, Fields>[] {
    const entities: Loaded<Entity, Hint, Fields>[] = [];

    for (const row of res) {
      const entity = this.mapResult(row);
      this.propagatePopulateHint(entity as Entity, this._populate);
      entities.push(entity);

      if (limit != null && --limit === 0) {
        break;
      }
    }

    return Utils.unique(entities) as Loaded<Entity, Hint, Fields>[];
  }

  /**
   * Executes the query, returning the first result or null
   */
  async getSingleResult(): Promise<Loaded<Entity, Hint, Fields> | null> {
    if (!this.finalized) {
      this.limit(1);
    }

    const [res] = await this.getResultList(1);
    return res || null;
  }

  /**
   * Executes count query (without offset and limit), returning total count of results
   */
  async getCount<F extends Field<Entity, RootAlias, Context>>(field?: F | F[], distinct?: boolean): Promise<number>;
  async getCount(field?: Field<Entity, RootAlias, Context> | Field<Entity, RootAlias, Context>[], distinct?: boolean): Promise<number> {
    let res: { count: number };

    if (this.type === QueryType.COUNT) {
      res = await this.execute<{ count: number }>('get', false);
    } else {
      const qb = (this._type === undefined ? this : this.clone()) as QueryBuilder<Entity, RootAlias, Hint, Context>;
      qb.processPopulateHint(); // needs to happen sooner so `qb.hasToManyJoins()` reports correctly
      qb.count(field, distinct ?? qb.hasToManyJoins()).limit(undefined).offset(undefined).orderBy([]);
      res = await qb.execute<{ count: number }>('get', false);
    }

    return res ? +res.count : 0;
  }

  /**
   * Executes the query, returning both array of results and total count query (without offset and limit).
   */
  async getResultAndCount(): Promise<[Loaded<Entity, Hint, Fields>[], number]> {
    return [await this.clone().getResultList(), await this.clone().getCount()];
  }

  /**
   * Returns native query builder instance with sub-query aliased with given alias.
   */
  as(alias: string): NativeQueryBuilder;

  /**
   * Returns native query builder instance with sub-query aliased with given alias.
   * You can provide the target entity name as the first parameter and use the second parameter to point to an existing property to infer its field name.
   */
  as<T>(targetEntity: EntityName<T>, alias: EntityKey<T>): NativeQueryBuilder;

  as<T>(aliasOrTargetEntity: string | EntityName<T>, alias?: EntityKey<T>): NativeQueryBuilder {
    const qb = this.getNativeQuery();
    let finalAlias = aliasOrTargetEntity as string;

    /* v8 ignore next */
    if (typeof aliasOrTargetEntity === 'string' && aliasOrTargetEntity.includes('.')) {
      throw new Error('qb.as(alias) no longer supports target entity name prefix, use qb.as(TargetEntity, key) signature instead');
    }

    if (alias) {
      const meta = this.metadata.get(aliasOrTargetEntity as EntityName<T>);
      /* v8 ignore next */
      finalAlias = meta.properties[alias]?.fieldNames[0] ?? alias;
    }

    qb.as(finalAlias);

    // tag the instance, so it is possible to detect it easily
    Object.defineProperty(qb, '__as', { enumerable: false, value: finalAlias });

    return qb;
  }

  /**
   * Combines the current query with one or more other queries using `UNION ALL`.
   * All queries must select the same columns. Returns a `QueryBuilder` that
   * can be used with `$in`, passed to `qb.from()`, or converted via `.getQuery()`,
   * `.getParams()`, `.toQuery()`, `.toRaw()`, etc.
   *
   * ```ts
   * const qb1 = em.createQueryBuilder(Employee).select('id').where(condition1);
   * const qb2 = em.createQueryBuilder(Employee).select('id').where(condition2);
   * const qb3 = em.createQueryBuilder(Employee).select('id').where(condition3);
   * const subquery = qb1.unionAll(qb2, qb3);
   *
   * const results = await em.find(Employee, { id: { $in: subquery } });
   * ```
   */
  unionAll(...others: (QueryBuilder<any> | NativeQueryBuilder)[]): QueryBuilder<Entity> {
    return this.buildUnionQuery('union all', others);
  }

  /**
   * Combines the current query with one or more other queries using `UNION` (with deduplication).
   * All queries must select the same columns. Returns a `QueryBuilder` that
   * can be used with `$in`, passed to `qb.from()`, or converted via `.getQuery()`,
   * `.getParams()`, `.toQuery()`, `.toRaw()`, etc.
   *
   * ```ts
   * const qb1 = em.createQueryBuilder(Employee).select('id').where(condition1);
   * const qb2 = em.createQueryBuilder(Employee).select('id').where(condition2);
   * const subquery = qb1.union(qb2);
   *
   * const results = await em.find(Employee, { id: { $in: subquery } });
   * ```
   */
  union(...others: (QueryBuilder<any> | NativeQueryBuilder)[]): QueryBuilder<Entity> {
    return this.buildUnionQuery('union', others);
  }

  private buildUnionQuery(separator: 'union' | 'union all', others: (QueryBuilder<any> | NativeQueryBuilder)[]): QueryBuilder<Entity> {
    const all = [this as QueryBuilder<any>, ...others];
    const parts: string[] = [];
    const params: unknown[] = [];

    for (const qb of all) {
      const compiled = qb instanceof QueryBuilder ? qb.toQuery() : qb.compile();
      parts.push(`(${compiled.sql})`);
      params.push(...compiled.params);
    }

    const result = this.clone(true) as QueryBuilder<Entity>;
    result._unionQuery = { sql: parts.join(` ${separator} `), params };
    return result;
  }

  clone(reset?: boolean | string[], preserve?: string[]): QueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
    const qb = new QueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields>(
      this.mainAlias.entityName,
      this.metadata,
      this.driver,
      this.context,
      this.mainAlias.aliasName,
      this.connectionType,
      this.em,
    );
    reset = reset || [];

    // clone array/object properties
    const properties = [
      'flags', '_populate', '_populateWhere', '_populateFilter', '__populateWhere', '_populateMap', '_joins', '_joinedProps', '_cond', '_data', '_orderBy',
      '_schema', '_indexHint', '_collation', '_cache', 'subQueries', 'lockMode', 'lockTables', '_groupBy', '_having', '_returning',
      '_comments', '_hintComments', 'aliasCounter', '_unionQuery',
    ];

    for (const prop of Object.keys(this)) {
      if (!preserve?.includes(prop) && (reset === true || reset.includes(prop) || ['_helper', '_query'].includes(prop))) {
        continue;
      }

      (qb as any)[prop] = properties.includes(prop) ? Utils.copy(this[prop as keyof this]) : this[prop as keyof this];
    }

    /* v8 ignore next */
    if (this._fields && reset !== true && !reset.includes('_fields')) {
      qb._fields = [...this._fields];
    }

    qb._aliases = { ...this._aliases };
    (qb._helper as Dictionary).aliasMap = qb._aliases;
    qb.finalized = false;

    return qb;
  }

  /**
   * Sets logger context for this query builder.
   */
  setLoggerContext(context: LoggingOptions & Dictionary): void {
    this.loggerContext = context as LoggingOptions;
  }

  /**
   * Gets logger context for this query builder.
   */
  getLoggerContext<T extends Dictionary & LoggingOptions = Dictionary>(): T {
    this.loggerContext ??= {};
    return this.loggerContext as T;
  }

  private fromVirtual<T extends object>(meta: EntityMetadata<T>): string {
    if (typeof meta.expression === 'string') {
      return `(${meta.expression}) as ${this.platform.quoteIdentifier(this.alias)}`;
    }

    const res = meta.expression!(this.em, this._cond as any, {});

    if (typeof res === 'string') {
      return `(${res}) as ${this.platform.quoteIdentifier(this.alias)}`;
    }

    if (res instanceof QueryBuilder) {
      return `(${res.getFormattedQuery()}) as ${this.platform.quoteIdentifier(this.alias)}`;
    }

    if (isRaw(res)) {
      const query = this.platform.formatQuery(res.sql, res.params);
      return `(${query}) as ${this.platform.quoteIdentifier(this.alias)}`;
    }

    /* v8 ignore next */
    return res as unknown as string;
  }

  /**
   * Adds a join from a property object. Used internally for TPT joins where the property
   * is synthetic (not in entity.properties) but defined on metadata (e.g., tptParentProp).
   * The caller must create the alias first via createAlias().
   * @internal
   */
  addPropertyJoin(prop: EntityProperty, ownerAlias: string, alias: string, type: JoinType, path: string, schema?: string): string {
    schema ??= prop.targetMeta?.schema === '*' ? '*' : this.driver.getSchemaName(prop.targetMeta);
    const key = `[tpt]${ownerAlias}#${alias}`;
    this._joins[key] = prop.kind === ReferenceKind.MANY_TO_ONE
      ? this.helper.joinManyToOneReference(prop, ownerAlias, alias, type, {}, schema)
      : this.helper.joinOneToReference(prop, ownerAlias, alias, type, {}, schema);
    this._joins[key].path = path;
    return key;
  }

  private joinReference(field: string | RawQueryFragment | NativeQueryBuilder | QueryBuilder, alias: string, cond: Dictionary, type: JoinType, path?: string, schema?: string, subquery?: string): { prop: EntityProperty<Entity>; key: string } {
    this.ensureNotFinalized();

    if (typeof field === 'object') {
      const prop = {
        name: '__subquery__',
        kind: ReferenceKind.MANY_TO_ONE,
      } as EntityProperty;

      if (field instanceof QueryBuilder) {
        prop.type = Utils.className(field.mainAlias.entityName);
        prop.targetMeta = field.mainAlias.meta!;
        field = field.getNativeQuery();
      }

      if (isRaw(field)) {
        field = this.platform.formatQuery(field.sql, field.params);
      }

      const key = `${this.alias}.${prop.name}#${alias}`;
      this._joins[key] = {
        prop,
        alias,
        type,
        cond,
        schema,
        subquery: field.toString(),
        ownerAlias: this.alias,
      } as any;

      return { prop, key };
    }

    if (!subquery && type.includes('lateral')) {
      throw new Error(`Lateral join can be used only with a sub-query.`);
    }

    const [fromAlias, fromField] = this.helper.splitField(field as EntityKey<Entity>);
    const q = (str: string) => `'${str}'`;

    if (!this._aliases[fromAlias]) {
      throw new Error(`Trying to join ${q(fromField)} with alias ${q(fromAlias)}, but ${q(fromAlias)} is not a known alias. Available aliases are: ${Object.keys(this._aliases).map(q).join(', ')}.`);
    }

    const entityName = this._aliases[fromAlias].entityName;
    const meta = this.metadata.get(entityName);
    const prop = meta.properties[fromField];

    if (!prop) {
      throw new Error(`Trying to join ${q(field)}, but ${q(fromField)} is not a defined relation on ${meta.className}.`);
    }

    // For TPT inheritance, owning relations (M:1 and owning 1:1) may have FK columns in a parent table
    // Resolve the correct alias for the table that owns the FK column
    const ownerAlias = (prop.kind === ReferenceKind.MANY_TO_ONE || (prop.kind === ReferenceKind.ONE_TO_ONE && prop.owner))
      ? this.helper.getTPTAliasForProperty(fromField, fromAlias)
      : fromAlias;

    this.createAlias(prop.targetMeta!.class, alias);
    cond = QueryHelper.processWhere({
      where: cond as FilterQuery<Entity>,
      entityName: this.mainAlias.entityName,
      metadata: this.metadata,
      platform: this.platform,
      aliasMap: this.getAliasMap(),
      aliased: [QueryType.SELECT, QueryType.COUNT].includes(this.type),
    })!;
    const criteriaNode = CriteriaNodeFactory.createNode<Entity>(this.metadata, prop.targetMeta!.class, cond);
    cond = criteriaNode.process(this as IQueryBuilder<Entity>, { ignoreBranching: true, alias });
    let aliasedName = `${fromAlias}.${prop.name}#${alias}`;
    path ??= `${(Object.values(this._joins).find(j => j.alias === fromAlias)?.path ?? Utils.className(entityName))}.${prop.name}`;

    if (prop.kind === ReferenceKind.ONE_TO_MANY) {
      this._joins[aliasedName] = this.helper.joinOneToReference(prop, fromAlias, alias, type, cond, schema);
      this._joins[aliasedName].path ??= path;
    } else if (prop.kind === ReferenceKind.MANY_TO_MANY) {
      let pivotAlias = alias;

      if (type !== JoinType.pivotJoin) {
        const oldPivotAlias = this.getAliasForJoinPath(path + '[pivot]');
        pivotAlias = oldPivotAlias ?? this.getNextAlias(prop.pivotEntity);
        aliasedName = `${fromAlias}.${prop.name}#${pivotAlias}`;
      }

      const joins = this.helper.joinManyToManyReference(prop, fromAlias, alias, pivotAlias, type, cond, path, schema);

      Object.assign(this._joins, joins);
      this.createAlias(prop.pivotEntity, pivotAlias);
      this._joins[aliasedName].path ??= path;
      aliasedName = Object.keys(joins)[1];
    } else if (prop.kind === ReferenceKind.ONE_TO_ONE) {
      this._joins[aliasedName] = this.helper.joinOneToReference(prop, ownerAlias, alias, type, cond, schema);
      this._joins[aliasedName].path ??= path;
    } else { // MANY_TO_ONE
      this._joins[aliasedName] = this.helper.joinManyToOneReference(prop, ownerAlias, alias, type, cond, schema);
      this._joins[aliasedName].path ??= path;
    }

    return { prop, key: aliasedName };
  }

  protected prepareFields<T>(fields: InternalField<T>[], type: 'where' | 'groupBy' | 'sub-query' = 'where', schema?: string): (string | RawQueryFragment)[] {
    const ret: InternalField<T>[] = [];
    const getFieldName = (name: string, customAlias?: string) => {
      const alias = customAlias ?? (type === 'groupBy' ? null : undefined);
      return this.helper.mapper(name, this.type, undefined, alias, schema);
    };

    fields.forEach(originalField => {
      if (typeof originalField !== 'string') {
        ret.push(originalField);
        return;
      }

      // Strip 'as alias' suffix if present — the alias is passed to mapper at the end
      let field = originalField;
      let customAlias: string | undefined;
      const asMatch = originalField.match(FIELD_ALIAS_RE);

      if (asMatch) {
        field = asMatch[1].trim();
        customAlias = asMatch[2];
      }

      const join = Object.keys(this._joins).find(k => field === k.substring(0, k.indexOf('#')))!;

      if (join && type === 'where') {
        ret.push(...this.helper.mapJoinColumns(this.type, this._joins[join]) as string[]);
        return;
      }

      const [a, f] = this.helper.splitField(field as EntityKey<T>);
      const prop = this.helper.getProperty(f, a);

      /* v8 ignore next */
      if (prop && [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)) {
        return;
      }

      if (prop?.persist === false && !prop.embedded && !prop.formula && type === 'where') {
        return;
      }

      if (prop?.embedded || (prop?.kind === ReferenceKind.EMBEDDED && prop.object)) {
        const name = prop.embeddedPath?.join('.') ?? prop.fieldNames[0];
        const aliased = this._aliases[a] ? `${a}.${name}` : name;
        ret.push(getFieldName(aliased, customAlias));
        return;
      }

      if (prop?.kind === ReferenceKind.EMBEDDED) {
        if (customAlias) {
          throw new Error(`Cannot use 'as ${customAlias}' alias on embedded property '${field}' because it expands to multiple columns. Alias individual fields instead (e.g. '${field}.propertyName as ${customAlias}').`);
        }

        const nest = (prop: EntityProperty): void => {
          for (const childProp of Object.values(prop.embeddedProps)) {
            if (childProp.fieldNames && (childProp.kind !== ReferenceKind.EMBEDDED || childProp.object) && childProp.persist !== false) {
              ret.push(getFieldName(childProp.fieldNames[0]));
            } else {
              nest(childProp);
            }
          }
        };

        nest(prop);
        return;
      }

      if (prop && prop.fieldNames.length > 1 && !prop.fieldNames.includes(f)) {
        if (customAlias) {
          throw new Error(`Cannot use 'as ${customAlias}' alias on '${field}' because it expands to multiple columns (${prop.fieldNames.join(', ')}).`);
        }

        ret.push(...prop.fieldNames.map(f => getFieldName(f)));
        return;
      }

      ret.push(getFieldName(field, customAlias));
    });

    const requiresSQLConversion = this.mainAlias.meta.props.filter(p => p.hasConvertToJSValueSQL && p.persist !== false);

    if (
      this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES) &&
      (fields.includes('*') || fields.includes(`${this.mainAlias.aliasName}.*`)) &&
      requiresSQLConversion.length > 0
    ) {
      for (const p of requiresSQLConversion) {
        ret.push(this.helper.mapper(p.name, this.type));
      }
    }

    for (const f of Object.keys(this._populateMap)) {
      if (type === 'where' && this._joins[f]) {
        ret.push(...this.helper.mapJoinColumns(this.type, this._joins[f]));
      }
    }

    return Utils.unique(ret) as string[];
  }

  /**
   * Resolves nested paths like `a.books.title` to their actual field references.
   * Auto-joins relations as needed and returns `{alias}.{field}`.
   * For embeddeds: navigates into flattened embeddeds to return the correct field name.
   */
  protected resolveNestedPath(field: string): string | string[] {
    if (typeof field !== 'string' || !field.includes('.')) {
      return field;
    }

    const parts = field.split('.');

    // Simple alias.property case - let prepareFields handle it
    if (parts.length === 2 && this._aliases[parts[0]]) {
      return field;
    }

    // Start with root alias
    let currentAlias = parts[0];
    let currentMeta = this._aliases[currentAlias] ? this.metadata.get(this._aliases[currentAlias].entityName) : this.mainAlias.meta;

    // If first part is not an alias, it's a property of the main entity
    if (!this._aliases[currentAlias]) {
      currentAlias = this.mainAlias.aliasName;
      parts.unshift(currentAlias);
    }

    // Walk through the path parts (skip the alias)
    for (let i = 1; i < parts.length; i++) {
      const propName = parts[i];
      const prop = (currentMeta.properties as Dictionary<EntityProperty>)[propName];

      if (!prop) {
        return field; // Unknown property, return as-is for raw SQL support
      }

      const isLastPart = i === parts.length - 1;

      // Handle embedded properties - navigate into flattened embeddeds
      if (prop.kind === ReferenceKind.EMBEDDED) {
        if (prop.object) {
          return `${currentAlias}.${propName}`;
        }

        // Navigate through remaining path to find the leaf property
        const remainingPath = parts.slice(i + 1);
        let embeddedProp: EntityProperty | undefined = prop;

        for (const part of remainingPath) {
          embeddedProp = embeddedProp?.embeddedProps?.[part];
          if (embeddedProp?.object && embeddedProp.fieldNames?.[0]) {
            return `${currentAlias}.${embeddedProp.fieldNames[0]}`;
          }
        }

        return `${currentAlias}.${embeddedProp?.fieldNames?.[0] ?? propName}`;
      }

      // Handle relations - auto-join if not the last part
      if (
        prop.kind === ReferenceKind.MANY_TO_ONE ||
        prop.kind === ReferenceKind.ONE_TO_ONE ||
        prop.kind === ReferenceKind.ONE_TO_MANY ||
        prop.kind === ReferenceKind.MANY_TO_MANY
      ) {
        if (isLastPart) {
          return `${currentAlias}.${propName}`;
        }

        // Find existing join or create new one
        const joinPath = parts.slice(0, i + 1).join('.');
        const existingJoinKey = Object.keys(this._joins).find(k => {
          const join = this._joins[k];
          // Check by path or by key prefix (key format is `alias.field#joinAlias`)
          return join.path === joinPath || k.startsWith(`${currentAlias}.${propName}#`);
        });

        let joinAlias: string;
        if (existingJoinKey) {
          joinAlias = this._joins[existingJoinKey].alias;
        } else {
          joinAlias = this.getNextAlias(prop.targetMeta?.className ?? propName);
          this.join(`${currentAlias}.${propName}` as any, joinAlias, {}, JoinType.leftJoin);
        }

        currentAlias = joinAlias;
        currentMeta = prop.targetMeta!;
        continue;
      }

      // Scalar property - return it (if not last part, it's an invalid path but let SQL handle it)
      return `${currentAlias}.${propName}`;
    }

    return field;
  }

  private init(type: QueryType, data?: any, cond?: any): this {
    this.ensureNotFinalized();
    this._type = type;

    if ([QueryType.UPDATE, QueryType.DELETE].includes(type) && Utils.hasObjectKeys(this._cond)) {
      throw new Error(`You are trying to call \`qb.where().${type.toLowerCase()}()\`. Calling \`qb.${type.toLowerCase()}()\` before \`qb.where()\` is required.`);
    }

    if (!this.helper.isTableNameAliasRequired(type)) {
      delete this._fields;
    }

    if (data) {
      if (Utils.isEntity(data)) {
        data = this.em?.getComparator().prepareEntity(data as Entity) ?? serialize(data as Entity);
      }

      this._data = this.helper.processData(data, this.flags.has(QueryFlag.CONVERT_CUSTOM_TYPES), false);
    }

    if (cond) {
      this.where(cond);
    }

    return this;
  }

  private getQueryBase(processVirtualEntity: boolean): NativeQueryBuilder {
    const qb = this.platform.createNativeQueryBuilder().setFlags(this.flags);
    const { subQuery, aliasName, entityName, meta } = this.mainAlias;
    const requiresAlias = this.finalized && (this._explicitAlias || this.helper.isTableNameAliasRequired(this.type));
    const alias = requiresAlias ? aliasName : undefined;
    const schema = this.getSchema(this.mainAlias);
    const tableName = subQuery instanceof NativeQueryBuilder
      ? subQuery.as(aliasName)
      : subQuery
        ? raw(`(${(subQuery as RawQueryFragment).sql}) as ${this.platform.quoteIdentifier(aliasName)}`, (subQuery as RawQueryFragment).params)
        : this.helper.getTableName(entityName);
    const joinSchema = this._schema ?? this.em?.schema ?? schema;

    if (meta.virtual && processVirtualEntity) {
      qb.from(raw(this.fromVirtual(meta)), { indexHint: this._indexHint });
    } else {
      qb.from(tableName, {
        schema,
        alias,
        indexHint: this._indexHint,
      });
    }

    switch (this.type) {
      case QueryType.SELECT:
        qb.select(this.prepareFields(this._fields!, 'where', schema));

        if (this._distinctOn) {
          qb.distinctOn(this.prepareFields(this._distinctOn, 'where', schema) as string[]);
        } else if (this.flags.has(QueryFlag.DISTINCT)) {
          qb.distinct();
        }

        this.helper.processJoins(qb, this._joins, joinSchema);
        break;
      case QueryType.COUNT: {
        const fields = this._fields!.map(f => this.helper.mapper(f as string, this.type, undefined, undefined, schema));
        qb.count(fields, this.flags.has(QueryFlag.DISTINCT));
        this.helper.processJoins(qb, this._joins, joinSchema);
        break;
      }
      case QueryType.INSERT:
        qb.insert(this._data);
        break;
      case QueryType.UPDATE:
        qb.update(this._data);
        this.helper.processJoins(qb, this._joins, joinSchema);
        this.helper.updateVersionProperty(qb, this._data);
        break;
      case QueryType.DELETE:
        qb.delete();
        break;
      case QueryType.TRUNCATE:
        qb.truncate();
        break;
    }

    return qb;
  }

  private applyDiscriminatorCondition(): void {
    const meta = this.mainAlias.meta;

    if (meta.root.inheritanceType !== 'sti' || !meta.discriminatorValue) {
      return;
    }

    const types = Object.values(meta.root.discriminatorMap!).map(cls => this.metadata.get(cls));
    const children: EntityMetadata[] = [];
    const lookUpChildren = (ret: EntityMetadata[], type: EntityName) => {
      const children = types.filter(meta2 => meta2.extends === type);
      children.forEach(m => lookUpChildren(ret, m.class));
      ret.push(...children.filter(c => c.discriminatorValue));

      return children;
    };
    lookUpChildren(children, meta.class);
    this.andWhere({
      [meta.root.discriminatorColumn!]: children.length > 0 ? { $in: [meta.discriminatorValue, ...children.map(c => c.discriminatorValue)] } : meta.discriminatorValue,
    } as any);
  }

  /**
   * Ensures TPT joins are applied. Can be called early before finalize() to populate
   * the _tptAlias map for use in join resolution. Safe to call multiple times.
   * @internal
   */
  ensureTPTJoins(): void {
    this.applyTPTJoins();
  }

  /**
   * For TPT (Table-Per-Type) inheritance: INNER JOINs parent tables.
   * When querying a child entity, we need to join all parent tables.
   * Field selection is handled separately in addTPTParentFields().
   */
  private applyTPTJoins(): void {
    const meta = this.mainAlias.meta;

    if (meta?.inheritanceType !== 'tpt' || !meta.tptParent || ![QueryType.SELECT, QueryType.COUNT].includes(this.type)) {
      return;
    }

    if (this.tptJoinsApplied) {
      return;
    }
    this.tptJoinsApplied = true;

    let childMeta: EntityMetadata = meta;
    let childAlias = this.mainAlias.aliasName;

    while (childMeta.tptParent) {
      const parentMeta = childMeta.tptParent;
      const parentAlias = this.getNextAlias(parentMeta.className);
      this.createAlias(parentMeta.class, parentAlias);
      this._tptAlias[parentMeta.className] = parentAlias;

      this.addPropertyJoin(childMeta.tptParentProp!, childAlias, parentAlias, JoinType.innerJoin, `[tpt]${childMeta.className}`);

      childMeta = parentMeta;
      childAlias = parentAlias;
    }
  }

  /**
   * For TPT inheritance: adds field selections from parent tables.
   */
  private addTPTParentFields(): void {
    const meta = this.mainAlias.meta;

    if (meta?.inheritanceType !== 'tpt' || !meta.tptParent || ![QueryType.SELECT, QueryType.COUNT].includes(this.type)) {
      return;
    }

    if (!this._fields?.includes('*') && !this._fields?.includes(`${this.mainAlias.aliasName}.*`)) {
      return;
    }

    let parentMeta: EntityMetadata<Entity> | undefined = meta.tptParent;
    while (parentMeta) {
      const parentAlias = this._tptAlias[parentMeta.className];
      if (parentAlias) {
        const schema = parentMeta.schema === '*' ? '*' : this.driver.getSchemaName(parentMeta);
        parentMeta.ownProps!
          .filter(prop => this.platform.shouldHaveColumn(prop, []))
          .forEach(prop => this._fields!.push(...this.driver.mapPropToFieldNames(this, prop, parentAlias, parentMeta!, schema)));
      }
      parentMeta = parentMeta.tptParent;
    }
  }

  /**
   * For TPT polymorphic queries: LEFT JOINs all child tables when querying a TPT base class.
   * Adds discriminator and child fields to determine and load the concrete type.
   */
  private applyTPTPolymorphicJoins(): void {
    const meta = this.mainAlias.meta;

    const descendants = meta?.allTPTDescendants;

    if (!descendants?.length || ![QueryType.SELECT, QueryType.COUNT].includes(this.type)) {
      return;
    }

    if (!this._fields?.includes('*') && !this._fields?.includes(`${this.mainAlias.aliasName}.*`)) {
      return;
    }

    // LEFT JOIN each descendant table and add their fields
    for (const childMeta of descendants) {
      const childAlias = this.getNextAlias(childMeta.className);
      this.createAlias(childMeta.class, childAlias);
      this._tptAlias[childMeta.className] = childAlias;

      this.addPropertyJoin(childMeta.tptInverseProp!, this.mainAlias.aliasName, childAlias, JoinType.leftJoin, `[tpt]${meta.className}`);

      // Add child fields
      const schema = childMeta.schema === '*' ? '*' : this.driver.getSchemaName(childMeta);
      childMeta.ownProps!
        .filter(prop => !prop.primary && this.platform.shouldHaveColumn(prop, []))
        .forEach(prop => this._fields!.push(...this.driver.mapPropToFieldNames(this, prop, childAlias, childMeta, schema) as Field<Entity>[]));
    }

    // Add computed discriminator (CASE WHEN to determine concrete type)
    // descendants is pre-sorted by depth (deepest first) during discovery
    if (meta.tptDiscriminatorColumn) {
      this._fields!.push(this.driver.buildTPTDiscriminatorExpression(meta, descendants, this._tptAlias, this.mainAlias.aliasName));
    }
  }

  private finalize(): void {
    if (this.finalized) {
      return;
    }

    if (!this._type) {
      this.select('*');
    }

    const meta = this.mainAlias.meta as EntityMetadata<Entity>;
    this.applyDiscriminatorCondition();
    this.applyTPTJoins();
    this.addTPTParentFields();
    this.applyTPTPolymorphicJoins();
    this.processPopulateHint();
    this.processNestedJoins();

    if (meta && (this._fields?.includes('*') || this._fields?.includes(`${this.mainAlias.aliasName}.*`))) {
      const schema = this.getSchema(this.mainAlias);

      // Create a column mapping with unquoted aliases - quoting should be handled by the user via `quote` helper
      // For TPT, use helper to resolve correct alias per property (inherited props use parent alias)
      const quotedMainAlias = this.platform.quoteIdentifier(this.mainAlias.aliasName).toString();
      const columns = meta.createColumnMappingObject(
        prop => this.helper.getTPTAliasForProperty(prop.name, this.mainAlias.aliasName),
        quotedMainAlias,
      );

      meta.props
        .filter(prop => prop.formula && (!prop.lazy || this.flags.has(QueryFlag.INCLUDE_LAZY_FORMULAS)))
        .map(prop => {
          const aliased = this.platform.quoteIdentifier(prop.fieldNames[0]);
          const table = this.helper.createFormulaTable(quotedMainAlias, meta, schema);
          return `${this.driver.evaluateFormula(prop.formula!, columns, table)} as ${aliased}`;
        })
        .filter(field => !this._fields!.some(f => {
          if (isRaw(f)) {
            return f.sql === field && f.params.length === 0;
          }

          return f === field;
        }))
        .forEach(field => this._fields!.push(raw(field)));
    }

    QueryHelper.processObjectParams(this._data);
    QueryHelper.processObjectParams(this._cond);
    QueryHelper.processObjectParams(this._having);

    // automatically enable paginate flag when we detect to-many joins, but only if there is no `group by` clause
    if (!this.flags.has(QueryFlag.DISABLE_PAGINATE) && this._groupBy.length === 0 && this.hasToManyJoins()) {
      this.flags.add(QueryFlag.PAGINATE);
    }

    if (meta && !meta.virtual && this.flags.has(QueryFlag.PAGINATE) && !this.flags.has(QueryFlag.DISABLE_PAGINATE) && (this._limit! > 0 || this._offset! > 0)) {
      this.wrapPaginateSubQuery(meta);
    }

    if (meta && (this.flags.has(QueryFlag.UPDATE_SUB_QUERY) || this.flags.has(QueryFlag.DELETE_SUB_QUERY))) {
      this.wrapModifySubQuery(meta);
    }

    this.finalized = true;
  }

  /** @internal */
  processPopulateHint(): void {
    if (this.populateHintFinalized) {
      return;
    }

    const meta = this.mainAlias.meta as EntityMetadata<Entity>;

    if (meta && this.flags.has(QueryFlag.AUTO_JOIN_ONE_TO_ONE_OWNER)) {
      const relationsToPopulate = this._populate.map(({ field }) => field);
      meta.relations
        .filter(prop => prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner && !relationsToPopulate.includes(prop.name) && !relationsToPopulate.includes(`${prop.name}:ref` as any))
        .map(prop => ({ field: `${prop.name}:ref` as any }))
        .forEach(item => this._populate.push(item));
    }

    this._populate.forEach(({ field }) => {
      const [fromAlias, fromField] = this.helper.splitField(field);
      const aliasedField = `${fromAlias}.${fromField}`;
      const join = Object.keys(this._joins).find(k => `${aliasedField}#${this._joins[k].alias}` === k);

      if (join && this._joins[join] && this.helper.isOneToOneInverse(fromField)) {
        this._populateMap[join] = this._joins[join].alias;
        return;
      }

      if (meta && this.helper.isOneToOneInverse(fromField)) {
        const prop = meta.properties[fromField as EntityKey<Entity>];
        const alias = this.getNextAlias(prop.pivotEntity ?? prop.targetMeta!.class);
        const aliasedName = `${fromAlias}.${prop.name}#${alias}`;
        this._joins[aliasedName] = this.helper.joinOneToReference(prop, this.mainAlias.aliasName, alias, JoinType.leftJoin);
        this._joins[aliasedName].path = `${(Object.values(this._joins).find(j => j.alias === fromAlias)?.path ?? meta.className)}.${prop.name}`;
        this._populateMap[aliasedName] = this._joins[aliasedName].alias;
        this.createAlias(prop.targetMeta!.class, alias);
      }
    });

    this.processPopulateWhere(false);
    this.processPopulateWhere(true);
    this.populateHintFinalized = true;
  }

  private processPopulateWhere(filter: boolean) {
    const key = filter ? '_populateFilter' : '_populateWhere';

    if (this[key] == null || this[key] === PopulateHint.ALL) {
      return;
    }

    let joins = Object.values(this._joins);

    for (const join of joins) {
      join.cond_ ??= join.cond;
      join.cond = { ...join.cond };
    }

    if (typeof this[key] === 'object') {
      const cond = CriteriaNodeFactory
        .createNode<Entity>(this.metadata, this.mainAlias.entityName, this[key])
        .process(this as IQueryBuilder<Entity>, { matchPopulateJoins: true, ignoreBranching: true, preferNoBranch: true, filter });
      // there might be new joins created by processing the `populateWhere` object
      joins = Object.values(this._joins);
      this.mergeOnConditions(joins, cond, filter);
    }
  }

  private mergeOnConditions(joins: JoinOptions[], cond: Dictionary, filter: boolean, op?: string) {
    for (const k of Object.keys(cond)) {
      if (Utils.isOperator(k)) {
        if (Array.isArray(cond[k])) {
          cond[k].forEach((c: Dictionary) => this.mergeOnConditions(joins, c, filter, k));
        }

        /* v8 ignore next */
        this.mergeOnConditions(joins, cond[k], filter, k);
      }

      const [alias] = this.helper.splitField(k as EntityKey<Entity>);
      const join = joins.find(j => j.alias === alias);

      if (join) {
        const parentJoin = joins.find(j => j.alias === join.ownerAlias);

        // https://stackoverflow.com/a/56815807/3665878
        if (parentJoin && !filter) {
          const nested = (parentJoin!.nested ??= new Set());
          join.type = join.type === JoinType.innerJoin || ([ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(parentJoin.prop.kind))
            ? JoinType.nestedInnerJoin
            : JoinType.nestedLeftJoin;
          nested.add(join);
        }

        if (join.cond[k]) {
          /* v8 ignore next */
          join.cond = { [op ?? '$and']: [join.cond, { [k]: cond[k] }] };
        } else if (op === '$or') {
          join.cond.$or ??= [];
          join.cond.$or.push({ [k]: cond[k] });
        } else {
          join.cond = { ...join.cond, [k]: cond[k] };
        }
      }
    }
  }

  /**
   * When adding an inner join on a left joined relation, we need to nest them,
   * otherwise the inner join could discard rows of the root table.
   */
  private processNestedJoins() {
    if (this.flags.has(QueryFlag.DISABLE_NESTED_INNER_JOIN)) {
      return;
    }

    const joins = Object.values(this._joins);
    const lookupParentGroup = (j: JoinOptions): Set<JoinOptions> | undefined => {
      return j.nested ?? (j.parent ? lookupParentGroup(j.parent) : undefined);
    };

    for (const join of joins) {
      if (join.type === JoinType.innerJoin) {
        join.parent = joins.find(j => j.alias === join.ownerAlias);

        // https://stackoverflow.com/a/56815807/3665878
        if (join.parent?.type === JoinType.leftJoin || join.parent?.type === JoinType.nestedLeftJoin) {
          const nested = ((join.parent)!.nested ??= new Set());
          join.type = join.type === JoinType.innerJoin
            ? JoinType.nestedInnerJoin
            : JoinType.nestedLeftJoin;
          nested.add(join);
        } else if (join.parent?.type === JoinType.nestedInnerJoin) {
          const group = lookupParentGroup(join.parent);
          const nested = group ?? ((join.parent)!.nested ??= new Set());
          join.type = join.type === JoinType.innerJoin
            ? JoinType.nestedInnerJoin
            : JoinType.nestedLeftJoin;
          nested.add(join);
        }
      }
    }
  }

  private hasToManyJoins(): boolean {
    return Object.values(this._joins).some(join => {
      return [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(join.prop.kind);
    });
  }

  protected wrapPaginateSubQuery(meta: EntityMetadata): void {
    const schema = this.getSchema(this.mainAlias);
    const pks = this.prepareFields(meta.primaryKeys, 'sub-query', schema) as string[];
    const subQuery = this.clone(['_orderBy', '_fields', 'lockMode', 'lockTableAliases'])
      .select(pks as any)
      .groupBy(pks as any)
      .limit(this._limit!);

    // revert the on conditions added via populateWhere, we want to apply those only once
    for (const join of Object.values(subQuery._joins)) {
      if (join.cond_) {
        join.cond = join.cond_;
      }
    }

    if (this._offset) {
      subQuery.offset(this._offset);
    }

    const addToSelect = [];

    if (this._orderBy.length > 0) {
      const orderBy = [];

      for (const orderMap of this._orderBy) {
        for (const field of Utils.getObjectQueryKeys(orderMap)) {
          const direction = orderMap[field as EntityKey<Entity>];

          if (RawQueryFragment.isKnownFragmentSymbol(field)) {
            orderBy.push({ [field]: direction });
            continue;
          }

          const [a, f] = this.helper.splitField<Entity>(field);
          const prop = this.helper.getProperty(f, a);
          const type = this.platform.castColumn(prop);
          const fieldName = this.helper.mapper(field, this.type, undefined, null);

          if (!prop?.persist && !prop?.formula && !prop?.hasConvertToJSValueSQL && !pks.includes(fieldName)) {
            addToSelect.push(fieldName);
          }

          const quoted = this.platform.quoteIdentifier(fieldName);
          const key = raw(`min(${quoted}${type})`);
          orderBy.push({ [key]: direction });
        }
      }

      subQuery.orderBy(orderBy);
    }

    subQuery.finalized = true;
    const innerQuery = subQuery.as(this.mainAlias.aliasName).clear('select').select(pks);

    if (addToSelect.length > 0) {
      addToSelect.forEach(prop => {
        const field = this._fields!.find(field => {
          if (typeof field === 'object' && field && '__as' in field) {
            return field.__as === prop;
          }

          if (isRaw(field)) {
            // not perfect, but should work most of the time, ideally we should check only the alias (`... as alias`)
            return field.sql.includes(prop);
          }

          return false;
        });

        /* v8 ignore next */
        if (isRaw(field)) {
          innerQuery.select(field);
        } else if (field instanceof NativeQueryBuilder) {
          innerQuery.select(field.toRaw());
        } else if (field) {
          innerQuery.select(field as string);
        }
      });
    }

    // multiple sub-queries are needed to get around mysql limitations with order by + limit + where in + group by (o.O)
    // https://stackoverflow.com/questions/17892762/mysql-this-version-of-mysql-doesnt-yet-support-limit-in-all-any-some-subqu
    const subSubQuery = this.platform.createNativeQueryBuilder();
    subSubQuery.select(pks).from(innerQuery);
    this._limit = undefined;
    this._offset = undefined;

    // Save the original WHERE conditions before pruning joins
    const originalCond = this._cond;
    const populatePaths = this.getPopulatePaths();

    if (!this._fields!.some(field => isRaw(field))) {
      this.pruneJoinsForPagination(meta, populatePaths);
    }

    // Transfer WHERE conditions to ORDER BY joins (GH #6160)
    this.transferConditionsForOrderByJoins(meta, originalCond, populatePaths);

    const { sql, params } = subSubQuery.compile();
    (this.select(this._fields as any).where as any)({ [Utils.getPrimaryKeyHash(meta.primaryKeys)]: { $in: raw(sql, params) } });
  }

  /**
   * Computes the set of populate paths from the _populate hints.
   */
  protected getPopulatePaths(): Set<string> {
    const paths = new Set<string>();

    function addPath(hints: PopulateOptions<any>[], prefix = ''): void {
      for (const hint of hints) {
        const field = hint.field.split(':')[0];
        const fullPath = prefix ? prefix + '.' + field : field;
        paths.add(fullPath);

        if (hint.children) {
          addPath(hint.children, fullPath);
        }
      }
    }

    addPath(this._populate);
    return paths;
  }

  protected normalizeJoinPath(join: JoinOptions, meta: EntityMetadata): string {
    return join.path?.replace(/\[populate]|\[pivot]|:ref/g, '').replace(new RegExp(`^${meta.className}.`), '') ?? '';
  }

  /**
   * Transfers WHERE conditions to ORDER BY joins that are not used for population.
   * This ensures the outer query's ORDER BY uses the same filtered rows as the subquery.
   * GH #6160
   */
  protected transferConditionsForOrderByJoins(meta: EntityMetadata, cond: Dictionary | undefined, populatePaths: Set<string>): void {
    if (!cond || this._orderBy.length === 0) {
      return;
    }

    const orderByAliases = new Set(
      this._orderBy
        .flatMap(hint => Object.keys(hint))
        .filter(k => !RawQueryFragment.isKnownFragmentSymbol(k))
        .map(k => k.split('.')[0]),
    );

    for (const join of Object.values(this._joins)) {
      const joinPath = this.normalizeJoinPath(join, meta);
      const isPopulateJoin = populatePaths.has(joinPath);

      // Only transfer conditions for joins used for ORDER BY but not for population
      if (orderByAliases.has(join.alias) && !isPopulateJoin) {
        this.transferConditionsToJoin(cond, join);
      }
    }
  }

  /**
   * Removes joins that are not used for population or ordering to improve performance.
   */
  protected pruneJoinsForPagination(meta: EntityMetadata, populatePaths: Set<string>): void {
    const orderByAliases = this._orderBy
      .flatMap(hint => Object.keys(hint))
      .map(k => k.split('.')[0]);

    const joins = Object.entries(this._joins);
    const rootAlias = this.alias;

    function addParentAlias(alias: string): void {
      const join = joins.find(j => j[1].alias === alias);

      if (join && join[1].ownerAlias !== rootAlias) {
        orderByAliases.push(join[1].ownerAlias);
        addParentAlias(join[1].ownerAlias);
      }
    }

    for (const orderByAlias of orderByAliases) {
      addParentAlias(orderByAlias);
    }

    for (const [key, join] of joins) {
      const path = this.normalizeJoinPath(join, meta);

      if (!populatePaths.has(path) && !orderByAliases.includes(join.alias)) {
        delete this._joins[key];
      }
    }
  }

  /**
   * Transfers WHERE conditions that reference a join alias to the join's ON clause.
   * This is needed when a join is kept for ORDER BY after pagination wrapping,
   * so the outer query orders by the same filtered rows as the subquery.
   * @internal
   */
  protected transferConditionsToJoin(cond: Dictionary, join: JoinOptions, path = ''): void {
    const aliasPrefix = join.alias + '.';

    for (const key of Object.keys(cond)) {
      const value = cond[key];

      // Handle $and/$or operators - recurse into nested conditions
      if (key === '$and' || key === '$or') {
        if (Array.isArray(value)) {
          for (const item of value) {
            this.transferConditionsToJoin(item, join, path);
          }
        }
        continue;
      }

      // Check if this condition references the join alias
      if (key.startsWith(aliasPrefix)) {
        // Add condition to the join's ON clause
        join.cond[key] = value;
      }
    }
  }

  private wrapModifySubQuery(meta: EntityMetadata): void {
    const subQuery = this.clone();
    subQuery.finalized = true;

    // wrap one more time to get around MySQL limitations
    // https://stackoverflow.com/questions/45494/mysql-error-1093-cant-specify-target-table-for-update-in-from-clause
    const subSubQuery = this.platform.createNativeQueryBuilder();
    const method = this.flags.has(QueryFlag.UPDATE_SUB_QUERY) ? 'update' : 'delete';
    const schema = this.getSchema(this.mainAlias);
    const pks = this.prepareFields(meta.primaryKeys, 'sub-query', schema) as string[];
    this._cond = {}; // otherwise we would trigger validation error
    this._joins = {}; // included in the subquery
    subSubQuery.select(pks).from(subQuery.as(this.mainAlias.aliasName));

    const { sql, params } = subSubQuery.compile();
    ((this[method] as (data?: unknown) => RunQueryBuilder<Entity>)(this._data).where as any)({
      [Utils.getPrimaryKeyHash(meta.primaryKeys)]: { $in: raw(sql, params) },
    });
  }

  private getSchema(alias: Alias<any>): string | undefined {
    const { meta } = alias;
    const metaSchema = meta.schema && meta.schema !== '*' ? meta.schema : undefined;
    const schema = this._schema ?? metaSchema ?? this.em?.schema ?? this.em?.config.getSchema(true);

    if (schema === this.platform.getDefaultSchemaName()) {
      return undefined;
    }

    return schema;
  }

  /** @internal */
  createAlias<U = unknown>(entityName: EntityName<U>, aliasName: string, subQuery?: NativeQueryBuilder | RawQueryFragment): Alias<U> {
    const meta = this.metadata.find(entityName)!;
    const alias = { aliasName, entityName, meta, subQuery } satisfies Alias<U>;
    this._aliases[aliasName] = alias;
    return alias;
  }

  private createMainAlias(entityName: EntityName<Entity>, aliasName: string, subQuery?: NativeQueryBuilder | RawQueryFragment): Alias<Entity> {
    this._mainAlias = this.createAlias(entityName, aliasName, subQuery);
    this._helper = this.createQueryBuilderHelper();
    return this._mainAlias;
  }

  private fromSubQuery(target: QueryBuilder<Entity>, aliasName?: string): void {
    const { entityName } = target.mainAlias;
    aliasName ??= this.getNextAlias(entityName);
    const subQuery = target._unionQuery ? target.toRaw() : target.getNativeQuery();

    this.createMainAlias(entityName, aliasName, subQuery);
  }

  private fromEntityName(entityName: EntityName<Entity>, aliasName?: string): void {
    aliasName ??= this._mainAlias?.aliasName ?? this.getNextAlias(entityName);
    this.createMainAlias(entityName, aliasName);
  }

  private createQueryBuilderHelper(): QueryBuilderHelper {
    return new QueryBuilderHelper(this.mainAlias.entityName, this.mainAlias.aliasName, this._aliases, this.subQueries, this.driver, this._tptAlias);
  }

  private ensureFromClause(): void {
    /* v8 ignore next */
    if (!this._mainAlias) {
      throw new Error(`Cannot proceed to build a query because the main alias is not set.`);
    }
  }

  private ensureNotFinalized(): void {
    if (this.finalized) {
      throw new Error('This QueryBuilder instance is already finalized, clone it first if you want to modify it.');
    }
  }

  /** @ignore */
  /* v8 ignore next */
  [Symbol.for('nodejs.util.inspect.custom')](depth = 2) {
    const object = { ...this } as Dictionary;
    const hidden = ['metadata', 'driver', 'context', 'platform', 'type'];
    Object.keys(object).filter(k => k.startsWith('_')).forEach(k => delete object[k]);
    Object.keys(object).filter(k => object[k] == null).forEach(k => delete object[k]);
    hidden.forEach(k => delete object[k]);
    let prefix = this.type ? this.type.substring(0, 1) + this.type.toLowerCase().substring(1) : '';

    if (this._data) {
      object.data = this._data;
    }

    if (this._schema) {
      object.schema = this._schema;
    }

    if (!Utils.isEmpty(this._cond)) {
      object.where = this._cond;
    }

    if (this._onConflict?.[0]) {
      prefix = 'Upsert';
      object.onConflict = this._onConflict[0];
    }

    if (!Utils.isEmpty(this._orderBy)) {
      object.orderBy = this._orderBy;
    }

    const name = this._mainAlias ? `${prefix}QueryBuilder<${Utils.className(this._mainAlias?.entityName)}>` : 'QueryBuilder';
    const ret = inspect(object, { depth });

    return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
  }

}

export interface RunQueryBuilder<
  Entity extends object,
  RootAlias extends string = never,
  Context extends object = never,
  RawAliases extends string = never,
> extends Omit<QueryBuilder<Entity, RootAlias, never, Context, RawAliases, '*'>, 'getResult' | 'getSingleResult' | 'getResultList' | 'where'> {
  where(
    cond: QBFilterQuery<Entity, RootAlias, Context, RawAliases> | string,
    params?: keyof typeof GroupOperator | any[],
    operator?: keyof typeof GroupOperator,
  ): this;
  execute<Result = QueryResult<Entity>>(method?: 'all' | 'get' | 'run', mapResults?: boolean): Promise<Result>;
}

/**
 * @internal Optimized DTO type for execute().
 * Bypasses the double mapped type of EntityDTO<Loaded<T, H, F>> by using DirectDTO
 * which only iterates selected keys instead of all entity keys.
 *
 * - Wildcard, no joins: EntityDTO<T>
 * - Selected fields, no joins: DirectDTO<T, F> (~132x faster than Pick<EntityDTO<T>, F>)
 * - Wildcard + single-level join: Omit<EntityDTO<T>> + override populated relations
 * - Selected fields + single-level join: DirectDTO for root + DirectDTO for joined (~60x faster)
 * - Wildcard + nested joins: uses SerializeDTO<T, H> (~40x faster than EntityDTO<Loaded<T, H>>)
 * - Fields + nested joins: falls back to EntityDTO<Loaded<T, H, F>>
 */
type DirectDTO<T, F extends keyof T> = {
  [K in F]: EntityDTOProp<T, NonNullable<T[K]>> | Extract<T[K], null | undefined>;
};

type PopulatedDTO<T, K extends keyof T> =
  NonNullable<T[K]> extends Collection<infer U>
    ? EntityDTOFlat<U & object>[]
    : EntityDTOFlat<ExpandProperty<T[K]>>;

type SubFields<F extends string, Rel extends string> =
  F extends `${Rel}.${infer Sub}` ? Sub : never;

type RootFields<F extends string, H extends string> =
  F extends `${string}.${string}`
    ? F extends `${H}.${string}` ? never : F
    : F;

type JoinDTO<T, K extends keyof T, F extends string> =
  NonNullable<T[K]> extends Collection<infer U>
    ? SubFields<F, K & string> extends never
      ? EntityDTOProp<T, Collection<U>>
      : DirectDTO<U, (SubFields<F, K & string> | PrimaryProperty<U>) & keyof U>[]
    : SubFields<F, K & string> extends never
      ? EntityDTOProp<T, T[K]>
      : DirectDTO<NonNullable<T[K]>, (SubFields<F, K & string> | PrimaryProperty<NonNullable<T[K]>>) & keyof NonNullable<T[K]>>
        | Extract<T[K], null | undefined>;

type ExecuteDTO<T, H extends string, F extends string> =
  [H] extends [never]
    ? [F] extends ['*']
      ? EntityDTOFlat<T>
      : DirectDTO<T, F & keyof T>
    : [F] extends ['*']
      ? true extends (H extends `${string}.${string}` ? true : false)
        ? SerializeDTO<T, H>
        : Omit<EntityDTOFlat<T>, H & keyof EntityDTOFlat<T>> &
          { [K in H & keyof T as K & keyof EntityDTOFlat<T>]: PopulatedDTO<T, K> | Extract<T[K], null | undefined> }
      : true extends (H extends `${string}.${string}` ? true : false)
        ? EntityDTOFlat<Loaded<T, H, F>>
        : DirectDTO<T, (RootFields<F, H> | PrimaryProperty<T>) & keyof T> &
          { [K in H & keyof T]: JoinDTO<T, K, F> };

export interface SelectQueryBuilder<
  Entity extends object = AnyEntity,
  RootAlias extends string = never,
  Hint extends string = never,
  Context extends object = never,
  RawAliases extends string = never,
  Fields extends string = '*',
> extends QueryBuilder<Entity, RootAlias, Hint, Context, RawAliases, Fields> {
  execute<Result = ExecuteDTO<Entity, Hint, Fields>[]>(method?: 'all' | 'get' | 'run', mapResults?: boolean): Promise<Result>;
  execute<Result = ExecuteDTO<Entity, Hint, Fields>[]>(method: 'all', mapResults?: boolean): Promise<Result>;
  execute<Result = ExecuteDTO<Entity, Hint, Fields>>(method: 'get', mapResults?: boolean): Promise<Result>;
  execute<Result = QueryResult<Entity>>(method: 'run', mapResults?: boolean): Promise<Result>;
}

export interface CountQueryBuilder<Entity extends object> extends QueryBuilder<Entity, any, any> {
  execute<Result = { count: number }[]>(method?: 'all' | 'get' | 'run', mapResults?: boolean): Promise<Result>;
  execute<Result = { count: number }[]>(method: 'all', mapResults?: boolean): Promise<Result>;
  execute<Result = { count: number }>(method: 'get', mapResults?: boolean): Promise<Result>;
  execute<Result = QueryResult<{ count: number }>>(method: 'run', mapResults?: boolean): Promise<Result>;
}

export interface InsertQueryBuilder<T extends object, RootAlias extends string = never, Context extends object = never> extends RunQueryBuilder<
  T,
  RootAlias,
  Context
> {}

export interface UpdateQueryBuilder<T extends object, RootAlias extends string = never, Context extends object = never> extends RunQueryBuilder<
  T,
  RootAlias,
  Context
> {}

export interface DeleteQueryBuilder<T extends object, RootAlias extends string = never, Context extends object = never> extends RunQueryBuilder<
  T,
  RootAlias,
  Context
> {}

export interface TruncateQueryBuilder<T extends object> extends RunQueryBuilder<T> {}
