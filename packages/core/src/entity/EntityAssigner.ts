import { inspect } from 'util';
import { Collection } from './Collection';
import { EntityManager } from '../EntityManager';
import { AnyEntity, EntityData, EntityDTO, EntityMetadata, EntityProperty, Primary } from '../typings';
import { Utils } from '../utils/Utils';
import { Reference } from './Reference';
import { ReferenceType, SCALAR_TYPES } from '../enums';
import { EntityValidator } from './EntityValidator';
import { wrap } from './wrap';

const validator = new EntityValidator(false);

export class EntityAssigner {

  static assign<T extends AnyEntity<T>>(entity: T, data: EntityData<T> | Partial<EntityDTO<T>>, options: AssignOptions = {}): T {
    options = {
      updateNestedEntities: true,
      updateByPrimaryKey: true,
      ...options,
    };
    const wrapped = entity.__helper!;
    const meta = entity.__meta!;
    const em = options.em || wrapped.__em;
    const props = meta.properties;

    Object.keys(data).forEach(prop => {
      if (options.onlyProperties && !(prop in props)) {
        return;
      }

      let value = data[prop as keyof typeof data];

      if (props[prop] && !props[prop].nullable && (value === undefined || value === null)) {
        throw new Error(`You must pass a non-${value} value to the property ${prop} of entity ${entity.constructor.name}.`);
      }

      if (props[prop] && Utils.isCollection(entity[prop as keyof T], props[prop]) && Array.isArray(value) && EntityAssigner.validateEM(em)) {
        return EntityAssigner.assignCollection<T>(entity, entity[prop as keyof T] as unknown as Collection<AnyEntity>, value, props[prop], em!, options);
      }

      /* istanbul ignore next */
      const customType = props[prop]?.customType;

      if (options.convertCustomTypes && customType && props[prop].reference === ReferenceType.SCALAR && !Utils.isEntity(data)) {
        value = props[prop].customType.convertToJSValue(value, entity.__platform);
      }

      if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(props[prop]?.reference) && Utils.isDefined(value, true) && EntityAssigner.validateEM(em)) {
        // eslint-disable-next-line no-prototype-builtins
        if (options.updateNestedEntities && entity.hasOwnProperty(prop) && Utils.isEntity(entity[prop], true) && Utils.isPlainObject(value)) {
          const unwrappedEntity = Reference.unwrapReference(entity[prop]);

          if (options.updateByPrimaryKey) {
            const pk = Utils.extractPK(value, props[prop].targetMeta);

            if (pk) {
              const ref = em.getReference(props[prop].type, pk as Primary<T>);
              if (ref.__helper!.isInitialized()) {
                return EntityAssigner.assign(ref, value, options);
              }
            }

            return EntityAssigner.assignReference<T>(entity, value, props[prop], em!, options);
          }

          if (wrap(unwrappedEntity).isInitialized()) {
            return EntityAssigner.assign(unwrappedEntity, value, options);
          }
        }

        return EntityAssigner.assignReference<T>(entity, value, props[prop], em!, options);
      }

      if (props[prop]?.reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(props[prop].type) && (props[prop].setter || !props[prop].getter)) {
        return entity[prop as keyof T] = validator.validateProperty(props[prop], value, entity);
      }

      if (props[prop]?.reference === ReferenceType.EMBEDDED) {
        return EntityAssigner.assignEmbeddable(entity, value, props[prop], em, options);
      }

      if (options.mergeObjects && Utils.isPlainObject(value)) {
        Utils.merge(entity[prop as keyof T], value);
      } else if (!props[prop] || props[prop].setter || !props[prop].getter) {
        entity[prop as keyof T] = value as T[keyof T];
      }
    });

