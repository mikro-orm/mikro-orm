import { inspect } from 'util';
import { Collection } from './Collection';
import { SCALAR_TYPES } from './EntityFactory';
import { EntityManager } from '../EntityManager';
import { EntityData, EntityMetadata, EntityProperty, AnyEntity } from '../typings';
import { Utils } from '../utils';
import { ReferenceType } from './enums';
import { Reference } from './Reference';
import { wrap } from './EntityHelper';

export class EntityAssigner {

  static assign<T extends AnyEntity<T>>(entity: T, data: EntityData<T>, options?: AssignOptions): T;
  static assign<T extends AnyEntity<T>>(entity: T, data: EntityData<T>, onlyProperties?: boolean): T;
  static assign<T extends AnyEntity<T>>(entity: T, data: EntityData<T>, onlyProperties: AssignOptions | boolean = false): T {
    const options = (typeof onlyProperties === 'boolean' ? { onlyProperties } : onlyProperties);
    const em = options.em || wrap(entity).__em;
    const meta = wrap(entity).__internal.metadata.get(entity.constructor.name);
    const validator = wrap(entity).__internal.validator;
    const platform = wrap(entity).__internal.platform;
    const props = meta.properties;

    Object.keys(data).forEach(prop => {
      if (options.onlyProperties && !(prop in props)) {
        return;
      }

      let value = data[prop as keyof EntityData<T>];

      if (props[prop] && props[prop].customType) {
        value = props[prop].customType.convertToJSValue(value, platform);
      }

      // tslint:disable-next-line:triple-equals - Really want the double equals here to pass for both null and undefined and allow for keys of numeric 0
      if (props[prop] && [ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(props[prop].reference) && value != null && EntityAssigner.validateEM(em)) {
        return EntityAssigner.assignReference<T>(entity, value, props[prop], em!);
      }

      if (props[prop] && Utils.isCollection(entity[prop as keyof T], props[prop]) && Array.isArray(value) && EntityAssigner.validateEM(em)) {
        return EntityAssigner.assignCollection<T>(entity, entity[prop as keyof T] as unknown as Collection<AnyEntity>, value, props[prop], em!);
      }

      if (props[prop] && props[prop].reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(props[prop].type) && (!props[prop].getter || props[prop].setter)) {
        return entity[prop as keyof T] = validator.validateProperty(props[prop], value, entity);
      }

      if (options.mergeObjects && Utils.isObject(value)) {
        Utils.merge(entity[prop as keyof T], value);
      } else if (!props[prop] || !props[prop].getter || props[prop].setter) {
        entity[prop as keyof T] = value;
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

    const meta2 = entity[prop.name].__meta as EntityMetadata;
    const prop2 = meta2.properties[prop.inversedBy || prop.mappedBy];

    if (prop2 && !entity[prop.name][prop2.name]) {
      if (entity[prop.name] instanceof Reference) {
        entity[prop.name].unwrap()[prop2.name] = Utils.wrapReference(entity, prop2);
      } else {
        entity[prop.name][prop2.name] = Utils.wrapReference(entity, prop2);
      }
    }
  }

  private static validateEM(em?: EntityManager): boolean {
    if (!em) {
      throw new Error(`To use assign() on not managed entities, explicitly provide EM instance: wrap(entity).assign(data, { em: orm.em })`);
    }

    return true;
  }

  private static assignReference<T extends AnyEntity<T>>(entity: T, value: any, prop: EntityProperty, em: EntityManager): void {
    let valid = false;

    if (Utils.isEntity(value) || value instanceof Reference) {
      entity[prop.name as keyof T] = value as T[keyof T];
      valid = true;
    } else if (Utils.isPrimaryKey(value)) {
      entity[prop.name as keyof T] = Utils.wrapReference(em.getReference(prop.type, value), prop) as T[keyof T];
      valid = true;
    } else if (Utils.isObject<T[keyof T]>(value)) {
      entity[prop.name as keyof T] = Utils.wrapReference(em.create(prop.type, value) as T[keyof T], prop) as T[keyof T];
      valid = true;
    }

    if (!valid) {
      const name = entity.constructor.name;
      throw new Error(`Invalid reference value provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(value)}`);
    }

    EntityAssigner.autoWireOneToOne(prop, entity);
  }

  private static assignCollection<T extends AnyEntity<T>, U extends AnyEntity<U> = AnyEntity>(entity: T, collection: Collection<U>, value: any[], prop: EntityProperty, em: EntityManager): void {
    const invalid: any[] = [];
    const items = value.map((item: any) => this.createCollectionItem<U>(item, em, prop, invalid));

    if (invalid.length > 0) {
      const name = entity.constructor.name;
      throw new Error(`Invalid collection values provided for '${name}.${prop.name}' in ${name}.assign(): ${inspect(invalid)}`);
    }

    collection.hydrate(items, true);
    collection.setDirty();
  }

  private static createCollectionItem<T extends AnyEntity<T>>(item: any, em: EntityManager, prop: EntityProperty, invalid: any[]): T {
    if (Utils.isEntity<T>(item)) {
      return item;
    }

    if (Utils.isPrimaryKey(item)) {
      return em.getReference(prop.type, item);
    }

    if (Utils.isObject<T>(item)) {
      return em.create<T>(prop.type, item);
    }

    invalid.push(item);

    return item;
  }

}

export interface AssignOptions {
  onlyProperties?: boolean;
  mergeObjects?: boolean;
  em?: EntityManager;
}
