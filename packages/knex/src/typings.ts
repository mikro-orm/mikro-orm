import type {
  DeferMode,
  CheckCallback,
  Dictionary,
  EntityProperty,
  GroupOperator,
  RawQueryFragment,
  QBFilterQuery,
  QueryOrderMap,
  Type,
  QueryFlag,
  AnyEntity,
  EntityName,
  EntitySchemaWithMeta,
  Primary,
  PrimaryProperty,
  Opt,
} from '@mikro-orm/core';
import type { JoinType, QueryType } from './query/enums.js';
import type { DatabaseSchema } from './schema/DatabaseSchema.js';
import type { DatabaseTable } from './schema/DatabaseTable.js';
import type { QueryBuilder } from './query/QueryBuilder.js';
import type { NativeQueryBuilder } from './query/NativeQueryBuilder.js';
import type { Generated, Kysely } from 'kysely';

export interface Table {
  table_name: string;
  schema_name?: string;
  table_comment?: string;
}

type AnyString = string & {};

export type Field<T> = AnyString | keyof T | RawQueryFragment | QueryBuilder | NativeQueryBuilder;

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

export interface SchemaDifference {
  newNamespaces: Set<string>;
  newNativeEnums: { name: string; schema?: string; items: string[] }[];
  newTables: Dictionary<DatabaseTable>;
  changedTables: Dictionary<TableDifference>;
  removedTables: Dictionary<DatabaseTable>;
  removedNamespaces: Set<string>;
  removedNativeEnums: { name: string; schema?: string }[];
  orphanedForeignKeys: ForeignKey[];
  fromSchema: DatabaseSchema;
}

export interface IQueryBuilder<T> {
  readonly alias: string;
  readonly type: QueryType;
  _fields?: Field<T>[];
  /** @internal */
  helper: any;
  select(fields: Field<T> | Field<T>[], distinct?: boolean): this;
  addSelect(fields: string | string[]): this;
  from<T extends AnyEntity<T> = AnyEntity>(target: EntityName<T> | IQueryBuilder<T>, aliasName?: string): IQueryBuilder<T>;
  insert(data: any): this;
  update(data: any): this;
  delete(cond?: QBFilterQuery): this;
  truncate(): this;
  count(field?: string | string[], distinct?: boolean): this;
  join(field: string, alias: string, cond?: QBFilterQuery, type?: JoinType, path?: string): this;
  innerJoin(field: string, alias: string, cond?: QBFilterQuery): this;
  leftJoin(field: string, alias: string, cond?: QBFilterQuery): this;
  joinAndSelect(field: string, alias: string, cond?: QBFilterQuery): this;
  leftJoinAndSelect(field: string, alias: string, cond?: QBFilterQuery, fields?: string[]): this;
  innerJoinAndSelect(field: string, alias: string, cond?: QBFilterQuery, fields?: string[]): this;
  withSubQuery(subQuery: RawQueryFragment | NativeQueryBuilder, alias: string): this;
  where(cond: QBFilterQuery<T>, operator?: keyof typeof GroupOperator): this;
  where(cond: string, params?: any[], operator?: keyof typeof GroupOperator): this;
  andWhere(cond: QBFilterQuery<T>): this;
  andWhere(cond: string, params?: any[]): this;
  orWhere(cond: QBFilterQuery<T>): this;
  orWhere(cond: string, params?: any[]): this;
  orderBy(orderBy: QueryOrderMap<T>): this;
  groupBy(fields: (string | keyof T) | (string | keyof T)[]): this;
  having(cond?: QBFilterQuery | string, params?: any[]): this;
  getAliasForJoinPath(path: string, options?: ICriteriaNodeProcessOptions): string | undefined;
  getJoinForPath(path?: string, options?: ICriteriaNodeProcessOptions): JoinOptions | undefined;
  getNextAlias(entityName?: string): string;
  clone(reset?: boolean): IQueryBuilder<T>;
  setFlag(flag: QueryFlag): this;
  unsetFlag(flag: QueryFlag): this;
  hasFlag(flag: QueryFlag): boolean;
  scheduleFilterCheck(path: string): void;
}

export interface ICriteriaNodeProcessOptions {
  alias?: string;
  matchPopulateJoins?: boolean;
  ignoreBranching?: boolean;
  preferNoBranch?: boolean;
  type?: 'orderBy'; // no type means it's a regular where query
  filter?: boolean; // use an inner join for given node
}

export interface ICriteriaNode<T extends object> {
  readonly entityName: string;
  readonly parent?: ICriteriaNode<T> | undefined;
  readonly key?: string | undefined;
  payload: any;
  prop?: EntityProperty;
  index?: number;
  process(qb: IQueryBuilder<T>, options?: ICriteriaNodeProcessOptions): any;
  shouldInline(payload: any): boolean;
  willAutoJoin(qb: IQueryBuilder<T>, alias?: string, options?: ICriteriaNodeProcessOptions): boolean;
  shouldRename(payload: any): boolean;
  renameFieldToPK<T>(qb: IQueryBuilder<T>, ownerAlias?: string): string;
  getPath(addIndex?: boolean): string;
  getPivotPath(path: string): string;
}

