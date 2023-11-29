import type { Dictionary, EntityKey, ExpandProperty } from './typings';
import type { Transaction } from './connections';

export enum FlushMode {
  /** The `EntityManager` delays the flush until the current Transaction is committed. */
  COMMIT = 'commit',
  /** This is the default mode, and it flushes the `EntityManager` only if necessary. */
  AUTO = 'auto',
  /** Flushes the `EntityManager` before every query. */
  ALWAYS = 'always',
}

export enum PopulateHint {
  INFER = 'infer',
  ALL = 'all',
}

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
  $fulltext = 'fulltext',
  $exists = 'not null',
  $ilike = 'ilike', // postgres only
  $overlap = '&&', // postgres only
  $contains = '@>', // postgres only
  $contained = '<@', // postgres only
  $none = 'none', // collection operators, sql only
  $some = 'some', // collection operators, sql only
  $every = 'every', // collection operators, sql only
}

export const ARRAY_OPERATORS = [
  '$eq',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$ne',
  '$overlap',
  '$contains',
  '$contained',
];

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
export type QueryOrderKeys<T> = QueryOrderKeysFlat | QueryOrderMap<T>;

export type QueryOrderMap<T> = {
  [K in EntityKey<T>]?: QueryOrderKeys<ExpandProperty<T[K]>>;
};

export type QBQueryOrderMap<T> = QueryOrderMap<T> | Dictionary;

export interface FlatQueryOrderMap {
  [x: string]: QueryOrderKeysFlat;
}

export enum QueryFlag {
  DISTINCT = 'DISTINCT',
  PAGINATE = 'PAGINATE',
  DISABLE_PAGINATE = 'DISABLE_PAGINATE',
  UPDATE_SUB_QUERY = 'UPDATE_SUB_QUERY',
  DELETE_SUB_QUERY = 'DELETE_SUB_QUERY',
  CONVERT_CUSTOM_TYPES = 'CONVERT_CUSTOM_TYPES',
  INCLUDE_LAZY_FORMULAS = 'INCLUDE_LAZY_FORMULAS',
  AUTO_JOIN_ONE_TO_ONE_OWNER = 'AUTO_JOIN_ONE_TO_ONE_OWNER',
  INFER_POPULATE = 'INFER_POPULATE',
}

export const SCALAR_TYPES = ['string', 'number', 'boolean', 'Date', 'Buffer', 'RegExp'];

export enum ReferenceKind {
  SCALAR = 'scalar',
  ONE_TO_ONE = '1:1',
  ONE_TO_MANY = '1:m',
  MANY_TO_ONE = 'm:1',
  MANY_TO_MANY = 'm:n',
  EMBEDDED = 'embedded',
}

export enum Cascade {
  PERSIST = 'persist',
  MERGE = 'merge',
  REMOVE = 'remove',
  ALL = 'all',

  /** @internal */
  SCHEDULE_ORPHAN_REMOVAL = 'schedule_orphan_removal',
  /** @internal */
  CANCEL_ORPHAN_REMOVAL = 'cancel_orphan_removal',
}

export enum LoadStrategy {
  SELECT_IN = 'select-in',
  JOINED = 'joined'
}

export enum Dataloader {
  OFF = 0,
  REFERENCE = 1,
  COLLECTION = 2,
  ALL = 3,
}

export enum LockMode {
  NONE = 0,
  OPTIMISTIC = 1,
  PESSIMISTIC_READ = 2,
  PESSIMISTIC_WRITE = 3,
  PESSIMISTIC_PARTIAL_WRITE = 4,
  PESSIMISTIC_WRITE_OR_FAIL = 5,
  PESSIMISTIC_PARTIAL_READ = 6,
  PESSIMISTIC_READ_OR_FAIL = 7,
}

export enum IsolationLevel {
  READ_UNCOMMITTED = 'read uncommitted',
  READ_COMMITTED = 'read committed',
  SNAPSHOT = 'snapshot',
  REPEATABLE_READ = 'repeatable read',
  SERIALIZABLE = 'serializable',
}

export enum EventType {
  onInit = 'onInit',
  onLoad = 'onLoad',
  beforeCreate = 'beforeCreate',
  afterCreate = 'afterCreate',
  beforeUpdate = 'beforeUpdate',
  afterUpdate = 'afterUpdate',
  beforeUpsert = 'beforeUpsert',
  afterUpsert = 'afterUpsert',
  beforeDelete = 'beforeDelete',
  afterDelete = 'afterDelete',
  beforeFlush = 'beforeFlush',
  onFlush = 'onFlush',
  afterFlush = 'afterFlush',
  beforeTransactionStart = 'beforeTransactionStart',
  afterTransactionStart = 'afterTransactionStart',
  beforeTransactionCommit = 'beforeTransactionCommit',
  afterTransactionCommit = 'afterTransactionCommit',
  beforeTransactionRollback = 'beforeTransactionRollback',
  afterTransactionRollback = 'afterTransactionRollback',
}

export const EventTypeMap = Object.keys(EventType).reduce((a, b, i) => {
  a[b as EventType] = i;
  return a;
}, {} as Record<EventType, number>);

export type TransactionEventType = EventType.beforeTransactionStart | EventType.afterTransactionStart | EventType.beforeTransactionCommit | EventType.afterTransactionCommit | EventType.beforeTransactionRollback | EventType.afterTransactionRollback;

export interface TransactionOptions {
  ctx?: Transaction;
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
  clear?: boolean;
  flushMode?: FlushMode;
  ignoreNestedTransactions?: boolean;
}

export abstract class PlainObject {
}
