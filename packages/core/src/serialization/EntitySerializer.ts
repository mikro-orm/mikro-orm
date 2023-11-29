import type { Collection } from '../entity/Collection';
import type {
  ArrayElement,
  AutoPath,
  Dictionary,
  EntityDTO,
  EntityDTOProp,
  EntityKey,
  EntityMetadata,
  EntityValue,
  FromEntityType,
  IPrimaryKey,
  Loaded,
} from '../typings';
import { helper } from '../entity/wrap';
import type { Platform } from '../platforms';
import { Utils } from '../utils/Utils';
import { ReferenceKind } from '../enums';
import { Reference } from '../entity/Reference';
import { SerializationContext } from './SerializationContext';

function isVisible<T extends object>(meta: EntityMetadata<T>, propName: EntityKey<T>, options: SerializeOptions<T, any, any>): boolean {
  if (Array.isArray(options.populate) && options.populate?.find(item => item === propName || item.startsWith(propName + '.') || item === '*')) {
    return true;
  }

  if (options.exclude?.find(item => item === propName)) {
    return false;
  }

  const prop = meta.properties[propName];
  const visible = prop && !prop.hidden;
  const prefixed = prop && !prop.primary && propName.startsWith('_'); // ignore prefixed properties, if it's not a PK

  return visible && !prefixed;
}

function isPopulated(propName: string, options: SerializeOptions<any, any, any>): boolean {
  if (typeof options.populate !== 'boolean' && (options.populate as string[])?.find(item => item === propName || item.startsWith(propName + '.') || item === '*')) {
    return true;
  }

  if (typeof options.populate === 'boolean') {
    return options.populate;
  }

  return false;
}

export class EntitySerializer {

  static serialize<T extends object, P extends string = never, E extends string = never>(entity: T, options: SerializeOptions<T, P, E> = {}): EntityDTO<Loaded<T, P>> {
    const wrapped = helper(entity);
    const meta = wrapped.__meta;
    let contextCreated = false;

    if (!wrapped.__serializationContext.root) {
      const root = new SerializationContext<T>(wrapped.__config);
      SerializationContext.propagate(root, entity, (meta, prop) => meta.properties[prop]?.kind !== ReferenceKind.SCALAR);
      options.populate = (options.populate ? Utils.asArray(options.populate) : options.populate) as any;
      contextCreated = true;
    }

    const root = wrapped.__serializationContext.root!;
    const ret = {} as Dictionary;
    const keys = new Set<EntityKey<T>>(meta.primaryKeys);
    Utils.keys(entity as object).forEach(prop => keys.add(prop));
    const visited = root.visited.has(entity);

    if (!visited) {
      root.visited.add(entity);
    }

    [...keys]
      .filter(prop => isVisible<T>(meta, prop, options))
      .map(prop => {
        const cycle = root.visit(meta.className, prop);

        if (cycle && visited) {
          return [prop, undefined];
        }

        const val = this.processProperty<T>(prop, entity, options);

        if (!cycle) {
          root.leave(meta.className, prop);
        }

        if (options.skipNull && Utils.isPlainObject(val)) {
          Utils.dropUndefinedProperties(val, null);
        }

        return [prop, val] as const;
      })
      .filter(([, value]) => typeof value !== 'undefined' && !(value === null && options.skipNull))
      .forEach(([prop, value]) => ret[this.propertyName(meta, prop!, wrapped.__platform)] = value as EntityDTOProp<EntityValue<T>>);

    if (contextCreated) {
      root.close();
    }

    if (!wrapped.isInitialized()) {
      return ret as EntityDTO<Loaded<T, P>>;
    }

    // decorated getters
    meta.props
      .filter(prop => prop.getter && prop.getterName === undefined && typeof entity[prop.name] !== 'undefined' && isVisible(meta, prop.name, options))
      // @ts-ignore
      .forEach(prop => ret[this.propertyName(meta, prop.name, wrapped.__platform)] = this.processProperty(prop.name, entity, options));

    // decorated get methods
    meta.props
      .filter(prop => prop.getterName && entity[prop.getterName] as unknown instanceof Function && isVisible(meta, prop.name, options))
      // @ts-ignore
      .forEach(prop => ret[this.propertyName(meta, prop.name, wrapped.__platform)] = this.processProperty(prop.getterName as keyof T & string, entity, options));

    return ret as EntityDTO<Loaded<T, P>>;
  }

