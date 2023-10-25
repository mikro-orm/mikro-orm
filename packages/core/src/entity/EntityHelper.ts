import { inspect } from 'util';

import type { EntityManager } from '../EntityManager';
import {
  EntityRepositoryType,
  OptionalProps,
  PrimaryKeyProp,
  EagerProps,
  HiddenProps,
  type AnyEntity,
  type Dictionary,
  type EntityMetadata,
  type EntityProperty,
  type IHydrator,
  type EntityValue,
  type EntityKey,
} from '../typings';
import { EntityTransformer } from '../serialization/EntityTransformer';
import { Reference } from './Reference';
import { Utils } from '../utils/Utils';
import { WrappedEntity } from './WrappedEntity';
import { ReferenceKind } from '../enums';
import { helper } from './wrap';

/**
 * @internal
 */
export class EntityHelper {

  static decorate<T extends object>(meta: EntityMetadata<T>, em: EntityManager): void {
    const fork = em.fork(); // use fork so we can access `EntityFactory`
    const serializedPrimaryKey = meta.props.find(p => p.serializedPrimaryKey);

    if (serializedPrimaryKey) {
      Object.defineProperty(meta.prototype, serializedPrimaryKey.name, {
        get(): string | null {
          return this._id ? em.getPlatform().normalizePrimaryKey<string>(this._id) : null;
        },
        set(id: string): void {
          this._id = id ? em.getPlatform().denormalizePrimaryKey(id) : null;
        },
        configurable: true,
      });
    }

    EntityHelper.defineBaseProperties(meta, meta.prototype, fork);
    EntityHelper.defineCustomInspect(meta);

    if (em.config.get('propagationOnPrototype') && !meta.embeddable && !meta.virtual) {
      EntityHelper.defineProperties(meta, fork);
    }

    const prototype = meta.prototype as Dictionary;

    if (!prototype.toJSON) { // toJSON can be overridden
      prototype.toJSON = function (this: T, ...args: any[]) {
        return EntityTransformer.toObject<T>(this, ...args.slice(meta.toJsonParams.length));
      };
    }
  }

