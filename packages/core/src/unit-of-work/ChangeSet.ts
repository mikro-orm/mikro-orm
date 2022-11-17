import { inspect } from 'util';
import type { EntityData, EntityMetadata, EntityDictionary, Primary } from '../typings';
import { helper } from '../entity/wrap';
import { Utils } from '../utils/Utils';

export class ChangeSet<T> {
  private primaryKey?: Primary<T> | null;
  private serializedPrimaryKey?: string;

  constructor(public entity: T, public type: ChangeSetType, public payload: EntityDictionary<T>, public meta: EntityMetadata<T>) {
    this.name = meta.className;
    this.rootName = meta.root.className;
    this.collection = meta.root.collection;
    this.schema = helper(entity).__schema ?? meta.root.schema;
  }

  getPrimaryKey(object = false): Primary<T> | null {
    if (!this.originalEntity) {
      this.primaryKey ??= helper(this.entity).getPrimaryKey(true);
    } else if (this.meta.compositePK) {
      this.primaryKey = this.meta.primaryKeys.map((pk) => (this.originalEntity as T)[pk]) as Primary<T>;
    } else {
      this.primaryKey = (this.originalEntity as T)[this.meta.primaryKeys[0]] as Primary<T>;
    }

    if (object && this.primaryKey != null) {
      const pks = this.meta.compositePK && Utils.isPlainObject(this.primaryKey) ? Object.values(this.primaryKey) : Utils.asArray(this.primaryKey);
      const ret = this.meta.primaryKeys.reduce((o, pk, idx) => {
        o[pk] = pks[idx] as any;
        return o;
      }, {} as T);
      return ret as any;
    }

    return this.primaryKey ?? null;
  }

  getSerializedPrimaryKey(): string | null {
    this.serializedPrimaryKey ??= helper(this.entity).getSerializedPrimaryKey();
    return this.serializedPrimaryKey;
  }

  [inspect.custom](depth: number) {
    const object = { ...this };
    const hidden = ['meta', 'serializedPrimaryKey'];
    hidden.forEach((k) => delete object[k]);
    const ret = inspect(object, { depth });
    const name = `${this.constructor.name}<${this.meta.className}>`;

    /* istanbul ignore next */
    return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
  }
}

export interface ChangeSet<T> {
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
  UPDATE_EARLY = 'update_early',
  DELETE_EARLY = 'delete_early',
}
