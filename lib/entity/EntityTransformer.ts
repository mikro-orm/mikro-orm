import { Utils } from '../utils';
import { ArrayCollection } from './ArrayCollection';
import { Collection } from './Collection';
import { AnyEntity, EntityData, EntityMetadata, EntityProperty, IPrimaryKey } from '../typings';
import { Reference } from './Reference';
import { wrap } from './EntityHelper';

export class EntityTransformer {

  static toObject<T extends AnyEntity<T>>(entity: T, ignoreFields: string[] = [], visited: string[] = []): EntityData<T> {
    const wrapped = wrap(entity);
    const platform = wrapped.__internal.platform;
    const meta = wrapped.__meta;
    const ret = {} as EntityData<T>;

    meta.primaryKeys
      .filter(pk => !Utils.isDefined(entity[pk], true) || !meta.properties[pk].hidden)
      .map(pk => [pk, Utils.getPrimaryKeyValue<T>(entity, [pk])] as [string, string])
      .forEach(([pk, value]) => ret[platform.getSerializedPrimaryKeyField(pk) as keyof T] = platform.normalizePrimaryKey(value));

    if ((!wrapped.isInitialized() && Utils.isDefined(wrapped.__primaryKey, true)) || visited.includes(wrap(entity).__uuid)) {
      return ret;
    }

    visited.push(wrap(entity).__uuid);

    // normal properties
    Object.keys(entity)
      .filter(prop => this.isVisible(meta, prop as keyof T & string, ignoreFields))
      .map(prop => [prop, EntityTransformer.processProperty<T>(prop as keyof T & string, entity, ignoreFields, visited)])
      .filter(([, value]) => typeof value !== 'undefined')
      .forEach(([prop, value]) => ret[prop as keyof T] = value as T[keyof T]);

    // decorated getters
    Object.values<EntityProperty<T>>(meta.properties)
      .filter(prop => prop.getter && !prop.hidden && typeof entity[prop.name] !== 'undefined')
      .forEach(prop => ret[prop.name] = entity[prop.name]);

    // decorated get methods
    Object.values<EntityProperty<T>>(meta.properties)
      .filter(prop => prop.getterName && !prop.hidden && entity[prop.getterName] as unknown instanceof Function)
      .forEach(prop => ret[prop.name] = (entity[prop.getterName!] as unknown as () => void)());

    return ret;
  }

  private static isVisible<T extends AnyEntity<T>>(meta: EntityMetadata<T>, prop: keyof T & string, ignoreFields: string[]): boolean {
    const visible = meta.properties[prop] && !meta.properties[prop].hidden;
    return visible && !meta.primaryKeys.includes(prop) && !prop.startsWith('_') && !ignoreFields.includes(prop);
  }

  private static processProperty<T extends AnyEntity<T>>(prop: keyof T & string, entity: T, ignoreFields: string[], visited: string[]): T[keyof T] | undefined {
    const property = wrap(entity).__meta.properties[prop];
    const platform = wrap(entity).__internal.platform;

    if (property && property.customType) {
      return property.customType.toJSON(entity[prop], platform);
    }

    if (entity[prop] as unknown instanceof ArrayCollection) {
      return EntityTransformer.processCollection(prop, entity);
    }

    if (Utils.isEntity(entity[prop]) || entity[prop] as unknown instanceof Reference) {
      return EntityTransformer.processEntity(prop, entity, ignoreFields, visited);
    }

    return entity[prop];
  }

  private static processEntity<T extends AnyEntity<T>>(prop: keyof T, entity: T, ignoreFields: string[], visited: string[]): T[keyof T] | undefined {
    const child = wrap(entity[prop] as unknown as T | Reference<T>);

    if (child.isInitialized() && child.__populated && child !== entity && !child.__lazyInitialized) {
      const args = [...child.__meta.toJsonParams.map(() => undefined), ignoreFields, visited];
      return child.toJSON(...args) as T[keyof T];
    }

    return child.__internal.platform.normalizePrimaryKey(child.__primaryKey as IPrimaryKey) as unknown as T[keyof T];
  }

  private static processCollection<T extends AnyEntity<T>>(prop: keyof T, entity: T): T[keyof T] | undefined {
    const col = entity[prop] as unknown as Collection<AnyEntity>;

    if (col.isInitialized(true) && col.shouldPopulate()) {
      return col.toArray() as unknown as T[keyof T];
    }

    if (col.isInitialized()) {
      return col.getIdentifiers() as unknown as T[keyof T];
    }
  }

}
