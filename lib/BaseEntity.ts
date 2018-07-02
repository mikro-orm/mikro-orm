import { getMetadataStorage, getEntityManager } from './MikroORM';
import { ObjectID } from 'bson';
import { Collection } from './Collection';
import { Utils } from './Utils';
import { SCALAR_TYPES } from './EntityFactory';

export class BaseEntity {

  public _id: ObjectID;
  public createdAt = new Date();
  public updatedAt = new Date();
  [property: string]: any | BaseEntity | Collection<BaseEntity>;

  private _initialized = false;
  private _populated = false;

  constructor() {
    const metadata = getMetadataStorage();
    const meta = metadata[this.constructor.name];
    const props = meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        this[prop] = new Collection(this, props[prop], []);
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

  shouldPopulate(): boolean {
    return this._populated;
  }

  populated(populated = true): void {
    this._populated = populated;
  }

  async init(): Promise<BaseEntity> {
    const em = getEntityManager();
    await em.findOne(this.constructor.name, this._id);
    this._populated = true;

    return this;
  }

  assign(data: any) {
    const em = getEntityManager();
    const metadata = getMetadataStorage();
    const meta = metadata[this.constructor.name];
    const props = meta.properties;

    Object.keys(data).forEach(prop => {
      if (props[prop] && props[prop].reference === ReferenceType.MANY_TO_ONE && data[prop]) {
        if (data[prop] instanceof BaseEntity) {
          return this[prop] = data[prop];
        }

        if (data[prop] instanceof ObjectID) {
          return this[prop] = em.getReference(props[prop].type, data[prop].toHexString());
        }

        const id = typeof data[prop] === 'object' ? data[prop].id : data[prop];

        if (id) {
          return this[prop] = em.getReference(props[prop].type, id);
        }
      }

      const isCollection = props[prop] && [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference);

      if (isCollection && Utils.isArray(data[prop])) {
        const items = data[prop].map((item: any) => {
          if (item instanceof ObjectID) {
            return em.getReference(props[prop].type, item.toHexString());
          }

          if (item instanceof BaseEntity) {
            return item;
          }

          return em.getReference(props[prop].type, item);
        });

        return (this[prop] as Collection<BaseEntity>).set(items);
      }

      if (props[prop] && props[prop].reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(props[prop].type)) {
        this[prop] = em.validator.validateProperty(props[prop], data[prop], this)
      }

      this[prop] = data[prop];
    });
  }

  toObject(parent: BaseEntity = this): any {
    const ret = { id: this.id, createdAt: this.createdAt, updatedAt: this.updatedAt } as any;

    if (!this.isInitialized()) {
      return { id: this.id } as any;
    }

    Object.keys(this).forEach(prop => {
      if (['id', '_id', 'createdAt', 'updatedAt', '_populated'].includes(prop)) {
        return;
      }

      if (this[prop] instanceof Collection) {
        if (this[prop].isInitialized()) {
          const collection = (this[prop] as Collection<BaseEntity>).getItems();
          ret[prop] = collection.map(item => {
            return item.isInitialized() && this[prop].shouldPopulate() ? item.toObject(this) : item.id;
          });
        }

        return;
      }

      if (this[prop] instanceof BaseEntity) {
        if (this[prop].isInitialized() && this[prop].shouldPopulate() && this[prop] !== parent) {
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
  collection: string;
  path: string;
  properties: { [property: string]: EntityProperty };
  customRepository: any;
  hooks: { [type: string]: string[] };
}