export type MaybeReturnType<T> = T extends (...args: any[]) => infer R ? R : T;

export type InferEntityProperties<Schema> =
  Schema extends EntitySchemaWithMeta<any, any, any, any, infer Properties> ? Properties :
  never;

export type InferKyselyDB<TEntities extends { name: string }, TOptions = {}> = MapValueAsTable<MapByName<TEntities>, TOptions>;

export type InferDBFromKysely<TKysely extends Kysely<any>> = TKysely extends Kysely<infer TDB> ? TDB : never;

export type MapByName<T extends { name: string }> = {
  [P in T as P['name']]: P
};


export type MapValueAsTable<TMap extends Record<string, any>, TOptions = {}> = {
  [K in keyof TMap as TransformName<K, 'underscore'>]: InferKyselyTable<TMap[K], 'underscore'>
};

export type InferKyselyTable<TSchema extends EntitySchemaWithMeta, TNamingStrategy extends 'underscore' | 'entity' = 'underscore', TProcessOnCreate extends boolean = false> = ExcludeNever<{
  -readonly [K in keyof InferEntityProperties<TSchema> as TransformColumnName<K, TNamingStrategy, MaybeReturnType<InferEntityProperties<TSchema>[K]>>]:
    InferColumnValue<MaybeReturnType<InferEntityProperties<TSchema>[K]>, TProcessOnCreate>;
}>;

type TransformName<TName, TNamingStrategy extends 'underscore' | 'entity'> =
  TNamingStrategy extends 'underscore' ? TName extends string ? SnakeCase<TName> : TName :
  TName;

type TransformColumnName<TName, TNamingStrategy extends 'underscore' | 'entity', TBuilder> =
  TNamingStrategy extends 'entity' ? TName :
  TBuilder extends { '~options': { fieldName: string } } ? TBuilder['~options']['fieldName'] :
  TName extends string ? MaybeJoinColumnName<SnakeCase<TName>, TBuilder> :
  never;

type MaybeJoinColumnName<TName extends string, TBuilder> =
  TBuilder extends {
    '~type'?: { value: infer Value };
    '~options': { kind: 'm:1' };
  } ? PrimaryProperty<Value> extends string ? `${TName}_${SnakeCase<PrimaryProperty<Value>>}` : never :
  TBuilder extends {
    '~type'?: { value: infer Value };
    '~options': { kind: '1:1'; owner: true };
  } ? PrimaryProperty<Value> extends string ? `${TName}_${SnakeCase<PrimaryProperty<Value>>}` : never :
  TName;

export type SnakeCase<TName extends string> = TName extends `${infer P1}${infer P2}`
  ? P2 extends Uncapitalize<P2>
    ? `${Uncapitalize<P1>}${SnakeCase<P2>}`
    : `${Uncapitalize<P1>}_${SnakeCase<Uncapitalize<P2>>}`
  : TName;

type InferColumnValue<TBuilder, TProcessOnCreate extends boolean> = TBuilder extends {
  '~type'?: { value: infer Value };
  '~options': infer TOptions;
} ? MaybeNever<
      MaybeGenerated<
        MaybeJoinKey<Value, TOptions>,
        TOptions,
        TProcessOnCreate
      >,
      TOptions
    >
  : never;

type MaybeGenerated<TValue, TOptions, TProcessOnCreate extends boolean> =
  TOptions extends { nullable: true } ? (TValue | null) :
  TOptions extends { autoincrement: true } ? Generated<TValue> :
  TOptions extends { default: true } ? Generated<TValue> :
  TOptions extends { defaultRaw: true } ? Generated<TValue> :
  TProcessOnCreate extends false ? TValue :
  TOptions extends { onCreate: Function } ? Generated<TValue> :
  TValue;

type MaybeJoinKey<TValue, TOptions> =
  TOptions extends { kind: 'm:1' } ? UnwrapOpt<Primary<TValue>> :
  TOptions extends { kind: '1:1' } ?
    TOptions extends { owner: true } ? UnwrapOpt<Primary<TValue>> : never :
  TValue;

type UnwrapOpt<TValue> =
  TValue extends Opt<infer OriginalValue> ? OriginalValue : TValue;

type MaybeNever<TValue, TOptions> =
  TOptions extends { persist: true } ? never :
  TOptions extends { kind: 'm:n' } ? never :
  TValue;

type ExcludeNever<TMap extends Record<string, any>> = {
  [K in keyof TMap as TMap[K] extends never ? never : K]: TMap[K];
};
