import type { EntityData, AnyEntity, EntityMetadata, EntityDictionary, Primary } from '../typings';

export class ChangeSet<T extends AnyEntity<T>> {

  private primaryKey?: Primary<T> | null;
  private serializedPrimaryKey?: string;

  constructor(public entity: T,
              public type: ChangeSetType,
              public payload: EntityDictionary<T>,
              private meta: EntityMetadata<T>) {
    this.name = meta.className;
    this.rootName = meta.root.className;
    this.collection = meta.root.collection;
    this.schema = entity.__helper!.__schema ?? meta.root.schema;
  }

  getPrimaryKey(object = false): Primary<T> | null {
    if (!this.originalEntity) {
      this.primaryKey ??= this.entity.__helper!.getPrimaryKey(true);
    } else if (this.meta.compositePK || object) {
      this.primaryKey = this.meta.primaryKeys.reduce((o, pk) => {
        o[pk] = (this.originalEntity as T)[pk];
        return o;
      }, {} as T) as any;
    } else {
      this.primaryKey = (this.originalEntity as T)[this.meta.primaryKeys[0]] as Primary<T>;
    }

    return this.primaryKey ?? null;
  }

  getSerializedPrimaryKey(): string | null {
    this.serializedPrimaryKey ??= this.entity.__helper!.getSerializedPrimaryKey();
    return this.serializedPrimaryKey;
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
  DELETE_EARLY = 'delete_early',
}
