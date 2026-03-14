import type { EntityKey, ExpandProperty } from './typings.js';
import type { Transaction } from './connections/Connection.js';
import type { LogContext } from './logging/Logger.js';

/** Controls when the `EntityManager` flushes pending changes to the database. */
export enum FlushMode {
  /** The `EntityManager` delays the flush until the current Transaction is committed. */
  COMMIT = 'commit',
  /** This is the default mode, and it flushes the `EntityManager` only if necessary. */
  AUTO = 'auto',
  /** Flushes the `EntityManager` before every query. */
  ALWAYS = 'always',
}

/** Controls how populate hints are resolved when using `FindOptions.populateWhere`. */
export enum PopulateHint {
  /** Infer population hints from the `where` condition. */
  INFER = 'infer',
  /** Apply population hints to all relations. */
  ALL = 'all',
}

/** Special tokens used as populate path values in `FindOptions.populate`. */
export enum PopulatePath {
  /** Infer which relations to populate based on fields accessed in the `where` or `orderBy` clause. */
  INFER = '$infer',
  /** Populate all relations. */
  ALL = '*',
}

/** Logical grouping operators for combining query conditions. */
export enum GroupOperator {
  /** Logical AND — all conditions must match. */
  $and = 'and',
  /** Logical OR — at least one condition must match. */
  $or = 'or',
}

/** Comparison and filtering operators used in query conditions. */
export enum QueryOperator {
  /** Equal. */
  $eq = '=',
  /** Included in the given list. */
  $in = 'in',
  /** Not included in the given list. */
  $nin = 'not in',
  /** Greater than. */
  $gt = '>',
  /** Greater than or equal to. */
  $gte = '>=',
  /** Less than. */
  $lt = '<',
  /** Less than or equal to. */
  $lte = '<=',
  /** Not equal. */
  $ne = '!=',
  /** Negation wrapper. */
  $not = 'not',
  /** SQL LIKE pattern matching. */
  $like = 'like',
  /** Regular expression matching. */
  $re = 'regexp',
  /** Full-text search. */
  $fulltext = 'fulltext',
  /** Checks that the value is not null (i.e., exists). */
  $exists = 'not null',
  /** Case-insensitive LIKE (PostgreSQL only). */
  $ilike = 'ilike', // postgres only
  /** Array overlap operator (PostgreSQL only). */
  $overlap = '&&', // postgres only
  /** Array/JSON contains operator (PostgreSQL only). */
  $contains = '@>', // postgres only
  /** Array/JSON contained-by operator (PostgreSQL only). */
  $contained = '<@', // postgres only
  /** No element in the collection matches (SQL only). */
  $none = 'none', // collection operators, sql only
  /** At least one element in the collection matches (SQL only). */
  $some = 'some', // collection operators, sql only
  /** Every element in the collection matches (SQL only). */
  $every = 'every', // collection operators, sql only
  /** Matches collections by their size (SQL only). */
  $size = 'size', // collection operators, sql only
  /** JSON object has the given key (PostgreSQL only). */
  $hasKey = '?', // postgres only, json
  /** JSON object has all of the given keys (PostgreSQL only). */
  $hasKeys = '?&', // postgres only, json
  /** JSON object has at least one of the given keys (PostgreSQL only). */
  $hasSomeKeys = '?|', // postgres only, json
  /** Matches an element inside a JSON array (SQL only). */
  $elemMatch = 'elemMatch', // json array element matching, sql only
}

export const ARRAY_OPERATORS = ['$eq', '$gt', '$gte', '$lt', '$lte', '$ne', '$overlap', '$contains', '$contained'];

export const JSON_KEY_OPERATORS = ['$hasKey', '$hasKeys', '$hasSomeKeys'];

