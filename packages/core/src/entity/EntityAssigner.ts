import { inspect } from 'util';
import { Collection } from './Collection';
import type { EntityManager } from '../EntityManager';
import type { Platform } from '../platforms/Platform';
import type { AnyEntity, Dictionary, EntityData, EntityDTO, EntityMetadata, EntityProperty, Primary, RequiredEntityData } from '../typings';
import { Utils } from '../utils/Utils';
import { Reference } from './Reference';
import { ReferenceType, SCALAR_TYPES } from '../enums';
import { EntityValidator } from './EntityValidator';
import { helper, wrap } from './wrap';

const validator = new EntityValidator(false);

export class EntityAssigner {

  static assign<T extends object>(entity: T, data: EntityData<T> | Partial<EntityDTO<T>>, options: AssignOptions = {}): T {
    let opts = options as unknown as InternalAssignOptions;

    if (opts.visited?.has(entity)) {
      return entity;
    }

    opts.visited ??= new Set();
    opts.visited.add(entity);
    const wrapped = helper(entity);
    opts = {
      updateNestedEntities: true,
      updateByPrimaryKey: true,
      mergeObjects: true,
      schema: wrapped.__schema,
      ...opts, // allow overriding the defaults
    };
    const meta = wrapped.__meta;
    const props = meta.properties;

    Object.keys(data).forEach(prop => {
      return EntityAssigner.assignProperty(entity, prop, props, data, {
        ...opts,
        em: opts.em || wrapped.__em,
        platform: wrapped.__platform,
      });
    });

    return entity;
  }

