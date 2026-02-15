import type { Generated, Kysely } from 'kysely';
import type {
  CheckCallback,
  DeferMode,
  Dictionary,
  EntityName,
  EntityProperty,
  EntitySchemaWithMeta,
  FilterQuery,
  GroupOperator,
  IndexColumnOptions,
  Opt,
  Primary,
  PrimaryProperty,
  QueryFlag,
  QueryOrderMap,
  RawQueryFragment,
  Type,
} from '@mikro-orm/core';
import type { JoinType, QueryType } from './query/enums.js';
import type { DatabaseSchema } from './schema/DatabaseSchema.js';
import type { DatabaseTable } from './schema/DatabaseTable.js';
import type { QueryBuilder } from './query/QueryBuilder.js';
import type { NativeQueryBuilder } from './query/NativeQueryBuilder.js';
import type { MikroKyselyPluginOptions } from './plugin/index.js';

export interface Table {
  table_name: string;
  schema_name?: string;
  table_comment?: string;
}

/** @internal */
export type InternalField<T> = string | RawQueryFragment | QueryBuilder | NativeQueryBuilder;

export interface JoinOptions {
  table: string;
  schema?: string;
  type: JoinType;
  alias: string;
  ownerAlias: string;
  inverseAlias?: string;
  joinColumns?: string[];
  inverseJoinColumns?: string[];
  primaryKeys?: string[];
  path?: string;
  prop: EntityProperty;
  cond: Dictionary;
  // used as cache when overriding the on condition via `populateWhere` as we need
  // to revert the change when wrapping queries when pagination is triggered.
  cond_?: Dictionary;
  subquery?: string;
  nested?: Set<JoinOptions>;
  parent?: JoinOptions;
}

export interface Column {
  name: string;
  type: string;
  mappedType: Type<unknown>;
  unsigned?: boolean;
  autoincrement?: boolean;
  nullable?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  default?: string | null;
  defaultConstraint?: string;
  comment?: string;
  generated?: string;
  nativeEnumName?: string;
  enumItems?: string[];
  primary?: boolean;
  unique?: boolean;
  /** mysql only */
  extra?: string;
  ignoreSchemaChanges?: ('type' | 'extra' | 'default')[];
}

export interface ForeignKey {
  columnNames: string[];
  constraintName: string;
  localTableName: string;
  referencedTableName: string;
  referencedColumnNames: string[];
  updateRule?: string;
  deleteRule?: string;
  deferMode?: DeferMode;
}

export interface IndexDef {
  columnNames: string[];
  keyName: string;
  unique: boolean;
  constraint: boolean;
  primary: boolean;
  composite?: boolean;
  expression?: string; // allows using custom sql expressions
  options?: Dictionary; // for driver specific options
  type?: string | Readonly<{ indexType?: string; storageEngineIndexType?: 'hash' | 'btree'; predicate?: string }>;
  deferMode?: DeferMode | `${DeferMode}`;
  /**
   * Advanced column options for the index.
   * When specified, these options override the simple columnNames for index generation.
   */
  columns?: IndexColumnOptions[];
  /**
   * Columns to include in the index but not as part of the key (PostgreSQL, MSSQL).
   */
  include?: string[];
  /** Fill factor for the index as a percentage 0-100 (PostgreSQL, MSSQL). */
  fillFactor?: number;
  /**
   * Whether the index is invisible/hidden from the query optimizer (MySQL 8+, MariaDB 10.6+, MongoDB).
   */
  invisible?: boolean;
  /**
   * Whether the index is disabled (MSSQL only).
   */
  disabled?: boolean;
  /**
   * Whether the index should be clustered (MariaDB, MSSQL).
   */
  clustered?: boolean;
}

export interface CheckDef<T = unknown> {
  name: string;
  expression: string | CheckCallback<T>;
  definition?: string;
  columnName?: string;
}

export interface ColumnDifference {
  oldColumnName: string;
  column: Column;
  fromColumn: Column;
  changedProperties: Set<string>;
}

export interface TableDifference {
  name: string;
  changedComment?: string;
  fromTable: DatabaseTable;
  toTable: DatabaseTable;
  addedColumns: Dictionary<Column>;
  changedColumns: Dictionary<ColumnDifference>;
  removedColumns: Dictionary<Column>;
  renamedColumns: Dictionary<Column>;
  addedIndexes: Dictionary<IndexDef>;
  changedIndexes: Dictionary<IndexDef>;
  removedIndexes: Dictionary<IndexDef>;
  renamedIndexes: Dictionary<IndexDef>;
  addedChecks: Dictionary<CheckDef>;
  changedChecks: Dictionary<CheckDef>;
  removedChecks: Dictionary<CheckDef>;
  addedForeignKeys: Dictionary<ForeignKey>;
  changedForeignKeys: Dictionary<ForeignKey>;
  removedForeignKeys: Dictionary<ForeignKey>;
}

export interface DatabaseView {
  name: string;
  schema?: string;
  definition: string;
  /** True if this is a materialized view (PostgreSQL only). */
  materialized?: boolean;
  /** For materialized views, whether data was populated on creation. */
  withData?: boolean;
}

