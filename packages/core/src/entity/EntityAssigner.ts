import { inspect } from 'util';
import type { Collection } from './Collection';
import type { EntityManager } from '../EntityManager';
import type { AnyEntity, Dictionary, EntityData, EntityDTO, EntityMetadata, EntityProperty, Primary, RequiredEntityData } from '../typings';
import { Utils } from '../utils/Utils';
import { Reference } from './Reference';
import { ReferenceType, SCALAR_TYPES } from '../enums';
import { EntityValidator } from './EntityValidator';
import { helper, wrap } from './wrap';

const validator = new EntityValidator(false);

export class EntityAssigner {

  // eslint-disable-next-line @typescript-eslint/ban-types
  static assign<T extends {}>(entity: T, data: EntityData<T> | Partial<EntityDTO<T>>, options: AssignOptions = {}): T {
    if (options.visited?.has(entity)) {
      return entity;
    }

    options.visited ??= new Set();
    options.visited.add(entity);
    const wrapped = helper(entity);
    options = {
      updateNestedEntities: true,
      updateByPrimaryKey: true,
      mergeObjects: true,
      schema: wrapped.__schema,
      ...options, // allow overriding the defaults
    };
    const meta = wrapped.__meta;
    const em = options.em || wrapped.__em;
    const props = meta.properties;

    Object.keys(data).forEach(prop => {
      if (options.onlyProperties && !(prop in props)) {
        return;
      }

      let value = data[prop];

      if (props[prop] && !props[prop].nullable && value == null) {
        throw new Error(`You must pass a non-${value} value to the property ${prop} of entity ${(entity as Dictionary).constructor.name}.`);
      }

      if (props[prop] && Utils.isCollection(entity[prop as keyof T]) && Array.isArray(value) && EntityAssigner.validateEM(em)) {
        return EntityAssigner.assignCollection<T>(entity, entity[prop as keyof T] as unknown as Collection<AnyEntity>, value, props[prop], em!, options);
      }

      const customType = props[prop]?.customType;

      if (options.convertCustomTypes && customType && props[prop].reference === ReferenceType.SCALAR && !Utils.isEntity(data)) {
        value = props[prop].customType.convertToJSValue(value, wrapped.__platform);
      }

      if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(props[prop]?.reference) && value != null && EntityAssigner.validateEM(em)) {
        // eslint-disable-next-line no-prototype-builtins
        if (options.updateNestedEntities && (entity as object).hasOwnProperty(prop) && Utils.isEntity(entity[prop], true) && Utils.isPlainObject(value)) {
          const unwrappedEntity = Reference.unwrapReference(entity[prop]);

          if (options.updateByPrimaryKey) {
            const pk = Utils.extractPK(value, props[prop].targetMeta);

            if (pk) {
              const ref = em.getReference(props[prop].type, pk as Primary<T>, options);
              // if the PK differs, we want to change the target entity, not update it
              const sameTarget = ref.__helper.getSerializedPrimaryKey() === unwrappedEntity.__helper.getSerializedPrimaryKey();

              if (ref.__helper!.isInitialized() && sameTarget) {
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

      if (props[prop]?.reference === ReferenceType.EMBEDDED && EntityAssigner.validateEM(em)) {
        return EntityAssigner.assignEmbeddable(entity, value, props[prop], em, options);
      }

      if (options.mergeObjects && Utils.isPlainObject(value)) {
        entity[prop] ??= {};
        Utils.merge(entity[prop], value);
      } else if (!props[prop] || props[prop].setter || !props[prop].getter) {
        entity[prop] = value;
      }
    });

    return entity;
  }

  /**
   * auto-wire 1:1 inverse side with owner as in no-sql drivers it can't be joined
   * also makes sure the link is bidirectional when creating new entities from nested structures
   * @internal
   */
  static autoWireOneToOne<T>(prop: EntityProperty, entity: T): void {
    if (prop.reference !== ReferenceType.ONE_TO_ONE || !Utils.isEntity(entity[prop.name])) {
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

  private static assignReference<T extends object>(entity: T, value: any, prop: EntityProperty, em: EntityManager, options: AssignOptions): void {
    if (Utils.isEntity(value, true)) {
      entity[prop.name] = Reference.wrapReference(value, prop);
    } else if (Utils.isPrimaryKey(value, true)) {
      entity[prop.name] = prop.mapToPk ? value : Reference.wrapReference(em.getReference<T>(prop.type, value, options), prop);
    } else if (Utils.isPlainObject(value) && options.merge) {
      entity[prop.name] = Reference.wrapReference(em.merge(prop.type, value, options), prop);
    } else if (Utils.isPlainObject(value)) {
      entity[prop.name] = Reference.wrapReference(em.create(prop.type, value, options), prop);
    } else {
      const name = (entity as object).constructor.name;
      throw new Error(`Invalid reference value provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(value)}`);
    }

    EntityAssigner.autoWireOneToOne(prop, entity);
  }

  private static assignCollection<T extends object, U extends object = AnyEntity>(entity: T, collection: Collection<U>, value: any[], prop: EntityProperty, em: EntityManager, options: AssignOptions): void {
    const invalid: any[] = [];
    const items = value.map((item: any, idx) => {
      if (options.updateNestedEntities && options.updateByPrimaryKey && Utils.isPlainObject(item)) {
        const pk = Utils.extractPK(item, prop.targetMeta);

        if (pk) {
          const ref = em.getReference(prop.type, pk as Primary<U>, options) as U;

          /* istanbul ignore else */
          if (helper(ref).isInitialized()) {
            return EntityAssigner.assign(ref, item as U, options);
          }
        }

        return this.createCollectionItem<U>(item, em, prop, invalid, options);
      }

      /* istanbul ignore next */
      if (options.updateNestedEntities && !options.updateByPrimaryKey && helper(collection[idx])?.isInitialized()) {
        return EntityAssigner.assign(collection[idx], item, options);
      }

      return this.createCollectionItem<U>(item, em, prop, invalid, options);
    });

    if (invalid.length > 0) {
      const name = (entity as object).constructor.name;
      throw new Error(`Invalid collection values provided for '${name}.${prop.name}' in ${name}.assign(): ${inspect(invalid)}`);
    }

    collection.set(items);
  }

  private static assignEmbeddable<T extends object>(entity: T, value: any, prop: EntityProperty, em: EntityManager | undefined, options: AssignOptions): void {
    const propName = prop.embedded ? prop.embedded[1] : prop.name;

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

    const create = () => EntityAssigner.validateEM(em) && em!.getEntityFactory().createEmbeddable<T>(prop.type, value, {
      convertCustomTypes: options.convertCustomTypes,
      newEntity: options.mergeObjects ? !entity[propName] : true,
    });
    entity[propName] = options.mergeObjects ? (entity[propName] || create()) : create();

    Object.keys(value).forEach(key => {
      const childProp = prop.embeddedProps[key];

      if (childProp && childProp.reference === ReferenceType.EMBEDDED) {
        return EntityAssigner.assignEmbeddable(entity[propName], value[key], childProp, em, options);
      }

      entity[propName][key] = value[key];
    });
  }

  private static createCollectionItem<T extends object>(item: any, em: EntityManager, prop: EntityProperty, invalid: any[], options: AssignOptions): T {
    if (Utils.isEntity<T>(item)) {
      return item;
    }

    if (Utils.isPrimaryKey(item)) {
      return em.getReference(prop.type, item, options) as T;
    }

    if (Utils.isPlainObject(item) && options.merge) {
      return em.merge<T>(prop.type, item as EntityData<T>, options);
    }

    if (Utils.isPlainObject(item)) {
      return em.create<T>(prop.type, item as RequiredEntityData<T>, options);
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
  schema?: string;
  em?: EntityManager;
  /** @internal */
  visited?: Set<AnyEntity>;
}
