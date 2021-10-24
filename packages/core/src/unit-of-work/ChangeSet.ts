import type { EntityData, AnyEntity, EntityMetadata, EntityDictionary, Primary } from '../typings';

export class ChangeSet<T extends AnyEntity<T>> {

  private primaryKey?: Primary<T> | Primary<T>[] | null;

  constructor(public entity: T,
              public type: ChangeSetType,
              public payload: EntityDictionary<T>,
              meta: EntityMetadata<T>) {
    this.name = meta.className;
    this.rootName = meta.root.className;
    this.collection = meta.root.collection;
    this.schema = entity.__helper!.__schema ?? meta.root.schema;
  }

  getPrimaryKey(): Primary<T> | Primary<T>[] | null {
    this.primaryKey = this.primaryKey ?? this.entity.__helper!.getPrimaryKey(true);
    return this.primaryKey;
  }

}

export interface ChangeSet<T extends AnyEntity<T>> {
  name: string;
  rootName: string;
  collection: string;
  schema?: string;
  type: ChangeSetType;
  entity: T;
  payload: EntityDictionary<T>;
  persisted: boolean;
  originalEntity?: EntityData<T>;
}

export enum ChangeSetType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}
