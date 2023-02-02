import type { EntityName, EntityMetadata } from '../typings';
import type { EntityManager } from '../EntityManager';
import type { ChangeSet, UnitOfWork } from '../unit-of-work';
import type { Transaction } from '../connections';

export interface EventArgs<T> {
  entity: T;
  em: EntityManager;
  meta: EntityMetadata<T>;
  changeSet?: ChangeSet<T & {}>;
}

export interface FlushEventArgs extends Omit<EventArgs<any>, 'entity' | 'changeSet' | 'meta'> {
  uow: UnitOfWork;
}

export interface TransactionEventArgs extends Omit<EventArgs<any>, 'entity' | 'meta' | 'changeSet'> {
  transaction?: Transaction;
  uow?: UnitOfWork;
}

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