export interface SchemaDifference {
  newNamespaces: Set<string>;
  newNativeEnums: { name: string; schema?: string; items: string[] }[];
  newTables: Dictionary<DatabaseTable>;
  changedTables: Dictionary<TableDifference>;
  removedTables: Dictionary<DatabaseTable>;
  newViews: Dictionary<DatabaseView>;
  changedViews: Dictionary<{ from: DatabaseView; to: DatabaseView }>;
  removedViews: Dictionary<DatabaseView>;
  removedNamespaces: Set<string>;
  removedNativeEnums: { name: string; schema?: string }[];
  orphanedForeignKeys: ForeignKey[];
  fromSchema: DatabaseSchema;
}

export interface IQueryBuilder<T> {
  readonly alias: string;
  readonly type: QueryType;
  /** @internal */
  _fields?: InternalField<T>[];
  /** @internal */
  helper: any;
  select(fields: string | RawQueryFragment | (string | RawQueryFragment)[], distinct?: boolean): this;
  addSelect(fields: string | string[]): this;
  from<T extends object>(target: EntityName<T> | IQueryBuilder<T>, aliasName?: string): IQueryBuilder<T>;
  insert(data: any): this;
  update(data: any): this;
  delete(cond?: FilterQuery<any>): this;
  truncate(): this;
  count(field?: string | string[], distinct?: boolean): this;
  join(field: string, alias: string, cond?: FilterQuery<any>, type?: JoinType, path?: string): this;
  innerJoin(field: string, alias: string, cond?: FilterQuery<any>): this;
  leftJoin(field: string, alias: string, cond?: FilterQuery<any>): this;
  joinAndSelect(field: any, alias: string, cond?: FilterQuery<any>): this;
  leftJoinAndSelect(field: any, alias: string, cond?: FilterQuery<any>, fields?: string[]): this;
  innerJoinAndSelect(field: any, alias: string, cond?: FilterQuery<any>, fields?: string[]): this;
  withSubQuery(subQuery: RawQueryFragment | NativeQueryBuilder, alias: string): this;
  where(
    cond: FilterQuery<T> | string | RawQueryFragment | Dictionary,
    operator?: keyof typeof GroupOperator | any[],
    operator2?: keyof typeof GroupOperator,
  ): this;
  andWhere(cond: FilterQuery<T> | string | RawQueryFragment | Dictionary, params?: any[]): this;
  orWhere(cond: FilterQuery<T> | string | RawQueryFragment | Dictionary, params?: any[]): this;
  orderBy(orderBy: QueryOrderMap<T>): this;
  groupBy(fields: (string | keyof T) | (string | keyof T)[]): this;
  having(cond?: FilterQuery<any> | string, params?: any[]): this;
  getAliasForJoinPath(path: string, options?: ICriteriaNodeProcessOptions): string | undefined;
  getJoinForPath(path?: string, options?: ICriteriaNodeProcessOptions): JoinOptions | undefined;
  getNextAlias(entityName?: string | EntityName<T>): string;
  clone(reset?: boolean | string[], preserve?: string[]): IQueryBuilder<T>;
  setFlag(flag: QueryFlag): this;
  unsetFlag(flag: QueryFlag): this;
  hasFlag(flag: QueryFlag): boolean;
  scheduleFilterCheck(path: string): void;
  withSchema(schema: string): this;
}

export interface ICriteriaNodeProcessOptions {
  alias?: string;
  matchPopulateJoins?: boolean;
  ignoreBranching?: boolean;
  preferNoBranch?: boolean;
  type?: 'orderBy' | 'having'; // no type means it's a regular where query
  filter?: boolean; // use an inner join for given node
  parentPath?: string;
}

export interface ICriteriaNode<T extends object> {
  readonly entityName: EntityName<T>;
  readonly parent?: ICriteriaNode<T> | undefined;
  readonly key?: string | symbol | undefined;
  readonly strict?: boolean;
  payload: any;
  prop?: EntityProperty;
  index?: number;
  process(qb: IQueryBuilder<T>, options?: ICriteriaNodeProcessOptions): any;
  shouldInline(payload: any): boolean;
  willAutoJoin(qb: IQueryBuilder<T>, alias?: string, options?: ICriteriaNodeProcessOptions): boolean;
  shouldRename(payload: any): boolean;
  renameFieldToPK<T>(qb: IQueryBuilder<T>, ownerAlias?: string): string;
  getPath(opts?: { addIndex?: boolean }): string;
  getPivotPath(path: string): string;
}

export type MaybeReturnType<T> = T extends (...args: any[]) => infer R ? R : T;

export type InferEntityProperties<Schema> = Schema extends EntitySchemaWithMeta<any, any, any, any, infer Properties> ? Properties : never;

export type InferKyselyDB<TEntities extends { name: string }, TOptions extends MikroKyselyPluginOptions = {}> = MapValueAsTable<
  MapTableName<TEntities, TOptions>,
  TOptions
>;

