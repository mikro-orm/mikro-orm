import type { EntityName } from '../typings';
import type { EntityManager } from '../EntityManager';
import type { ChangeSet, UnitOfWork } from '../unit-of-work';
import type { Transaction } from '../connections';

export interface EventArgs<T> {
  entity: T;
  em: EntityManager;
  changeSet?: ChangeSet<T>;
}

export interface FlushEventArgs extends Omit<EventArgs<unknown>, 'entity'> {
  uow: UnitOfWork;
}

export interface TransactionEventArgs extends Omit<EventArgs<unknown>, 'entity' | 'changeSet'> {
  transaction?: Transaction;
  uow?: UnitOfWork;
}

export interface EventSubscriber<T = any> {
  getSubscribedEntities?(): EntityName<T>[];
  onInit?(args: EventArgs<T>): void;
  beforeCreate?(args: EventArgs<T>): Promise<void>;
  afterCreate?(args: EventArgs<T>): Promise<void>;
  beforeUpdate?(args: EventArgs<T>): Promise<void>;
  afterUpdate?(args: EventArgs<T>): Promise<void>;
  beforeDelete?(args: EventArgs<T>): Promise<void>;
  afterDelete?(args: EventArgs<T>): Promise<void>;
  beforeFlush?(args: FlushEventArgs): Promise<void>;
  onFlush?(args: FlushEventArgs): Promise<void>;
  afterFlush?(args: FlushEventArgs): Promise<void>;

  beforeTransactionStart?(args: TransactionEventArgs): Promise<void>;
  afterTransactionStart?(args: TransactionEventArgs): Promise<void>;
  beforeTransactionCommit?(args: TransactionEventArgs): Promise<void>;
  afterTransactionCommit?(args: TransactionEventArgs): Promise<void>;
  beforeTransactionRollback?(args: TransactionEventArgs): Promise<void>;
  afterTransactionRollback?(args: TransactionEventArgs): Promise<void>;
}
