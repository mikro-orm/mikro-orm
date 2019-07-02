import { Utils } from '../utils';
import { ArrayCollection } from './ArrayCollection';
import { Collection } from './Collection';
import { EntityData, EntityMetadata, IEntity, IEntityType } from '../decorators';
import { MetadataStorage } from '../metadata';

export class EntityTransformer {

  static toObject<T extends IEntityType<T>>(entity: T, ignoreFields: string[] = []): EntityData<T> {
    const platform = entity.__em.getDriver().getPlatform();
    const pk = platform.getSerializedPrimaryKeyField(entity.__primaryKeyField);
    const meta = MetadataStorage.getMetadata(entity.constructor.name);
    const pkProp = meta.properties[meta.primaryKey];
    const ret = (entity.__primaryKey && !pkProp.hidden ? { [pk]: platform.normalizePrimaryKey(entity.__primaryKey) } : {}) as EntityData<T>;

    if (!entity.isInitialized() && entity.__primaryKey) {
      return ret;
    }

    Object.keys(entity)
      .filter(prop => this.isVisible(meta, prop, entity, ignoreFields))
      .map(prop => [prop, EntityTransformer.processProperty<T>(prop as keyof T, entity, ignoreFields)])
      .filter(([, value]) => typeof value !== 'undefined')
      .forEach(([prop, value]) => ret[prop!] = value);

    return ret;
  }

  private static isVisible<T extends IEntityType<T>>(meta: EntityMetadata<T>, prop: keyof T & string, entity: T, ignoreFields: string[]): boolean {
    const hidden = meta.properties[prop] && !meta.properties[prop].hidden;
    return hidden && prop !== entity.__primaryKeyField && !prop.startsWith('_') && !ignoreFields.includes(prop);
  }

  private static processProperty<T extends IEntityType<T>>(prop: keyof T, entity: T, ignoreFields: string[]): T[keyof T] | undefined {
    if (entity[prop] as object instanceof ArrayCollection) {
      return EntityTransformer.processCollection(prop, entity);
    }

    if (Utils.isEntity(entity[prop])) {
      return EntityTransformer.processEntity(prop, entity, ignoreFields);
    }

    return entity[prop];
  }

  private static processEntity<T extends IEntityType<T>>(prop: keyof T, entity: T, ignoreFields: string[]): T[keyof T] | undefined {
    const child = entity[prop] as IEntity;
    const platform = child.__em.getDriver().getPlatform();

    if (child.isInitialized() && child.__populated && child !== entity && !child.__lazyInitialized) {
      const meta = MetadataStorage.getMetadata(child.constructor.name);
      const args = [...meta.toJsonParams.map(() => undefined), ignoreFields];

      return child.toJSON(...args) as T[keyof T];
    }

    return platform.normalizePrimaryKey(child.__primaryKey);
  }

  private static processCollection<T extends IEntityType<T>>(prop: keyof T, entity: T): T[keyof T] | undefined {
    const col = entity[prop] as Collection<IEntity>;

    if (col.isInitialized(true) && col.shouldPopulate()) {
      return col.toArray() as T[keyof T];
    }

    if (col.isInitialized()) {
      return col.getIdentifiers() as T[keyof T];
    }
  }

}
