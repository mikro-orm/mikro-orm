import { Collection } from './Collection';
import { SCALAR_TYPES } from './EntityFactory';
import { EntityManager } from './EntityManager';
import { EntityMetadata, EntityProperty, IEntity, ReferenceType } from './decorators/Entity';
import { Utils } from './Utils';

export class EntityHelper {

  static async init(entity: IEntity, populated = true): Promise<IEntity> {
    await entity['__em'].findOne(entity.constructor.name, entity.id);
    entity.populated(populated);

    return entity;
  }

  static assign(entity: IEntity, data: any): void {
    const metadata = entity['__em'].entityFactory.getMetadata();
    const meta = metadata[entity.constructor.name];
    const props = meta.properties;

    Object.keys(data).forEach(prop => {
      if (props[prop] && props[prop].reference === ReferenceType.MANY_TO_ONE && data[prop]) {
        return EntityHelper.assignReference(entity, data[prop], props[prop], entity['__em']);
      }

      const isCollection = props[prop] && [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference);

      if (isCollection && Array.isArray(data[prop])) {
        return EntityHelper.assignCollection(entity, data[prop], props[prop], entity['__em']);
      }

      if (props[prop] && props[prop].reference === ReferenceType.SCALAR && SCALAR_TYPES.includes(props[prop].type)) {
        entity[prop] = entity['__em'].validator.validateProperty(props[prop], data[prop], entity)
      }

      entity[prop] = data[prop];
    });
  }

  static toObject(entity: IEntity, parent?: IEntity, collection: Collection<IEntity> = null): any {
    parent = parent || entity;
    const ret = entity.id ? { id: entity.id } : {} as any;

    if (!entity.isInitialized() && entity.id) {
      return ret;
    }

    Object.keys(entity).forEach(prop => {
      if (prop === 'id' || prop.startsWith('_')) {
        return;
      }

      if (entity[prop] instanceof Collection) {
        const col = entity[prop] as Collection<IEntity>;

        if (col.isInitialized(true) && col.shouldPopulate()) {
          ret[prop] = col.toArray(entity);
        } else if (col.isInitialized() && !col.shouldPopulate()) {
          ret[prop] = col.getIdentifiers();
        }

        return;
      }

      if (Utils.isEntity(entity[prop])) {
        if (entity[prop].isInitialized() && entity[prop].shouldPopulate(collection) && entity[prop] !== parent) {
          return ret[prop] = (entity[prop] as IEntity).toObject(entity);
        }

        return ret[prop] = entity[prop].id;
      }

      ret[prop] = entity[prop];
    });

    return ret;
  }

  private static assignReference(entity: IEntity, value: any, prop: EntityProperty, em: EntityManager): void {
    if (Utils.isEntity(value)) {
      entity[prop.name] = value;
      return;
    }

    const id = Utils.extractPK(value);

    if (id) {
      const normalized = em.getDriver().normalizePrimaryKey(id);
      entity[prop.name] = em.getReference(prop.type, normalized);
      return;
    }

    const name = entity.constructor.name;
    throw new Error(`Invalid reference value provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(value)}`);
  }

  private static assignCollection(entity: IEntity, value: any, prop: EntityProperty, em: EntityManager): void {
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
      const name = entity.constructor.name;
      throw new Error(`Invalid collection values provided for '${name}.${prop.name}' in ${name}.assign(): ${JSON.stringify(invalid)}`);
    }

    (entity[prop.name] as Collection<IEntity>).set(items);
  }

  static decorate(prototype: any, meta: EntityMetadata, em: EntityManager) {
    const pk = meta.properties[meta.primaryKey];

    // define magic id property getter/setter if the key is `_id: ObjectID`
    if (pk.name === '_id' && pk.type === 'ObjectID') {
      Object.defineProperty(prototype, 'id', {
        get(): string {
          return this._id ? em.getDriver().normalizePrimaryKey<string>(this._id) : null;
        },
        set(id: string) {
          this._id = id ? em.getDriver().denormalizePrimaryKey(id) : null;
        },
      });
    }

    Object.defineProperties(prototype, {
      __populated: { value: false, writable: true, enumerable: false, configurable: false },
      __entity: { value: true, writable: false, enumerable: false, configurable: false },
      __em: { value: em, writable: false, enumerable: false, configurable: false },
      isInitialized: {
        value: function () {
          return this._initialized !== false;
        },
      },
      shouldPopulate: {
        value: function (collection: Collection<IEntity> = null) {
          return this.__populated && !collection;
        },
      },
      populated: {
        value: function (populated = true) {
          this.__populated = populated;
        },
      },
      init: {
        value: async function (populated = true): Promise<IEntity> {
          return EntityHelper.init(this, populated);
        },
      },
      assign: {
        value: function (data: any) {
          EntityHelper.assign(this, data);
        }
      },
      toObject: {
        value: function (parent?: IEntity, collection: Collection<IEntity> = null) {
          return EntityHelper.toObject(this, parent, collection);
        }
      },
      toJSON: {
        value: function () {
          return EntityHelper.toObject(this);
        }
      },
    });
  }

}
