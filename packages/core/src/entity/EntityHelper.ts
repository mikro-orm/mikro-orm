import { inspect } from 'util';

import { EntityManager } from '../EntityManager';
import { AnyEntity, Dictionary, EntityMetadata, EntityProperty } from '../typings';
import { EntityTransformer } from './EntityTransformer';
import { Reference } from './Reference';
import { Platform } from '../platforms';
import { Utils } from '../utils/Utils';
import { WrappedEntity } from './WrappedEntity';
import { ReferenceType } from '../enums';

export class EntityHelper {

  static decorate<T extends AnyEntity<T>>(meta: EntityMetadata<T>, em: EntityManager): void {
    if (meta.embeddable) {
      return;
    }

    const pk = meta.properties[meta.primaryKeys[0]];

    if (pk.name === '_id') {
      EntityHelper.defineIdProperty(meta, em.getDriver().getPlatform());
    }

    EntityHelper.defineBaseProperties(meta, meta.prototype, em.getDriver().getPlatform());
    const prototype = meta.prototype as Dictionary;

    if (em.config.get('propagateToOneOwner')) {
      EntityHelper.defineReferenceProperties(meta);
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

  private static defineBaseProperties<T extends AnyEntity<T>>(meta: EntityMetadata<T>, prototype: T, platform: Platform) {
    Object.defineProperties(prototype, {
      __entity: { value: true },
      __meta: { value: meta },
      __platform: { value: platform },
      __helper: {
        get(): WrappedEntity<T, keyof T> {
          const helper = new WrappedEntity(this);
          Object.defineProperty(this, '__helper', { value: helper, writable: true });

          return helper;
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
      let name = meta.name;

      // distinguish not initialized entities
      if (!this.__helper!.__initialized) {
        name = `Ref<${name}>`;
      }

      return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
    };
  }

  private static defineReferenceProperty<T extends AnyEntity<T>>(prop: EntityProperty<T>, ref: T, val: AnyEntity): void {
    Object.defineProperty(ref, prop.name, {
      get() {
        return this.__data[prop.name];
      },
      set(val: AnyEntity | Reference<AnyEntity>) {
        this.__data[prop.name] = Reference.wrapReference(val as T, prop);
        const entity = Reference.unwrapReference(val as T);
        EntityHelper.propagate(entity, this, prop);
      },
      enumerable: true,
      configurable: true,
    });
    ref[prop.name] = val as T[string & keyof T];
  }

  private static propagate<T extends AnyEntity<T>, O extends AnyEntity<O>>(entity: T, owner: O, prop: EntityProperty<O>): void {
    const inverse = entity && entity[prop.inversedBy || prop.mappedBy];

    if (prop.reference === ReferenceType.MANY_TO_ONE && Utils.isCollection<O, T>(inverse) && inverse.isInitialized()) {
      inverse.add(owner);
    }

    if (prop.reference === ReferenceType.ONE_TO_ONE && entity && entity.__helper!.__initialized && Reference.unwrapReference(inverse) !== owner) {
      EntityHelper.propagateOneToOne(entity, owner, prop);
    }
  }

  private static propagateOneToOne<T, O>(entity: T, owner: O, prop: EntityProperty<O>): void {
    const inverse = entity[prop.inversedBy || prop.mappedBy];

    if (Reference.isReference(inverse)) {
      inverse.set(owner);
    } else {
      entity[prop.inversedBy || prop.mappedBy] = Reference.wrapReference(owner, prop);
    }
  }

}
