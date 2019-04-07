import { v4 as uuid } from 'uuid';
import { EntityManager } from '../EntityManager';
import { EntityClass, EntityData, EntityMetadata, IEntity, IEntityType, IPrimaryKey } from '../decorators';
import { EntityTransformer } from './EntityTransformer';
import { AssignOptions, EntityAssigner } from './EntityAssigner';

export class EntityHelper {

  static async init(entity: IEntity, populated = true): Promise<IEntity> {
    await entity.__em.findOne(entity.constructor.name, entity.__primaryKey);
    entity.populated(populated);

    return entity;
  }

  static decorate<T extends IEntityType<T>>(meta: EntityMetadata<T>, em: EntityManager): void {
    const pk = meta.properties[meta.primaryKey];

    if (pk.name === '_id' && !meta.properties['id']) {
      EntityHelper.defineIdProperty(meta, em);
    }

    EntityHelper.defineBaseProperties(meta, em);
    EntityHelper.definePrimaryKeyProperties(meta);

    if (!meta.prototype.assign) { // assign can be overridden
      meta.prototype.assign = function (data: EntityData<T>, options?: AssignOptions): void {
        EntityAssigner.assign(this, data, options);
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
  private static defineIdProperty<T extends IEntityType<T>>(meta: EntityMetadata<T>, em: EntityManager): void {
    Object.defineProperty(meta.prototype, 'id', {
      get(): string | null {
        return this._id ? em.getDriver().getPlatform().normalizePrimaryKey<string>(this._id) : null;
      },
      set(id: string): void {
        this._id = id ? em.getDriver().getPlatform().denormalizePrimaryKey(id) : null;
      },
    });
  }

  private static defineBaseProperties<T extends IEntityType<T>>(meta: EntityMetadata<T>, em: EntityManager) {
    Object.defineProperties(meta.prototype, {
      __populated: { value: false, writable: true },
      __entity: { value: true },
      __em: { value: em },
      __uuid: {
        get(): string {
          if (!this.___uuid) {
            Object.defineProperty(this, '___uuid', { value: uuid() });
          }

          return this.___uuid;
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

  private static definePrimaryKeyProperties<T extends IEntityType<T>>(meta: EntityMetadata<T>) {
    Object.defineProperties(meta.prototype, {
      __primaryKeyField: { value: meta.primaryKey },
      __primaryKey: {
        get(): IPrimaryKey {
          return this[meta.primaryKey];
        },
        set(id: IPrimaryKey): void {
          this[meta.primaryKey] = id;
        },
      },
      __serializedPrimaryKeyField: { value: meta.serializedPrimaryKey },
      __serializedPrimaryKey: {
        get(): IPrimaryKey {
          return this[meta.serializedPrimaryKey];
        },
      },
    });
  }

}