  private static propertyName<T>(meta: EntityMetadata<T>, prop: EntityKey<T>, platform?: Platform): EntityKey<T> {
    /* istanbul ignore next */
    if (meta.properties[prop]?.serializedName) {
      return meta.properties[prop].serializedName as EntityKey<T>;
    }

    if (meta.properties[prop]?.primary && platform) {
      return platform.getSerializedPrimaryKeyField(prop) as EntityKey<T>;
    }

    return prop;
  }

  private static processProperty<T extends object>(prop: EntityKey<T>, entity: T, options: SerializeOptions<T, any, any>): EntityValue<T> | undefined {
    const parts = prop.split('.');
    prop = parts[0] as EntityKey<T>;
    const wrapped = helper(entity);
    const property = wrapped.__meta.properties[prop];
    const serializer = property?.serializer;
    const value = entity[prop];

    // getter method
    if (entity[prop] as unknown instanceof Function) {
      const returnValue = (entity[prop] as unknown as () => T[keyof T & string])();
      if (!options.ignoreSerializers && serializer) {
        return serializer(returnValue);
      }

      return returnValue as EntityValue<T>;
    }

    /* istanbul ignore next */
    if (!options.ignoreSerializers && serializer) {
      return serializer(value);
    }

    if (Utils.isCollection(value)) {
      return this.processCollection(prop, entity, options);
    }

    if (Utils.isEntity(value, true)) {
      return this.processEntity(prop, entity, wrapped.__platform, options);
    }

    if (Utils.isScalarReference(value)) {
      return value.unwrap();
    }

    /* istanbul ignore next */
    if (property?.kind === ReferenceKind.EMBEDDED) {
      if (Array.isArray(value)) {
        return (value as object[]).map(item => helper(item).toJSON()) as EntityValue<T>;
      }

      if (Utils.isObject(value)) {
        return helper(value!).toJSON() as EntityValue<T>;
      }
    }

    const customType = property?.customType;

    if (customType) {
      return customType.toJSON(value, wrapped.__platform);
    }

    return wrapped.__platform.normalizePrimaryKey(value as unknown as IPrimaryKey) as unknown as EntityValue<T>;
  }

  private static extractChildOptions<T extends object, U extends object>(options: SerializeOptions<T, any, any>, prop: EntityKey<T>): SerializeOptions<U, any> {
    const extractChildElements = (items: string[], allSymbol?: string) => {
      return items
        .filter(field => field === allSymbol || field.startsWith(`${prop}.`))
        .map(field => field === allSymbol ? allSymbol : field.substring(prop.length + 1));
    };

    return {
      ...options,
      populate: Array.isArray(options.populate) ? extractChildElements(options.populate, '*') : options.populate,
      exclude: Array.isArray(options.exclude) ? extractChildElements(options.exclude) : options.exclude,
    } as SerializeOptions<U, any>;
  }

  private static processEntity<T extends object>(prop: EntityKey<T>, entity: T, platform: Platform, options: SerializeOptions<T, any, any>): EntityValue<T> | undefined {
    const child = Reference.unwrapReference(entity[prop] as T);
    const wrapped = helper(child);
    const populated = isPopulated(prop, options) && wrapped.isInitialized();
    const expand = populated || !wrapped.__managed;

    if (expand) {
      return this.serialize(child, this.extractChildOptions(options, prop)) as EntityValue<T>;
    }

    if (options.forceObject || wrapped.__config.get('serialization').forceObject) {
      return Utils.primaryKeyToObject(wrapped.__meta, wrapped.getPrimaryKey(true)!) as EntityValue<T>;
    }

    return platform.normalizePrimaryKey(wrapped.getPrimaryKey() as IPrimaryKey) as EntityValue<T>;
  }

