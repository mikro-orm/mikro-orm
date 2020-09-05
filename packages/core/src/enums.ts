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
  $ilike = 'ilike', // postgres only
  $overlap = '&&', // postgres only
  $contains = '@>', // postgres only
  $contained = '<@', // postgres only
}

export const ARRAY_OPERATORS = ['$overlap', '$contains', '$contained'];

export enum QueryOrder {
  ASC = 'ASC',
  ASC_NULLS_LAST = 'ASC NULLS LAST',
  ASC_NULLS_FIRST = 'ASC NULLS FIRST',
  DESC = 'DESC',
  DESC_NULLS_LAST = 'DESC NULLS LAST',
  DESC_NULLS_FIRST = 'DESC NULLS FIRST',
  asc = 'asc',
  asc_nulls_last = 'asc nulls last',
  asc_nulls_first = 'asc nulls first',
  desc = 'desc',
  desc_nulls_last = 'desc nulls last',
  desc_nulls_first = 'desc nulls first',
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
  CONVERT_CUSTOM_TYPES = 'CONVERT_CUSTOM_TYPES',
}
