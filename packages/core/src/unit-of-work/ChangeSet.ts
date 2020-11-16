import { EntityData, AnyEntity, EntityMetadata } from '../typings';

export class ChangeSet<T extends AnyEntity<T>> {

  constructor(public entity: T,
              public type: ChangeSetType,
              public payload: EntityData<T>,
              meta: EntityMetadata<T>) {
    this.name = meta.className;
    this.rootName = meta.root.className;
    this.collection = meta.root.collection;
  }

}

export interface ChangeSet<T extends AnyEntity<T>> {
  name: string;
  rootName: string;
  collection: string;
  type: ChangeSetType;
  entity: T;
  payload: EntityData<T>;
  persisted: boolean;
  originalEntity?: EntityData<T>;
}

export enum ChangeSetType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
