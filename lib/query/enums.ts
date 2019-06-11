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
  ASC = 'ASC',
  DESC = 'DESC',
  asc = 'asc',
  desc = 'desc',
}

export type QueryOrderMap = Record<string, QueryOrder | keyof typeof QueryOrder>;
