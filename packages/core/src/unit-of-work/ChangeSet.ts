import { EntityData, AnyEntity } from '../typings';

export interface ChangeSet<T extends AnyEntity<T>> {
  name: string;
  collection: string;
  type: ChangeSetType;
  entity: T;
  payload: EntityData<T>;
  persisted: boolean;
}

export enum ChangeSetType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