export type InferDBFromKysely<TKysely extends Kysely<any>> = TKysely extends Kysely<infer TDB> ? TDB : never;

type PreferStringLiteral<TCandidate, TFallback> = [TCandidate] extends [never]
  ? TFallback
  : string extends TCandidate
    ? TFallback
    : TCandidate extends string
      ? TCandidate
      : TFallback;

export type MapTableName<T extends { name: string; tableName?: string }, TOptions extends MikroKyselyPluginOptions = {}> = {
  [P in T as TOptions['tableNamingStrategy'] extends 'entity' ? P['name'] : PreferStringLiteral<NonNullable<P['tableName']>, P['name']>]: P;
};

export type MapValueAsTable<TMap extends Record<string, any>, TOptions extends MikroKyselyPluginOptions = {}> = {
  [K in keyof TMap as TransformName<K, TOptions['tableNamingStrategy'] extends 'entity' ? 'entity' : 'underscore'>]: InferKyselyTable<TMap[K], TOptions>;
};

export type InferKyselyTable<TSchema extends EntitySchemaWithMeta, TOptions extends MikroKyselyPluginOptions = {}> = ExcludeNever<{
  -readonly [K in keyof InferEntityProperties<TSchema> as TransformColumnName<
    K,
    TOptions['columnNamingStrategy'] extends 'property' ? 'property' : 'underscore',
    MaybeReturnType<InferEntityProperties<TSchema>[K]>
  >]: InferColumnValue<MaybeReturnType<InferEntityProperties<TSchema>[K]>, TOptions['processOnCreateHooks'] extends true ? true : false>;
}>;

type TransformName<TName, TNamingStrategy extends 'underscore' | 'entity'> = TNamingStrategy extends 'underscore'
  ? TName extends string
    ? SnakeCase<TName>
    : TName
  : TName;

type TransformColumnName<TName, TNamingStrategy extends 'underscore' | 'property', TBuilder> = TNamingStrategy extends 'property'
  ? TName
  : TBuilder extends { '~options': { fieldName: string } }
    ? TBuilder['~options']['fieldName']
    : TName extends string
      ? MaybeJoinColumnName<SnakeCase<TName>, TBuilder>
      : never;

type MaybeJoinColumnName<TName extends string, TBuilder> = TBuilder extends {
  '~type'?: { value: infer Value };
  '~options': { kind: 'm:1' };
}
  ? PrimaryProperty<Value> extends string
    ? `${TName}_${SnakeCase<PrimaryProperty<Value>>}`
    : never
  : TBuilder extends {
        '~type'?: { value: infer Value };
        '~options': { kind: '1:1'; owner: true };
      }
    ? PrimaryProperty<Value> extends string
      ? `${TName}_${SnakeCase<PrimaryProperty<Value>>}`
      : never
    : TName;

export type SnakeCase<TName extends string> = TName extends `${infer A}${infer B}${infer Rest}`
  ? IsUpperLetter<B> extends never
    ? `${Lowercase<A>}${SnakeCase<`${B}${Rest}`>}`
    : IsLowerLetter<A> extends never
      ? `${Lowercase<A>}${SnakeCase<`${B}${Rest}`>}`
      : `${Lowercase<A>}_${SnakeCase<`${B}${Rest}`>}`
  : Lowercase<TName>;

type IsLowerLetter<C extends string> = C extends Lowercase<C> ? (C extends Uppercase<C> ? never : C) : never;

type IsUpperLetter<C extends string> = C extends Uppercase<C> ? (C extends Lowercase<C> ? never : C) : never;

type InferColumnValue<TBuilder, TProcessOnCreate extends boolean> = TBuilder extends {
  '~type'?: { value: infer Value };
  '~options': infer TOptions;
}
  ? MaybeNever<MaybeGenerated<MaybeJoinKey<Value, TOptions>, TOptions, TProcessOnCreate>, TOptions>
  : never;

type MaybeGenerated<TValue, TOptions, TProcessOnCreate extends boolean> = TOptions extends { nullable: true }
  ? TValue | null
  : TOptions extends { autoincrement: true }
    ? Generated<TValue>
    : TOptions extends { default: true }
      ? Generated<TValue>
      : TOptions extends { defaultRaw: true }
        ? Generated<TValue>
        : TProcessOnCreate extends false
          ? TValue
          : TOptions extends { onCreate: Function }
            ? Generated<TValue>
            : TValue;

type MaybeJoinKey<TValue, TOptions> = TOptions extends { kind: 'm:1' }
  ? UnwrapOpt<Primary<TValue>>
  : TOptions extends { kind: '1:1' }
    ? TOptions extends { owner: true }
      ? UnwrapOpt<Primary<TValue>>
      : never
    : TValue;

type UnwrapOpt<TValue> = TValue extends Opt<infer OriginalValue> ? OriginalValue : TValue;

type MaybeNever<TValue, TOptions> = TOptions extends { persist: false } | { kind: 'm:n' | '1:m' } ? never : TValue;

type ExcludeNever<TMap extends Record<string, any>> = {
  [K in keyof TMap as TMap[K] extends never ? never : K]: TMap[K];
};