  private static assignProperty<T extends object>(entity: T, propName: string, props: Dictionary<EntityProperty<T>>, data: Dictionary, options: InternalAssignOptions) {
    if (options.onlyProperties && !(propName in props)) {
      return;
    }

    let value = data[propName];
    const prop = { ...props[propName], name: propName } as EntityProperty<T>;

    if (propName in props && !prop.nullable && value == null) {
      throw new Error(`You must pass a non-${value} value to the property ${propName} of entity ${(entity as Dictionary).constructor.name}.`);
    }

    // create collection instance if its missing so old items can be deleted with orphan removal
    if ([ReferenceType.MANY_TO_MANY, ReferenceType.ONE_TO_MANY].includes(prop?.reference) && entity[prop.name] == null) {
      entity[prop.name] = Collection.create(entity, prop.name, undefined, helper(entity).isInitialized()) as any;
    }

    if (prop && Utils.isCollection(entity[prop.name])) {
      return EntityAssigner.assignCollection<T>(entity, entity[prop.name] as unknown as Collection<AnyEntity>, value, prop, options.em, options);
    }

    const customType = prop?.customType;

    if (options.convertCustomTypes && customType && prop.reference === ReferenceType.SCALAR && !Utils.isEntity(data)) {
      value = prop.customType.convertToJSValue(value, options.platform);
    }

    if ([ReferenceType.MANY_TO_ONE, ReferenceType.ONE_TO_ONE].includes(prop?.reference) && value != null) {
      // eslint-disable-next-line no-prototype-builtins
      if (options.updateNestedEntities && (entity as object).hasOwnProperty(propName) && Utils.isEntity(entity[propName], true) && Utils.isPlainObject(value)) {
        const unwrappedEntity = Reference.unwrapReference(entity[propName]);

        if (options.updateByPrimaryKey) {
          const pk = Utils.extractPK(value, prop.targetMeta);

          if (pk) {
            const ref = options.em!.getReference(prop.type, pk as Primary<T>, options);
            // if the PK differs, we want to change the target entity, not update it
            const sameTarget = helper(ref).getSerializedPrimaryKey() === unwrappedEntity.__helper.getSerializedPrimaryKey();

            if (helper(ref).isInitialized() && sameTarget) {
              return EntityAssigner.assign(ref, value, options);
            }
          }

          return EntityAssigner.assignReference<T>(entity, value, prop, options.em!, options);
        }

        if (wrap(unwrappedEntity).isInitialized()) {
          return EntityAssigner.assign(unwrappedEntity, value, options);
        }
      }

      return EntityAssigner.assignReference<T>(entity, value, prop, options.em, options);
    }

    if (prop?.reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(prop.type) && (prop.setter || !prop.getter)) {
      return entity[prop.name] = validator.validateProperty(prop, value, entity);
    }

    if (prop?.reference === ReferenceType.EMBEDDED && EntityAssigner.validateEM(options.em)) {
      return EntityAssigner.assignEmbeddable(entity, value, prop, options.em, options);
    }

    if (options.mergeObjects && Utils.isPlainObject(entity[propName]) && Utils.isPlainObject(value)) {
      entity[propName] = Utils.merge({}, entity[propName], value);
    } else if (!prop || prop.setter || !prop.getter) {
      entity[propName] = value;
    }
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

  private static validateEM(em?: EntityManager): em is EntityManager {
    if (!em) {
      throw new Error(`To use assign() on not managed entities, explicitly provide EM instance: wrap(entity).assign(data, { em: orm.em })`);
    }

    return true;
  }

  private static assignReference<T extends object>(entity: T, value: any, prop: EntityProperty, em: EntityManager | undefined, options: AssignOptions): void {
    if (Utils.isEntity(value, true)) {
      entity[prop.name] = Reference.wrapReference(value, prop);
    } else if (Utils.isPrimaryKey(value, true) && EntityAssigner.validateEM(em)) {
      entity[prop.name] = prop.mapToPk ? value : Reference.wrapReference(em.getReference<T>(prop.type, value, options), prop);
    } else if (Utils.isPlainObject(value) && options.merge && EntityAssigner.validateEM(em)) {
      entity[prop.name] = Reference.wrapReference(em.merge(prop.type, value, options), prop);
    } else if (Utils.isPlainObject(value) && EntityAssigner.validateEM(em)) {
      entity[prop.name] = Reference.wrapReference(em.create(prop.type, value, options), prop);
    } else {
      const name = (entity as object).constructor.name;
      throw new Error(`Invalid reference value provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(value)}`);
    }

    EntityAssigner.autoWireOneToOne(prop, entity);
  }

  private static assignCollection<T extends object, U extends object = AnyEntity>(entity: T, collection: Collection<U>, value: unknown, prop: EntityProperty, em: EntityManager | undefined, options: AssignOptions): void {
    const invalid: any[] = [];
    const items = Utils.asArray(value).map((item: any, idx) => {
      // try to propagate missing owning side reference to the payload first
      const prop2 = prop.targetMeta?.properties[prop.mappedBy];

      if (Utils.isPlainObject(item) && prop2 && item[prop2.name] == null) {
        item = { ...item, [prop2.name]: Reference.wrapReference(entity, prop2) };
      }

      if (options.updateNestedEntities && options.updateByPrimaryKey && Utils.isPlainObject(item)) {
        const pk = Utils.extractPK(item, prop.targetMeta);

        if (pk && EntityAssigner.validateEM(em)) {
          const ref = em.getUnitOfWork().getById(prop.type, pk as Primary<U>, options.schema);

          /* istanbul ignore else */
          if (ref) {
            return EntityAssigner.assign(ref, item as U, options);
          }
        }

        return this.createCollectionItem<U>(item, em, prop, invalid, options);
      }

      /* istanbul ignore next */
      if (options.updateNestedEntities && !options.updateByPrimaryKey && collection[idx] && helper(collection[idx])?.isInitialized()) {
        return EntityAssigner.assign(collection[idx], item, options);
      }

      return this.createCollectionItem<U>(item, em, prop, invalid, options);
    });

    if (invalid.length > 0) {
      const name = (entity as object).constructor.name;
      throw new Error(`Invalid collection values provided for '${name}.${prop.name}' in ${name}.assign(): ${inspect(invalid)}`);
    }

    if (Array.isArray(value)) {
      collection.set(items);
    } else { // append to the collection in case of assigning a single value instead of array
      collection.add(items);
    }
  }

  private static assignEmbeddable<T extends object>(entity: T, value: any, prop: EntityProperty, em: EntityManager | undefined, options: InternalAssignOptions): void {
    const propName = prop.embedded ? prop.embedded[1] : prop.name;

    if (value == null) {
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
      newEntity: options.mergeObjects ? !('propName' in entity) : true,
    });
    entity[propName] = options.mergeObjects ? (entity[propName] || create()) : create();

    Object.keys(value).forEach(key => {
      EntityAssigner.assignProperty(entity[propName], key, prop.embeddedProps, value, options);
    });
  }

  private static createCollectionItem<T extends object>(item: any, em: EntityManager | undefined, prop: EntityProperty, invalid: any[], options: AssignOptions): T {
    if (Utils.isEntity<T>(item)) {
      return item;
    }

    if (Utils.isPrimaryKey(item) && EntityAssigner.validateEM(em)) {
      return em.getReference(prop.type, item, options) as T;
    }

    if (Utils.isPlainObject(item) && options.merge && EntityAssigner.validateEM(em)) {
      return em.merge<T>(prop.type, item as EntityData<T>, options);
    }

    if (Utils.isPlainObject(item) && EntityAssigner.validateEM(em)) {
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
}

interface InternalAssignOptions extends AssignOptions {
  visited: Set<AnyEntity>;
  platform: Platform;
}
