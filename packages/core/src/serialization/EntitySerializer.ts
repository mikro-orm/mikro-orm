import type { Collection } from '../entity/Collection.js';
import type {
  ArrayElement,
  AutoPath,
  CleanTypeConfig,
  Dictionary,
  EntityDTOProp,
  ExtractFieldsHint,
  FromEntityType,
  ResolveSerializeFields,
  SerializeDTO,
  SerializeFieldsKeepPK,
  EntityKey,
  EntityMetadata,
  EntityProperty,
  EntityValue,
  IPrimaryKey,
  TypeConfig,
  UnboxArray,
} from '../typings.js';
import { helper } from '../entity/wrap.js';
import type { Platform } from '../platforms/Platform.js';
import { Utils } from '../utils/Utils.js';
import { type PopulatePath, ReferenceKind } from '../enums.js';
import { Reference } from '../entity/Reference.js';
import { SerializationContext } from './SerializationContext.js';
import { isRaw } from '../utils/RawQueryFragment.js';

/** Returns true when any entry in `items` is `propName`, the wildcard `*`, or a dot-path under `propName`. */
function matchesPath(items: readonly string[], propName: string): boolean {
  return items.some(item => item === propName || item === '*' || item.startsWith(propName + '.'));
}

function isVisible<T extends object>(
  meta: EntityMetadata<T>,
  propName: EntityKey<T>,
  options: SerializeOptions<T, any, any, any>,
): boolean {
  const prop = meta.properties[propName];

  if (options.groups && prop?.groups) {
    return prop.groups.some(g => options.groups!.includes(g));
  }

  if (Array.isArray(options.fields) && options.fields.length > 0 && !matchesPath(options.fields, propName)) {
    return false;
  }

  if (
    Array.isArray(options.populate) &&
    options.populate.find(item => item === propName || item.startsWith(propName + '.'))
  ) {
    return true;
  }

  if (options.exclude?.find(item => item === propName)) {
    return false;
  }

  const visible = prop && !(prop.hidden && !options.includeHidden);
  const prefixed = prop && !prop.primary && !prop.accessor && propName.startsWith('_'); // ignore prefixed properties, if it's not a PK

  return visible && !prefixed;
}

function isPopulated(propName: string, options: SerializeOptions<any, any, any, any>): boolean {
  if (
    typeof options.populate !== 'boolean' &&
    Array.isArray(options.populate) &&
    matchesPath(options.populate, propName)
  ) {
    return true;
  }

  if (typeof options.populate === 'boolean') {
    return options.populate;
  }

  return false;
}

/** Converts entity instances to plain DTOs via `serialize()`, with fine-grained control over populate, exclude, fields, and serialization groups. */
export class EntitySerializer {
  /** Serializes an entity to a plain DTO, with fine-grained control over population, exclusion, fields, groups, and custom types. */
  static serialize<T extends object, P extends string = never, E extends string = never, F extends string = never>(
    entity: T,
    options: SerializeOptions<T, P, E, F> = {},
  ): SerializeDTO<T, P, E, never, ResolveSerializeFields<F>, SerializeFieldsKeepPK<F>> {
    const wrapped = helper(entity);
    const meta = wrapped.__meta;
    let contextCreated = false;

    if (!wrapped.__serializationContext.root) {
      const root = new SerializationContext<T>();
      SerializationContext.propagate(
        root,
        entity,
        (meta, prop) => meta.properties[prop]?.kind !== ReferenceKind.SCALAR,
      );
      options.populate = (options.populate ? Utils.asArray(options.populate) : options.populate) as any;
      contextCreated = true;
    }

    const root = wrapped.__serializationContext.root!;
    const ret = {} as Dictionary;
    const props = new Set<EntityKey<T>>();

    if (meta.serializedPrimaryKey && !meta.compositePK) {
      props.add(meta.serializedPrimaryKey);
    } else {
      meta.primaryKeys.forEach(pk => props.add(pk));
    }

    if (wrapped.isInitialized() || !wrapped.hasPrimaryKey()) {
      const entityKeys = new Set(Object.keys(entity) as EntityKey<T>[]);

      for (const prop of meta.props) {
        if (entityKeys.has(prop.name) || (prop.getter && prop.accessor === prop.name)) {
          props.add(prop.name);
        }
      }

      for (const key of entityKeys) {
        if (!meta.properties[key as EntityKey]) {
          props.add(key);
        }
      }
    }

    const visited = root.visited.has(entity);

    if (!visited) {
      root.visited.add(entity);
    }

    for (const prop of props) {
      if (!isVisible<T>(meta, prop, options)) {
        continue;
      }

      const cycle = root.visit(meta.class, prop);

      if (cycle && visited) {
        continue;
      }

      const val = this.processProperty<T>(prop, entity, options);

      if (!cycle) {
        root.leave(meta.class, prop);
      }

      if (options.skipNull && Utils.isPlainObject(val)) {
        Utils.dropUndefinedProperties(val, null);
      }

      if (isRaw(val)) {
        throw new Error(`Trying to serialize raw SQL fragment: '${val.sql}'`);
      }

      const visible = typeof val !== 'undefined' && !(val === null && options.skipNull);

      if (visible) {
        ret[this.propertyName(meta, prop)] = val as EntityDTOProp<T, EntityValue<T>>;
      }
    }

    if (contextCreated) {
      root.close();
    }

    if (!wrapped.isInitialized()) {
      return ret as SerializeDTO<T, P, E, never, ResolveSerializeFields<F>, SerializeFieldsKeepPK<F>>;
    }

    for (const prop of meta.getterProps) {
      // decorated get methods
      if (prop.getterName != null) {
        const visible = (entity[prop.getterName] as unknown) instanceof Function && isVisible(meta, prop.name, options);

        if (visible) {
          ret[this.propertyName(meta, prop.name)] = this.processProperty(prop.getterName as EntityKey, entity, options);
        }
      } else {
        // decorated getters
        const visible = typeof entity[prop.name] !== 'undefined' && isVisible(meta, prop.name, options);

        if (visible) {
          ret[this.propertyName(meta, prop.name) as any] = this.processProperty(prop.name, entity, options);
        }
      }
    }

    return ret as SerializeDTO<T, P, E, never, ResolveSerializeFields<F>, SerializeFieldsKeepPK<F>>;
  }

