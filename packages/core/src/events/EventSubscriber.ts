import { AnyEntity, EntityName } from '../typings';
import { EntityManager } from '../EntityManager';

export interface EventArgs<T> {
  entity: T;
  em: EntityManager;
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
}
