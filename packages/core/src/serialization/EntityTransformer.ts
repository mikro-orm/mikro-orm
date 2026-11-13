import type { Collection } from '../entity/Collection.js';
import type {
  AnyEntity,
  Dictionary,
  EntityDTO,
  EntityKey,
  EntityMetadata,
  EntityProperty,
  EntityValue,
  IPrimaryKey,
} from '../typings.js';
import { helper, wrap } from '../entity/wrap.js';
import type { Platform } from '../platforms/Platform.js';
import { Utils } from '../utils/Utils.js';
import { ReferenceKind } from '../enums.js';
import type { Reference } from '../entity/Reference.js';
import { SerializationContext } from './SerializationContext.js';
import { isRaw } from '../utils/RawQueryFragment.js';

function isPropertyVisible<Entity>(prop: EntityProperty<Entity>): boolean {
  const prefixed = !prop.primary && !prop.accessor && prop.name.startsWith('_'); // ignore prefixed properties, if it's not a PK
  return !prop.hidden && !prefixed;
}

interface PlanEntry<Entity> {
  prop: EntityProperty<Entity>;
  visible: boolean;
  key: string;
  /** scalar without getter or serializer, so a primitive or `Date` value can skip the relation and embeddable checks */
  scalar: boolean;
}

/** Per-entity-type part of `toObject()` that does not depend on the entity instance or the serialization context. */
interface SerializationPlan<Entity> {
  /** `meta.props` the plan was built from, `meta.sync()` replaces it */
  source: EntityProperty<Entity>[];
  pks: PlanEntry<Entity>[];
  rest: PlanEntry<Entity>[];
  visible: Set<string>;
}

const plans = new WeakMap<EntityMetadata<any>, SerializationPlan<any>>();

function getPlan<Entity>(meta: EntityMetadata<Entity>): SerializationPlan<Entity> {
  const cached = plans.get(meta);

  if (cached?.source === meta.props) {
    return cached;
  }

  const pkNames = meta.serializedPrimaryKey && !meta.compositePK ? [meta.serializedPrimaryKey] : meta.primaryKeys;
  const entry = (prop: EntityProperty<Entity>): PlanEntry<Entity> => ({
    prop,
    visible: isPropertyVisible(prop),
    key: prop.serializedName || (prop.primary && meta.serializedPrimaryKey ? meta.serializedPrimaryKey : prop.name),
    scalar: prop.kind === ReferenceKind.SCALAR && !prop.serializer && !prop.getter && !prop.accessor,
  });
  const plan: SerializationPlan<Entity> = {
    source: meta.props,
    pks: pkNames.filter(pk => meta.properties[pk]).map(pk => entry(meta.properties[pk])),
    rest: meta.props.filter(prop => !pkNames.includes(prop.name)).map(entry),
    visible: new Set(meta.props.filter(prop => isPropertyVisible(prop)).map(prop => prop.name)),
  };
  plans.set(meta, plan);

  return plan;
}

function isVisible<Entity extends object>(meta: EntityMetadata<Entity>, propName: EntityKey<Entity>): boolean {
  return getPlan(meta).visible.has(propName);
}

function isPlainValue(value: unknown): boolean {
  return value == null || (typeof value !== 'object' && typeof value !== 'function') || value instanceof Date;
}

