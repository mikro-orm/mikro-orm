import { EntityData, EntityProperty, AnyEntity, Primary } from '../typings';
import { Hydrator } from './Hydrator';
import { Collection, EntityAssigner, ReferenceType, wrap } from '../entity';
import { Utils } from '../utils';

export class ObjectHydrator extends Hydrator {

  protected hydrateProperty<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, value: any, newEntity: boolean): void {
    if (prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE) {
      this.hydrateManyToOne(value, entity, prop);
    } else if (prop.reference === ReferenceType.ONE_TO_MANY) {
      this.hydrateOneToMany(entity, prop, value, newEntity);
    } else if (prop.reference === ReferenceType.MANY_TO_MANY) {
      this.hydrateManyToMany(entity, prop, value, newEntity);
    } else { // ReferenceType.SCALAR
      this.hydrateScalar(entity, prop, value);
    }
  }

  private hydrateOneToMany<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, value: any, newEntity: boolean): void {
    entity[prop.name as keyof T] = new Collection<AnyEntity>(entity, undefined, !!value || newEntity) as unknown as T[keyof T];
  }

  private hydrateScalar<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, value: any): void {
    if (typeof value === 'undefined' || (prop.getter && !prop.setter)) {
      return;
    }

    if (prop.customType) {
      value = prop.customType.convertToJSValue(value, this.em.getDriver().getPlatform());
    }

    entity[prop.name as keyof T] = value;
  }

  private hydrateManyToMany<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, value: any, newEntity: boolean): void {
    if (prop.owner) {
      return this.hydrateManyToManyOwner(entity, prop, value, newEntity);
    }

    this.hydrateManyToManyInverse(entity, prop, newEntity);
  }

  private hydrateManyToManyOwner<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, value: any, newEntity: boolean): void {
    if (Array.isArray(value)) {
      const items = value.map((value: Primary<T> | EntityData<T>) => this.createCollectionItem(prop, value));
      entity[prop.name as keyof T] = new Collection<AnyEntity>(entity, items) as unknown as T[keyof T];
    } else if (!entity[prop.name as keyof T]) {
      const items = this.em.getDriver().getPlatform().usesPivotTable() ? undefined : [];
      entity[prop.name as keyof T] = new Collection<AnyEntity>(entity, items, newEntity) as unknown as T[keyof T];
    }
  }

  private hydrateManyToManyInverse<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, newEntity: boolean): void {
    if (!entity[prop.name as keyof T]) {
      entity[prop.name as keyof T] = new Collection<AnyEntity>(entity, undefined, newEntity) as unknown as T[keyof T];
    }
  }

  private hydrateManyToOne<T extends AnyEntity<T>>(value: any, entity: T, prop: EntityProperty): void {
    if (typeof value === 'undefined') {
      return;
    }

    if (Utils.isPrimaryKey<T[keyof T]>(value)) {
      entity[prop.name as keyof T] = Utils.wrapReference<T[keyof T]>(this.factory.createReference<T[keyof T]>(prop.type, value), prop) as T[keyof T];
    } else if (Utils.isObject<EntityData<T[keyof T]>>(value)) {
      entity[prop.name as keyof T] = Utils.wrapReference(this.factory.create(prop.type, value), prop) as T[keyof T];
    }

    if (entity[prop.name]) {
      EntityAssigner.autoWireOneToOne(prop, entity);
    }
  }

  private createCollectionItem<T extends AnyEntity<T>>(prop: EntityProperty, value: Primary<T> | EntityData<T>): T {
    if (Utils.isPrimaryKey(value)) {
      return this.factory.createReference(prop.type, value);
    }

    const child = this.factory.create(prop.type, value as EntityData<T>);

    if (wrap(child).__primaryKey) {
      this.em.merge(child);
    }

    return child;
  }

}
