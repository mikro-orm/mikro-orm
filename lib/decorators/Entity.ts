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
      _populated: { value: false, writable: true, enumerable: false, configurable: false },
      __isEntity: { value: true, writable: false, enumerable: false, configurable: false },
    });

    Object.defineProperties(target.prototype, {
      isInitialized: {
        value: function () {
          return this._initialized !== false;
        },
      },
      shouldPopulate: {
        value: function (collection: Collection<IEntity> = null) {
          return this._populated && !collection;
        },
      },
      populated: {
        value: function (populated = true) {
          this._populated = populated;
        },
      },
      init: {
        value: async function (populated = true, em: EntityManager = null): Promise<IEntity> {
          await (em || this.getEntityManager(em)).findOne(this.constructor.name, this.id);
          this._populated = populated;

          return this;
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
          Object.defineProperty(this, '_em', {
            value: em,
            enumerable: false,
            writable: true,
          });
        },
      },
      getEntityManager: {
        value: function (em: EntityManager = null): EntityManager {
          if (em) {
            this._em = em;
          }

          if (!this._em) {
            throw new Error('This entity is not attached to EntityManager, please provide one!');
          }

          return this._em;
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

export interface Entity extends IEntity {

}
