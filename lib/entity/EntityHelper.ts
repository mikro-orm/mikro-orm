import { v4 as uuid } from 'uuid';
import { EntityManager } from '../EntityManager';
import { EntityData, EntityMetadata, AnyEntity, IWrappedEntity, Primary, WrappedEntity } from '../typings';
import { EntityTransformer } from './EntityTransformer';
import { AssignOptions, EntityAssigner } from './EntityAssigner';
import { LockMode } from '../unit-of-work';
import { Reference } from './Reference';
import { Platform } from '../platforms';
import { ValidationError } from '../utils';

export class EntityHelper {

  static async init<T extends AnyEntity<T>>(entity: T, populated = true, lockMode?: LockMode): Promise<T> {
    const em = wrap(entity).__em;

    if (!em) {
      throw ValidationError.entityNotManaged(entity);
    }

    await em.findOne(entity.constructor.name, entity, { refresh: true, lockMode });
    wrap(entity).populated(populated);
    Object.defineProperty(entity, '__lazyInitialized', { value: true, writable: true });

    return entity;
  }

  static decorate<T extends AnyEntity<T>>(meta: EntityMetadata<T>, em: EntityManager): void {
    const pk = meta.properties[meta.primaryKey];

    if (pk.name === '_id') {
      EntityHelper.defineIdProperty(meta, em.getDriver().getPlatform());
    }

    EntityHelper.defineBaseProperties(meta, em);
    EntityHelper.defineBaseHelperMethods(meta);
    EntityHelper.definePrimaryKeyProperties(meta);
    const prototype = meta.prototype as IWrappedEntity<T, keyof T> & T;

    if (!prototype.assign) { // assign can be overridden
      prototype.assign = function (this: T, data: EntityData<T>, options?: AssignOptions): IWrappedEntity<T, keyof T> & T {
        return EntityAssigner.assign<T>(this, data, options) as IWrappedEntity<T, keyof T> & T;
      };
    }

    if (!prototype.toJSON) { // toJSON can be overridden
      prototype.toJSON = function (this: T, ...args: any[]) {
        return EntityTransformer.toObject<T>(this, ...args.slice(meta.toJsonParams.length));
      };
    }
  }

  /**
   * defines magic id property getter/setter if PK property is `_id` and there is no `id` property defined
   */
  private static defineIdProperty<T extends AnyEntity<T>>(meta: EntityMetadata<T>, platform: Platform): void {
    Object.defineProperty(meta.prototype, 'id', {
      get(): string | null {
        return this._id ? platform.normalizePrimaryKey<string>(this._id) : null;
      },
      set(id: string): void {
        this._id = id ? platform.denormalizePrimaryKey(id) : null;
      },
    });
  }

  private static defineBaseProperties<T extends AnyEntity<T>>(meta: EntityMetadata<T>, em: EntityManager) {
    const internal = {
      platform: em.getDriver().getPlatform(),
      metadata: em.getMetadata(),
      validator: em.getValidator(),
    };

    Object.defineProperties(meta.prototype, {
      __populated: { value: false, writable: true },
      __lazyInitialized: { value: false, writable: true },
      __entity: { value: true },
      __em: { value: undefined, writable: true },
      __meta: { value: meta },
      __internal: { value: internal },
      __uuid: {
        get(): string {
          if (!this.___uuid) {
            Object.defineProperty(this, '___uuid', { value: uuid() });
          }

          return this.___uuid;
        },
      },
    });
  }

  private static defineBaseHelperMethods<T extends AnyEntity<T>>(meta: EntityMetadata<T>) {
    const prototype = meta.prototype as IWrappedEntity<T, keyof T> & T;

    prototype.isInitialized = function (this: IWrappedEntity<T, keyof T>) {
      return this.__initialized !== false;
    };

    prototype.populated = function (this: T, populated: boolean = true) {
      Object.defineProperty(this, '__populated', { value: populated, writable: true });
    };

    prototype.toReference = function (this: T) {
      return Reference.create(this);
    };

    prototype.toObject = function (this: T, ignoreFields: string[] = []) {
      return EntityTransformer.toObject(this, ignoreFields);
    };

    prototype.init = function (this: T, populated: boolean = true): Promise<IWrappedEntity<T, keyof T> & T> {
      return EntityHelper.init<T>(this as T, populated) as Promise<IWrappedEntity<T, keyof T> & T>;
    };
  }

  private static definePrimaryKeyProperties<T extends AnyEntity<T>>(meta: EntityMetadata<T>) {
    Object.defineProperties(meta.prototype, {
      __primaryKeyField: { value: meta.primaryKey },
      __primaryKey: {
        get(): Primary<T> {
          return this[meta.primaryKey];
        },
        set(id: Primary<T>): void {
          this[meta.primaryKey] = id;
        },
      },
      __serializedPrimaryKeyField: { value: meta.serializedPrimaryKey },
      __serializedPrimaryKey: {
        get(): Primary<T> {
          return this[meta.serializedPrimaryKey];
        },
      },
    });
  }

}

/**
 * wraps entity type with AnyEntity internal properties and helpers like init/isInitialized/populated/toJSON
 */
export function wrap<T>(entity: T): T & WrappedEntity<T, keyof T> {
  return entity as T & WrappedEntity<T, keyof T>;
}