/** Converts entity instances to plain objects via `toObject()`, respecting populate hints, hidden fields, and serialization context. */
export class EntityTransformer {
  /** Converts an entity to a plain object, respecting populate hints, hidden fields, and custom serializers. */
  static toObject<Entity extends object, Ignored extends EntityKey<Entity> = never>(
    entity: Entity,
    ignoreFields: Ignored[] = [],
    raw = false,
  ): Omit<EntityDTO<Entity>, Ignored> {
    if (!Array.isArray(ignoreFields)) {
      ignoreFields = [];
    }

    const wrapped = helper(entity);
    let contextCreated = false;

    if (!wrapped) {
      return entity as EntityDTO<Entity>;
    }

    let root = wrapped.__serializationContext.root;

    if (!root) {
      root = new SerializationContext<Entity>(
        wrapped.__serializationContext.populate,
        wrapped.__serializationContext.fields,
        wrapped.__serializationContext.exclude,
      );
      contextCreated = true;
    }

    try {
      SerializationContext.propagate(root, entity, isVisible);
      const meta = wrapped.__meta;
      const ret = {} as Dictionary;
      const plan = getPlan(meta);
      const pkCount = plan.pks.length;
      // own keys that are not entity properties are never visible, so only the metadata properties are collected
      const total = wrapped.isInitialized() || !wrapped.hasPrimaryKey() ? pkCount + plan.rest.length : pkCount;
      const visited = root.visited.has(entity);
      const includePrimaryKeys = wrapped.__config.get('serialization').includePrimaryKeys;
      const checkIgnored = ignoreFields.length > 0;

      if (!visited) {
        root.visited.add(entity);
      }

      for (let i = 0; i < total; i++) {
        const entry = i < pkCount ? plan.pks[i] : plan.rest[i - pkCount];
        const property = entry.prop;
        const prop = property.name;

        if (
          i >= pkCount &&
          !Object.prototype.propertyIsEnumerable.call(entity, prop) &&
          !(property.getter && property.accessor === prop)
        ) {
          continue;
        }

        if (!raw && (!entry.visible || (checkIgnored && ignoreFields.includes(prop as Ignored)))) {
          continue;
        }

        const populated = root.isMarkedAsPopulated(meta.class, prop);

        if (!raw) {
          const partiallyLoaded = root.isPartiallyLoaded(meta.class, prop);
          const isPrimary = includePrimaryKeys && property.primary;

          if (!partiallyLoaded && !populated && !isPrimary) {
            continue;
          }

          if (root.isExcluded(meta.class, prop) && !populated) {
            continue;
          }
        }

        const cycle = root.visit(meta.class, prop);

        if (cycle && visited) {
          continue;
        }

        let val: EntityValue<Entity> | undefined;

        try {
          const value = entry.scalar ? entity[prop] : undefined;

          if (entry.scalar && isPlainValue(value)) {
            val = EntityTransformer.processScalar(property, value, wrapped.__platform);
          } else {
            val = EntityTransformer.processProperty<Entity>(prop, entity, raw, populated);
          }
        } finally {
          if (!cycle) {
            root.leave(meta.class, prop);
          }
        }

        if (isRaw(val)) {
          throw new Error(`Trying to serialize raw SQL fragment: '${val.sql}'`);
        }

        if (typeof val === 'undefined') {
          continue;
        }

        ret[raw ? prop : entry.key] = val;
      }

      if (!wrapped.isInitialized() && wrapped.hasPrimaryKey()) {
        return ret as EntityDTO<Entity>;
      }

      for (const prop of meta.getterProps) {
        // decorated get methods
        if (prop.getterName != null) {
          const visible = !prop.hidden && entity[prop.getterName] instanceof Function;
          const populated = root.isMarkedAsPopulated(meta.class, prop.name);

          if (visible) {
            ret[this.propertyName(meta, prop, raw)] = this.processProperty(
              prop.getterName as EntityKey,
              entity,
              raw,
              populated,
            );
          }
        } else {
          // decorated getters
          const visible = !prop.hidden && typeof entity[prop.name] !== 'undefined';
          const populated = root.isMarkedAsPopulated(meta.class, prop.name);

          if (visible) {
            ret[this.propertyName(meta, prop, raw)] = this.processProperty(prop.name, entity, raw, populated);
          }
        }
      }

      return ret as EntityDTO<Entity>;
    } finally {
      if (contextCreated) {
        root.close();
      }
    }
  }

  private static propertyName<Entity>(
    meta: EntityMetadata<Entity>,
    prop: EntityProperty<Entity>,
    raw?: boolean,
  ): EntityKey<Entity> {
    if (raw) {
      return prop.name;
    }

    if (prop.serializedName) {
      return prop.serializedName as EntityKey<Entity>;
    }

    if (prop.primary && meta.serializedPrimaryKey) {
      return meta.serializedPrimaryKey;
    }

    return prop.name;
  }

  private static processScalar<Entity>(
    prop: EntityProperty<Entity>,
    value: unknown,
    platform: Platform,
  ): EntityValue<Entity> | undefined {
    if (prop.customType) {
      return prop.customType.toJSON(value, platform);
    }

    if (prop.primary) {
      return platform.normalizePrimaryKey(value as IPrimaryKey) as EntityValue<Entity>;
    }

    return value as EntityValue<Entity>;
  }

