import { inspect } from 'util';

import type { EntityManager } from '../EntityManager';
import type { AnyEntity, Dictionary, EntityMetadata, EntityProperty } from '../typings';
import { EntityTransformer } from './EntityTransformer';
import { Reference } from './Reference';
import type { Platform } from '../platforms';
import { Utils } from '../utils/Utils';
import { WrappedEntity } from './WrappedEntity';
import { ReferenceType } from '../enums';
import { helper } from './wrap';

const entityHelperSymbol = Symbol('helper');

export class EntityHelper {

  static decorate<T extends object>(meta: EntityMetadata<T>, em: EntityManager): void {
    const fork = em.fork(); // use fork so we can access `EntityFactory`

    if (meta.embeddable) {
      EntityHelper.defineBaseProperties(meta, meta.prototype, fork);
      return;
    }

    const pk = meta.properties[meta.primaryKeys[0]];

    if (pk.name === '_id' && meta.serializedPrimaryKey === 'id') {
      EntityHelper.defineIdProperty(meta, em.getPlatform());
    }

    EntityHelper.defineBaseProperties(meta, meta.prototype, fork);
    EntityHelper.defineProperties(meta);
    const prototype = meta.prototype as Dictionary;

    if (!prototype.toJSON) { // toJSON can be overridden
      prototype.toJSON = function (this: T, ...args: any[]) {
        return EntityTransformer.toObject<T>(this, ...args.slice(meta.toJsonParams.length));
      };
    }
  }

  /**
   * defines magic id property getter/setter if PK property is `_id` and there is no `id` property defined
   */
  private static defineIdProperty<T>(meta: EntityMetadata<T>, platform: Platform): void {
    Object.defineProperty(meta.prototype, 'id', {
      get(): string | null {
        return this._id ? platform.normalizePrimaryKey<string>(this._id) : null;
      },
      set(id: string): void {
        this._id = id ? platform.denormalizePrimaryKey(id) : null;
      },
    });
  }

  /**
   * As a performance optimization, we create entity state methods in a lazy manner. We first add
   * the `null` value to the prototype to reserve space in memory. Then we define a setter on the
   * prototype, that will be executed exactly once per entity instance. There we redefine given
   * property on the entity instance, so shadowing the prototype setter.
   */
  private static defineBaseProperties<T extends object>(meta: EntityMetadata<T>, prototype: T, em: EntityManager) {
    const helperParams = meta.embeddable ? [] : [em.getComparator().getPkGetter(meta), em.getComparator().getPkSerializer(meta), em.getComparator().getPkGetterConverted(meta)];
    Object.defineProperties(prototype, {
      __entity: { value: !meta.embeddable },
      __meta: { value: meta },
      __platform: { value: em.getPlatform() },
      __factory: { value: em.getEntityFactory() },
      [entityHelperSymbol]: { value: null, writable: true, enumerable: false },
      __helper: {
        get(): WrappedEntity<T, keyof T> {
          if (!this[entityHelperSymbol]) {
            Object.defineProperty(this, entityHelperSymbol, {
              value: new WrappedEntity(this, ...helperParams),
              enumerable: false,
            });
          }

          return this[entityHelperSymbol];
        },
      },
    });
  }

  /**
   * Defines getter and setter for every owning side of m:1 and 1:1 relation. This is then used for propagation of
   * changes to the inverse side of bi-directional relations. Rest of the properties are also defined this way to
   * achieve dirtiness, which is then used for fast checks whether we need to auto-flush because of managed entities.
   *
   * First defines a setter on the prototype, once called, actual get/set handlers are registered on the instance rather
   * than on its prototype. Thanks to this we still have those properties enumerable (e.g. part of `Object.keys(entity)`).
   */
  private static defineProperties<T>(meta: EntityMetadata<T>): void {
    Object
      .values<EntityProperty<T>>(meta.properties)
      .forEach(prop => {
        const isCollection = [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(prop.reference);
        const isReference = [ReferenceType.ONE_TO_ONE, ReferenceType.MANY_TO_ONE].includes(prop.reference) && (prop.inversedBy || prop.mappedBy) && !prop.mapToPk;

        if (isReference) {
          return Object.defineProperty(meta.prototype, prop.name, {
            set(val: AnyEntity) {
              EntityHelper.defineReferenceProperty(meta, prop, this);
              this[prop.name] = val;
            },
          });
        }

        if (prop.inherited || prop.primary || prop.persist === false || prop.trackChanges === false || prop.embedded || isCollection) {
          return;
        }

        Object.defineProperty(meta.prototype, prop.name, {
          set(val) {
            Object.defineProperty(this, prop.name, {
              get() {
                return this.__helper.__data[prop.name];
              },
              set(val) {
                this.__helper.__data[prop.name] = val;
                this.__helper.__touched = true;
              },
              enumerable: true,
              configurable: true,
            });
            this.__helper.__data[prop.name] = val;
            this.__helper.__touched = true;
          },
        });
      });

    meta.prototype[inspect.custom] ??= function (this: T, depth: number) {
      const object = { ...this };
      const ret = inspect(object, { depth });
      let name = (this as object).constructor.name;

      // distinguish not initialized entities
      if (!helper(this).__initialized) {
        name = `Ref<${name}>`;
      }

      return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
    };
  }

  static defineReferenceProperty<T extends object>(meta: EntityMetadata<T>, prop: EntityProperty<T>, ref: T): void {
    Object.defineProperty(ref, prop.name, {
      get() {
        return this.__helper.__data[prop.name];
      },
      set(val: AnyEntity | Reference<AnyEntity>) {
        const entity = Reference.unwrapReference(val ?? this.__helper.__data[prop.name]);
        this.__helper.__data[prop.name] = Reference.wrapReference(val as T, prop);
        this.__helper.__touched = true;
        EntityHelper.propagate(meta, entity, this, prop, Reference.unwrapReference(val));
      },
      enumerable: true,
      configurable: true,
    });
  }

  private static propagate<T extends object, O extends object>(meta: EntityMetadata<O>, entity: T, owner: O, prop: EntityProperty<O>, value?: O[keyof O]): void {
    const inverseProps = prop.targetMeta!.relations.filter(prop2 => (prop2.inversedBy || prop2.mappedBy) === prop.name && prop2.targetMeta!.root.className === meta.root.className);

    for (const prop2 of inverseProps) {
      const inverse = value?.[prop2.name as string];

      if (prop.reference === ReferenceType.MANY_TO_ONE && Utils.isCollection<O, T>(inverse) && inverse.isInitialized()) {
        inverse.add(owner);
      }

      if (prop.reference === ReferenceType.ONE_TO_ONE && entity && helper(entity).__initialized && Reference.unwrapReference(inverse) !== owner && value != null) {
        EntityHelper.propagateOneToOne(entity, owner, prop, prop2);
      }

      if (prop.reference === ReferenceType.ONE_TO_ONE && entity && helper(entity).__initialized && entity[prop2.name] != null && value == null) {
        entity[prop2.name] = value;
        if (prop.orphanRemoval) {
          helper(entity).__em?.getUnitOfWork().scheduleOrphanRemoval(entity);
        }
      }
    }
  }

  private static propagateOneToOne<T extends object, O extends object>(entity: T, owner: O, prop: EntityProperty<O>, prop2: EntityProperty<T>): void {
    const inverse = entity[prop2.name];

    if (Reference.isReference(inverse)) {
      inverse.set(owner);
    } else {
      entity[prop2.name] = Reference.wrapReference(owner, prop) as unknown as T[keyof T & string];
    }
  }

}
