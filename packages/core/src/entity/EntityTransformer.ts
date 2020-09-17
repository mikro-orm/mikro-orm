import { ArrayCollection } from './ArrayCollection';
import { Collection } from './Collection';
import { AnyEntity, EntityData, EntityMetadata, IPrimaryKey } from '../typings';
import { Reference } from './Reference';
import { wrap } from './wrap';
import { Platform } from '../platforms';
import { Utils } from '../utils/Utils';

export class EntityTransformer {

  static toObject<T extends AnyEntity<T>>(entity: T, ignoreFields: string[] = [], visited = new WeakSet<AnyEntity>()): EntityData<T> {
    const wrapped = entity.__helper!;
    const meta = entity.__meta!;
    const ret = {} as EntityData<T>;

    meta.primaryKeys
      .filter(pk => !Utils.isDefined(entity[pk], true) || !(meta.properties[pk].hidden || ignoreFields.includes(pk)))
      .map(pk => {
        let value: unknown;

        if (meta.properties[pk].serializer) {
          value = meta.properties[pk].serializer!(entity[pk]);
        } else if (Utils.isEntity(entity[pk], true)) {
          value = EntityTransformer.processEntity(pk, entity, ignoreFields, entity.__platform!, visited);
        } else {
          value = entity.__platform!.normalizePrimaryKey(Utils.getPrimaryKeyValue<T>(entity, [pk]));
        }

        return [pk, value] as [string & keyof T, string];
      })
      .forEach(([pk, value]) => ret[this.propertyName(meta, pk, entity.__platform!)] = value as unknown as T[keyof T]);

    if ((!wrapped.isInitialized() && wrapped.hasPrimaryKey()) || visited.has(entity)) {
      return ret;
    }

    visited.add(entity);

    // normal properties
    Object.keys(entity)
      .filter(prop => this.isVisible(meta, prop as keyof T & string, ignoreFields))
      .map(prop => [prop, EntityTransformer.processProperty<T>(prop as keyof T & string, entity, ignoreFields, visited)])
      .filter(([, value]) => typeof value !== 'undefined')
      .forEach(([prop, value]) => ret[this.propertyName(meta, prop as keyof T & string)] = value as T[keyof T]);

    // decorated getters
    meta.props
      .filter(prop => prop.getter && !prop.hidden && typeof entity[prop.name] !== 'undefined')
      .forEach(prop => ret[this.propertyName(meta, prop.name)] = entity[prop.name]);

    // decorated get methods
    meta.props
      .filter(prop => prop.getterName && !prop.hidden && entity[prop.getterName] as unknown instanceof Function)
      .forEach(prop => ret[this.propertyName(meta, prop.name)] = (entity[prop.getterName!] as unknown as () => void)());

    return ret;
  }

  private static isVisible<T extends AnyEntity<T>>(meta: EntityMetadata<T>, prop: keyof T & string, ignoreFields: string[]): boolean {
    const visible = meta.properties[prop] && !meta.properties[prop].hidden;
    return visible && !meta.primaryKeys.includes(prop) && !prop.startsWith('_') && !ignoreFields.includes(prop);
  }

  private static propertyName<T extends AnyEntity<T>>(meta: EntityMetadata<T>, prop: keyof T & string, platform?: Platform): string {
    if (meta.properties[prop].serializedName) {
      return meta.properties[prop].serializedName!;
    }

    if (meta.properties[prop].primary && platform) {
      return platform.getSerializedPrimaryKeyField(prop);
    }

    return prop;
  }

  private static processProperty<T extends AnyEntity<T>>(prop: keyof T & string, entity: T, ignoreFields: string[], visited: WeakSet<AnyEntity>): T[keyof T] | undefined {
    const wrapped = entity.__helper!;
    const property = wrapped.__meta.properties[prop];

    /* istanbul ignore next */
    const serializer = property?.serializer;

    if (serializer) {
      return serializer(entity[prop]);
    }

    /* istanbul ignore next */
    const customType = property?.customType;

    if (customType) {
      return customType.toJSON(entity[prop], entity.__platform!);
    }

    if (entity[prop] as unknown instanceof ArrayCollection) {
      return EntityTransformer.processCollection(prop, entity);
    }

    if (Utils.isEntity(entity[prop], true)) {
      return EntityTransformer.processEntity(prop, entity, ignoreFields, entity.__platform!, visited);
    }

    return entity[prop];
  }

  private static processEntity<T extends AnyEntity<T>>(prop: keyof T, entity: T, ignoreFields: string[], platform: Platform, visited: WeakSet<AnyEntity>): T[keyof T] | undefined {
    const child = entity[prop] as unknown as T | Reference<T>;
    const wrapped = (child as T).__helper!;

    if (wrapped.isInitialized() && wrapped.__populated && child !== entity && !wrapped.__lazyInitialized) {
      const args = [...wrapped.__meta.toJsonParams.map(() => undefined), ignoreFields, visited];
      return wrap(child).toJSON(...args) as T[keyof T];
    }

    return platform.normalizePrimaryKey(wrapped.__primaryKey as unknown as IPrimaryKey) as unknown as T[keyof T];
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
