import { inspect } from 'util';
import { Collection } from './Collection';
import type { EntityManager } from '../EntityManager';
import type { Platform } from '../platforms/Platform';
import type {
  AnyEntity,
  Dictionary,
  EntityData,
  EntityDTO,
  EntityKey,
  EntityProperty,
  EntityValue,
  FromEntityType,
  IsSubset,
  MergeSelected,
  Primary,
  RequiredEntityData,
} from '../typings';
import { Utils } from '../utils/Utils';
import { Reference } from './Reference';
import { ReferenceKind, SCALAR_TYPES } from '../enums';
import { EntityValidator } from './EntityValidator';
import { helper, wrap } from './wrap';
import { EntityHelper } from './EntityHelper';

const validator = new EntityValidator(false);

export class EntityAssigner {

  static assign<
    Entity extends object,
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Convert extends boolean = false,
    Data extends EntityData<Naked, Convert> | Partial<EntityDTO<Naked>> = EntityData<Naked, Convert> | Partial<EntityDTO<Naked>>,
  >(entity: Entity, data: Data & IsSubset<EntityData<Naked, Convert>, Data>, options: AssignOptions<Convert> = {}): MergeSelected<Entity, Naked, keyof Data & string> {
    let opts = options as unknown as InternalAssignOptions<Convert>;

    if (opts.visited?.has(entity)) {
      return entity as any;
    }

    EntityHelper.ensurePropagation(entity);
    opts.visited ??= new Set();
    opts.visited.add(entity);
    const wrapped = helper(entity);
    opts = {
      ...wrapped.__config.get('assign'),
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

    return entity as any;
  }

  private static assignProperty<T extends object, C extends boolean>(entity: T, propName: string, props: Dictionary<EntityProperty<T>>, data: Dictionary, options: InternalAssignOptions<C>) {
    if (options.onlyProperties && !(propName in props)) {
      return;
    }

    let value = data[propName];
    const prop = { ...props[propName], name: propName } as EntityProperty<T>;

    if (prop && options.onlyOwnProperties) {
      if ([ReferenceKind.MANY_TO_MANY, ReferenceKind.ONE_TO_MANY].includes(prop.kind)) {
        return;
      }

      if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop.kind)) {
        value = Utils.extractPK(value, prop.targetMeta);
      }
    }

    if (propName in props && !prop.nullable && value == null) {
      throw new Error(`You must pass a non-${value} value to the property ${propName} of entity ${(entity as Dictionary).constructor.name}.`);
    }

    // create collection instance if its missing so old items can be deleted with orphan removal
    if ([ReferenceKind.MANY_TO_MANY, ReferenceKind.ONE_TO_MANY].includes(prop?.kind) && entity[prop.name] == null) {
      entity[prop.name] = Collection.create(entity, prop.name, undefined, helper(entity).isInitialized()) as EntityValue<T>;
    }

    if (prop && Utils.isCollection(entity[prop.name])) {
      return EntityAssigner.assignCollection<T, any, C>(entity, entity[prop.name] as unknown as Collection<AnyEntity>, value, prop, options.em, options);
    }

    const customType = prop?.customType;

    if (options.convertCustomTypes && customType && prop.kind === ReferenceKind.SCALAR && !Utils.isEntity(data)) {
      value = customType.convertToJSValue(value, options.platform);
    }

    if ([ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(prop?.kind) && value != null) {
      if (options.updateNestedEntities && Object.hasOwn(entity, propName) && Utils.isEntity(entity[propName as EntityKey<T>], true) && Utils.isPlainObject(value)) {
        const unwrappedEntity = Reference.unwrapReference(entity[propName as EntityKey<T>] as object);
        const wrapped = helper(unwrappedEntity);

        if (options.updateByPrimaryKey) {
          const pk = Utils.extractPK(value, prop.targetMeta);

          if (pk) {
            const ref = options.em!.getReference(prop.type, pk as Primary<T>, options);
            // if the PK differs, we want to change the target entity, not update it
            const wrappedChild = helper(ref);
            const sameTarget = wrappedChild.getSerializedPrimaryKey() === wrapped.getSerializedPrimaryKey();

            if (wrappedChild.__managed && wrappedChild.isInitialized() && sameTarget) {
              return EntityAssigner.assign(ref, value as any, options);
            }
          }

          return EntityAssigner.assignReference<T, C>(entity, value, prop, options.em!, options);
        }

        if (wrapped.__managed && wrap(unwrappedEntity).isInitialized()) {
          return EntityAssigner.assign(unwrappedEntity, value as any, options);
        }
      }

      return EntityAssigner.assignReference<T, C>(entity, value, prop, options.em, options);
    }

    if (prop.kind === ReferenceKind.SCALAR && SCALAR_TYPES.includes(prop.runtimeType) && (prop.setter || !prop.getter)) {
      return entity[prop.name] = validator.validateProperty(prop, value, entity);
    }

    if (prop.kind === ReferenceKind.EMBEDDED && EntityAssigner.validateEM(options.em)) {
      return EntityAssigner.assignEmbeddable(entity, value, prop, options.em, options);
    }

    if (options.mergeObjectProperties && Utils.isPlainObject(entity[propName as EntityKey]) && Utils.isPlainObject(value)) {
      entity[propName as EntityKey<T>] ??= {} as EntityValue<T>;
      entity[propName as EntityKey<T>] = Utils.merge({}, entity[propName as EntityKey<T>], value);
    } else if (!prop || prop.setter || !prop.getter) {
      entity[propName as EntityKey<T>] = value;
    }
  }

