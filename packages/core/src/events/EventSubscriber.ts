import { AnyEntity, EntityName } from '../typings';
import { EntityManager } from '../EntityManager';
import { ChangeSet, UnitOfWork } from '../unit-of-work';

export interface EventArgs<T> {
  entity: T;
  em: EntityManager;
  changeSet?: ChangeSet<T>;
}

export interface FlushEventArgs extends Omit<EventArgs<unknown>, 'entity'> {
  uow: UnitOfWork;
}

export interface EventSubscriber<T = AnyEntity> {
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
}