  /**
   * As a performance optimization, we create entity state methods in a lazy manner. We first add
   * the `null` value to the prototype to reserve space in memory. Then we define a setter on the
   * prototype, that will be executed exactly once per entity instance. There we redefine given
   * property on the entity instance, so shadowing the prototype setter.
   */
  private static defineBaseProperties<T extends object>(meta: EntityMetadata<T>, prototype: T, em: EntityManager) {
    const helperParams = meta.embeddable || meta.virtual ? [] : [em.getComparator().getPkGetter(meta), em.getComparator().getPkSerializer(meta), em.getComparator().getPkGetterConverted(meta)];
    Object.defineProperties(prototype, {
      __entity: { value: !meta.embeddable, configurable: true },
      __meta: { value: meta, configurable: true },
      __config: { value: em.config, configurable: true },
      __platform: { value: em.getPlatform(), configurable: true },
      __factory: { value: em.getEntityFactory(), configurable: true },
      __helper: {
        get(): WrappedEntity<T> {
          Object.defineProperty(this, '__helper', {
            value: new WrappedEntity(this, em.getHydrator(), ...helperParams),
            enumerable: false,
            configurable: true,
          });

          return this.__helper;
        },
        configurable: true, // otherwise jest fails when trying to compare entities ¯\_(ツ)_/¯
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
  private static defineProperties<T extends object>(meta: EntityMetadata<T>, em: EntityManager): void {
    Object
      .values<EntityProperty<T>>(meta.properties)
      .forEach(prop => {
        const isCollection = [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind);
        const isReference = [ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(prop.kind) && (prop.inversedBy || prop.mappedBy) && !prop.mapToPk;

        if (isReference) {
          Object.defineProperty(meta.prototype, prop.name, {
            set(val: AnyEntity) {
              EntityHelper.defineReferenceProperty(meta, prop, this, em.getHydrator());
              this[prop.name] = val;
            },
            configurable: true,
          });
          return;
        }

        if (prop.inherited || prop.primary || prop.persist === false || prop.trackChanges === false || prop.embedded || isCollection) {
          return;
        }

        Object.defineProperty(meta.prototype, prop.name, {
          set(val) {
            Object.defineProperty(this, prop.name, {
              get() {
                return this.__helper?.__data[prop.name];
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
          configurable: true,
        });
      });
  }

  static defineCustomInspect<T extends object>(meta: EntityMetadata<T>): void {
    // @ts-ignore
    meta.prototype[inspect.custom] ??= function (this: T, depth: number) {
      const object = { ...this } as any;
      // ensure we dont have internal symbols in the POJO
      [OptionalProps, EntityRepositoryType, PrimaryKeyProp, EagerProps, HiddenProps].forEach(sym => delete object[sym]);
      meta.props
        .filter(prop => object[prop.name] === undefined)
        .forEach(prop => delete object[prop.name]);
      const ret = inspect(object, { depth });
      let name = (this).constructor.name;

      const showEM = ['true', 't', '1'].includes(process.env.MIKRO_ORM_LOG_EM_ID?.toString().toLowerCase() ?? '');

      if (showEM) {
        if (helper(this).__em) {
          name += ` [managed by ${helper(this).__em.id}]`;
        } else {
          name += ` [not managed]`;
        }
      }

      // distinguish not initialized entities
      if (!helper(this).__initialized) {
        name = `(${name})`;
      }

      return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
    };
  }

  static defineReferenceProperty<T extends object>(meta: EntityMetadata<T>, prop: EntityProperty<T>, ref: T, hydrator: IHydrator): void {
    const wrapped = helper(ref);
    Object.defineProperty(ref, prop.name, {
      get() {
        return helper(ref).__data[prop.name];
      },
      set(val: AnyEntity | Reference<AnyEntity>) {
        const entity = Reference.unwrapReference(val ?? wrapped.__data[prop.name]);
        const old = Reference.unwrapReference(wrapped.__data[prop.name]);
        wrapped.__data[prop.name] = Reference.wrapReference(val as T, prop);

        // when propagation from inside hydration, we set the FK to the entity data immediately
        if (val && hydrator.isRunning() && wrapped.__originalEntityData && prop.owner) {
          wrapped.__originalEntityData[prop.name] = helper(wrapped.__data[prop.name]).getPrimaryKey(true);
        } else {
          wrapped.__touched = true;
        }

        EntityHelper.propagate(meta, entity, this, prop, Reference.unwrapReference(val), old);
      },
      enumerable: true,
      configurable: true,
    });
  }

  static propagate<T extends object>(meta: EntityMetadata<T>, entity: T, owner: T, prop: EntityProperty<T>, value?: T[keyof T & string], old?: T): void {
    const inverseProps = prop.targetMeta!.bidirectionalRelations
      .filter(prop2 => (prop2.inversedBy || prop2.mappedBy) === prop.name)
      .filter(prop2 => {
        const meta2 = prop2.targetMeta!;
        return meta2.abstract ? meta2.root.className === meta.root.className : meta2.className === meta.className;
      }) as EntityProperty<T>[];

    for (const prop2 of inverseProps) {
      const inverse = value?.[prop2.name];

      if (prop.kind === ReferenceKind.MANY_TO_ONE && Utils.isCollection<T, T>(inverse) && inverse.isInitialized()) {
        inverse.add(owner);
      }

      if (prop.kind === ReferenceKind.ONE_TO_ONE && entity && (!prop.owner || helper(entity).__initialized)) {
        if (
          (value != null && Reference.unwrapReference(inverse!) !== owner) ||
          (value == null && entity[prop2.name] != null)
        ) {
          EntityHelper.propagateOneToOne(entity, owner, prop, prop2, value, old as T);
        }
      }
    }
  }

  private static propagateOneToOne<T extends object>(entity: T, owner: T, prop: EntityProperty<T>, prop2: EntityProperty<T>, value?: T[keyof T & string], old?: T): void {
    helper(entity).__pk = helper(entity).getPrimaryKey()!;

    // the inverse side will be changed on the `value` too, so we need to clean-up and schedule orphan removal there too
    if (!prop.primary && !prop2.mapToPk && value?.[prop2.name] != null && Reference.unwrapReference(value[prop2.name]!) !== entity) {
      const other = Reference.unwrapReference(value![prop2.name]!);
      delete helper(other).__data[prop.name];

      if (prop2.orphanRemoval) {
        helper(other).__em?.getUnitOfWork().scheduleOrphanRemoval(other);
      }
    }

    if (value == null) {
      entity[prop2.name] = value as EntityValue<T>;
    } else if (prop2.mapToPk) {
      entity[prop2.name] = helper(owner).getPrimaryKey() as EntityValue<T>;
    } else {
      entity[prop2.name] = Reference.wrapReference(owner, prop) as EntityValue<T>;
    }

    if (old && prop.orphanRemoval) {
      helper(old).__em?.getUnitOfWork().scheduleOrphanRemoval(old);
    }

    if (old?.[prop2.name] != null) {
      delete helper(old).__data[prop2.name];
    }
  }

  static ensurePropagation<T>(entity: T) {
    if ((entity as Dictionary).__gettersDefined) {
      return;
    }

    const wrapped = helper(entity);
    const meta = wrapped.__meta;
    const platform = wrapped.__platform;
    const serializedPrimaryKey = meta.props.find(p => p.serializedPrimaryKey);

    const values: [string, unknown][] = [];

    if (serializedPrimaryKey) {
      const pk = meta.getPrimaryProps()[0];
      const val = entity[serializedPrimaryKey.name];
      delete entity[serializedPrimaryKey.name];
      Object.defineProperty(entity, serializedPrimaryKey.name, {
        get(): string | null {
          return this[pk.name] ? platform.normalizePrimaryKey<string>(this[pk.name]) : null;
        },
        set(id: string): void {
          this[pk.name] = id ? platform.denormalizePrimaryKey(id) : null;
        },
        configurable: true,
      });

      if (entity[pk.name] == null && val != null) {
        values.push([serializedPrimaryKey.name, val]);
      }
    }

    meta.trackingProps.forEach(prop => {
      if (entity[prop.name] !== undefined) {
        values.push([prop.name, entity[prop.name]]);
      }
    });

    meta.trackingProps.forEach(prop => {
      delete entity[prop.name];
    });
    Object.defineProperties(entity, meta.definedProperties);
    values.forEach(val => entity[val[0] as EntityKey<T>] = val[1] as EntityValue<T>);
  }

}
