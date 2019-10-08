import { Utils } from '../utils';
import { ArrayCollection } from './ArrayCollection';
import { Collection } from './Collection';
import { EntityData, EntityMetadata, EntityProperty, AnyEntity, IPrimaryKey } from '../types';
import { Reference } from './Reference';
import { wrap } from './EntityHelper';

export class EntityTransformer {

  static toObject<T extends AnyEntity<T>>(entity: T, ignoreFields: string[] = []): EntityData<T> {
    const wrapped = wrap(entity);
    const platform = wrapped.__em.getDriver().getPlatform();
    const pk = platform.getSerializedPrimaryKeyField(wrapped.__meta.primaryKey);
    const meta = wrapped.__meta;
    const pkProp = meta.properties[meta.primaryKey];
    const ret = (wrapped.__primaryKey && !pkProp.hidden ? { [pk]: platform.normalizePrimaryKey(wrapped.__primaryKey as IPrimaryKey) } : {}) as EntityData<T>;

    if (!wrapped.isInitialized() && wrapped.__primaryKey) {
      return ret;
    }

    // normal properties
    Object.keys(entity)
      .filter(prop => this.isVisible(meta, prop as keyof T & string, ignoreFields))
      .map(prop => [prop, EntityTransformer.processProperty<T>(prop as keyof T, entity, ignoreFields)])
      .filter(([, value]) => typeof value !== 'undefined')
      .forEach(([prop, value]) => ret[prop! as keyof T] = value as T[keyof T]);

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
    const hidden = meta.properties[prop] && !meta.properties[prop].hidden;
    return hidden && prop !== meta.primaryKey && !prop.startsWith('_') && !ignoreFields.includes(prop);
  }

  private static processProperty<T extends AnyEntity<T>>(prop: keyof T, entity: T, ignoreFields: string[]): T[keyof T] | undefined {
    if (entity[prop] as unknown instanceof ArrayCollection) {
      return EntityTransformer.processCollection(prop, entity);
    }

    if (Utils.isEntity(entity[prop]) || entity[prop] as unknown instanceof Reference) {
      return EntityTransformer.processEntity(prop, entity, ignoreFields);
    }

    return entity[prop];
  }

  private static processEntity<T extends AnyEntity<T>>(prop: keyof T, entity: T, ignoreFields: string[]): T[keyof T] | undefined {
    const child = wrap(entity[prop] as unknown as T | Reference<T>);
    const platform = child.__em.getDriver().getPlatform();

    if (child.isInitialized() && child.__populated && child !== entity && !child.__lazyInitialized) {
      const args = [...child.__meta.toJsonParams.map(() => undefined), ignoreFields];
      return child.toJSON(...args) as T[keyof T];
    }

    return platform.normalizePrimaryKey(child.__primaryKey as IPrimaryKey) as unknown as T[keyof T];
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
