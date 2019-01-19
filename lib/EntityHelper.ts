import { Collection } from './Collection';
import { SCALAR_TYPES } from './EntityFactory';
import { EntityManager } from './EntityManager';
import { EntityProperty, IEntity, ReferenceType } from './decorators/Entity';
import { Utils } from './Utils';

export class EntityHelper {

  constructor(private readonly entity: IEntity) { }

  async init(populated = true, em: EntityManager = null): Promise<IEntity> {
    await (em || this.entity.getEntityManager(em)).findOne(this.entity.constructor.name, this.entity.id);
    this.entity.populated(populated);

    return this.entity;
  }

  setEntityManager(em: EntityManager): void {
    Object.defineProperty(this.entity, '_em', {
      value: em,
      enumerable: false,
      writable: true,
    });
  }

  getEntityManager(em: EntityManager = null): EntityManager {
    if (em) {
      this.entity._em = em;
    }

    if (!this.entity._em) {
      throw new Error('This entity is not attached to EntityManager, please provide one!');
    }

    return this.entity._em;
  }

  assign(data: any, em: EntityManager = null) {
    em = this.entity.getEntityManager(em);
    const metadata = em.entityFactory.getMetadata();
    const meta = metadata[this.entity.constructor.name];
    const props = meta.properties;

    Object.keys(data).forEach(prop => {
      if (props[prop] && props[prop].reference === ReferenceType.MANY_TO_ONE && data[prop]) {
        return this.assignReference(data[prop], props[prop], em);
      }

      const isCollection = props[prop] && [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference);

      if (isCollection && Array.isArray(data[prop])) {
        return this.assignCollection(data[prop], props[prop], em);
      }

      if (props[prop] && props[prop].reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(props[prop].type)) {
        this.entity[prop] = em.validator.validateProperty(props[prop], data[prop], this.entity)
      }

      this.entity[prop] = data[prop];
    });
  }

  toObject(parent?: IEntity, collection: Collection<IEntity> = null): any {
    parent = parent || this.entity;
    const ret = this.entity.id ? { id: this.entity.id } : {} as any;

    if (!this.entity.isInitialized() && this.entity.id) {
      return ret;
    }

    Object.keys(this.entity).forEach(prop => {
      if (prop === 'id' || prop.startsWith('_')) {
        return;
      }

      if (this.entity[prop] instanceof Collection) {
        const col = this.entity[prop] as Collection<IEntity>;

        if (col.isInitialized(true) && col.shouldPopulate()) {
          ret[prop] = col.toArray(this.entity);
        } else if (col.isInitialized() && !col.shouldPopulate()) {
          ret[prop] = col.getIdentifiers();
        }

        return;
      }

      if (Utils.isEntity(this.entity[prop])) {
        if (this.entity[prop].isInitialized() && this.entity[prop].shouldPopulate(collection) && this.entity[prop] !== parent) {
          return ret[prop] = (this.entity[prop] as IEntity).toObject(this.entity);
        }

        return ret[prop] = this.entity[prop].id;
      }

      ret[prop] = this.entity[prop];
    });

    return ret;
  }

  private assignReference(value: any, prop: EntityProperty, em: EntityManager): void {
    if (Utils.isEntity(value)) {
      this.entity[prop.name] = value;
      return;
    }

    const id = Utils.extractPK(value);

    if (id) {
      const normalized = em.getDriver().normalizePrimaryKey(id);
      this.entity[prop.name] = em.getReference(prop.type, normalized);
      return;
    }

    const name = this.entity.constructor.name;
    throw new Error(`Invalid reference value provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(value)}`);
  }

  private assignCollection(value: any, prop: EntityProperty, em: EntityManager): void {
    const invalid = [];
    const items = value.map((item: any) => {
      if (Utils.isEntity(item)) {
        return item;
      }

      if (Utils.isPrimaryKey(item)) {
        const id = em.getDriver().normalizePrimaryKey(item);
        return em.getReference(prop.type, id);
      }

      invalid.push(item);
    });

    if (invalid.length > 0) {
      const name = this.entity.constructor.name;
      throw new Error(`Invalid collection values provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(invalid)}`);
    }

    (this.entity[prop.name] as Collection<IEntity>).set(items);
  }

}
