import type { EntityName, EntityMetadata } from '../typings.js';
import type { EntityManager } from '../EntityManager.js';
import type { UnitOfWork } from '../unit-of-work/UnitOfWork.js';
import type { ChangeSet } from '../unit-of-work/ChangeSet.js';
import type { Transaction } from '../connections/Connection.js';

/** Arguments passed to entity lifecycle event hooks. */
export interface EventArgs<T> {
  entity: T;
  em: EntityManager;
  meta: EntityMetadata<T>;
  changeSet?: ChangeSet<T & {}>;
}

/** Arguments passed to flush lifecycle event hooks (beforeFlush, onFlush, afterFlush). */
export interface FlushEventArgs extends Omit<EventArgs<any>, 'entity' | 'changeSet' | 'meta'> {
  uow: UnitOfWork;
}

/** Arguments passed to transaction lifecycle event hooks (start, commit, rollback). */
export interface TransactionEventArgs extends Omit<EventArgs<any>, 'entity' | 'meta' | 'changeSet'> {
  transaction?: Transaction & { savepointName?: string };
  uow?: UnitOfWork;
}

/** Interface for subscribing to entity and transaction lifecycle events. */
export interface EventSubscriber<T = any> {
  getSubscribedEntities?(): EntityName<T>[];
  onInit?(args: EventArgs<T>): void;
  onLoad?(args: EventArgs<T>): void | Promise<void>;
  beforeCreate?(args: EventArgs<T>): void | Promise<void>;
  afterCreate?(args: EventArgs<T>): void | Promise<void>;
  beforeUpdate?(args: EventArgs<T>): void | Promise<void>;
  afterUpdate?(args: EventArgs<T>): void | Promise<void>;
  beforeUpsert?(args: EventArgs<T>): void | Promise<void>;
  afterUpsert?(args: EventArgs<T>): void | Promise<void>;
  beforeDelete?(args: EventArgs<T>): void | Promise<void>;
  afterDelete?(args: EventArgs<T>): void | Promise<void>;
  beforeFlush?(args: FlushEventArgs): void | Promise<void>;
  onFlush?(args: FlushEventArgs): void | Promise<void>;
  afterFlush?(args: FlushEventArgs): void | Promise<void>;

  beforeTransactionStart?(args: TransactionEventArgs): void | Promise<void>;
  afterTransactionStart?(args: TransactionEventArgs): void | Promise<void>;
  beforeTransactionCommit?(args: TransactionEventArgs): void | Promise<void>;
  afterTransactionCommit?(args: TransactionEventArgs): void | Promise<void>;
  beforeTransactionRollback?(args: TransactionEventArgs): void | Promise<void>;
  afterTransactionRollback?(args: TransactionEventArgs): void | Promise<void>;
}