  private static propertyName<T>(meta: EntityMetadata<T>, prop: EntityKey<T>): EntityKey<T> {
    /* v8 ignore next */
    if (meta.properties[prop]?.serializedName) {
      return meta.properties[prop].serializedName as EntityKey<T>;
    }

    if (meta.properties[prop]?.primary && meta.serializedPrimaryKey) {
      return meta.serializedPrimaryKey;
    }

    return prop;
  }

  private static processProperty<T extends object>(
    prop: EntityKey<T>,
    entity: T,
    options: SerializeOptions<T, any, any, any>,
  ): EntityValue<T> | undefined {
    const parts = prop.split('.');
    prop = parts[0] as EntityKey<T>;
    const wrapped = helper(entity);
    const property = wrapped.__meta.properties[prop] ?? { name: prop };
    const serializer = property?.serializer;
    const value = entity[prop];

    // getter method
    if ((entity[prop] as unknown) instanceof Function) {
      const returnValue = (entity[prop] as unknown as () => T[keyof T & string])();
      if (!options.ignoreSerializers && serializer) {
        return serializer(returnValue, this.extractChildOptions(options, prop));
      }

      return returnValue as EntityValue<T>;
    }

    /* v8 ignore next */
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

    /* v8 ignore next */
    if (property?.kind === ReferenceKind.EMBEDDED) {
      if (Array.isArray(value)) {
        return (value as object[]).map(item => helper(item).toJSON()) as EntityValue<T>;
      }

      if (Utils.isObject(value)) {
        return helper(value).toJSON() as EntityValue<T>;
      }
    }

    if (property.customType) {
      return this.processCustomType(value, property, wrapped.__platform, options.convertCustomTypes);
    }

    return wrapped.__platform.normalizePrimaryKey(value as unknown as IPrimaryKey) as unknown as EntityValue<T>;
  }

  private static processCustomType<T, V>(
    value: V,
    prop: EntityProperty<T>,
    platform: Platform,
    convertCustomTypes?: boolean,
  ): V {
    if (!prop.customType) {
      return value;
    }

    if (convertCustomTypes) {
      return prop.customType.convertToDatabaseValue(value, platform, { mode: 'serialization' });
    }

    return prop.customType.toJSON(value, platform);
  }

  private static extractChildOptions<T extends object, U extends object>(
    options: SerializeOptions<T, any, any, any>,
    prop: EntityKey<T>,
  ): SerializeOptions<U> {
    return {
      ...options,
      populate: Array.isArray(options.populate)
        ? Utils.extractChildElements(options.populate, prop, '*')
        : options.populate,
      exclude: Array.isArray(options.exclude) ? Utils.extractChildElements(options.exclude, prop) : options.exclude,
      fields: Array.isArray(options.fields) ? this.extractChildFields(options.fields, prop) : options.fields,
    } as SerializeOptions<U>;
  }

