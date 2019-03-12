import { v4 as uuid } from 'uuid';
import { EntityManager } from '../EntityManager';
import { EntityClass, EntityData, EntityMetadata, IEntity, IEntityType } from '../decorators';
import { EntityTransformer } from './EntityTransformer';
import { EntityAssigner } from './EntityAssigner';

export class EntityHelper {

  static async init(entity: IEntity, populated = true): Promise<IEntity> {
    await entity.__em.findOne(entity.constructor.name, entity.id);
    entity.populated(populated);

    return entity;
  }

  static decorate<T extends IEntityType<T>>(meta: EntityMetadata<T>, em: EntityManager): void {
    const pk = meta.properties[meta.primaryKey];

    if (pk.name === '_id' && !meta.properties['id']) {
      EntityHelper.defineIdProperty<T>(meta, em);
    }

    EntityHelper.defineBaseProperties<T>(meta, em);

    if (!meta.prototype.assign) { // assign can be overridden
      meta.prototype.assign = function (data: EntityData<T>): void {
        EntityAssigner.assign(this, data);
      };
    }

    if (!meta.prototype.toJSON) { // toJSON can be overridden
      meta.prototype.toJSON = function (...args: any[]) {
        return EntityTransformer.toObject(this, ...args.slice(meta.toJsonParams.length));
      };
    }
  }

  /**
   * defines magic id property getter/setter if PK property is `_id` and there is no `id` property defined
   */
  private static defineIdProperty<T extends IEntityType<T>>(meta: EntityMetadata, em: EntityManager): void {
    Object.defineProperty(meta.prototype, 'id', {
      get(): string | null {
        return this._id ? em.getDriver().normalizePrimaryKey<string>(this._id) : null;
      },
      set(id: string): void {
        this._id = id ? em.getDriver().denormalizePrimaryKey(id) : null;
      },
    });
  }

  private static defineBaseProperties<T extends IEntityType<T>>(meta: EntityMetadata<T>, em: EntityManager) {
    Object.defineProperties(meta.prototype, {
      __populated: { value: false, writable: true },
      __entity: { value: true },
      __em: { value: em },
      uuid: {
        get(): string {
          if (!this.__uuid) {
            Object.defineProperty(this, '__uuid', { value: uuid() });
          }

          return this.__uuid;
        },
      },
    });

    meta.prototype.isInitialized = function () {
      return this.__initialized !== false;
    };

    meta.prototype.populated = function (populated = true) {
      this.__populated = populated;
    };

    meta.prototype.toObject = function (parent?: IEntity, isCollection?: boolean) {
      return EntityTransformer.toObject(this, parent, isCollection);
    };

    meta.prototype.init = async function (populated = true) {
      return EntityHelper.init(this, populated) as Promise<EntityClass<T> & T>;
    };
  }

}
