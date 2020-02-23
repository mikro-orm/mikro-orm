import { v4 as uuid } from 'uuid';
import { inspect } from 'util';

import { EntityManager } from '../EntityManager';
import { AnyEntity, EntityData, EntityMetadata, EntityProperty, IWrappedEntity, Primary, WrappedEntity } from '../typings';
import { EntityTransformer } from './EntityTransformer';
import { AssignOptions, EntityAssigner } from './EntityAssigner';
import { LockMode } from '../unit-of-work';
import { Reference } from './Reference';
import { Platform } from '../platforms';
import { Utils, ValidationError } from '../utils';
import { ReferenceType } from './enums';
import { Collection } from './Collection';

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

    if (em.config.get('propagateToOneOwner')) {
      EntityHelper.defineReferenceProperties(meta);
    }

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

  /**
   * Defines getter and setter for every owning side of m:1 and 1:1 relation. This is then used for propagation of
   * changes to the inverse side of bi-directional relations.
   * First defines a setter on the prototype, once called, actual get/set handlers are registered on the instance rather
   * than on its prototype. Thanks to this we still have those properties enumerable (e.g. part of `Object.keys(entity)`).
   */
  private static defineReferenceProperties<T extends AnyEntity<T>>(meta: EntityMetadata<T>): void {
    Object
      .values<EntityProperty>(meta.properties)
      .filter(prop => [ReferenceType.ONE_TO_ONE, ReferenceType.MANY_TO_ONE].includes(prop.reference) && (prop.inversedBy || prop.mappedBy))
      .forEach(prop => {
        Object.defineProperty(meta.prototype, prop.name, {
          set(val: AnyEntity) {
            if (!('__data' in this)) {
              Object.defineProperty(this, '__data', { value: {} });
            }

            EntityHelper.defineReferenceProperty(prop, this, val);
          },
        });
      });

    meta.prototype[inspect.custom] = function (depth: number) {
      const ret = inspect({ ...this }, { depth });
      return ret === '[Object]' ? `[${meta.name}]` : meta.name + ' ' + ret;
    };
  }

  private static defineReferenceProperty<T extends AnyEntity<T>>(prop: EntityProperty<T>, ref: T, val: AnyEntity): void {
    Object.defineProperty(ref, prop.name, {
      get() {
        return this.__data[prop.name];
      },
      set(val: AnyEntity | Reference<AnyEntity>) {
        this.__data[prop.name] = Utils.wrapReference(val as T, prop);
        const entity = Utils.unwrapReference(val as T);
        EntityHelper.propagate(entity, this, prop);
      },
      enumerable: true,
      configurable: true,
    });
    ref[prop.name] = val as T[string & keyof T];
  }

  private static propagate<T>(entity: T, owner: T, prop: EntityProperty<T>): void {
    const inverse = entity && entity[prop.inversedBy || prop.mappedBy];

    if (prop.reference === ReferenceType.MANY_TO_ONE && inverse && wrap(inverse).isInitialized()) {
      (inverse as Collection<T>).add(owner);
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE && entity && wrap(entity).isInitialized() && Utils.unwrapReference(inverse) !== owner) {
      EntityHelper.propagateOneToOne(entity, owner, prop);
    }
  }

  private static propagateOneToOne<T>(entity: T, owner: T, prop: EntityProperty<T>): void {
    const inverse = entity[prop.inversedBy || prop.mappedBy];

    if (Utils.isReference(inverse)) {
      inverse.set(owner);
    } else {
      entity[prop.inversedBy || prop.mappedBy] = Utils.wrapReference(owner, prop);
    }
  }

}

/**
 * wraps entity type with AnyEntity internal properties and helpers like init/isInitialized/populated/toJSON
 */
export function wrap<T>(entity: T): T & WrappedEntity<T, keyof T> {
  return entity as T & WrappedEntity<T, keyof T>;
}
