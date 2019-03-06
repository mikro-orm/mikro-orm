import { Utils } from '..';
import { ArrayCollection } from './ArrayCollection';
import { Collection } from './Collection';
import { EntityData, IEntity, IEntityType } from '../decorators/Entity';

export class EntityTransformer {

  static toObject<T extends IEntityType<T>>(entity: T, parent?: IEntity, isCollection = false): EntityData<T> {
    const ret = (entity.id ? { id: entity.id } : {}) as EntityData<T>;

    if (!entity.isInitialized() && entity.id) {
      return ret;
    }

    Object.keys(entity)
      .filter(prop => prop !== 'id' && !prop.startsWith('_'))
      .map(prop => [prop, EntityTransformer.processProperty<T>(prop, entity, parent || entity, isCollection)])
      .filter(([prop, value]) => !!value)
      .forEach(([prop, value]) => ret[prop!] = value);

    return ret;
  }

  private static processProperty<T extends IEntityType<T>>(prop: string, entity: T, parent: IEntity, isCollection: boolean): T[keyof T] | undefined {
    if (entity[prop as keyof T] as object instanceof ArrayCollection) {
      return EntityTransformer.processCollection(prop, entity);
    }

    if (Utils.isEntity(entity[prop as keyof T])) {
      return EntityTransformer.processEntity(prop, entity, parent, isCollection);
    }

    return entity[prop as keyof T];
  }

  private static processEntity<T extends IEntityType<T>>(prop: string, entity: T, parent: IEntity, isCollection: boolean): T[keyof T] | undefined {
    const child = entity[prop as keyof T] as IEntity;

    if (child.isInitialized() && child.__populated && !isCollection && child !== parent) {
      return EntityTransformer.toObject(child, entity) as T[keyof T];
    }

    return entity[prop as keyof T].id;
  }

  private static processCollection<T extends IEntityType<T>>(prop: string, entity: T): T[keyof T] | undefined {
    const col = entity[prop as keyof T] as Collection<IEntity>;

    if (col.isInitialized(true) && col.shouldPopulate()) {
      return col.toArray(entity) as T[keyof T];
    }

    if (col.isInitialized()) {
      return col.getIdentifiers() as T[keyof T];
    }
  }

}
