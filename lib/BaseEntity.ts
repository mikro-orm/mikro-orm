import { getMetadataStorage } from './MikroORM';
import { ObjectID } from 'bson';
import { Collection } from './Collection';
import { SCALAR_TYPES } from './EntityFactory';
import { EntityManager } from './EntityManager';
import { IEntity } from './decorators/Entity';

export abstract class BaseEntity {

  constructor() {
    const metadata = getMetadataStorage();
    const meta = metadata[this.constructor.name];
    const props = meta.properties;

    Object.keys(props).forEach(prop => {
      if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
        this[prop] = new Collection(this as unknown as IEntity, props[prop], []);
      }
    });
  }

  assign(data: any, em: EntityManager = null) {
    const metadata = getMetadataStorage();
    const meta = metadata[this.constructor.name];
    const props = meta.properties;

    Object.keys(data).forEach(prop => {
      if (props[prop] && props[prop].reference === ReferenceType.MANY_TO_ONE && data[prop]) {
        if (data[prop] instanceof BaseEntity) {
          return this[prop] = data[prop];
        }

        if (data[prop] instanceof ObjectID) {
          return this[prop] = this.getEntityManager(em).getReference(props[prop].type, data[prop].toHexString());
        }

        const id = typeof data[prop] === 'object' ? data[prop].id : data[prop];

        if (id) {
          return this[prop] = this.getEntityManager(em).getReference(props[prop].type, id);
        }
      }

      const isCollection = props[prop] && [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference);

      if (isCollection && Array.isArray(data[prop])) {
        const items = data[prop].map((item: any) => {
          if (item instanceof ObjectID) {
            return this.getEntityManager(em).getReference(props[prop].type, item.toHexString());
          }

          if (item instanceof BaseEntity) {
            return item;
          }

          return this.getEntityManager(em).getReference(props[prop].type, item);
        });

        return (this[prop] as Collection<IEntity>).set(items);
      }

      if (props[prop] && props[prop].reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(props[prop].type)) {
        this[prop] = this.getEntityManager(em).validator.validateProperty(props[prop], data[prop], this)
      }

      this[prop] = data[prop];
    });
  }

  toObject(parent: IEntity = this as unknown as IEntity, collection: Collection<IEntity> = null): any {
    const ret = { id: this.id } as any;

    if (!this.isInitialized()) {
      return ret;
    }

    Object.keys(this).forEach(prop => {
      if (prop === 'id' || prop.startsWith('_')) {
        return;
      }

      if (this[prop] instanceof Collection) {
        const col = this[prop] as Collection<IEntity>;

        if (col.isInitialized(true) && col.shouldPopulate()) {
          ret[prop] = col.toArray(this as unknown as IEntity);
        } else if (col.isInitialized() && !col.shouldPopulate()) {
          ret[prop] = col.getIdentifiers();
        }

        return;
      }

      if (this[prop] instanceof BaseEntity) {
        if (this[prop].isInitialized() && this[prop].shouldPopulate(collection) && this[prop] !== parent) {
          return ret[prop] = (this[prop] as BaseEntity).toObject(this as unknown as IEntity);
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
  entity: () => string | Function;
  type: string;
  reference: ReferenceType;
  fieldName?: string;
  attributes?: { [attribute: string]: any };
  onUpdate?: () => any;
  owner?: boolean;
  inversedBy?: string;
  mappedBy?: string;
  pivotTable?: string;
  joinColumn?: string;
  inverseJoinColumn?: string;
  referenceColumnName?: string;
}

export interface EntityMetadata {
  name: string;
  constructorParams: string[];
  collection: string;
  path: string;
  properties: { [property: string]: EntityProperty };
  customRepository: any;
  hooks: { [type: string]: string[] };
}

export interface BaseEntity extends IEntity { }
