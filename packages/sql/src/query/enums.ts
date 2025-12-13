export enum QueryType {
  TRUNCATE = 'TRUNCATE',
  SELECT = 'SELECT',
  COUNT = 'COUNT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  UPSERT = 'UPSERT',
}

export enum JoinType {
  leftJoin = 'left join',
  innerJoin = 'inner join',
  nestedLeftJoin = 'nested left join',
  nestedInnerJoin = 'nested inner join',
  pivotJoin = 'pivot join',
  innerJoinLateral = 'inner join lateral',
  leftJoinLateral = 'left join lateral',
}
