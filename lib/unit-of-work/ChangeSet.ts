import { EntityData, IEntityType } from '../decorators';

export interface ChangeSet<T extends IEntityType<T>> {
  name: string;
  collection: string;
  type: ChangeSetType;
  entity: T;
  payload: EntityData<T>;
}

export enum ChangeSetType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