/** Sort direction for query results. Both upper- and lower-case variants are accepted. */
export enum QueryOrder {
  /** Ascending order. */
  ASC = 'ASC',
  /** Ascending order with nulls sorted last. */
  ASC_NULLS_LAST = 'ASC NULLS LAST',
  /** Ascending order with nulls sorted first. */
  ASC_NULLS_FIRST = 'ASC NULLS FIRST',
  /** Descending order. */
  DESC = 'DESC',
  /** Descending order with nulls sorted last. */
  DESC_NULLS_LAST = 'DESC NULLS LAST',
  /** Descending order with nulls sorted first. */
  DESC_NULLS_FIRST = 'DESC NULLS FIRST',
  /** Ascending order (lower-case variant). */
  asc = 'asc',
  /** Ascending order with nulls sorted last (lower-case variant). */
  asc_nulls_last = 'asc nulls last',
  /** Ascending order with nulls sorted first (lower-case variant). */
  asc_nulls_first = 'asc nulls first',
  /** Descending order (lower-case variant). */
  desc = 'desc',
  /** Descending order with nulls sorted last (lower-case variant). */
  desc_nulls_last = 'desc nulls last',
  /** Descending order with nulls sorted first (lower-case variant). */
  desc_nulls_first = 'desc nulls first',
}

/** Numeric sort direction, compatible with MongoDB-style ordering. */
export enum QueryOrderNumeric {
  /** Ascending order. */
  ASC = 1,
  /** Descending order. */
  DESC = -1,
}

export type QueryOrderKeysFlat = QueryOrder | QueryOrderNumeric | `${QueryOrder}`;
export type QueryOrderKeys<T> = QueryOrderKeysFlat | QueryOrderMap<T>;

export type QueryOrderMap<T> = {
  [K in EntityKey<T>]?: QueryOrderKeys<ExpandProperty<T[K]>>;
};

export interface FlatQueryOrderMap {
  [x: string]: QueryOrderKeysFlat;
}

/** Flags that modify query builder behavior. */
export enum QueryFlag {
  /** Add a DISTINCT clause to the SELECT statement. */
  DISTINCT = 'DISTINCT',
  /** Enable result pagination via a sub-query for the primary keys. */
  PAGINATE = 'PAGINATE',
  /** Disable the automatic pagination sub-query. */
  DISABLE_PAGINATE = 'DISABLE_PAGINATE',
  /** Wrap UPDATE statements in a sub-query. */
  UPDATE_SUB_QUERY = 'UPDATE_SUB_QUERY',
  /** Wrap DELETE statements in a sub-query. */
  DELETE_SUB_QUERY = 'DELETE_SUB_QUERY',
  /** Convert values through custom type mappings when reading results. */
  CONVERT_CUSTOM_TYPES = 'CONVERT_CUSTOM_TYPES',
  /** Include lazy formula properties in the SELECT clause. */
  INCLUDE_LAZY_FORMULAS = 'INCLUDE_LAZY_FORMULAS',
  /** Automatically join the owning side of one-to-one relations. */
  AUTO_JOIN_ONE_TO_ONE_OWNER = 'AUTO_JOIN_ONE_TO_ONE_OWNER',
  /** Infer the populate hint from the query fields. */
  INFER_POPULATE = 'INFER_POPULATE',
  /** Prevent nested conditions from being promoted to INNER JOINs. */
  DISABLE_NESTED_INNER_JOIN = 'DISABLE_NESTED_INNER_JOIN',
  /** Enable IDENTITY_INSERT for explicit PK values (MSSQL only). */
  IDENTITY_INSERT = 'IDENTITY_INSERT', // mssql only
  /** Use an OUTPUT...INTO temp table for returning rows (MSSQL only). */
  OUTPUT_TABLE = 'OUTPUT_TABLE', // mssql only
}

export const SCALAR_TYPES: Set<string> = new Set([
  'string',
  'number',
  'boolean',
  'bigint',
  'Uint8Array',
  'Date',
  'Buffer',
  'RegExp',
]);

