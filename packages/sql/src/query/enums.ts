export enum QueryType {
  TRUNCATE = 'TRUNCATE',
  SELECT = 'SELECT',
  COUNT = 'COUNT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  UPSERT = 'UPSERT',
}

/** Operators that apply to the embedded array column itself, not to individual elements. */
export const EMBEDDABLE_ARRAY_OPS = ['$contains', '$contained', '$overlap'];

export enum JoinType {
  leftJoin = 'left join',
  innerJoin = 'inner join',
  nestedLeftJoin = 'nested left join',
  nestedInnerJoin = 'nested inner join',
  pivotJoin = 'pivot join',
  innerJoinLateral = 'inner join lateral',
  leftJoinLateral = 'left join lateral',
}