  private static processCollection<T extends object>(prop: EntityKey<T>, entity: T, options: SerializeOptions<T, any, any>): EntityValue<T> | undefined {
    const col = entity[prop] as unknown as Collection<T>;

    if (!col.isInitialized()) {
      return undefined;
    }

    return col.getItems(false).map(item => {
      const populated = isPopulated(prop, options);
      const wrapped = helper(item);

      if (populated || !wrapped.__managed) {
        return this.serialize(item, this.extractChildOptions(options, prop));
      }

      if (options.forceObject || wrapped.__config.get('serialization').forceObject) {
        return Utils.primaryKeyToObject(wrapped.__meta, wrapped.getPrimaryKey(true)!) as EntityValue<T>;
      }

      return helper(item).getPrimaryKey();
    }) as unknown as EntityValue<T>;
  }

}

export interface SerializeOptions<T, P extends string = never, E extends string = never> {
  /** Specify which relation should be serialized as populated and which as a FK. */
  populate?: readonly AutoPath<T, P, '*'>[];

  /** Specify which properties should be omitted. */
  exclude?: readonly AutoPath<T, E>[];

  /** Enforce unpopulated references to be returned as objects, e.g. `{ author: { id: 1 } }` instead of `{ author: 1 }`. */
  forceObject?: boolean;

  /** Ignore custom property serializers. */
  ignoreSerializers?: boolean;

  /** Skip properties with `null` value. */
  skipNull?: boolean;
}
/**
 * Converts entity instance to POJO, converting the `Collection`s to arrays and unwrapping the `Reference` wrapper, while respecting the serialization options.
 * This method accepts either a single entity or an array of entities, and returns the corresponding POJO or an array of POJO.
 * To serialize single entity, you can also use `wrap(entity).serialize()` which handles a single entity only.
 *
 * ```ts
 * const dtos = serialize([user1, user, ...], { exclude: ['id', 'email'], forceObject: true });
 * const [dto2, dto3] = serialize([user2, user3], { exclude: ['id', 'email'], forceObject: true });
 * const dto1 = serialize(user, { exclude: ['id', 'email'], forceObject: true });
 * const dto2 = wrap(user).serialize({ exclude: ['id', 'email'], forceObject: true });
 * ```
 */
export function serialize<
  Entity extends object,
  Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
  Populate extends string = never,
  Exclude extends string = never,
>(entity: Entity, options?: SerializeOptions<Entity extends object[] ? ArrayElement<Entity> : Entity, Populate, Exclude>): Naked extends object[] ? EntityDTO<Loaded<ArrayElement<Naked>, Populate>>[] : EntityDTO<Loaded<Naked, Populate>>;

/**
 * Converts entity instance to POJO, converting the `Collection`s to arrays and unwrapping the `Reference` wrapper, while respecting the serialization options.
 * This method accepts either a single entity or an array of entities, and returns the corresponding POJO or an array of POJO.
 * To serialize single entity, you can also use `wrap(entity).serialize()` which handles a single entity only.
 *
 * ```ts
 * const dtos = serialize([user1, user, ...], { exclude: ['id', 'email'], forceObject: true });
 * const [dto2, dto3] = serialize([user2, user3], { exclude: ['id', 'email'], forceObject: true });
 * const dto1 = serialize(user, { exclude: ['id', 'email'], forceObject: true });
 * const dto2 = wrap(user).serialize({ exclude: ['id', 'email'], forceObject: true });
 * ```
 */
export function serialize<
  Entity extends object,
  Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
  Populate extends string = never,
  Exclude extends string = never,
>(entities: Entity | Entity[], options?: SerializeOptions<Entity, Populate, Exclude>): EntityDTO<Loaded<Naked, Populate>> | EntityDTO<Loaded<Naked, Populate>>[] {
  if (Array.isArray(entities)) {
    return entities.map(e => EntitySerializer.serialize(e, options)) as any;
  }

  return EntitySerializer.serialize(entities, options) as any;
}