/** Describes the kind of relationship a property represents. */
export enum ReferenceKind {
  /** A plain scalar property (not a relation). */
  SCALAR = 'scalar',
  /** A one-to-one relation. */
  ONE_TO_ONE = '1:1',
  /** A one-to-many relation (inverse side of a many-to-one). */
  ONE_TO_MANY = '1:m',
  /** A many-to-one relation (owning side). */
  MANY_TO_ONE = 'm:1',
  /** A many-to-many relation. */
  MANY_TO_MANY = 'm:n',
  /** An embedded entity (inline object stored within the parent). */
  EMBEDDED = 'embedded',
}

/** Cascade operations that propagate from a parent entity to its relations. */
export enum Cascade {
  /** Cascade persist — new related entities are automatically persisted. */
  PERSIST = 'persist',
  /** Cascade merge — detached related entities are merged into the identity map. */
  MERGE = 'merge',
  /** Cascade remove — removing the parent also removes related entities. */
  REMOVE = 'remove',
  /** Enable all cascade operations (persist, merge, remove). */
  ALL = 'all',

  /** @internal */
  SCHEDULE_ORPHAN_REMOVAL = 'schedule_orphan_removal',
  /** @internal */
  CANCEL_ORPHAN_REMOVAL = 'cancel_orphan_removal',
}

/** Strategy used to load related entities when populating. */
export enum LoadStrategy {
  /** Load relations with a separate SELECT ... WHERE pk IN (...) query. */
  SELECT_IN = 'select-in',
  /** Load relations via SQL JOINs in a single query. */
  JOINED = 'joined',
  /** Use joined strategy for to-one relations and select-in for to-many. */
  BALANCED = 'balanced',
}

/** Controls which relation types use the dataloader for batched loading. */
export enum DataloaderType {
  /** Dataloader is disabled. */
  NONE = 0,
  /** Use the dataloader for Reference (to-one) relations only. */
  REFERENCE = 1,
  /** Use the dataloader for Collection (to-many) relations only. */
  COLLECTION = 2,
  /** Use the dataloader for both Reference and Collection relations. */
  ALL = 3,
}

/** Locking strategy for concurrency control. */
export enum LockMode {
  /** No locking. */
  NONE = 0,
  /** Optimistic locking via a version column. */
  OPTIMISTIC = 1,
  /** Pessimistic shared lock (FOR SHARE). */
  PESSIMISTIC_READ = 2,
  /** Pessimistic exclusive lock (FOR UPDATE). */
  PESSIMISTIC_WRITE = 3,
  /** Pessimistic exclusive lock that skips already-locked rows (FOR UPDATE SKIP LOCKED). */
  PESSIMISTIC_PARTIAL_WRITE = 4,
  /** Pessimistic exclusive lock that fails immediately if the row is locked (FOR UPDATE NOWAIT). */
  PESSIMISTIC_WRITE_OR_FAIL = 5,
  /** Pessimistic shared lock that skips already-locked rows (FOR SHARE SKIP LOCKED). */
  PESSIMISTIC_PARTIAL_READ = 6,
  /** Pessimistic shared lock that fails immediately if the row is locked (FOR SHARE NOWAIT). */
  PESSIMISTIC_READ_OR_FAIL = 7,
}

/** Transaction isolation levels as defined by the SQL standard (plus vendor extensions). */
export enum IsolationLevel {
  /** Allows dirty reads, non-repeatable reads, and phantom reads. */
  READ_UNCOMMITTED = 'read uncommitted',
  /** Prevents dirty reads; non-repeatable and phantom reads are still possible. */
  READ_COMMITTED = 'read committed',
  /** Snapshot isolation — each transaction sees a consistent snapshot of the database (MSSQL). */
  SNAPSHOT = 'snapshot',
  /** Prevents dirty and non-repeatable reads; phantom reads are still possible. */
  REPEATABLE_READ = 'repeatable read',
  /** Full isolation — transactions are executed as if they were run sequentially. */
  SERIALIZABLE = 'serializable',
}

