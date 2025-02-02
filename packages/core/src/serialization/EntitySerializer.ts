import type { Collection } from '../entity/Collection';
import type {
  ArrayElement,
  AutoPath,
  CleanTypeConfig,
  Dictionary,
  EntityDTO,
  EntityDTOProp,
  EntityKey,
  EntityMetadata,
  EntityProperty,
  EntityValue,
  FromEntityType,
  IPrimaryKey,
  Loaded,
  TypeConfig,
  UnboxArray,
} from '../typings';
import { helper } from '../entity/wrap';
import type { Platform } from '../platforms';
import { Utils } from '../utils/Utils';
import { type PopulatePath, ReferenceKind } from '../enums';
import { Reference } from '../entity/Reference';
import { SerializationContext } from './SerializationContext';
import { isRaw } from '../utils/RawQueryFragment';

function isVisible<T extends object>(meta: EntityMetadata<T>, propName: EntityKey<T>, options: SerializeOptions<T, any, any>): boolean {
  const prop = meta.properties[propName];

  if (options.groups && prop?.groups) {
     return prop.groups.some(g => options.groups!.includes(g));
  }

  if (Array.isArray(options.populate) && options.populate?.find(item => item === propName || item.startsWith(propName + '.') || item === '*')) {
    return true;
  }

  if (options.exclude?.find(item => item === propName)) {
    return false;
  }

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

    for (const prop of keys) {
      if (!isVisible<T>(meta, prop, options)) {
        continue;
      }

      const cycle = root.visit(meta.className, prop);

      if (cycle && visited) {
        continue;
      }

      const val = this.processProperty<T>(prop, entity, options);

      if (!cycle) {
        root.leave(meta.className, prop);
      }

      if (options.skipNull && Utils.isPlainObject(val)) {
        Utils.dropUndefinedProperties(val, null);
      }

      if (isRaw(val)) {
        throw new Error(`Trying to serialize raw SQL fragment: '${val.sql}'`);
      }

      const visible = typeof val !== 'undefined' && !(val === null && options.skipNull);

      if (visible) {
        ret[this.propertyName(meta, prop!, wrapped.__platform)] = val as EntityDTOProp<T, EntityValue<T>>;
      }
    }

    if (contextCreated) {
      root.close();
    }

    if (!wrapped.isInitialized()) {
      return ret as EntityDTO<Loaded<T, P>>;
    }

    for (const prop of meta.getterProps) {
      // decorated get methods
      if (prop.getterName != null) {
        const visible = entity[prop.getterName] as unknown instanceof Function && isVisible(meta, prop.name, options);

        if (visible) {
          ret[this.propertyName(meta, prop.name, wrapped.__platform)] = this.processProperty(prop.getterName as EntityKey, entity, options);
        }
      } else {
        // decorated getters
        const visible = typeof entity[prop.name] !== 'undefined' && isVisible(meta, prop.name, options);

        if (visible) {
          ret[this.propertyName(meta, prop.name, wrapped.__platform) as any] = this.processProperty(prop.name, entity, options);
        }
      }
    }

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
    const property = wrapped.__meta.properties[prop] ?? { name: prop };
    const serializer = property?.serializer;
    const value = entity[prop];

    // getter method
    if (entity[prop] as unknown instanceof Function) {
      const returnValue = (entity[prop] as unknown as () => T[keyof T & string])();
      if (!options.ignoreSerializers && serializer) {
        return serializer(returnValue, this.extractChildOptions(options, prop));
      }

      return returnValue as EntityValue<T>;
    }

    /* istanbul ignore next */
    if (!options.ignoreSerializers && serializer) {
      return serializer(value);
    }

    if (Utils.isCollection(value)) {
      return this.processCollection(property, entity, options);
    }

    if (Utils.isEntity(value, true)) {
      return this.processEntity(property, entity, wrapped.__platform, options);
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

  private static extractChildOptions<T extends object, U extends object>(options: SerializeOptions<T, any, any>, prop: EntityKey<T>): SerializeOptions<U> {
    return {
      ...options,
      populate: Array.isArray(options.populate) ? Utils.extractChildElements(options.populate, prop, '*') : options.populate,
      exclude: Array.isArray(options.exclude) ? Utils.extractChildElements(options.exclude, prop) : options.exclude,
    } as SerializeOptions<U>;
  }

  private static processEntity<T extends object>(prop: EntityProperty<T>, entity: T, platform: Platform, options: SerializeOptions<T, any, any>): EntityValue<T> | undefined {
    const child = Reference.unwrapReference(entity[prop.name] as T);
    const wrapped = helper(child);
    const populated = isPopulated(prop.name, options) && wrapped.isInitialized();
    const expand = populated || !wrapped.__managed;
    const meta = wrapped.__meta;
    const childOptions = this.extractChildOptions(options, prop.name) as Dictionary;
    const visible = meta.primaryKeys.filter(prop => isVisible(meta, prop, childOptions));

    if (expand) {
      return this.serialize(child, childOptions) as EntityValue<T>;
    }

    let pk = wrapped.getPrimaryKey()!;

    if (prop.customType) {
      pk = prop.customType.toJSON(pk, wrapped.__platform);
    }

    if (options.forceObject || wrapped.__config.get('serialization').forceObject) {
      return Utils.primaryKeyToObject(meta, pk, visible) as EntityValue<T>;
    }

    if (Utils.isPlainObject(pk)) {
      const pruned = Utils.primaryKeyToObject(meta, pk, visible) as EntityValue<T>;

      if (visible.length === 1) {
        return platform.normalizePrimaryKey(pruned[visible[0] as keyof typeof pruned] as IPrimaryKey) as EntityValue<T>;
      }

      return pruned;
    }

    return platform.normalizePrimaryKey(pk as IPrimaryKey) as EntityValue<T>;
  }

  private static processCollection<T extends object>(prop: EntityProperty<T>, entity: T, options: SerializeOptions<T, any, any>): EntityValue<T> | undefined {
    const col = entity[prop.name] as Collection<T>;

    if (!col.isInitialized()) {
      return undefined;
    }

    return col.getItems(false).map(item => {
      const populated = isPopulated(prop.name, options);
      const wrapped = helper(item);

      if (populated || !wrapped.__managed) {
        return this.serialize(item, this.extractChildOptions(options, prop.name));
      }

      let pk = wrapped.getPrimaryKey()!;

      if (prop.customType) {
        pk = prop.customType.toJSON(pk, wrapped.__platform);
      }

      if (options.forceObject || wrapped.__config.get('serialization').forceObject) {
        return Utils.primaryKeyToObject(wrapped.__meta, pk) as EntityValue<T>;
      }

      return pk;
    }) as unknown as EntityValue<T>;
  }

}

export interface SerializeOptions<T, P extends string = never, E extends string = never> {
  /** Specify which relation should be serialized as populated and which as a FK. */
  populate?: readonly AutoPath<T, P, `${PopulatePath.ALL}`>[];

  /** Specify which properties should be omitted. */
  exclude?: readonly AutoPath<T, E>[];

  /** Enforce unpopulated references to be returned as objects, e.g. `{ author: { id: 1 } }` instead of `{ author: 1 }`. */
  forceObject?: boolean;

  /** Ignore custom property serializers. */
  ignoreSerializers?: boolean;

  /** Skip properties with `null` value. */
  skipNull?: boolean;

  /** Only include properties for a specific group. If a property does not specify any group, it will be included, otherwise only properties with a matching group are included. */
  groups?: string[];
}

/**
 * Converts entity instance to POJO, converting the `Collection`s to arrays and unwrapping the `Reference` wrapper, while respecting the serialization options.
 * This method accepts either a single entity or an array of entities, and returns the corresponding POJO or an array of POJO.
 * To serialize a single entity, you can also use `wrap(entity).serialize()` which handles a single entity only.
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
  Config extends TypeConfig = never,
>(entity: Entity, options?: Config & SerializeOptions<UnboxArray<Entity>, Populate, Exclude>): Naked extends object[] ? EntityDTO<Loaded<ArrayElement<Naked>, Populate>, CleanTypeConfig<Config>>[] : EntityDTO<Loaded<Naked, Populate>, CleanTypeConfig<Config>>;

/**
 * Converts entity instance to POJO, converting the `Collection`s to arrays and unwrapping the `Reference` wrapper, while respecting the serialization options.
 * This method accepts either a single entity or an array of entities, and returns the corresponding POJO or an array of POJO.
 * To serialize a single entity, you can also use `wrap(entity).serialize()` which handles a single entity only.
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
  Config extends TypeConfig = never,
>(entities: Entity | Entity[], options?: SerializeOptions<Entity, Populate, Exclude>): EntityDTO<Loaded<Naked, Populate>, CleanTypeConfig<Config>> | EntityDTO<Loaded<Naked, Populate>, CleanTypeConfig<Config>>[] {
  if (Array.isArray(entities)) {
    return entities.map(e => EntitySerializer.serialize(e, options)) as any;
  }

  return EntitySerializer.serialize(entities, options) as any;
}
