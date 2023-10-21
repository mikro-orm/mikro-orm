import type { Knex } from 'knex';
import type { CheckCallback, Dictionary, EntityProperty, GroupOperator, QBFilterQuery, QueryOrderMap, Type } from '@mikro-orm/core';
import type { QueryType } from './query/enums';
import type { DatabaseSchema, DatabaseTable } from './schema';

export interface Table {
  table_name: string;
  schema_name?: string;
  table_comment?: string;
}

export type KnexStringRef = Knex.Ref<string, {
  [alias: string]: string;
}>;

type AnyString = string & {};

export type Field<T> = AnyString | keyof T | KnexStringRef | Knex.QueryBuilder;

export interface JoinOptions {
  table: string;
  schema?: string;
  type: 'leftJoin' | 'innerJoin' | 'pivotJoin';
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
  comment?: string;
  enumItems?: string[];
  primary?: boolean;
  unique?: boolean;
  /** mysql only */
  extra?: string;
  ignoreSchemaChanges?: ('type' | 'extra')[];
}

export interface ForeignKey {
  columnNames: string[];
  constraintName: string;
  localTableName: string;
  referencedTableName: string;
  referencedColumnNames: string[];
  updateRule?: string;
  deleteRule?: string;
}

export interface IndexDef {
  columnNames: string[];
  keyName: string;
  unique: boolean;
  primary: boolean;
  composite?: boolean;
  expression?: string; // allows using custom sql expressions
  type?: string | Readonly<{ indexType?: string; storageEngineIndexType?: 'hash' | 'btree'; predicate?: Knex.QueryBuilder }>; // for back compatibility mainly, to allow using knex's `index.type` option (e.g. gin index)
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
  newTables: Dictionary<DatabaseTable>;
  changedTables: Dictionary<TableDifference>;
  removedTables: Dictionary<DatabaseTable>;
  removedNamespaces: Set<string>;
  orphanedForeignKeys: ForeignKey[];
  fromSchema: DatabaseSchema;
}

export interface IQueryBuilder<T> {
  readonly alias: string;
  readonly type?: QueryType;
  _fields?: Field<T>[];
  select(fields: Field<T> | Field<T>[], distinct?: boolean): this;
  addSelect(fields: string | string[]): this;
  insert(data: any): this;
  update(data: any): this;
  delete(cond?: QBFilterQuery): this;
  truncate(): this;
  count(field?: string | string[], distinct?: boolean): this;
  join(field: string, alias: string, cond?: QBFilterQuery, type?: 'leftJoin' | 'innerJoin' | 'pivotJoin', path?: string): this;
  leftJoin(field: string, alias: string, cond?: QBFilterQuery): this;
  joinAndSelect(field: string, alias: string, cond?: QBFilterQuery): this;
  leftJoinAndSelect(field: string, alias: string, cond?: QBFilterQuery, fields?: string[]): this;
  innerJoinAndSelect(field: string, alias: string, cond?: QBFilterQuery, fields?: string[]): this;
  withSubQuery(subQuery: Knex.QueryBuilder, alias: string): this;
  where(cond: QBFilterQuery<T>, operator?: keyof typeof GroupOperator): this;
  where(cond: string, params?: any[], operator?: keyof typeof GroupOperator): this;
  andWhere(cond: QBFilterQuery<T>): this;
  andWhere(cond: string, params?: any[]): this;
  orWhere(cond: QBFilterQuery<T>): this;
  orWhere(cond: string, params?: any[]): this;
  orderBy(orderBy: QueryOrderMap<T>): this;
  groupBy(fields: (string | keyof T) | (string | keyof T)[]): this;
  having(cond?: QBFilterQuery | string, params?: any[]): this;
  getAliasForJoinPath(path: string): string | undefined;
  getNextAlias(entityName?: string): string;
}

export interface ICriteriaNode<T extends object> {
  readonly entityName: string;
  readonly parent?: ICriteriaNode<T> | undefined;
  readonly key?: string | undefined;
  payload: any;
  prop?: EntityProperty;
  index?: number;
  process(qb: IQueryBuilder<T>, alias?: string): any;
  shouldInline(payload: any): boolean;
  willAutoJoin(qb: IQueryBuilder<T>, alias?: string): boolean;
  shouldRename(payload: any): boolean;
  renameFieldToPK<T>(qb: IQueryBuilder<T>): string;
  getPath(addIndex?: boolean): string;
  getPivotPath(path: string): string;
}
