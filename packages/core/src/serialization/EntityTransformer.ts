import type { Collection } from '../entity/Collection';
import type {
  AnyEntity,
  Dictionary,
  EntityDTO,
  EntityKey,
  EntityMetadata,
  EntityProperty,
  EntityValue,
  IPrimaryKey,
} from '../typings';
import { helper, wrap } from '../entity/wrap';
import type { Platform } from '../platforms';
import { Utils } from '../utils/Utils';
import { ReferenceKind } from '../enums';
import type { Reference } from '../entity/Reference';
import { SerializationContext } from './SerializationContext';
import { isRaw } from '../utils/RawQueryFragment';

function isVisible<Entity extends object>(meta: EntityMetadata<Entity>, propName: EntityKey<Entity>, ignoreFields: string[] = []): boolean {
  const prop = meta.properties[propName];
  const visible = prop && !prop.hidden;
  const prefixed = prop && !prop.primary && propName.startsWith('_'); // ignore prefixed properties, if it's not a PK

  return visible && !prefixed && !ignoreFields.includes(propName);
}

export class EntityTransformer {

  static toObject<Entity extends object, Ignored extends EntityKey<Entity> = never>(entity: Entity, ignoreFields: Ignored[] = [], raw = false): Omit<EntityDTO<Entity>, Ignored> {
    if (!Array.isArray(ignoreFields)) {
      ignoreFields = [];
    }

    const wrapped = helper(entity);
    let contextCreated = false;

    if (!wrapped) {
      return entity as EntityDTO<Entity>;
    }

    if (!wrapped.__serializationContext.root) {
      const root = new SerializationContext<Entity>(
        wrapped.__config,
        wrapped.__serializationContext.populate,
        wrapped.__serializationContext.fields,
        wrapped.__serializationContext.exclude,
      );
      SerializationContext.propagate(root, entity, isVisible);
      contextCreated = true;
    }

    const root = wrapped.__serializationContext.root!;
    const meta = wrapped.__meta;
    const ret = {} as Dictionary;
    const keys = new Set<EntityKey<Entity>>();

    if (meta.serializedPrimaryKey && !meta.compositePK) {
      keys.add(meta.serializedPrimaryKey);
    } else {
      meta.primaryKeys.forEach(pk => keys.add(pk));
    }

    if (wrapped.isInitialized() || !wrapped.hasPrimaryKey()) {
      Utils.keys(entity as object).forEach(prop => keys.add(prop));
    }

    const visited = root.visited.has(entity);
    const includePrimaryKeys = wrapped.__config.get('serialization').includePrimaryKeys;

    if (!visited) {
      root.visited.add(entity);
    }

    for (const prop of keys) {
      const visible = raw ? meta.properties[prop] : isVisible<Entity>(meta, prop, ignoreFields);

      if (!visible) {
        continue;
      }

      const populated = root.isMarkedAsPopulated(meta.className, prop);
      const partiallyLoaded = root.isPartiallyLoaded(meta.className, prop);
      const isPrimary = includePrimaryKeys && meta.properties[prop].primary;

      if (!partiallyLoaded && !populated && !isPrimary) {
        continue;
      }

      const cycle = root.visit(meta.className, prop);

      if (cycle && visited) {
        continue;
      }

      const val = EntityTransformer.processProperty<Entity>(prop, entity, raw, populated);

      if (!cycle) {
        root.leave(meta.className, prop);
      }

      if (isRaw(val)) {
        throw new Error(`Trying to serialize raw SQL fragment: '${val.sql}'`);
      }

      if (typeof val === 'undefined') {
        continue;
      }

      ret[this.propertyName(meta, prop!, wrapped.__platform, raw) as any] = val;
    }

    if (!wrapped.isInitialized() && wrapped.hasPrimaryKey()) {
      return ret as EntityDTO<Entity>;
    }

    for (const prop of meta.getterProps) {
      // decorated get methods
      if (prop.getterName != null) {
        const visible = !prop.hidden && entity[prop.getterName] instanceof Function;
        const populated = root.isMarkedAsPopulated(meta.className, prop.name);

        if (visible) {
          ret[this.propertyName(meta, prop.name, wrapped.__platform, raw)] = this.processProperty(prop.getterName as EntityKey, entity, raw, populated);
        }
      } else {
        // decorated getters
        const visible = !prop.hidden && typeof entity[prop.name] !== 'undefined';
        const populated = root.isMarkedAsPopulated(meta.className, prop.name);

        if (visible) {
          ret[this.propertyName(meta, prop.name, wrapped.__platform, raw) as any] = this.processProperty(prop.name, entity, raw, populated);
        }
      }
    }

    if (contextCreated) {
      root.close();
    }

    return ret as EntityDTO<Entity>;
  }

  private static propertyName<Entity>(meta: EntityMetadata<Entity>, prop: EntityKey<Entity>, platform?: Platform, raw?: boolean): EntityKey<Entity> {
    if (raw) {
      return prop;
    }

    if (meta.properties[prop].serializedName) {
      return meta.properties[prop].serializedName as EntityKey<Entity>;
    }

    if (meta.properties[prop].primary && platform) {
      return platform.getSerializedPrimaryKeyField(prop) as EntityKey<Entity>;
    }

    return prop;
  }

  private static processProperty<Entity extends object>(prop: EntityKey<Entity>, entity: Entity, raw: boolean, populated: boolean): EntityValue<Entity> | undefined {
    const wrapped = helper(entity);
    const property = wrapped.__meta.properties[prop] ?? { name: prop };
    const serializer = property?.serializer;
    const value = entity[prop];

    // getter method
    if (entity[prop] as unknown instanceof Function) {
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
      return EntityTransformer.processEntity(property, entity, wrapped.__platform, raw, populated) as EntityValue<Entity>;
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

      const wrapped = value && helper(value!);
      return wrapped ? wrapped.toJSON() as EntityValue<Entity> : value;
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

  private static processEntity<Entity extends object>(prop: EntityProperty<Entity>, entity: Entity, platform: Platform, raw: boolean, populated: boolean): EntityValue<Entity> | undefined {
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
        return platform.normalizePrimaryKey(pruned[visible[0] as keyof typeof pruned] as IPrimaryKey) as EntityValue<Entity>;
      }

      return pruned;
    }

    return platform.normalizePrimaryKey(pk as IPrimaryKey) as EntityValue<Entity>;
  }

  private static processCollection<Entity extends object>(prop: EntityProperty<Entity>, entity: Entity, raw: boolean, populated: boolean): EntityValue<Entity> | undefined {
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