/** Lifecycle and transaction events emitted by the ORM. */
export enum EventType {
  /** Fired when an entity instance is created (via constructor or `em.create`). */
  onInit = 'onInit',
  /** Fired after an entity is loaded from the database. */
  onLoad = 'onLoad',
  /** Fired before a new entity is inserted into the database. */
  beforeCreate = 'beforeCreate',
  /** Fired after a new entity has been inserted into the database. */
  afterCreate = 'afterCreate',
  /** Fired before an existing entity is updated in the database. */
  beforeUpdate = 'beforeUpdate',
  /** Fired after an existing entity has been updated in the database. */
  afterUpdate = 'afterUpdate',
  /** Fired before an upsert operation. */
  beforeUpsert = 'beforeUpsert',
  /** Fired after an upsert operation. */
  afterUpsert = 'afterUpsert',
  /** Fired before an entity is deleted from the database. */
  beforeDelete = 'beforeDelete',
  /** Fired after an entity has been deleted from the database. */
  afterDelete = 'afterDelete',
  /** Fired at the very beginning of `em.flush()`, before change detection. */
  beforeFlush = 'beforeFlush',
  /** Fired during `em.flush()` after change detection but before database writes. */
  onFlush = 'onFlush',
  /** Fired after `em.flush()` has completed all database writes. */
  afterFlush = 'afterFlush',
  /** Fired before a new database transaction is started. */
  beforeTransactionStart = 'beforeTransactionStart',
  /** Fired after a new database transaction has been started. */
  afterTransactionStart = 'afterTransactionStart',
  /** Fired before a database transaction is committed. */
  beforeTransactionCommit = 'beforeTransactionCommit',
  /** Fired after a database transaction has been committed. */
  afterTransactionCommit = 'afterTransactionCommit',
  /** Fired before a database transaction is rolled back. */
  beforeTransactionRollback = 'beforeTransactionRollback',
  /** Fired after a database transaction has been rolled back. */
  afterTransactionRollback = 'afterTransactionRollback',
}

export const EventTypeMap: Record<EventType, number> = Object.keys(EventType).reduce(
  (a, b, i) => {
    a[b as EventType] = i;
    return a;
  },
  {} as Record<EventType, number>,
);

export type TransactionEventType =
  | EventType.beforeTransactionStart
  | EventType.afterTransactionStart
  | EventType.beforeTransactionCommit
  | EventType.afterTransactionCommit
  | EventType.beforeTransactionRollback
  | EventType.afterTransactionRollback;

/** Controls how a transactional operation interacts with an existing transaction. */
export enum TransactionPropagation {
  /** Join the current transaction or create a new one if none exists. */
  REQUIRED = 'required',
  /** Always create a new transaction, suspending the current one if it exists. */
  REQUIRES_NEW = 'requires_new',
  /** Create a nested savepoint within the current transaction, or a new transaction if none exists. */
  NESTED = 'nested',
  /** Execute non-transactionally, suspending the current transaction if one exists. */
  NOT_SUPPORTED = 'not_supported',
  /** Join the current transaction if one exists, otherwise execute non-transactionally. */
  SUPPORTS = 'supports',
  /** Join the current transaction; throw if no transaction is active. */
  MANDATORY = 'mandatory',
  /** Execute non-transactionally; throw if a transaction is active. */
  NEVER = 'never',
}

export interface TransactionOptions {
  ctx?: Transaction;
  propagation?: TransactionPropagation | `${TransactionPropagation}`;
  isolationLevel?: IsolationLevel | `${IsolationLevel}`;
  readOnly?: boolean;
  clear?: boolean;
  flushMode?: FlushMode | `${FlushMode}`;
  ignoreNestedTransactions?: boolean;
  loggerContext?: LogContext;
}

export abstract class PlainObject {}

/** Constraint deferral mode for database constraints (e.g., foreign keys, unique). */
export enum DeferMode {
  /** The constraint is checked immediately by default, but can be deferred within a transaction. */
  INITIALLY_IMMEDIATE = 'immediate',
  /** The constraint is deferred until the transaction is committed. */
  INITIALLY_DEFERRED = 'deferred',
}

/** With `absolute` the prefix is set at the root of the entity (regardless of the nesting level) */
export type EmbeddedPrefixMode = 'absolute' | 'relative';
