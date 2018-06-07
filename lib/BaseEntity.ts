import { getMetadataStorage, getEntityManager } from './MikroORM';
import { ObjectID } from 'bson';
import { Collection } from './Collection';

export abstract class BaseEntity {

  public _id: ObjectID;
  public createdAt = new Date();
  public updatedAt = new Date();
  [property: string]: any | BaseEntity | Collection<BaseEntity>;

  private _initialized = false;

  protected constructor() {
    const metadata = getMetadataStorage();
    const meta = metadata[this.constructor.name];
    const props = meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        this[prop] = new Collection(props[prop], this, []);
      }
    });
  }

  get id(): string {
    return this._id ? this._id.toHexString() : null;
  }

  set id(id: string) {
    this._id = id ? new ObjectID(id) : null;
  }

  isInitialized(): boolean {
    return this._initialized !== false;
  }

  async init(): Promise<BaseEntity> {
    const em = getEntityManager();
    await em.findOne(this.constructor.name, this._id);

    return this;
  }

  toObject(parent: BaseEntity = this): any {
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

export enum ReferenceType {
  SCALAR = 0,
  MANY_TO_ONE = 1,
  ONE_TO_MANY = 2,
  MANY_TO_MANY = 3,
}

export interface EntityProperty {
  name: string;
  fk: string;
  entity: () => string;
  type: string;
  reference: ReferenceType;
  attributes?: { [attribute: string]: any };
  owner?: boolean;
  inversedBy: string;
  mappedBy: string;
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