    return entity;
  }

  /**
   * auto-wire 1:1 inverse side with owner as in no-sql drivers it can't be joined
   * also makes sure the link is bidirectional when creating new entities from nested structures
   * @internal
   */
  static autoWireOneToOne<T extends AnyEntity<T>>(prop: EntityProperty, entity: T): void {
    if (prop.reference !== ReferenceType.ONE_TO_ONE) {
      return;
    }

    const meta2 = entity[prop.name].__meta! as EntityMetadata;
    const prop2 = meta2.properties[prop.inversedBy || prop.mappedBy];

    /* istanbul ignore next */
    if (prop2 && !entity[prop.name][prop2.name]) {
      if (Reference.isReference(entity[prop.name])) {
        entity[prop.name].unwrap()[prop2.name] = Reference.wrapReference(entity, prop2);
      } else {
        entity[prop.name][prop2.name] = Reference.wrapReference(entity, prop2);
      }
    }
  }

  private static validateEM(em?: EntityManager): boolean {
    if (!em) {
      throw new Error(`To use assign() on not managed entities, explicitly provide EM instance: wrap(entity).assign(data, { em: orm.em })`);
    }

    return true;
  }

  private static assignReference<T extends AnyEntity<T>>(entity: T, value: any, prop: EntityProperty, em: EntityManager, options: AssignOptions): void {
    if (Utils.isEntity(value, true)) {
      entity[prop.name] = value;
    } else if (Utils.isPrimaryKey(value, true)) {
      entity[prop.name] = Reference.wrapReference(em.getReference<T>(prop.type, value, false, options.convertCustomTypes), prop);
    } else if (Utils.isPlainObject(value) && options.merge) {
      entity[prop.name] = Reference.wrapReference(em.merge(prop.type, value), prop);
    } else if (Utils.isPlainObject(value)) {
      entity[prop.name] = Reference.wrapReference(em.create(prop.type, value), prop);
    } else {
      const name = entity.constructor.name;
      throw new Error(`Invalid reference value provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(value)}`);
    }

    EntityAssigner.autoWireOneToOne(prop, entity);
  }

  private static assignCollection<T extends AnyEntity<T>, U extends AnyEntity<U> = AnyEntity>(entity: T, collection: Collection<U>, value: any[], prop: EntityProperty, em: EntityManager, options: AssignOptions): void {
    const invalid: any[] = [];
    const items = value.map((item: any, idx) => {
      if (options.updateNestedEntities && options.updateByPrimaryKey && Utils.isPlainObject(item)) {
        const pk = Utils.extractPK(item, prop.targetMeta);

        if (pk) {
          const ref = em.getReference(prop.type, pk as Primary<U>);

          /* istanbul ignore else */
          if (ref.__helper!.isInitialized()) {
            return EntityAssigner.assign(ref, item as U, options);
          }
        }

        return this.createCollectionItem<U>(item, em, prop, invalid, options);
      }

      /* istanbul ignore next */
      if (options.updateNestedEntities && !options.updateByPrimaryKey && collection[idx]?.__helper!.isInitialized()) {
        return EntityAssigner.assign(collection[idx], item, options);
      }

      return this.createCollectionItem<U>(item, em, prop, invalid, options);
    });

    if (invalid.length > 0) {
      const name = entity.constructor.name;
      throw new Error(`Invalid collection values provided for '${name}.${prop.name}' in ${name}.assign(): ${inspect(invalid)}`);
    }

    collection.set(items);
  }

  private static assignEmbeddable<T extends AnyEntity<T>>(entity: T, value: any, prop: EntityProperty, em: EntityManager, options: AssignOptions): void {
    const Embeddable = prop.embeddable;
    const propName = prop.embedded ? prop.embedded[1] : prop.name;
    entity[propName] = prop.array || options.mergeObjects ? (entity[propName] || Object.create(Embeddable.prototype)) : Object.create(Embeddable.prototype);

    if (!value) {
      entity[propName] = value;
      return;
    }

    // if the value is not an array, we just push, otherwise we replace the array
    if (prop.array && (Array.isArray(value) || entity[propName] == null)) {
      entity[propName] = [];
    }

    if (prop.array) {
      return Utils.asArray(value).forEach(item => {
        const tmp = {};
        this.assignEmbeddable(tmp, item, { ...prop, array: false }, em, options);
        entity[propName].push(...Object.values(tmp));
      });
    }

    Object.keys(value).forEach(key => {
      const childProp = prop.embeddedProps[key];

      if (childProp && childProp.reference === ReferenceType.EMBEDDED) {
        return EntityAssigner.assignEmbeddable(entity[propName], value[key], childProp, em, options);
      }

      entity[propName][key] = value[key];
    });
  }

  private static createCollectionItem<T extends AnyEntity<T>>(item: any, em: EntityManager, prop: EntityProperty, invalid: any[], options: AssignOptions): T {
    if (Utils.isEntity<T>(item)) {
      return item;
    }

    if (Utils.isPrimaryKey(item)) {
      return em.getReference(prop.type, item);
    }

    if (Utils.isPlainObject(item) && options.merge) {
      return em.merge<T>(prop.type, item as EntityData<T>);
    }

    if (Utils.isPlainObject(item)) {
      return em.create<T>(prop.type, item as EntityData<T>);
    }

    invalid.push(item);

    return item;
  }

}

export const assign = EntityAssigner.assign;

export interface AssignOptions {
  updateNestedEntities?: boolean;
  updateByPrimaryKey?: boolean;
  onlyProperties?: boolean;
  convertCustomTypes?: boolean;
  mergeObjects?: boolean;
  merge?: boolean;
  em?: EntityManager;
}
