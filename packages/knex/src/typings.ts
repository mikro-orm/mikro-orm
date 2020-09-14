import { QueryBuilder as KnexQueryBuilder, Ref } from 'knex';
import { Dictionary, EntityProperty, GroupOperator, QBFilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { QueryType } from './query/enums';

export interface Table {
  table_name: string;
  schema_name?: string;
}

export type KnexStringRef = Ref<string, {
  [alias: string]: string;
}>;

export type Field<T> = string | keyof T | KnexStringRef | KnexQueryBuilder;

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
  fk: ForeignKey;
  fks: ForeignKey[];
  indexes: Index[];
  primary: boolean;
  unique: boolean;
  nullable: boolean;
  maxLength: number;
  defaultValue: string | null;
  enumItems: string[];
}

export interface ForeignKey {
  columnName: string;
  constraintName: string;
  referencedTableName: string;
  referencedColumnName: string;
  updateRule: string;
  deleteRule: string;
}

export interface Index {
  columnName: string;
  keyName: string;
  unique: boolean;
  primary: boolean;
  composite?: boolean;
}

export interface IsSame {
  all?: boolean;
  sameTypes?: boolean;
  sameNullable?: boolean;
  sameDefault?: boolean;
  sameIndex?: boolean;
  sameEnums?: boolean;
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
  withSubQuery(subQuery: KnexQueryBuilder, alias: string): this;
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
