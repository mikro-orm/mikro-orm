export enum QueryType {
  TRUNCATE = 'TRUNCATE',
  SELECT = 'SELECT',
  COUNT = 'COUNT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum QueryFlag {
  DISTINCT = 'DISTINCT',
  AUTO_GROUP_BY = 'AUTO_GROUP_BY', // automatically add missing fields to group by clause to fix `only_full_group_by` issues
}

export enum QueryOrder {
  ASC = 'ASC',
  DESC = 'DESC',
  asc = 'asc',
  desc = 'desc',
}

export enum QueryOrderNumeric {
  ASC = 1,
  DESC = -1,
}

export type QueryOrderKeysFlat = QueryOrder | QueryOrderNumeric | keyof typeof QueryOrder;
export type QueryOrderKeys = QueryOrderKeysFlat | QueryOrderMap;

export interface QueryOrderMap {
  [x: string]: QueryOrderKeys;
}

export interface FlatQueryOrderMap {
  [x: string]: QueryOrderKeysFlat;
}