  /**
   * Extracts the nested `fields` whitelist for a child property. A bare parent name (`fields: ['books']`) or a
   * wildcard removes the whitelist on the sub-tree (everything is included), so consumers don't have to repeat
   * every field of the child. Otherwise dot-paths are stripped of the parent prefix and passed down.
   */
  private static extractChildFields(fields: readonly string[], prop: string): readonly string[] | undefined {
    const out: string[] = [];
    const dotPrefix = prop + '.';

    for (const field of fields) {
      if (field === prop || field === '*') {
        return undefined;
      }

      if (field.startsWith(dotPrefix)) {
        out.push(field.substring(dotPrefix.length));
      }
    }

    return out;
  }

  private static processEntity<T extends object>(
    prop: EntityProperty<T>,
    entity: T,
    platform: Platform,
    options: SerializeOptions<T, any, any, any>,
  ): EntityValue<T> | undefined {
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

    const pk = this.processCustomType(wrapped.getPrimaryKey()!, prop, wrapped.__platform, options.convertCustomTypes);

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

  private static processCollection<T extends object>(
    prop: EntityProperty<T>,
    entity: T,
    options: SerializeOptions<T, any, any, any>,
  ): EntityValue<T> | undefined {
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

      const pk = this.processCustomType(wrapped.getPrimaryKey()!, prop, wrapped.__platform, options.convertCustomTypes);

      if (options.forceObject || wrapped.__config.get('serialization').forceObject) {
        return Utils.primaryKeyToObject(wrapped.__meta, pk) as EntityValue<T>;
      }

      return pk;
    }) as unknown as EntityValue<T>;
  }
}

export interface SerializeOptions<T, P extends string = never, E extends string = never, F extends string = never> {
  /** Specify which relation should be serialized as populated and which as a FK. */
  populate?: readonly AutoPath<T, P, `${PopulatePath.ALL}`>[];

  /** Specify which properties should be omitted. */
  exclude?: readonly AutoPath<T, E>[];

  /**
   * Whitelist of properties to serialize, supports dot-paths (e.g. `['name', 'books.title']`). When set, only the
   * listed properties end up in the output, including primary keys. A bare property name keeps its entire sub-tree;
   * a dot-path additionally narrows the nested object to the listed sub-keys. `exclude` takes precedence on conflict.
   */
  fields?: readonly AutoPath<T, F, `${PopulatePath.ALL}`>[];

  /** Enforce unpopulated references to be returned as objects, e.g. `{ author: { id: 1 } }` instead of `{ author: 1 }`. */
  forceObject?: boolean;

  /** Ignore custom property serializers. */
  ignoreSerializers?: boolean;

  /** Include properties marked as `hidden`. */
  includeHidden?: boolean;

  /** Skip properties with `null` value. */
  skipNull?: boolean;

  /** Only include properties for a specific group. If a property does not specify any group, it will be included, otherwise only properties with a matching group are included. */
  groups?: string[];

  /** Convert custom types to their database representation. By default, the `Type.toJSON` method is invoked instead. */
  convertCustomTypes?: boolean;
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
  Fields extends string = never,
  Config extends TypeConfig = never,
>(
  entity: Entity,
  options?: Config & SerializeOptions<UnboxArray<Entity>, Populate, Exclude, Fields>,
): Naked extends object[]
  ? SerializeDTO<
      ArrayElement<Naked>,
      Populate,
      Exclude,
      CleanTypeConfig<Config>,
      ResolveSerializeFields<Fields, ExtractFieldsHint<Entity>>,
      SerializeFieldsKeepPK<Fields>
    >[]
  : SerializeDTO<
      Naked,
      Populate,
      Exclude,
      CleanTypeConfig<Config>,
      ResolveSerializeFields<Fields, ExtractFieldsHint<Entity>>,
      SerializeFieldsKeepPK<Fields>
    >;

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
  Fields extends string = never,
  Config extends TypeConfig = never,
>(
  entities: Entity | Entity[],
  options?: SerializeOptions<Entity, Populate, Exclude, Fields>,
):
  | SerializeDTO<
      Naked,
      Populate,
      Exclude,
      CleanTypeConfig<Config>,
      ResolveSerializeFields<Fields, ExtractFieldsHint<Entity>>,
      SerializeFieldsKeepPK<Fields>
    >
  | SerializeDTO<
      Naked,
      Populate,
      Exclude,
      CleanTypeConfig<Config>,
      ResolveSerializeFields<Fields, ExtractFieldsHint<Entity>>,
      SerializeFieldsKeepPK<Fields>
    >[] {
  if (Array.isArray(entities)) {
    return entities.map(e => EntitySerializer.serialize(e, options)) as any;
  }

  return EntitySerializer.serialize(entities, options) as any;
}