  /**
   * auto-wire 1:1 inverse side with owner as in no-sql drivers it can't be joined
   * also makes sure the link is bidirectional when creating new entities from nested structures
   * @internal
   */
  static autoWireOneToOne<T extends object, O extends object>(prop: EntityProperty<O, T>, entity: O): void {
    const ref = entity[prop.name] as T;

    if (prop.kind !== ReferenceKind.ONE_TO_ONE || !Utils.isEntity(ref)) {
      return;
    }

    const meta2 = helper(ref).__meta;
    const prop2 = meta2.properties[prop.inversedBy || prop.mappedBy];

    /* istanbul ignore next */
    if (prop2 && !ref![prop2.name]) {
      if (Reference.isReference<T>(ref)) {
        ref.unwrap()[prop2.name] = Reference.wrapReference(entity, prop2) as EntityValue<T>;
      } else {
        ref[prop2.name] = Reference.wrapReference(entity, prop2) as EntityValue<T>;
      }
    }
  }

  private static validateEM(em?: EntityManager): em is EntityManager {
    if (!em) {
      throw new Error(`To use assign() on not managed entities, explicitly provide EM instance: wrap(entity).assign(data, { em: orm.em })`);
    }

    return true;
  }

  private static assignReference<T extends object, C extends boolean>(entity: T, value: any, prop: EntityProperty<T>, em: EntityManager | undefined, options: AssignOptions<C>): void {
    if (Utils.isEntity(value, true)) {
      entity[prop.name] = Reference.wrapReference(value as T, prop) as EntityValue<T>;
    } else if (Utils.isPrimaryKey(value, true) && EntityAssigner.validateEM(em)) {
      entity[prop.name] = prop.mapToPk ? value as EntityValue<T> : Reference.wrapReference(em.getReference<T>(prop.type, value as Primary<T>, options), prop) as EntityValue<T>;
    } else if (Utils.isPlainObject(value) && options.merge && EntityAssigner.validateEM(em)) {
      entity[prop.name] = Reference.wrapReference(em.merge(prop.type, value as T, options) as T, prop) as EntityValue<T>;
    } else if (Utils.isPlainObject(value) && EntityAssigner.validateEM(em)) {
      entity[prop.name] = Reference.wrapReference(em.create(prop.type, value as T, options) as T, prop) as EntityValue<T>;
    } else {
      const name = (entity as object).constructor.name;
      throw new Error(`Invalid reference value provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(value)}`);
    }

    EntityAssigner.autoWireOneToOne(prop, entity);
  }

  private static assignCollection<T extends object, U extends object = AnyEntity, C extends boolean = false>(entity: T, collection: Collection<U>, value: unknown, prop: EntityProperty, em: EntityManager | undefined, options: AssignOptions<C>): void {
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
            return EntityAssigner.assign(ref, item as any, options);
          }
        }

        return this.createCollectionItem<U, C>(item, em, prop, invalid, options);
      }

      /* istanbul ignore next */
      if (options.updateNestedEntities && !options.updateByPrimaryKey && collection[idx] && helper(collection[idx])?.isInitialized()) {
        return EntityAssigner.assign(collection[idx], item, options);
      }

      return this.createCollectionItem<U, C>(item, em, prop, invalid, options);
    });

    if (invalid.length > 0) {
      const name = (entity as object).constructor.name;
      throw new Error(`Invalid collection values provided for '${name}.${prop.name}' in ${name}.assign(): ${inspect(invalid)}`);
    }

    if (Array.isArray(value)) {
      collection.set(items as any);
    } else { // append to the collection in case of assigning a single value instead of array
      collection.add(items as any);
    }
  }

  private static assignEmbeddable<T extends object, C extends boolean>(entity: T, value: any, prop: EntityProperty<T>, em: EntityManager | undefined, options: InternalAssignOptions<C>): void {
    const propName = prop.embedded ? prop.embedded[1] : prop.name;

    if (value == null) {
      entity[propName] = value;
      return;
    }

    // if the value is not an array, we just push, otherwise we replace the array
    if (prop.array && (Array.isArray(value) || entity[propName] == null)) {
      entity[propName] = [] as EntityValue<T>;
    }

    if (prop.array) {
      return Utils.asArray(value).forEach(item => {
        const tmp = {} as T;
        this.assignEmbeddable(tmp, item, { ...prop, array: false }, em, options);
        (entity[propName] as unknown[]).push(...Object.values(tmp));
      });
    }

    const create = () => EntityAssigner.validateEM(em) && em!.getEntityFactory().createEmbeddable<T>(prop.type, value, {
      convertCustomTypes: options.convertCustomTypes,
      newEntity: options.mergeEmbeddedProperties ? !('propName' in entity) : true,
    });
    entity[propName] = (options.mergeEmbeddedProperties ? (entity[propName] || create()) : create()) as EntityValue<T>;

    Object.keys(value).forEach(key => {
      EntityAssigner.assignProperty(entity[propName], key, prop.embeddedProps, value, options);
    });
  }

  private static createCollectionItem<T extends object, C extends boolean>(item: any, em: EntityManager | undefined, prop: EntityProperty, invalid: any[], options: AssignOptions<C>): T {
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
      return em.create<T, C>(prop.type, item as RequiredEntityData<T, never, C>, options as AssignOptions<C>);
    }

    invalid.push(item);

    return item as T;
  }

}

export const assign = EntityAssigner.assign;

export interface AssignOptions<Convert extends boolean> {
  updateNestedEntities?: boolean;
  updateByPrimaryKey?: boolean;
  onlyProperties?: boolean;
  onlyOwnProperties?: boolean;
  convertCustomTypes?: Convert;
  mergeObjectProperties?: boolean;
  mergeEmbeddedProperties?: boolean;
  merge?: boolean;
  schema?: string;
  em?: EntityManager;
}

interface InternalAssignOptions<Convert extends boolean> extends AssignOptions<Convert> {
  visited: Set<AnyEntity>;
  platform: Platform;
}
