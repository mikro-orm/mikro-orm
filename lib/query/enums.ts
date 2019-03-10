export enum QueryType {
  TRUNCATE = 'TRUNCATE',
  SELECT = 'SELECT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum QueryFlag {
  COUNT = 'SELECT',
  DISTINCT = 'DISTINCT',
}

export enum QueryOrder {
  ASC = 1,
  DESC = -1,
}