  private static processProperty<Entity extends object>(
    prop: EntityKey<Entity>,
    entity: Entity,
    raw: boolean,
    populated: boolean,
  ): EntityValue<Entity> | undefined {
    const wrapped = helper(entity);
    const property = wrapped.__meta.properties[prop] ?? { name: prop };
    const serializer = property?.serializer;
    const value = entity[prop];

    // getter method
    if ((entity[prop] as unknown) instanceof Function) {
      const returnValue = (entity[prop] as unknown as () => Entity[keyof Entity & string])();
      if (serializer && !raw) {
        return serializer(returnValue);
      }

      return returnValue as EntityValue<Entity>;
    }

    if (serializer && !raw) {
      return serializer(value);
    }

    if (Utils.isCollection(value)) {
      return EntityTransformer.processCollection(property, entity, raw, populated);
    }

    if (Utils.isEntity(value, true)) {
      return EntityTransformer.processEntity(
        property,
        entity,
        wrapped.__platform,
        raw,
        populated,
      ) as EntityValue<Entity>;
    }

    if (Utils.isScalarReference(value)) {
      return value.unwrap();
    }

    if (property.kind === ReferenceKind.EMBEDDED) {
      if (Array.isArray(value)) {
        return (value as object[]).map(item => {
          const wrapped = item && helper(item);
          return wrapped ? wrapped.toJSON() : item;
        }) as EntityValue<Entity>;
      }

      const wrapped = value && helper(value);
      return wrapped ? (wrapped.toJSON() as EntityValue<Entity>) : value;
    }

    const customType = property?.customType;

    if (customType) {
      return customType.toJSON(value, wrapped.__platform);
    }

    if (property?.primary) {
      return wrapped.__platform.normalizePrimaryKey(value as unknown as IPrimaryKey) as unknown as EntityValue<Entity>;
    }

    return value;
  }

  private static processEntity<Entity extends object>(
    prop: EntityProperty<Entity>,
    entity: Entity,
    platform: Platform,
    raw: boolean,
    populated: boolean,
  ): EntityValue<Entity> | undefined {
    const child = entity[prop.name] as Entity | Reference<Entity>;
    const wrapped = helper(child as Entity);
    const meta = wrapped.__meta;
    const visible = meta.primaryKeys.filter(prop => isVisible(meta, prop));

    if (raw && wrapped.isInitialized() && child !== entity) {
      return wrapped.toPOJO() as unknown as EntityValue<Entity>;
    }

    function isPopulated() {
      if (wrapped.__populated != null) {
        return wrapped.__populated;
      }

      if (populated) {
        return true;
      }

      return !wrapped.__managed;
    }

    if (wrapped.isInitialized() && isPopulated() && child !== entity) {
      return wrap(child).toJSON() as EntityValue<Entity>;
    }

    let pk = wrapped.getPrimaryKey()!;

    if (prop.customType) {
      pk = prop.customType.toJSON(pk, wrapped.__platform);
    }

    if (wrapped.__config.get('serialization').forceObject) {
      return Utils.primaryKeyToObject(meta, pk, visible) as EntityValue<Entity>;
    }

    if (Utils.isPlainObject(pk)) {
      const pruned = Utils.primaryKeyToObject(meta, pk, visible) as EntityValue<Entity>;

      if (visible.length === 1) {
        return platform.normalizePrimaryKey(
          pruned[visible[0] as keyof typeof pruned] as IPrimaryKey,
        ) as EntityValue<Entity>;
      }

      return pruned;
    }

    return platform.normalizePrimaryKey(pk as IPrimaryKey) as EntityValue<Entity>;
  }

  private static processCollection<Entity extends object>(
    prop: EntityProperty<Entity>,
    entity: Entity,
    raw: boolean,
    populated: boolean,
  ): EntityValue<Entity> | undefined {
    const col = entity[prop.name] as Collection<AnyEntity>;

    if (raw && col.isInitialized(true)) {
      return col.map(item => helper(item).toPOJO()) as EntityValue<Entity>;
    }

    if (col.shouldPopulate(populated)) {
      return col.toArray() as EntityValue<Entity>;
    }

    if (col.isInitialized()) {
      const wrapped = helper(entity);
      const forceObject = wrapped.__config.get('serialization').forceObject;

      return col.map(item => {
        const wrapped = helper(item);
        const pk = wrapped.getPrimaryKey()!;

        if (prop.customType) {
          return prop.customType.toJSON(pk, wrapped.__platform);
        }

        if (forceObject) {
          return Utils.primaryKeyToObject(wrapped.__meta, pk) as EntityValue<Entity>;
        }

        return pk;
      }) as EntityValue<Entity>;
    }

    return undefined;
  }
}
