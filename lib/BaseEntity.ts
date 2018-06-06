import { ObjectID } from 'bson';

import { getMetadataStorage } from './MikroORM';
import { EntityManager } from './EntityManager';
import { Collection } from './Collection';

export abstract class BaseEntity {

  public _id: ObjectID;
  public createdAt = new Date();
  public updatedAt = new Date();
  [property: string]: any | BaseEntity | Collection<BaseEntity>;

  private _initialized = false;

  get id(): string {
    return this._id ? this._id.toHexString() : null;
  }

  set id(id: string) {
    this._id = id ? new ObjectID(id) : null;
  }

  isInitialized(): boolean {
    return this._initialized !== false;
  }

  async init(em: EntityManager): Promise<BaseEntity> {
    await em.findOne(this.constructor.name, this._id);

    return this;
  }

  toObject(parent: BaseEntity = null): any {
    const metadata = getMetadataStorage();
    const meta = metadata[this.constructor.name];
    const props = meta.properties;
    const ret = { id: this.id, createdAt: this.createdAt, updatedAt: this.updatedAt } as any;

    if (!this.isInitialized()) {
      return { id: this.id } as any;
    }

    Object.keys(props).forEach(prop => {
      if (this[prop] instanceof Collection) {
        if (this[prop].isInitialized()) {
          const collection = (this[prop] as Collection<BaseEntity>).getItems();
          ret[prop] = collection.map(item => {
            return item.isInitialized() ? item.toObject(this) : item.id;
          });
        }

        return;
      }

      if (this[prop] instanceof BaseEntity) {
        if (this[prop].isInitialized() && this[prop] !== parent) {
          return ret[prop] = (this[prop] as BaseEntity).toObject(this);
        }

        return ret[prop] = this[prop].id;
      }

      ret[prop] = this[prop];
    });

    return ret;
  }

  toJSON(): any {
    return this.toObject();
  }

}

export interface EntityProperty {
  name: string;
  fk: string;
  entity: () => string;
  type: string;
  reference: boolean;
  collection: boolean;
  attributes?: { [attribute: string]: any };
}

export interface EntityMetadata {
  name: string;
  entity: string;
  collection: string;
  path: string;
  constructorParams: string[];
  properties: { [property: string]: EntityProperty };
  customRepository: any;
  hooks: { [type: string]: string[] };
}
