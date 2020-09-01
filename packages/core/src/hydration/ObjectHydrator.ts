import { AnyEntity, Dictionary, EntityData, EntityProperty, Primary } from '../typings';
import { Hydrator } from './Hydrator';
import { Collection, EntityAssigner, Reference, ReferenceType } from '../entity';
import { Utils } from '../utils';

export class ObjectHydrator extends Hydrator {

  protected hydrateProperty<T>(entity: T, prop: EntityProperty, data: EntityData<T>, newEntity: boolean, convertCustomTypes: boolean): void {
    if (prop.reference === ReferenceType.MANY_TO_ONE || prop.reference === ReferenceType.ONE_TO_ONE) {
      this.hydrateToOne(data[prop.name], entity, prop);
    } else if (prop.reference === ReferenceType.ONE_TO_MANY || prop.reference === ReferenceType.MANY_TO_MANY) {
      this.hydrateToMany(entity, prop, data[prop.name], newEntity);
    } else if (prop.reference === ReferenceType.EMBEDDED) {
      this.hydrateEmbeddable(entity, prop, data);
    } else { // ReferenceType.SCALAR
      this.hydrateScalar(entity, prop, data[prop.name], convertCustomTypes);
    }
  }

  private hydrateScalar<T>(entity: T, prop: EntityProperty, value: any, convertCustomTypes: boolean): void {
    if (typeof value === 'undefined' || (prop.getter && !prop.setter)) {
      return;
    }

    if (prop.customType && convertCustomTypes) {
      value = prop.customType.convertToJSValue(value, this.em.getDriver().getPlatform());
    }

    entity[prop.name] = value;
  }

  private hydrateEmbeddable<T extends AnyEntity<T>>(entity: T, prop: EntityProperty, data: EntityData<T>): void {
    const value: Dictionary = {};

    Object.values<EntityProperty>(entity.__helper!.__meta.properties).filter(p => p.embedded?.[0] === prop.name).forEach(childProp => {
      value[childProp.embedded![1]] = data[childProp.name];
    });

    entity[prop.name] = Object.create(prop.embeddable.prototype);
    Object.keys(value).forEach(k => entity[prop.name][k] = value[k]);
  }

  private hydrateToMany<T>(entity: T, prop: EntityProperty<T>, value: any, newEntity?: boolean): void {
    if (Array.isArray(value)) {
      const items = value.map((value: Primary<T> | EntityData<T>) => this.createCollectionItem(prop, value, newEntity));
      const coll = Collection.create<AnyEntity>(entity, prop.name, items, !!newEntity);
      coll.setDirty(!!newEntity);
    } else if (!entity[prop.name]) {
      const items = this.em.getDriver().getPlatform().usesPivotTable() || !prop.owner ? undefined : [];
      const coll = Collection.create<AnyEntity>(entity, prop.name, items, !!(value || newEntity));
      coll.setDirty(false);
    }
  }

  private hydrateToOne<T>(value: any, entity: T, prop: EntityProperty): void {
    if (typeof value === 'undefined') {
      return;
    }

    if (Utils.isPrimaryKey<T[keyof T]>(value, true)) {
      entity[prop.name] = Reference.wrapReference(this.factory.createReference<T[keyof T]>(prop.type, value, { merge: true }), prop) as T[keyof T];
    } else if (Utils.isObject<EntityData<T[keyof T]>>(value)) {
      entity[prop.name] = Reference.wrapReference(this.factory.create(prop.type, value, { initialized: true, merge: true }), prop) as T[keyof T];
    } else if (value === null) {
      entity[prop.name] = null;
    }

    if (entity[prop.name]) {
      EntityAssigner.autoWireOneToOne(prop, entity);
    }
  }

  private createCollectionItem<T>(prop: EntityProperty, value: Primary<T> | EntityData<T> | T, newEntity?: boolean): T {
    const meta = this.em.getMetadata().get(prop.type);

    if (Utils.isPrimaryKey(value, meta.compositePK)) {
      const ref = this.factory.createReference<T>(prop.type, value, { merge: true });
      this.em.merge(ref);

      return ref;
    }

    if (Utils.isEntity<T>(value)) {
      return value;
    }

    return this.factory.create(prop.type, value as EntityData<T>, { newEntity });
  }

}
