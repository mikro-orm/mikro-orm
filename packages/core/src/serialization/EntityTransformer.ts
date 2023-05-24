import type { Collection } from '../entity/Collection';
import type { AnyEntity, Dictionary, EntityDTO, EntityKey, EntityMetadata, EntityValue, IPrimaryKey } from '../typings';
import { helper, wrap } from '../entity/wrap';
import type { Platform } from '../platforms';
import { Utils } from '../utils/Utils';
import { ReferenceKind } from '../enums';
import type { Reference } from '../entity/Reference';
import { SerializationContext } from './SerializationContext';

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

    if (!wrapped.__serializationContext.root) {
      const root = new SerializationContext<Entity>(wrapped.__config, wrapped.__serializationContext.populate, wrapped.__serializationContext.fields);
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

    if (!visited) {
      root.visited.add(entity);
    }

    [...keys]
      .filter(prop => raw ? meta.properties[prop] : isVisible<Entity>(meta, prop, ignoreFields))
      .map(prop => {
        const populated = root.isMarkedAsPopulated(meta.className, prop);
        const partiallyLoaded = root.isPartiallyLoaded(meta.className, prop);
        const isPrimary = wrapped.__config.get('serialization').includePrimaryKeys && meta.properties[prop].primary;

        if (!partiallyLoaded && !populated && !isPrimary) {
          return [prop, undefined];
        }

        const cycle = root.visit(meta.className, prop);

        if (cycle && visited) {
          return [prop, undefined];
        }

        const val = EntityTransformer.processProperty<Entity>(prop, entity, raw, populated);

        if (!cycle) {
          root.leave(meta.className, prop);
        }

        return [prop, val] as const;
      })
      .filter(([, value]) => typeof value !== 'undefined')
      .forEach(([prop, value]) => ret[this.propertyName(meta, prop!, wrapped.__platform) as any] = value as any);

    if (!visited) {
      root.visited.delete(entity);
    }

    if (!wrapped.isInitialized() && wrapped.hasPrimaryKey()) {
      return ret as EntityDTO<Entity>;
    }

    // decorated getters
    meta.props
      .filter(prop => prop.getter && !prop.hidden && typeof entity[prop.name] !== 'undefined')
      .forEach(prop => ret[this.propertyName(meta, prop.name, wrapped.__platform) as any] = entity[prop.name] as any);

    // decorated get methods
    meta.props
      .filter(prop => prop.getterName && !prop.hidden && entity[prop.getterName] as unknown instanceof Function)
      .forEach(prop => ret[this.propertyName(meta, prop.name, wrapped.__platform)] = (entity[prop.getterName!] as () => any)());

    if (contextCreated) {
      root.close();
    }

    return ret as EntityDTO<Entity>;
  }

  private static propertyName<Entity>(meta: EntityMetadata<Entity>, prop: EntityKey<Entity>, platform?: Platform): EntityKey<Entity> {
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
    const property = wrapped.__meta.properties[prop];
    const serializer = property?.serializer;
    const value = entity[prop];

    if (serializer) {
      return serializer(value);
    }

    if (Utils.isCollection(value)) {
      return EntityTransformer.processCollection(prop, entity, raw, populated);
    }

    if (Utils.isEntity(value, true)) {
      return EntityTransformer.processEntity(prop, entity, wrapped.__platform, raw, populated);
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

    return wrapped.__platform.normalizePrimaryKey(value as unknown as IPrimaryKey) as unknown as EntityValue<Entity>;
  }

  private static processEntity<Entity extends object>(prop: keyof Entity, entity: Entity, platform: Platform, raw: boolean, populated: boolean): EntityValue<Entity> | undefined {
    const child = entity[prop] as unknown as Entity | Reference<Entity>;
    const wrapped = helper(child);

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

    return platform.normalizePrimaryKey(wrapped.getPrimaryKey() as IPrimaryKey) as unknown as EntityValue<Entity>;
  }

  private static processCollection<Entity>(prop: keyof Entity, entity: Entity, raw: boolean, populated: boolean): EntityValue<Entity> | undefined {
    const col = entity[prop] as Collection<AnyEntity>;

    if (raw && col.isInitialized(true)) {
      return col.getItems().map(item => wrap(item).toPOJO()) as EntityValue<Entity>;
    }

    if (col.shouldPopulate(populated)) {
      return col.toArray() as EntityValue<Entity>;
    }

    if (col.isInitialized()) {
      return col.getIdentifiers() as EntityValue<Entity>;
    }

    return undefined;
  }

}
