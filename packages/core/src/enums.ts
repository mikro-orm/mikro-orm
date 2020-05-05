export enum GroupOperator {
  $and = 'and',
  $or = 'or',
}

export enum QueryOperator {
  $eq = '=',
  $in = 'in',
  $nin = 'not in',
  $gt = '>',
  $gte = '>=',
  $lt = '<',
  $lte = '<=',
  $ne = '!=',
  $not = 'not',
  $like = 'like',
  $re = 'regexp',
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

export enum QueryFlag {
  DISTINCT = 'DISTINCT',
  PAGINATE = 'PAGINATE',
  UPDATE_SUB_QUERY = 'UPDATE_SUB_QUERY',
  DELETE_SUB_QUERY = 'DELETE_SUB_QUERY',
}
