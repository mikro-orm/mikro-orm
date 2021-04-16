import { Knex } from 'knex';
import { Dictionary, EntityProperty, GroupOperator, QBFilterQuery, QueryOrderMap, Type } from '@mikro-orm/core';
import { QueryType } from './query/enums';
import { DatabaseSchema, DatabaseTable } from './schema';

export interface Table {
  table_name: string;
  schema_name?: string;
  table_comment?: string;
}

export type KnexStringRef = Knex.Ref<string, {
  [alias: string]: string;
}>;

export type Field<T> = string | keyof T | KnexStringRef | Knex.QueryBuilder;

export interface JoinOptions {
  table: string;
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

export interface Index {
  columnNames: string[];
  keyName: string;
  unique: boolean;
  primary: boolean;
  composite?: boolean;
  expression?: string; // allows using custom sql expressions
  type?: string; // for back compatibility mainly, to allow using knex's `index.type` option (e.g. gin index)
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
  addedColumns: Dictionary<Column>;
  changedColumns: Dictionary<ColumnDifference>;
  removedColumns: Dictionary<Column>;
  renamedColumns: Dictionary<Column>;
  addedIndexes: Dictionary<Index>;
  changedIndexes: Dictionary<Index>;
  removedIndexes: Dictionary<Index>;
  renamedIndexes: Dictionary<Index>;
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
  readonly type: QueryType;
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
  leftJoinAndSelect(field: string, alias: string, cond?: QBFilterQuery): this;
  withSubQuery(subQuery: Knex.QueryBuilder, alias: string): this;
  where(cond: QBFilterQuery<T>, operator?: keyof typeof GroupOperator): this;
  where(cond: string, params?: any[], operator?: keyof typeof GroupOperator): this;
  andWhere(cond: QBFilterQuery<T>): this;
  andWhere(cond: string, params?: any[]): this;
  orWhere(cond: QBFilterQuery<T>): this;
  orWhere(cond: string, params?: any[]): this;
  orderBy(orderBy: QueryOrderMap): this;
  groupBy(fields: (string | keyof T) | (string | keyof T)[]): this;
  having(cond?: QBFilterQuery | string, params?: any[]): this;
  getAliasForJoinPath(path: string): string | undefined;
  getNextAlias(prefix?: string): string;
}

export interface ICriteriaNode {
  readonly entityName: string;
  readonly parent?: ICriteriaNode | undefined;
  readonly key?: string | undefined;
  payload: any;
  prop?: EntityProperty;
  process<T>(qb: IQueryBuilder<T>, alias?: string): any;
  shouldInline(payload: any): boolean;
  willAutoJoin<T>(qb: IQueryBuilder<T>, alias?: string): boolean;
  shouldRename(payload: any): boolean;
  renameFieldToPK<T>(qb: IQueryBuilder<T>): string;
  getPath(): string;
  getPivotPath(path: string): string;
}
