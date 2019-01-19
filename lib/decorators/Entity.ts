import { merge } from 'lodash';
import { getMetadataStorage } from '../MikroORM';
import { Utils } from '../Utils';
import { Collection } from '../Collection';
import { IPrimaryKey } from './PrimaryKey';
import { EntityManager } from '../EntityManager';
import { EntityHelper } from '../EntityHelper';

export function Entity(options: EntityOptions = {}): Function {
  return function <T extends { new(...args: any[]): IEntity }>(target: T) {
    const storage = getMetadataStorage(target.name);
    const meta = storage[target.name];

    if (options) {
      merge(meta, options);
    }

    meta.name = target.name;
    meta.constructorParams = Utils.getParamNames(target);

    Object.defineProperties(target.prototype, {
      __populated: { value: false, writable: true, enumerable: false, configurable: false },
      __entity: { value: true, writable: false, enumerable: false, configurable: false },
    });

    Object.defineProperties(target.prototype, {
      isInitialized: {
        value: function () {
          return this._initialized !== false;
        },
      },
      shouldPopulate: {
        value: function (collection: Collection<IEntity> = null) {
          return this.__populated && !collection;
        },
      },
      populated: {
        value: function (populated = true) {
          this.__populated = populated;
        },
      },
      init: {
        value: async function (populated = true, em: EntityManager = null): Promise<IEntity> {
          return new EntityHelper(this).init(populated, em);
        },
      },
      assign: {
        value: function (data: any, em: EntityManager = null) {
          new EntityHelper(this).assign(data, em);
        }
      },
      toObject: {
        value: function (parent?: IEntity, collection: Collection<IEntity> = null) {
          return new EntityHelper(this).toObject(parent, collection);
        }
      },
      toJSON: {
        value: function () {
          return new EntityHelper(this).toObject();
        }
      },
      setEntityManager: {
        value: function (em: EntityManager): void {
          new EntityHelper(this).setEntityManager(em);
        },
      },
      getEntityManager: {
        value: function (em: EntityManager = null): EntityManager {
          return new EntityHelper(this).getEntityManager(em);
        },
      },
    });

    return target;
  };
}

export type EntityOptions = {
  collection?: string;
  customRepository?: any;
}

export interface IEntity {
  id: IPrimaryKey;
  isInitialized(): boolean;
  shouldPopulate(collection?: Collection<IEntity>): boolean;
  populated(populated?: boolean): void;
  init(populated?, em?: EntityManager): Promise<IEntity>;
  setEntityManager(em: EntityManager): void;
  getEntityManager(em?: EntityManager): EntityManager;
  toJSON(): any;
  toObject(parent?: IEntity, collection?: Collection<IEntity>): any;
  assign(data: any, em?: EntityManager): void;
  [property: string]: any | IEntity | Collection<IEntity>;
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
