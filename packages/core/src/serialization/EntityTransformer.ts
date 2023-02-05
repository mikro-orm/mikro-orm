import type { Collection } from '../entity/Collection';
import type { AnyEntity, EntityData, EntityKey, EntityMetadata, EntityValue, IPrimaryKey } from '../typings';
import { helper, wrap } from '../entity/wrap';
import type { Platform } from '../platforms';
import { Utils } from '../utils/Utils';
import { ReferenceKind } from '../enums';
import type { Reference } from '../entity/Reference';
import { SerializationContext } from './SerializationContext';

function isVisible<T extends object>(meta: EntityMetadata<T>, propName: EntityKey<T>, ignoreFields: string[] = []): boolean {
  const prop = meta.properties[propName];
  const visible = prop && !prop.hidden;
  const prefixed = prop && !prop.primary && propName.startsWith('_'); // ignore prefixed properties, if it's not a PK

  return visible && !prefixed && !ignoreFields.includes(propName);
}

export class EntityTransformer {

  static toObject<T extends object>(entity: T, ignoreFields: string[] = [], raw = false): EntityData<T> {
    if (!Array.isArray(ignoreFields)) {
      ignoreFields = [];
    }

    const wrapped = helper(entity);
    let contextCreated = false;

    if (!wrapped.__serializationContext.root) {
      const root = new SerializationContext<T>(wrapped.__serializationContext.populate ?? []);
      SerializationContext.propagate(root, entity, isVisible);
      contextCreated = true;
    }

    const root = wrapped.__serializationContext.root!;
    const meta = wrapped.__meta;
    const ret = {} as EntityData<T>;
    const keys = new Set<EntityKey<T>>();

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
      .filter(prop => raw ? meta.properties[prop] : isVisible<T>(meta, prop, ignoreFields))
      .map(prop => {
        const cycle = root.visit(meta.className, prop);

        if (cycle && visited) {
          return [prop, undefined];
        }

        const val = EntityTransformer.processProperty<T>(prop, entity, raw);

        if (!cycle) {
          root.leave(meta.className, prop);
        }

        return [prop, val] as const;
      })
      .filter(([, value]) => typeof value !== 'undefined')
      .forEach(([prop, value]) => ret[this.propertyName(meta, prop!, wrapped.__platform)] = value as EntityValue<T>);

    if (!visited) {
      root.visited.delete(entity);
    }

    if (!wrapped.isInitialized() && wrapped.hasPrimaryKey()) {
      return ret;
    }

    // decorated getters
    meta.props
      .filter(prop => prop.getter && prop.getterName === undefined && !prop.hidden && typeof entity[prop.name] !== 'undefined')
      // @ts-ignore
      .forEach(prop => ret[this.propertyName(meta, prop.name, wrapped.__platform)] = this.processProperty(prop.name, entity, raw));

    // decorated get methods
    meta.props
      .filter(prop => prop.getterName && !prop.hidden && entity[prop.getterName] as unknown instanceof Function)
      // @ts-ignore
      .forEach(prop => ret[this.propertyName(meta, prop.name, wrapped.__platform)] = this.processProperty(prop.getterName as keyof T & string, entity, raw));

    if (contextCreated) {
      root.close();
    }

    return ret;
  }

  private static propertyName<T>(meta: EntityMetadata<T>, prop: EntityKey<T>, platform?: Platform): EntityKey<T> {
    if (meta.properties[prop].serializedName) {
      return meta.properties[prop].serializedName as EntityKey<T>;
    }

    if (meta.properties[prop].primary && platform) {
      return platform.getSerializedPrimaryKeyField(prop) as EntityKey<T>;
    }

    return prop;
  }

  private static processProperty<T extends object>(prop: EntityKey<T>, entity: T, raw: boolean): EntityValue<T> | undefined {
    const wrapped = helper(entity);
    const property = wrapped.__meta.properties[prop];
    const serializer = property?.serializer;

    // getter method
    if (entity[prop] as unknown instanceof Function) {
      const returnValue = (entity[prop] as unknown as () => T[keyof T & string])();
      if (serializer) {
        return serializer(returnValue);
      }
      return returnValue;
    }

    if (serializer) {
      return serializer(entity[prop]);
    }

    if (Utils.isCollection(entity[prop])) {
      return EntityTransformer.processCollection(prop, entity, raw);
    }

    if (Utils.isEntity(entity[prop], true)) {
      return EntityTransformer.processEntity(prop, entity, wrapped.__platform, raw);
    }

    if (property.kind === ReferenceKind.EMBEDDED) {
      if (Array.isArray(entity[prop])) {
        return (entity[prop] as object[]).map(item => {
          const wrapped = item && helper(item);
          return wrapped ? wrapped.toJSON() : item;
        }) as EntityValue<T>;
      }

      const wrapped = entity[prop] && helper(entity[prop]!);
      return wrapped ? wrapped.toJSON() as EntityValue<T> : entity[prop];
    }

    const customType = property?.customType;

    if (customType) {
      return customType.toJSON(entity[prop], wrapped.__platform);
    }

    return wrapped.__platform.normalizePrimaryKey(entity[prop] as unknown as IPrimaryKey) as unknown as EntityValue<T>;
  }

  private static processEntity<T extends object>(prop: keyof T, entity: T, platform: Platform, raw: boolean): EntityValue<T> | undefined {
    const child = entity[prop] as unknown as T | Reference<T>;
    const wrapped = helper(child);

    if (raw && wrapped.isInitialized() && child !== entity) {
      return wrapped.toPOJO() as unknown as EntityValue<T>;
    }

    if (wrapped.isInitialized() && (wrapped.__populated || !wrapped.__managed) && child !== entity && !wrapped.__lazyInitialized) {
      const args = [...wrapped.__meta.toJsonParams.map(() => undefined)];
      return wrap(child).toJSON(...args) as EntityValue<T>;
    }

    return platform.normalizePrimaryKey(wrapped.getPrimaryKey() as IPrimaryKey) as unknown as EntityValue<T>;
  }

  private static processCollection<T>(prop: keyof T, entity: T, raw: boolean): EntityValue<T> | undefined {
    const col = entity[prop] as Collection<AnyEntity>;

    if (raw && col.isInitialized(true)) {
      return col.getItems().map(item => wrap(item).toPOJO()) as EntityValue<T>;
    }

    if (col.isInitialized(true) && col.shouldPopulate()) {
      return col.toArray() as EntityValue<T>;
    }

    if (col.isInitialized()) {
      return col.getIdentifiers() as EntityValue<T>;
    }

    return undefined;
  }

}
