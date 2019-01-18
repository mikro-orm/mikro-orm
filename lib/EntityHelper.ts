import { ObjectID } from 'bson';
import { Collection } from './Collection';
import { SCALAR_TYPES } from './EntityFactory';
import { EntityManager } from './EntityManager';
import { IEntity } from './decorators/Entity';
import { BaseEntity, ReferenceType } from './BaseEntity';

export class EntityHelper {

  constructor(private readonly entity: IEntity) { }

  assign(data: any, em: EntityManager = null) {
    em = this.entity.getEntityManager(em);
    const metadata = em.entityFactory.getMetadata();
    const meta = metadata[this.entity.constructor.name];
    const props = meta.properties;

    Object.keys(data).forEach(prop => {
      if (props[prop] && props[prop].reference === ReferenceType.MANY_TO_ONE && data[prop]) {
        if (data[prop] instanceof BaseEntity) {
          return this.entity[prop] = data[prop];
        }

        if (data[prop] instanceof ObjectID) {
          return this.entity[prop] = em.getReference(props[prop].type, data[prop].toHexString());
        }

        const id = typeof data[prop] === 'object' ? data[prop].id : data[prop];

        if (id) {
          return this.entity[prop] = em.getReference(props[prop].type, id);
        }
      }

      const isCollection = props[prop] && [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference);

      if (isCollection && Array.isArray(data[prop])) {
        const items = data[prop].map((item: any) => {
          if (item instanceof ObjectID) {
            return em.getReference(props[prop].type, item.toHexString());
          }

          if (item instanceof BaseEntity) {
            return item;
          }

          return em.getReference(props[prop].type, item);
        });

        return (this.entity[prop] as Collection<IEntity>).set(items);
      }

      if (props[prop] && props[prop].reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(props[prop].type)) {
        this.entity[prop] = em.validator.validateProperty(props[prop], data[prop], this.entity)
      }

      this.entity[prop] = data[prop];
    });
  }

  toObject(parent?: IEntity, collection: Collection<IEntity> = null): any {
    parent = parent || this.entity;
    const ret = { id: this.entity.id } as any;

    if (!this.entity.isInitialized()) {
      return ret;
    }

    Object.keys(this.entity).forEach(prop => {
      if (prop === 'id' || prop.startsWith('_')) {
        return;
      }

      if (this.entity[prop] instanceof Collection) {
        const col = this.entity[prop] as Collection<IEntity>;

        if (col.isInitialized(true) && col.shouldPopulate()) {
          ret[prop] = col.toArray(this.entity as unknown as IEntity);
        } else if (col.isInitialized() && !col.shouldPopulate()) {
          ret[prop] = col.getIdentifiers();
        }

        return;
      }

      if (this.entity[prop] instanceof BaseEntity) {
        if (this.entity[prop].isInitialized() && this.entity[prop].shouldPopulate(collection) && this.entity[prop] !== parent) {
          return ret[prop] = (this.entity[prop] as BaseEntity).toObject(this.entity as unknown as IEntity);
        }

        return ret[prop] = this.entity[prop].id;
      }

      ret[prop] = this.entity[prop];
    });

    return ret;
  }

}
