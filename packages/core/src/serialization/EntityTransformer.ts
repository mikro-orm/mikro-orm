import type { Collection } from '../entity/Collection';
import type { AnyEntity, Dictionary, EntityDTO, EntityKey, EntityMetadata, EntityValue, IPrimaryKey } from '../typings';
import { helper, wrap } from '../entity/wrap';
import type { Platform } from '../platforms';
import { Utils } from '../utils/Utils';
import { ReferenceKind } from '../enums';
import type { Reference } from '../entity/Reference';
import { SerializationContext } from './SerializationContext';
import { RawQueryFragment } from '../utils/RawQueryFragment';

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

        if (val instanceof RawQueryFragment) {
          throw new Error(`Trying to serialize raw SQL fragment: '${val.sql}'`);
        }

        return [prop, val] as const;
      })
      .filter(([, value]) => typeof value !== 'undefined')
      .forEach(([prop, value]) => ret[this.propertyName(meta, prop!, wrapped.__platform, raw) as any] = value as any);

    if (!visited) {
      root.visited.delete(entity);
    }

    if (!wrapped.isInitialized() && wrapped.hasPrimaryKey()) {
      return ret as EntityDTO<Entity>;
    }

    // decorated getters
    meta.props
      .filter(prop => prop.getter && prop.getterName === undefined && !prop.hidden && typeof entity[prop.name] !== 'undefined')
      // @ts-ignore
      .forEach(prop => ret[this.propertyName(meta, prop.name, wrapped.__platform, raw) as any] = this.processProperty(prop.name, entity, raw));

    // decorated get methods
    meta.props
      .filter(prop => prop.getterName && !prop.hidden && entity[prop.getterName] instanceof Function)
      // @ts-ignore
      .forEach(prop => ret[this.propertyName(meta, prop.name, wrapped.__platform, raw)] = this.processProperty(prop.getterName as keyof Entity & string, entity, raw));

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
    const property = wrapped.__meta.properties[prop];
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

    if (property?.primary) {
      return wrapped.__platform.normalizePrimaryKey(value as unknown as IPrimaryKey) as unknown as EntityValue<Entity>;
    }

    return value;
  }

  private static processEntity<Entity extends object>(prop: keyof Entity, entity: Entity, platform: Platform, raw: boolean, populated: boolean): EntityValue<Entity> | undefined {
    const child = entity[prop] as unknown as Entity | Reference<Entity>;
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

    const pk = wrapped.getPrimaryKey(true)!;

    if (wrapped.__config.get('serialization').forceObject) {
      return Utils.primaryKeyToObject(meta, pk, visible) as EntityValue<Entity>;
    }

    if (Utils.isPlainObject(pk)) {
      const pruned = Utils.primaryKeyToObject(meta, pk, visible) as EntityValue<Entity>;

      if (visible.length === 1) {
        return platform.normalizePrimaryKey(pruned[visible[0]] as IPrimaryKey) as EntityValue<Entity>;
      }

      return pruned;
    }

    return platform.normalizePrimaryKey(pk as IPrimaryKey) as EntityValue<Entity>;
  }

  private static processCollection<Entity extends object>(prop: keyof Entity, entity: Entity, raw: boolean, populated: boolean): EntityValue<Entity> | undefined {
    const col = entity[prop] as Collection<AnyEntity>;

    if (raw && col.isInitialized(true)) {
      return col.map(item => helper(item).toPOJO()) as EntityValue<Entity>;
    }

    if (col.shouldPopulate(populated)) {
      return col.toArray() as EntityValue<Entity>;
    }

    if (col.isInitialized()) {
      const wrapped = helper(entity);

      if (wrapped.__config.get('serialization').forceObject) {
        return col.map(item => {
          const wrapped = helper(item);
          return Utils.primaryKeyToObject(wrapped.__meta, wrapped.getPrimaryKey(true)!) as EntityValue<Entity>;
        }) as EntityValue<Entity>;
      }

      return col.map(i => helper(i).getPrimaryKey(true)) as EntityValue<Entity>;
    }

    return undefined;
  }

}
